import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const session = await getServerSession(req, res);

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  try {
    if (req.method === 'GET') {
      // Récupérer tous les résultats étudiants
      const { moduleId, numeroEtudiant, statut } = req.query;

      const where = {};
      if (moduleId) where.moduleId = moduleId;
      if (numeroEtudiant) where.numeroEtudiant = numeroEtudiant;
      if (statut) where.statut = statut;

      const resultats = await prisma.resultatEtudiant.findMany({
        where,
        include: {
          module: {
            select: {
              name: true,
              code: true,
              programme: {
                select: { name: true, code: true }
              }
            }
          }
        },
        orderBy: [
          { module: { name: 'asc' } },
          { nomEtudiant: 'asc' }
        ]
      });

      return res.status(200).json(resultats);

    } else if (req.method === 'POST') {
      // Créer un nouveau résultat étudiant
      const {
        numeroEtudiant,
        nomEtudiant,
        prenomEtudiant,
        emailEtudiant,
        moduleId,
        noteCC,
        noteExamen,
        noteFinale,
        statut,
        mention,
        vhDeroule,
        progressionPct,
        presences,
        absences,
        tauxPresence
      } = req.body;

      // Validation
      if (!numeroEtudiant || !nomEtudiant || !prenomEtudiant || !moduleId || !statut) {
        return res.status(400).json({
          error: 'Champs requis: numeroEtudiant, nomEtudiant, prenomEtudiant, moduleId, statut'
        });
      }

      // Calculer le taux de présence si présences et absences sont fournis
      let tauxPresenceCalcule = tauxPresence;
      if (presences !== undefined && absences !== undefined) {
        const total = presences + absences;
        tauxPresenceCalcule = total > 0 ? (presences / total) * 100 : 0;
      }

      const resultat = await prisma.resultatEtudiant.create({
        data: {
          numeroEtudiant,
          nomEtudiant,
          prenomEtudiant,
          emailEtudiant,
          moduleId,
          noteCC: noteCC ? parseFloat(noteCC) : null,
          noteExamen: noteExamen ? parseFloat(noteExamen) : null,
          noteFinale: noteFinale ? parseFloat(noteFinale) : null,
          statut,
          mention,
          vhDeroule: vhDeroule || 0,
          progressionPct: progressionPct || 0,
          presences: presences || 0,
          absences: absences || 0,
          tauxPresence: tauxPresenceCalcule
        },
        include: {
          module: true
        }
      });

      return res.status(201).json(resultat);

    } else {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

  } catch (error) {
    console.error('Erreur API résultats étudiants:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}
