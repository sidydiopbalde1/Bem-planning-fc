// pages/api/user/stats.js
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const { period = 'all' } = req.query;
    const userId = session.user.id;

    // Définir la période de filtre
    let dateFilter = {};
    const now = new Date();
    
    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { gte: weekAgo };
    } else if (period === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      dateFilter = { gte: monthAgo };
    }

    // Requêtes parallèles pour les statistiques
    const [
      totalProgrammes,
      programmesParStatut,
      totalModules,
      totalSeances,
      volumeHoraire,
      seancesCetteSemaine,
      user
    ] = await Promise.all([
      // Total programmes
      prisma.programme.count({
        where: { 
          userId,
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
        }
      }),

      // Programmes par statut
      prisma.programme.groupBy({
        by: ['status'],
        where: { 
          userId,
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
        },
        _count: { status: true }
      }),

      // Total modules
      prisma.module.count({
        where: { 
          userId,
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
        }
      }),

      // Total séances
      prisma.seance.count({
        where: {
          module: { userId },
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
        }
      }),

      // Volume horaire total
      prisma.programme.aggregate({
        where: { 
          userId,
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
        },
        _sum: { totalVHT: true }
      }),

      // Séances cette semaine
      prisma.seance.count({
        where: {
          module: { userId },
          dateSeance: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            lte: now
          }
        }
      }),

      // Informations utilisateur
      prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true, updatedAt: true }
      })
    ]);

    // Calculs supplémentaires
    const programmesEnCours = programmesParStatut.find(p => p.status === 'EN_COURS')?._count?.status || 0;
    const programmesPlanifies = programmesParStatut.find(p => p.status === 'PLANIFIE')?._count?.status || 0;
    const programmesTermines = programmesParStatut.find(p => p.status === 'TERMINE')?._count?.status || 0;

    // Calcul du taux de complétion
    const totalProgrammesActifs = programmesEnCours + programmesPlanifies + programmesTermines;
    const tauxCompletion = totalProgrammesActifs > 0 
      ? Math.round((programmesTermines / totalProgrammesActifs) * 100) 
      : 0;

    const stats = {
      totalProgrammes,
      totalModules,
      totalSeances,
      totalHeures: volumeHoraire._sum.totalVHT || 0,
      programmesEnCours,
      programmesPlanifies,
      programmesTermines,
      seancesCetteSemaine,
      tauxCompletion,
      lastLogin: user?.updatedAt || user?.createdAt,
      memberSince: user?.createdAt
    };

    res.status(200).json({ stats });

  } catch (error) {
    console.error('Erreur API stats:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  } finally {
    await prisma.$disconnect();
  }
}