// pages/api/rotations-weekend/disponibilites.js
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]';
import RotationWeekendManager from '../../../lib/rotation-weekend';

const prisma = new PrismaClient();

/**
 * Gestion des disponibilités des responsables
 */
export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    if (req.method === 'GET') {
      return await handleGet(req, res, session);
    } else if (req.method === 'POST') {
      return await handlePost(req, res, session);
    } else if (req.method === 'DELETE') {
      return await handleDelete(req, res, session);
    } else {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

  } catch (error) {
    console.error('Erreur API disponibilités:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * GET /api/rotations-weekend/disponibilites
 * Récupère les disponibilités
 */
async function handleGet(req, res, session) {
  const { responsableId, dateDebut, dateFin } = req.query;

  const where = {};

  // Si l'utilisateur n'est pas admin, il ne voit que ses propres disponibilités
  if (session.user.role === 'TEACHER') {
    where.responsableId = session.user.id;
  } else if (responsableId) {
    where.responsableId = responsableId;
  }

  if (dateDebut && dateFin) {
    where.dateDebut = {
      gte: new Date(dateDebut),
      lte: new Date(dateFin)
    };
  }

  const disponibilites = await prisma.disponibiliteResponsable.findMany({
    where,
    include: {
      responsable: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      dateDebut: 'asc'
    }
  });

  return res.status(200).json({ disponibilites });
}

/**
 * POST /api/rotations-weekend/disponibilites
 * Déclare une indisponibilité
 */
async function handlePost(req, res, session) {
  const { dateDebut, dateFin, raison } = req.body;

  if (!dateDebut || !dateFin) {
    return res.status(400).json({
      error: 'Données manquantes',
      message: 'Les dates de début et fin sont requises'
    });
  }

  const start = new Date(dateDebut);
  const end = new Date(dateFin);

  if (start >= end) {
    return res.status(400).json({
      error: 'Dates invalides',
      message: 'La date de fin doit être après la date de début'
    });
  }

  // Vérifier que l'utilisateur est un coordinateur
  if (!['ADMIN', 'COORDINATOR'].includes(session.user.role)) {
    return res.status(403).json({
      error: 'Accès refusé',
      message: 'Seuls les coordinateurs peuvent déclarer des indisponibilités'
    });
  }

  // Créer l'indisponibilité
  const disponibilite = await RotationWeekendManager.declarerIndisponibilite(
    session.user.id,
    start,
    end,
    raison
  );

  // Vérifier s'il y a des rotations planifiées pendant cette période
  const rotationsAffectees = await prisma.rotationWeekend.findMany({
    where: {
      responsableId: session.user.id,
      dateDebut: {
        gte: start,
        lte: end
      },
      status: 'PLANIFIE'
    }
  });

  // Logger l'action
  await prisma.journalActivite.create({
    data: {
      action: 'CREATION',
      entite: 'DisponibiliteResponsable',
      description: `Indisponibilité déclarée du ${start.toLocaleDateString()} au ${end.toLocaleDateString()}`,
      userId: session.user.id,
      userName: session.user.name,
      nouvelleValeur: JSON.stringify({
        disponibilite,
        rotationsAffectees: rotationsAffectees.length
      })
    }
  });

  return res.status(201).json({
    message: 'Indisponibilité enregistrée avec succès',
    disponibilite,
    rotationsAffectees: rotationsAffectees.length > 0 ? {
      count: rotationsAffectees.length,
      message: `${rotationsAffectees.length} rotation(s) planifiée(s) devront être réassignées`
    } : null
  });
}

/**
 * DELETE /api/rotations-weekend/disponibilites
 * Supprime une indisponibilité
 */
async function handleDelete(req, res, session) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID manquant' });
  }

  const disponibilite = await prisma.disponibiliteResponsable.findUnique({
    where: { id }
  });

  if (!disponibilite) {
    return res.status(404).json({ error: 'Disponibilité introuvable' });
  }

  // Vérifier les permissions
  const isOwner = disponibilite.responsableId === session.user.id;
  const isAdmin = session.user.role === 'ADMIN';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Non autorisé' });
  }

  await prisma.disponibiliteResponsable.delete({
    where: { id }
  });

  // Logger l'action
  await prisma.journalActivite.create({
    data: {
      action: 'SUPPRESSION',
      entite: 'DisponibiliteResponsable',
      entiteId: id,
      description: 'Indisponibilité supprimée',
      userId: session.user.id,
      userName: session.user.name,
      ancienneValeur: JSON.stringify(disponibilite)
    }
  });

  return res.status(200).json({
    message: 'Indisponibilité supprimée avec succès'
  });
}
