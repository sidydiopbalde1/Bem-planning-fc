// pages/api/coordinateur/notifications.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !['COORDINATOR', 'ADMIN', 'TEACHER'].includes(session.user.role)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    if (req.method === 'GET') {
      return await handleGet(req, res, session);
    }

    if (req.method === 'PUT') {
      return await handlePut(req, res, session);
    }

    if (req.method === 'DELETE') {
      return await handleDelete(req, res, session);
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (error) {
    console.error('Erreur API notifications:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}

async function handleGet(req, res, session) {
  const { type, lu, page = 1, limit = 20 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Build where clause
  const where = {
    destinataireId: session.user.id
  };

  if (type) where.type = type;
  if (lu !== undefined) where.lu = lu === 'true';

  // Get notifications
  const [notifications, total, nonLues] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: {
        destinataireId: session.user.id,
        lu: false
      }
    })
  ]);

  // Get stats by type
  const statsByType = await prisma.notification.groupBy({
    by: ['type'],
    where: {
      destinataireId: session.user.id
    },
    _count: {
      type: true
    }
  });

  const stats = {
    total,
    nonLues,
    parType: statsByType.reduce((acc, item) => {
      acc[item.type] = item._count.type;
      return acc;
    }, {})
  };

  return res.status(200).json({
    notifications,
    stats,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    }
  });
}

async function handlePut(req, res, session) {
  const { notificationIds, action } = req.body;

  if (!notificationIds || !Array.isArray(notificationIds)) {
    return res.status(400).json({ error: 'notificationIds requis (array)' });
  }

  if (!action || !['marquer_lu', 'marquer_non_lu'].includes(action)) {
    return res.status(400).json({ error: 'action invalide (marquer_lu, marquer_non_lu)' });
  }

  const lu = action === 'marquer_lu';

  // Update notifications
  const result = await prisma.notification.updateMany({
    where: {
      id: { in: notificationIds },
      destinataireId: session.user.id // Security: only update own notifications
    },
    data: {
      lu
    }
  });

  return res.status(200).json({
    message: `${result.count} notification(s) mise(s) à jour`,
    count: result.count
  });
}

async function handleDelete(req, res, session) {
  const { notificationIds } = req.body;

  if (!notificationIds || !Array.isArray(notificationIds)) {
    return res.status(400).json({ error: 'notificationIds requis (array)' });
  }

  // Delete notifications
  const result = await prisma.notification.deleteMany({
    where: {
      id: { in: notificationIds },
      destinataireId: session.user.id // Security: only delete own notifications
    }
  });

  return res.status(200).json({
    message: `${result.count} notification(s) supprimée(s)`,
    count: result.count
  });
}
