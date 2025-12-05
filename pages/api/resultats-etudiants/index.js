import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  try {
    if (req.method === 'GET') {
      // Récupérer tous les résultats étudiants
      const { moduleId, numeroEtudiant, statut, programmeId, page = 1, limit = 50 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {};
      if (moduleId) where.moduleId = moduleId;
      if (numeroEtudiant) {
        where.numeroEtudiant = {
          contains: numeroEtudiant,
          mode: 'insensitive'
        };
      }
      if (statut) where.statut = statut;
      if (programmeId) {
        where.module = {
          programmeId
        };
      }

      const [resultats, total] = await Promise.all([
        prisma.resultatEtudiant.findMany({
          where,
          include: {
            module: {
              select: {
                name: true,
                code: true,
                credits: true,
                coefficient: true,
                programme: {
                  select: { name: true, code: true, niveau: true }
                }
              }
            }
          },
          orderBy: [
            { module: { name: 'asc' } },
            { nomEtudiant: 'asc' }
          ],
          skip,
          take: parseInt(limit)
        }),
        prisma.resultatEtudiant.count({ where })
      ]);

      // Statistiques globales
      const stats = await prisma.resultatEtudiant.aggregate({
        where,
        _avg: {
          noteFinale: true,
          tauxPresence: true,
          progressionPct: true
        }
      });

      // Statistiques par statut
      const statutStats = await prisma.resultatEtudiant.groupBy({
        by: ['statut'],
        where,
        _count: true
      });

      return res.status(200).json({
        resultats,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        },
        stats: {
          noteMoyenne: stats._avg.noteFinale || 0,
          tauxPresenceMoyen: stats._avg.tauxPresence || 0,
          progressionMoyenne: stats._avg.progressionPct || 0,
          parStatut: statutStats.reduce((acc, curr) => {
            acc[curr.statut] = curr._count;
            return acc;
          }, {})
        }
      });

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
