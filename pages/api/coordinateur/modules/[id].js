// pages/api/coordinateur/modules/[id].js
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !['COORDINATOR', 'ADMIN'].includes(session.user.role)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const { id } = req.query;

    switch (req.method) {
      case 'PUT':
        return await handlePut(req, res, id, session);
      case 'DELETE':
        return await handleDelete(req, res, id, session);
      default:
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function handlePut(req, res, id, session) {
  const module = await prisma.module.findUnique({ where: { id }, include: { programme: true } });
  if (!module) return res.status(404).json({ error: 'Module non trouvé' });

  if (session.user.role === 'COORDINATOR' && module.programme.userId !== session.user.id) {
    return res.status(403).json({ error: 'Accès non autorisé' });
  }

  const updated = await prisma.module.update({
    where: { id },
    data: req.body
  });

  return res.status(200).json({ module: updated });
}

async function handleDelete(req, res, id, session) {
  const module = await prisma.module.findUnique({ where: { id }, include: { programme: true, _count: { select: { seances: true } } } });
  if (!module) return res.status(404).json({ error: 'Module non trouvé' });

  if (session.user.role === 'COORDINATOR' && module.programme.userId !== session.user.id) {
    return res.status(403).json({ error: 'Accès non autorisé' });
  }

  if (module._count.seances > 0) {
    return res.status(400).json({ error: `Ce module contient ${module._count.seances} séances` });
  }

  await prisma.module.delete({ where: { id } });
  return res.status(200).json({ message: 'Module supprimé' });
}
