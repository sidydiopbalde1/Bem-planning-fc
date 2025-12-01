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
      // Récupérer tous les indicateurs académiques
      const { programmeId, periodeId, type } = req.query;

      const where = {};
      if (programmeId) where.programmeId = programmeId;
      if (periodeId) where.periodeId = periodeId;
      if (type) where.type = type;

      const indicateurs = await prisma.indicateurAcademique.findMany({
        where,
        include: {
          programme: {
            select: { name: true, code: true }
          },
          periode: {
            select: { nom: true, annee: true }
          },
          responsable: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json(indicateurs);

    } else if (req.method === 'POST') {
      // Créer un nouveau indicateur académique
      const {
        nom,
        description,
        valeurCible,
        valeurReelle,
        periodicite,
        methodeCalcul,
        unite,
        type,
        programmeId,
        periodeId,
        responsableId,
        dateCollecte
      } = req.body;

      // Validation
      if (!nom || !type || !periodicite || !programmeId || !periodeId) {
        return res.status(400).json({
          error: 'Champs requis: nom, type, periodicite, programmeId, periodeId'
        });
      }

      const indicateur = await prisma.indicateurAcademique.create({
        data: {
          nom,
          description,
          valeurCible: valeurCible ? parseFloat(valeurCible) : null,
          valeurReelle: valeurReelle ? parseFloat(valeurReelle) : null,
          periodicite,
          methodeCalcul,
          unite: unite || '%',
          type,
          programmeId,
          periodeId,
          responsableId,
          dateCollecte: dateCollecte ? new Date(dateCollecte) : null
        },
        include: {
          programme: true,
          periode: true,
          responsable: true
        }
      });

      return res.status(201).json(indicateur);

    } else {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

  } catch (error) {
    console.error('Erreur API indicateurs académiques:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}
