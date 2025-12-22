// pages/api/rotations-weekend/index.js
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]';
import RotationWeekendManager from '../../../lib/rotation-weekend';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Seuls ADMIN et COORDINATOR peuvent gérer les rotations
    if (!['ADMIN', 'COORDINATOR'].includes(session.user.role)) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    if (req.method === 'GET') {
      return await handleGet(req, res, session);
    } else if (req.method === 'POST') {
      return await handlePost(req, res, session);
    } else {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

  } catch (error) {
    console.error('Erreur API rotations-weekend:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * GET /api/rotations-weekend
 * Récupère les rotations avec filtres
 */
async function handleGet(req, res, session) {
  const {
    annee,
    mois,
    responsableId,
    status,
    dateDebut,
    dateFin,
    includeStats = 'false',
    page = '1',
    limit = '50'
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Construire les filtres
  const where = {};

  if (annee) {
    where.annee = parseInt(annee);
  }

  if (mois) {
    where.dateDebut = {
      gte: new Date(annee, parseInt(mois) - 1, 1),
      lt: new Date(annee, parseInt(mois), 1)
    };
  }

  if (responsableId) {
    where.responsableId = responsableId;
  }

  if (status) {
    where.status = status;
  }

  if (dateDebut && dateFin) {
    where.dateDebut = {
      gte: new Date(dateDebut),
      lte: new Date(dateFin)
    };
  }

  // Récupérer les rotations
  const rotations = await prisma.rotationWeekend.findMany({
    where,
    include: {
      responsable: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      substitut: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      rapportSupervision: true
    },
    orderBy: {
      dateDebut: 'asc'
    },
    skip,
    take: limitNum
  });

  const total = await prisma.rotationWeekend.count({ where });

  const response = {
    rotations,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  };

  // Ajouter les stats si demandé
  if (includeStats === 'true') {
    const stats = await getStatsRotations(where);
    response.stats = stats;
  }

  return res.status(200).json(response);
}

/**
 * POST /api/rotations-weekend
 * Génère automatiquement les rotations
 */
async function handlePost(req, res, session) {
  const { nbSemaines = 12, dateDebut } = req.body;

  // Récupérer tous les coordinateurs
  const coordinateurs = await prisma.user.findMany({
    where: { role: 'COORDINATOR' },
    select: { id: true, name: true, email: true }
  });

  if (coordinateurs.length === 0) {
    return res.status(400).json({
      error: 'Aucun coordinateur disponible',
      message: 'Il faut au moins un coordinateur pour créer des rotations'
    });
  }

  const responsableIds = coordinateurs.map(c => c.id);
  const startDate = dateDebut ? new Date(dateDebut) : new Date();

  // Générer les rotations
  const rotations = await RotationWeekendManager.genererRotations(
    parseInt(nbSemaines),
    responsableIds,
    startDate
  );

  // Logger l'action
  await prisma.journalActivite.create({
    data: {
      action: 'PLANIFICATION_AUTO',
      entite: 'RotationWeekend',
      description: `Génération automatique de ${rotations.length} rotations weekend`,
      userId: session.user.id,
      userName: session.user.name,
      nouvelleValeur: JSON.stringify({
        nbSemaines,
        nbRotations: rotations.length,
        dateDebut: startDate
      })
    }
  });

  return res.status(201).json({
    message: `${rotations.length} rotations générées avec succès`,
    rotations,
    stats: {
      total: rotations.length,
      responsables: coordinateurs.map(c => ({
        id: c.id,
        name: c.name,
        nbWeekends: rotations.filter(r => r.responsableId === c.id).length
      }))
    }
  });
}

/**
 * Calcule les statistiques globales des rotations
 */
async function getStatsRotations(where) {
  const rotations = await prisma.rotationWeekend.findMany({
    where,
    include: {
      rapportSupervision: true
    }
  });

  const totalWeekends = rotations.length;
  const weekendsTermines = rotations.filter(r =>
    r.status === 'TERMINE' || r.status === 'TERMINE_SANS_RAPPORT'
  ).length;
  const weekendsAbsences = rotations.filter(r => r.status === 'ABSENT').length;
  const weekendsEnCours = rotations.filter(r => r.status === 'EN_COURS').length;

  const tauxCompletion = totalWeekends > 0
    ? ((weekendsTermines / totalWeekends) * 100).toFixed(2)
    : 0;

  const tauxAbsence = totalWeekends > 0
    ? ((weekendsAbsences / totalWeekends) * 100).toFixed(2)
    : 0;

  const nbSeancesTotal = rotations.reduce((sum, r) => sum + r.nbSeancesTotal, 0);
  const nbSeancesRealisees = rotations.reduce((sum, r) => sum + r.nbSeancesRealisees, 0);

  const satisfactions = rotations
    .filter(r => r.rapportSupervision?.satisfaction)
    .map(r => r.rapportSupervision.satisfaction);

  const moyenneSatisfaction = satisfactions.length > 0
    ? (satisfactions.reduce((sum, s) => sum + s, 0) / satisfactions.length).toFixed(2)
    : null;

  return {
    totalWeekends,
    weekendsTermines,
    weekendsAbsences,
    weekendsEnCours,
    tauxCompletion: parseFloat(tauxCompletion),
    tauxAbsence: parseFloat(tauxAbsence),
    nbSeancesTotal,
    nbSeancesRealisees,
    moyenneSatisfaction: moyenneSatisfaction ? parseFloat(moyenneSatisfaction) : null
  };
}
