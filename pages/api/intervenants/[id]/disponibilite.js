// pages/api/intervenants/[id]/disponibilite.js
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Vérifier que l'utilisateur n'est pas un simple intervenant (TEACHER)
    // Seuls les ADMIN et COORDINATOR peuvent modifier la disponibilité des intervenants
    if (session.user.role === 'TEACHER') {
      return res.status(403).json({
        error: 'Accès refusé. Vous n\'avez pas les permissions nécessaires pour modifier la disponibilité.'
      });
    }

    if (req.method === 'PATCH') {
      const { disponible } = req.body;

      if (typeof disponible !== 'boolean') {
        return res.status(400).json({ error: 'Le statut de disponibilité doit être un booléen' });
      }

      // Vérifier si l'intervenant existe
      const intervenant = await prisma.intervenant.findUnique({
        where: { id }
      });

      if (!intervenant) {
        return res.status(404).json({ error: 'Intervenant non trouvé' });
      }

      // Mettre à jour la disponibilité
      const updatedIntervenant = await prisma.intervenant.update({
        where: { id },
        data: { disponible },
        include: {
          modules: {
            select: {
              id: true,
              name: true,
              code: true,
              status: true
            }
          }
        }
      });

      res.status(200).json({ 
        message: 'Disponibilité mise à jour',
        intervenant: updatedIntervenant 
      });
    } else {
      res.status(405).json({ error: 'Method Not Allowed' });
    }

  } catch (error) {
    console.error('Erreur mise à jour disponibilité:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  } finally {
    await prisma.$disconnect();
  }
}