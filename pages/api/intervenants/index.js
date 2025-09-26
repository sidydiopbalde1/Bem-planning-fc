
// pages/api/intervenants/index.js
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    if (req.method === 'GET') {
      // Récupération de tous les intervenants avec leurs modules
      const intervenants = await prisma.intervenant.findMany({
        include: {
          modules: {
            select: {
              id: true,
              name: true,
              code: true,
              status: true
            }
          },
          _count: {
            select: {
              modules: true,
              seances: true
            }
          }
        },
        orderBy: [
          { disponible: 'desc' },
          { nom: 'asc' },
          { prenom: 'asc' }
        ]
      });

      res.status(200).json({ intervenants });
    } else {
      res.status(405).json({ error: 'Method Not Allowed' });
    }

  } catch (error) {
    console.error('Erreur API intervenants:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  } finally {
    await prisma.$disconnect();
  }
}