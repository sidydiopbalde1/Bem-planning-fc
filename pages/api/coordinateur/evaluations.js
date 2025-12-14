// pages/api/coordinateur/evaluations.js
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { sendEmail, emailTemplates } from '../../../lib/email';
import crypto from 'crypto';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !['COORDINATOR', 'ADMIN'].includes(session.user.role)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    if (req.method === 'GET') {
      return await handleGet(req, res, session);
    }

    if (req.method === 'POST') {
      return await handlePost(req, res, session);
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (error) {
    console.error('Erreur API evaluations:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}

async function handleGet(req, res, session) {
  const { moduleId, statut, page = 1, limit = 20 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Build where clause
  const where = {};
  if (moduleId) where.moduleId = moduleId;
  if (statut) where.statut = statut;

  // Get evaluations
  const [evaluations, total] = await Promise.all([
    prisma.evaluationEnseignement.findMany({
      where,
      include: {
        module: {
          select: {
            id: true,
            code: true,
            name: true,
            programme: {
              select: {
                id: true,
                code: true,
                name: true
              }
            }
          }
        },
        intervenant: {
          select: {
            id: true,
            civilite: true,
            nom: true,
            prenom: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take
    }),
    prisma.evaluationEnseignement.count({ where })
  ]);

  // Calculate stats
  const stats = {
    total,
    brouillon: await prisma.evaluationEnseignement.count({ where: { ...where, statut: 'BROUILLON' } }),
    envoyees: await prisma.evaluationEnseignement.count({ where: { ...where, statut: 'ENVOYEE' } }),
    enCours: await prisma.evaluationEnseignement.count({ where: { ...where, statut: 'EN_COURS' } }),
    terminees: await prisma.evaluationEnseignement.count({ where: { ...where, statut: 'TERMINEE' } }),
    tauxParticipationMoyen: await prisma.evaluationEnseignement.aggregate({
      where: { ...where, statut: 'TERMINEE' },
      _avg: {
        tauxParticipation: true
      }
    }).then(result => result._avg.tauxParticipation || 0)
  };

  return res.status(200).json({
    evaluations,
    stats,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    }
  });
}

async function handlePost(req, res, session) {
  const { moduleId, intervenantId, dateDebut, dateFin, nombreInvitations } = req.body;

  // Validate required fields
  if (!moduleId || !intervenantId || !dateDebut || !dateFin) {
    return res.status(400).json({
      error: 'Champs requis manquants',
      required: ['moduleId', 'intervenantId', 'dateDebut', 'dateFin']
    });
  }

  // Validate dates
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);
  if (debut >= fin) {
    return res.status(400).json({ error: 'La date de début doit être antérieure à la date de fin' });
  }

  // Check if module and intervenant exist
  const [module, intervenant] = await Promise.all([
    prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        programme: true
      }
    }),
    prisma.intervenant.findUnique({
      where: { id: intervenantId }
    })
  ]);

  if (!module) {
    return res.status(404).json({ error: 'Module introuvable' });
  }

  if (!intervenant) {
    return res.status(404).json({ error: 'Intervenant introuvable' });
  }

  // Generate unique evaluation link
  const token = crypto.randomBytes(32).toString('hex');
  const lienEvaluation = `${process.env.NEXTAUTH_URL}/evaluation/${token}`;

  // Create evaluation campaign
  const evaluation = await prisma.evaluationEnseignement.create({
    data: {
      moduleId,
      intervenantId,
      dateDebut: debut,
      dateFin: fin,
      lienEvaluation,
      nombreInvitations: nombreInvitations || 0,
      statut: 'BROUILLON'
    },
    include: {
      module: {
        include: {
          programme: true
        }
      },
      intervenant: true
    }
  });

  // Log the action
  await prisma.journalActivite.create({
    data: {
      action: 'CREATION',
      entite: 'EvaluationEnseignement',
      entiteId: evaluation.id,
      description: `Création d'une campagne d'évaluation pour ${module.code}`,
      userId: session.user.id,
      userName: session.user.name
    }
  });

  return res.status(201).json({
    message: 'Campagne d\'évaluation créée avec succès',
    evaluation
  });
}
