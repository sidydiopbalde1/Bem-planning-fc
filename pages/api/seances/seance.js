// pages/api/seances/index.js
import { PrismaClient } from '@prisma/client';
import { getSession } from 'next-auth/react';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  switch (req.method) {
    case 'GET':
      return handleGET(req, res, session);
    case 'POST':
      return handlePOST(req, res, session);
    default:
      return res.status(405).json({ error: 'Méthode non autorisée' });
  }
}

async function handleGET(req, res, session) {
  try {
    const { start, end, view, programmes, intervenants, types, status } = req.query;
    
    // Construire les filtres
    const where = {
      module: {
        programme: {
          userId: session.user.id
        }
      }
    };

    // Filtre par dates
    if (start && end) {
      where.dateSeance = {
        gte: new Date(start),
        lte: new Date(end)
      };
    }

    // Filtre par programmes
    if (programmes && programmes.length > 0) {
      where.module.programme.id = {
        in: Array.isArray(programmes) ? programmes : [programmes]
      };
    }

    // Filtre par intervenants
    if (intervenants && intervenants.length > 0) {
      where.intervenantId = {
        in: Array.isArray(intervenants) ? intervenants : [intervenants]
      };
    }

    // Filtre par types de séances
    if (types && types.length > 0) {
      where.typeSeance = {
        in: Array.isArray(types) ? types : [types]
      };
    }

    // Filtre par statut
    if (status && status.length > 0) {
      where.status = {
        in: Array.isArray(status) ? status : [status]
      };
    }

    const seances = await prisma.seance.findMany({
      where,
      include: {
        module: {
          include: {
            programme: {
              select: { name: true, code: true }
            }
          }
        },
        intervenant: {
          select: { 
            civilite: true, 
            nom: true, 
            prenom: true, 
            email: true 
          }
        }
      },
      orderBy: [
        { dateSeance: 'asc' },
        { heureDebut: 'asc' }
      ]
    });

    return res.status(200).json({
      seances,
      total: seances.length
    });
  } catch (error) {
    console.error('Erreur GET /api/seances:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function handlePOST(req, res, session) {
  try {
    const {
      moduleId,
      intervenantId,
      dateSeance,
      heureDebut,
      heureFin,
      typeSeance,
      salle,
      batiment,
      duree
    } = req.body;

    // Validation des données
    if (!moduleId || !intervenantId || !dateSeance || !heureDebut || !heureFin) {
      return res.status(400).json({
        error: 'Champs requis manquants',
        required: ['moduleId', 'intervenantId', 'dateSeance', 'heureDebut', 'heureFin']
      });
    }

    // Vérifier que le module appartient à l'utilisateur
    const module = await prisma.module.findFirst({
      where: {
        id: moduleId,
        programme: {
          userId: session.user.id
        }
      }
    });

    if (!module) {
      return res.status(404).json({ error: 'Module non trouvé ou non autorisé' });
    }

    // Calculer la durée si non fournie
    let calculatedDuree = duree;
    if (!duree) {
      const [startH, startM] = heureDebut.split(':').map(Number);
      const [endH, endM] = heureFin.split(':').map(Number);
      calculatedDuree = ((endH * 60 + endM) - (startH * 60 + startM));
    }

    // Vérifier les conflits avant création
    const conflicts = await detectConflicts({
      moduleId,
      intervenantId,
      dateSeance: new Date(dateSeance),
      heureDebut,
      heureFin,
      salle
    });

    // Créer la séance
    const seance = await prisma.seance.create({
      data: {
        moduleId,
        intervenantId,
        dateSeance: new Date(dateSeance),
        heureDebut,
        heureFin,
        duree: calculatedDuree,
        typeSeance,
        salle,
        batiment,
        status: 'PLANIFIE'
      },
      include: {
        module: {
          include: {
            programme: true
          }
        },
        intervenant: true
      }
    });

    // Enregistrer les conflits détectés
    if (conflicts.length > 0) {
      await Promise.all(conflicts.map(conflict => 
        prisma.conflit.create({
          data: {
            type: conflict.type,
            description: conflict.description,
            seanceId1: seance.id,
            seanceId2: conflict.seanceId2,
            ressourceType: conflict.ressourceType,
            ressourceId: conflict.ressourceId
          }
        })
      ));
    }

    return res.status(201).json({
      seance,
      conflicts: conflicts.length > 0 ? conflicts : null,
      message: conflicts.length > 0 ? 
        `Séance créée avec ${conflicts.length} conflit(s) détecté(s)` : 
        'Séance créée avec succès'
    });
  } catch (error) {
    console.error('Erreur POST /api/seances:', error);
    return res.status(500).json({ error: 'Erreur lors de la création de la séance' });
  }
}

// Fonction de détection de conflits
async function detectConflicts({ moduleId, intervenantId, dateSeance, heureDebut, heureFin, salle }) {
  const conflicts = [];
  
  // Convertir les heures en minutes pour faciliter les comparaisons
  const startMinutes = timeToMinutes(heureDebut);
  const endMinutes = timeToMinutes(heureFin);

  // 1. Conflit intervenant (double booking)
  const intervenantSeances = await prisma.seance.findMany({
    where: {
      intervenantId,
      dateSeance,
      NOT: {
        status: 'ANNULE'
      }
    },
    include: {
      module: {
        include: {
          programme: true
        }
      }
    }
  });

  for (const seance of intervenantSeances) {
    const existingStart = timeToMinutes(seance.heureDebut);
    const existingEnd = timeToMinutes(seance.heureFin);

    if (hasTimeOverlap(startMinutes, endMinutes, existingStart, existingEnd)) {
      conflicts.push({
        type: 'INTERVENANT_DOUBLE_BOOKING',
        description: `Conflit horaire pour l'intervenant le ${dateSeance.toLocaleDateString('fr-FR')} à ${heureDebut}`,
        seanceId2: seance.id,
        ressourceType: 'INTERVENANT',
        ressourceId: intervenantId
      });
    }
  }

  // 2. Conflit salle (si spécifiée)
  if (salle) {
    const salleSeances = await prisma.seance.findMany({
      where: {
        salle,
        dateSeance,
        NOT: {
          status: 'ANNULE'
        }
      },
      include: {
        module: {
          include: {
            programme: true
          }
        }
      }
    });

    for (const seance of salleSeances) {
      const existingStart = timeToMinutes(seance.heureDebut);
      const existingEnd = timeToMinutes(seance.heureFin);

      if (hasTimeOverlap(startMinutes, endMinutes, existingStart, existingEnd)) {
        conflicts.push({
          type: 'SALLE_DOUBLE_BOOKING',
          description: `Conflit de salle "${salle}" le ${dateSeance.toLocaleDateString('fr-FR')} à ${heureDebut}`,
          seanceId2: seance.id,
          ressourceType: 'SALLE',
          ressourceId: salle
        });
      }
    }
  }

  // 3. Contraintes calendaires (weekends, jours fériés, etc.)
  const dayOfWeek = dateSeance.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) { // Dimanche ou Samedi
    conflicts.push({
      type: 'CONTRAINTE_CALENDAIRE',
      description: `Séance programmée un weekend (${dateSeance.toLocaleDateString('fr-FR')})`,
      ressourceType: 'CALENDRIER',
      ressourceId: 'WEEKEND'
    });
  }

  return conflicts;
}

// Utilitaires pour la gestion du temps
function timeToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

function hasTimeOverlap(start1, end1, start2, end2) {
  return start1 < end2 && start2 < end1;
}
