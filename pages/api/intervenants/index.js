// pages/api/intervenants/index.js
import { PrismaClient } from '@prisma/client';
import { withCoordinator } from '../../../lib/withApiHandler';

const prisma = new PrismaClient();

async function handler(req, res) {
  try {
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
      console.log('Intervenants récupérés:', intervenants.length);
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

export default withCoordinator(handler, { entity: 'Intervenant' });