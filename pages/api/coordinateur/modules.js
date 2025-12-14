// pages/api/coordinateur/modules.js
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !['COORDINATOR', 'ADMIN'].includes(session.user.role)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, session);
      case 'POST':
        return await handlePost(req, res, session);
      default:
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }
  } catch (error) {
    console.error('Erreur API modules:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
}

async function handleGet(req, res, session) {
  const { programmeId, search, status } = req.query;

  const where = {};

  // Filtrer par programme si spécifié
  if (programmeId) {
    where.programmeId = programmeId;

    // Vérifier que le coordinateur a accès au programme
    if (session.user.role === 'COORDINATOR') {
      const programme = await prisma.programme.findUnique({
        where: { id: programmeId },
        select: { userId: true }
      });

      if (!programme || programme.userId !== session.user.id) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
    }
  } else if (session.user.role === 'COORDINATOR') {
    // Sinon, ne montrer que les modules des programmes du coordinateur
    where.userId = session.user.id;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (status) {
    where.status = status;
  }

  const modules = await prisma.module.findMany({
    where,
    include: {
      programme: {
        select: {
          id: true,
          code: true,
          name: true
        }
      },
      intervenant: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true
        }
      },
      _count: {
        select: {
          seances: true
        }
      }
    },
    orderBy: { code: 'asc' }
  });

  return res.status(200).json({ modules });
}

async function handlePost(req, res, session) {
  const {
    code,
    name,
    description,
    cm, td, tp, tpe,
    coefficient,
    credits,
    programmeId,
    intervenantId,
    dateDebut,
    dateFin
  } = req.body;

  // Validation
  if (!code || !name || !programmeId) {
    return res.status(400).json({ error: 'Code, nom et programme sont obligatoires' });
  }

  // Vérifier que le coordinateur a accès au programme
  if (session.user.role === 'COORDINATOR') {
    const programme = await prisma.programme.findUnique({
      where: { id: programmeId },
      select: { userId: true }
    });

    if (!programme || programme.userId !== session.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
  }

  // Vérifier unicité du code
  const existingModule = await prisma.module.findUnique({
    where: { code: code.trim().toUpperCase() }
  });

  if (existingModule) {
    return res.status(400).json({ error: 'Un module avec ce code existe déjà' });
  }

  // Calculer VHT
  const cmVal = parseInt(cm) || 0;
  const tdVal = parseInt(td) || 0;
  const tpVal = parseInt(tp) || 0;
  const tpeVal = parseInt(tpe) || 0;
  const vht = cmVal + tdVal + tpVal + tpeVal;

  const module = await prisma.module.create({
    data: {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description?.trim() || null,
      cm: cmVal,
      td: tdVal,
      tp: tpVal,
      tpe: tpeVal,
      vht,
      coefficient: parseInt(coefficient) || 1,
      credits: parseInt(credits) || 1,
      programmeId,
      intervenantId: intervenantId || null,
      userId: session.user.id,
      dateDebut: dateDebut ? new Date(dateDebut) : null,
      dateFin: dateFin ? new Date(dateFin) : null,
      status: 'PLANIFIE',
      progression: 0
    }
  });

  await prisma.journalActivite.create({
    data: {
      action: 'CREATION',
      entite: 'Module',
      entiteId: module.id,
      description: `Création du module ${module.code} - ${module.name}`,
      nouvelleValeur: JSON.stringify(module),
      userId: session.user.id,
      userName: session.user.name,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    }
  });

  return res.status(201).json({ module, message: 'Module créé avec succès' });
}
