// pages/api/coordinateur/programmes.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Vérifier que l'utilisateur est coordinateur ou admin
    if (!['COORDINATOR', 'ADMIN'].includes(session.user.role)) {
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
    console.error('Erreur API programmes:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
}

async function handleGet(req, res, session) {
  const { search, status, semestre, page = 1, limit = 12 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const where = {};

  // Les coordinateurs ne voient que leurs programmes
  if (session.user.role === 'COORDINATOR') {
    where.userId = session.user.id;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
      { niveau: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (status) {
    where.status = status;
  }

  if (semestre) {
    where.semestre = semestre;
  }

  const [programmes, total] = await Promise.all([
    prisma.programme.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            modules: true,
            activitesAcademiques: true,
            indicateursAcademiques: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { dateDebut: 'desc' }
      ],
      skip,
      take: limitNum
    }),
    prisma.programme.count({ where })
  ]);

  // Calculer les statistiques
  const stats = {
    total,
    parStatut: await prisma.programme.groupBy({
      by: ['status'],
      where,
      _count: { status: true }
    }),
    progressionMoyenne: programmes.length > 0
      ? Math.round(programmes.reduce((sum, p) => sum + p.progression, 0) / programmes.length)
      : 0,
    enRetard: programmes.filter(p => {
      if (p.status === 'TERMINE') return false;
      const now = new Date();
      const fin = new Date(p.dateFin);
      return now > fin && p.progression < 100;
    }).length
  };

  return res.status(200).json({
    programmes,
    stats,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
}

async function handlePost(req, res, session) {
  const {
    code,
    name,
    description,
    niveau,
    semestre,
    totalVHT,
    dateDebut,
    dateFin
  } = req.body;

  // Validation
  if (!code || !name || !niveau || !semestre || !totalVHT || !dateDebut || !dateFin) {
    return res.status(400).json({
      error: 'Tous les champs obligatoires doivent être renseignés'
    });
  }

  // Vérifier si le code existe déjà
  const existingProgramme = await prisma.programme.findUnique({
    where: { code }
  });

  if (existingProgramme) {
    return res.status(400).json({
      error: 'Un programme avec ce code existe déjà'
    });
  }

  // Valider les dates
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);

  if (fin <= debut) {
    return res.status(400).json({
      error: 'La date de fin doit être après la date de début'
    });
  }

  // Créer le programme
  const programme = await prisma.programme.create({
    data: {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description?.trim() || null,
      niveau: niveau.trim(),
      semestre,
      totalVHT: parseInt(totalVHT),
      dateDebut: debut,
      dateFin: fin,
      status: 'PLANIFIE',
      progression: 0,
      userId: session.user.id
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  // Enregistrer dans le journal
  await prisma.journalActivite.create({
    data: {
      action: 'CREATION',
      entite: 'Programme',
      entiteId: programme.id,
      description: `Création du programme ${programme.code} - ${programme.name}`,
      nouvelleValeur: JSON.stringify(programme),
      userId: session.user.id,
      userName: session.user.name,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    }
  });

  return res.status(201).json({
    programme,
    message: 'Programme créé avec succès'
  });
}
