// pages/api/admin/logs.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    return await handleGet(req, res);
  } catch (error) {
    console.error('Erreur API logs:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
}

async function handleGet(req, res) {
  const {
    search,
    userId,
    action,
    entite,
    dateDebut,
    dateFin,
    page = '1',
    limit = '50'
  } = req.query;

  const where = {};

  // Recherche textuelle
  if (search) {
    where.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      { userName: { contains: search, mode: 'insensitive' } },
      { entite: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Filtres spécifiques
  if (userId) {
    where.userId = userId;
  }

  if (action) {
    where.action = action;
  }

  if (entite) {
    where.entite = entite;
  }

  // Filtre par date
  if (dateDebut || dateFin) {
    where.createdAt = {};
    if (dateDebut) {
      where.createdAt.gte = new Date(dateDebut);
    }
    if (dateFin) {
      const endDate = new Date(dateFin);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = endDate;
    }
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const [logs, total, stats] = await Promise.all([
    prisma.journalActivite.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum
    }),
    prisma.journalActivite.count({ where }),
    getStats(where)
  ]);

  return res.status(200).json({
    logs,
    stats,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  });
}

async function getStats(where) {
  const [
    byAction,
    byEntite,
    uniqueUsers,
    recentActivity
  ] = await Promise.all([
    // Statistiques par type d'action
    prisma.journalActivite.groupBy({
      by: ['action'],
      _count: { action: true },
      where
    }),
    // Statistiques par entité
    prisma.journalActivite.groupBy({
      by: ['entite'],
      _count: { entite: true },
      where
    }),
    // Nombre d'utilisateurs uniques
    prisma.journalActivite.findMany({
      where,
      select: { userId: true },
      distinct: ['userId']
    }),
    // Activité des dernières 24h
    prisma.journalActivite.count({
      where: {
        ...where,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })
  ]);

  return {
    byAction: byAction.map(item => ({
      action: item.action,
      count: item._count.action
    })),
    byEntite: byEntite.map(item => ({
      entite: item.entite,
      count: item._count.entite
    })),
    uniqueUsers: uniqueUsers.length,
    last24h: recentActivity,
    total: await prisma.journalActivite.count({ where })
  };
}
