// pages/api/rotations-weekend/[id].js
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import RotationWeekendManager from '../../../lib/rotation-weekend';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;

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
      return await handleGet(req, res, id);
    } else if (req.method === 'PUT') {
      return await handlePut(req, res, id, session);
    } else if (req.method === 'DELETE') {
      return await handleDelete(req, res, id, session);
    } else {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

  } catch (error) {
    console.error('Erreur API rotation:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * GET /api/rotations-weekend/[id]
 * Récupère les détails d'une rotation
 */
async function handleGet(req, res, id) {
  const rotation = await prisma.rotationWeekend.findUnique({
    where: { id },
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
    }
  });

  if (!rotation) {
    return res.status(404).json({ error: 'Rotation introuvable' });
  }

  // Récupérer les séances du weekend
  const seances = await prisma.seance.findMany({
    where: {
      dateSeance: {
        gte: rotation.dateDebut,
        lte: rotation.dateFin
      },
      status: { notIn: ['ANNULE'] }
    },
    include: {
      module: {
        select: {
          code: true,
          name: true
        }
      },
      intervenant: {
        select: {
          nom: true,
          prenom: true
        }
      }
    },
    orderBy: {
      dateSeance: 'asc'
    }
  });

  return res.status(200).json({
    rotation,
    seances
  });
}

/**
 * PUT /api/rotations-weekend/[id]
 * Modifie une rotation
 */
async function handlePut(req, res, id, session) {
  const { status, responsableId, substitutId, commentaire, rapport } = req.body;

  const rotation = await prisma.rotationWeekend.findUnique({
    where: { id }
  });

  if (!rotation) {
    return res.status(404).json({ error: 'Rotation introuvable' });
  }

  const updateData = {};

  if (status) {
    updateData.status = status;

    // Si la rotation est terminée, créer le rapport si fourni
    if ((status === 'TERMINE' || status === 'TERMINE_SANS_RAPPORT') && rapport) {
      await RotationWeekendManager.terminerRotation(id, rapport);
      return res.status(200).json({
        message: 'Rotation terminée avec succès',
        rotation: await prisma.rotationWeekend.findUnique({
          where: { id },
          include: {
            responsable: true,
            rapportSupervision: true
          }
        })
      });
    }
  }

  if (responsableId) {
    updateData.responsableId = responsableId;
  }

  if (substitutId) {
    updateData.substitutId = substitutId;
  }

  if (commentaire !== undefined) {
    updateData.commentaire = commentaire;
  }

  const updatedRotation = await prisma.rotationWeekend.update({
    where: { id },
    data: {
      ...updateData,
      updatedAt: new Date()
    },
    include: {
      responsable: true,
      substitut: true,
      rapportSupervision: true
    }
  });

  // Logger l'action
  await prisma.journalActivite.create({
    data: {
      action: 'MODIFICATION',
      entite: 'RotationWeekend',
      entiteId: id,
      description: `Modification rotation du ${rotation.dateDebut.toLocaleDateString()}`,
      userId: session.user.id,
      userName: session.user.name,
      ancienneValeur: JSON.stringify(rotation),
      nouvelleValeur: JSON.stringify(updatedRotation)
    }
  });

  return res.status(200).json({
    message: 'Rotation mise à jour avec succès',
    rotation: updatedRotation
  });
}

/**
 * DELETE /api/rotations-weekend/[id]
 * Supprime une rotation
 */
async function handleDelete(req, res, id, session) {
  const rotation = await prisma.rotationWeekend.findUnique({
    where: { id }
  });

  if (!rotation) {
    return res.status(404).json({ error: 'Rotation introuvable' });
  }

  // Vérifier que la rotation n'est pas en cours ou terminée
  if (['EN_COURS', 'TERMINE', 'TERMINE_SANS_RAPPORT'].includes(rotation.status)) {
    return res.status(400).json({
      error: 'Impossible de supprimer',
      message: 'Les rotations en cours ou terminées ne peuvent pas être supprimées'
    });
  }

  await prisma.rotationWeekend.delete({
    where: { id }
  });

  // Logger l'action
  await prisma.journalActivite.create({
    data: {
      action: 'SUPPRESSION',
      entite: 'RotationWeekend',
      entiteId: id,
      description: `Suppression rotation du ${rotation.dateDebut.toLocaleDateString()}`,
      userId: session.user.id,
      userName: session.user.name,
      ancienneValeur: JSON.stringify(rotation)
    }
  });

  return res.status(200).json({
    message: 'Rotation supprimée avec succès'
  });
}
