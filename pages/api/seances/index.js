// pages/api/seances/index.js
import { PrismaClient } from '@prisma/client';
import { withAuth } from '../../../lib/withApiHandler';

const prisma = new PrismaClient();

async function handler(req, res) {
  try {
    const session = req.session;

    if (req.method === 'GET') {
      const { startDate, endDate, programmeId, status } = req.query;
      
      // Construction des filtres
      let whereClause = {
        module: {
          userId: session.user.id
        }
      };

      // Filtres optionnels
      if (startDate && endDate) {
        whereClause.dateSeance = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }

      if (programmeId && programmeId !== 'all') {
        whereClause.module.programmeId = programmeId;
      }

      if (status && status !== 'all') {
        whereClause.status = status;
      }

      // Récupération des séances
      const seances = await prisma.seance.findMany({
        where: whereClause,
        include: {
          module: {
            select: {
              id: true,
              name: true,
              code: true,
              programme: {
                select: {
                  id: true,
                  name: true,
                  code: true
                }
              }
            }
          },
          intervenant: {
            select: {
              id: true,
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

      res.status(200).json({ seances });

    } else if (req.method === 'POST') {
      // Création d'une nouvelle séance
      const {
        moduleId,
        intervenantId,
        dateSeance,
        heureDebut,
        heureFin,
        typeSeance,
        salle,
        batiment,
        status = 'PLANIFIE'
      } = req.body;

      // Validation
      if (!moduleId || !intervenantId || !dateSeance || !heureDebut || !heureFin || !typeSeance) {
        return res.status(400).json({ 
          error: 'Tous les champs obligatoires doivent être renseignés' 
        });
      }

      // Vérifier que le module appartient à l'utilisateur
      const module = await prisma.module.findFirst({
        where: {
          id: moduleId,
          userId: session.user.id
        }
      });

      if (!module) {
        return res.status(404).json({ error: 'Module non trouvé' });
      }

      // Calculer la durée en minutes
      const debut = new Date(`2000-01-01T${heureDebut}:00`);
      const fin = new Date(`2000-01-01T${heureFin}:00`);
      const duree = Math.round((fin - debut) / (1000 * 60));

      // Vérifier les conflits d'horaires
      const conflits = await prisma.seance.findMany({
        where: {
          OR: [
            {
              // Conflit intervenant
              intervenantId,
              dateSeance: new Date(dateSeance),
              AND: [
                {
                  OR: [
                    {
                      AND: [
                        { heureDebut: { lte: heureDebut } },
                        { heureFin: { gt: heureDebut } }
                      ]
                    },
                    {
                      AND: [
                        { heureDebut: { lt: heureFin } },
                        { heureFin: { gte: heureFin } }
                      ]
                    },
                    {
                      AND: [
                        { heureDebut: { gte: heureDebut } },
                        { heureFin: { lte: heureFin } }
                      ]
                    }
                  ]
                }
              ],
              status: { not: 'ANNULE' }
            },
            // Conflit salle si spécifiée
            ...(salle ? [{
              salle,
              dateSeance: new Date(dateSeance),
              AND: [
                {
                  OR: [
                    {
                      AND: [
                        { heureDebut: { lte: heureDebut } },
                        { heureFin: { gt: heureDebut } }
                      ]
                    },
                    {
                      AND: [
                        { heureDebut: { lt: heureFin } },
                        { heureFin: { gte: heureFin } }
                      ]
                    },
                    {
                      AND: [
                        { heureDebut: { gte: heureDebut } },
                        { heureFin: { lte: heureFin } }
                      ]
                    }
                  ]
                }
              ],
              status: { not: 'ANNULE' }
            }] : [])
          ]
        },
        include: {
          intervenant: {
            select: { nom: true, prenom: true }
          }
        }
      });

      if (conflits.length > 0) {
        const conflitMessages = conflits.map(conflit => {
          if (conflit.intervenantId === intervenantId) {
            return `Conflit avec l'intervenant ${conflit.intervenant.prenom} ${conflit.intervenant.nom} de ${conflit.heureDebut} à ${conflit.heureFin}`;
          }
          if (conflit.salle === salle) {
            return `Conflit avec la salle ${conflit.salle} de ${conflit.heureDebut} à ${conflit.heureFin}`;
          }
          return 'Conflit d\'horaires détecté';
        });

        return res.status(409).json({
          error: 'Conflit d\'horaires détecté',
          conflits: conflitMessages
        });
      }

      // Création de la séance
      const seance = await prisma.seance.create({
        data: {
          moduleId,
          intervenantId,
          dateSeance: new Date(dateSeance),
          heureDebut,
          heureFin,
          duree,
          typeSeance,
          salle: salle || null,
          batiment: batiment || null,
          status
        },
        include: {
          module: {
            select: {
              id: true,
              name: true,
              code: true,
              programme: {
                select: {
                  id: true,
                  name: true,
                  code: true
                }
              }
            }
          },
          intervenant: {
            select: {
              id: true,
              civilite: true,
              nom: true,
              prenom: true,
              email: true
            }
          }
        }
      });

      res.status(201).json({ 
        message: 'Séance créée avec succès',
        seance 
      });

    } else {
      res.status(405).json({ error: 'Method Not Allowed' });
    }

  } catch (error) {
    console.error('Erreur API séances:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  } finally {
    await prisma.$disconnect();
  }
}

export default withAuth(handler, { entity: 'Seance' });