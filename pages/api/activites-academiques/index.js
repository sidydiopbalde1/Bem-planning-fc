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
      // Récupérer toutes les activités académiques
      const { programmeId, periodeId } = req.query;

      const where = {};
      if (programmeId) where.programmeId = programmeId;
      if (periodeId) where.periodeId = periodeId;

      const activites = await prisma.activiteAcademique.findMany({
        where,
        include: {
          programme: {
            select: { name: true, code: true }
          },
          periode: {
            select: { nom: true, annee: true }
          }
        },
        orderBy: { datePrevue: 'asc' }
      });

      return res.status(200).json(activites);

    } else if (req.method === 'POST') {
      // Créer une nouvelle activité académique
      const { nom, description, datePrevue, dateReelle, type, programmeId, periodeId } = req.body;

      // Validation
      if (!nom || !type || !programmeId || !periodeId) {
        return res.status(400).json({
          error: 'Champs requis: nom, type, programmeId, periodeId'
        });
      }

      const activite = await prisma.activiteAcademique.create({
        data: {
          nom,
          description,
          datePrevue: datePrevue ? new Date(datePrevue) : null,
          dateReelle: dateReelle ? new Date(dateReelle) : null,
          type,
          programmeId,
          periodeId
        },
        include: {
          programme: true,
          periode: true
        }
      });

      return res.status(201).json(activite);

    } else {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

  } catch (error) {
    console.error('Erreur API activités académiques:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}
