// pages/api/coordinateur/programmes/[id].js
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

    if (!['COORDINATOR', 'ADMIN'].includes(session.user.role)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const { id } = req.query;

    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, id, session);
      case 'PUT':
        return await handlePut(req, res, id, session);
      case 'DELETE':
        return await handleDelete(req, res, id, session);
      default:
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }
  } catch (error) {
    console.error('Erreur API programme:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
}

async function handleGet(req, res, id, session) {
  const programme = await prisma.programme.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      modules: {
        include: {
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
      },
      _count: {
        select: {
          modules: true,
          activitesAcademiques: true,
          indicateursAcademiques: true
        }
      }
    }
  });

  if (!programme) {
    return res.status(404).json({ error: 'Programme non trouvé' });
  }

  // Vérifier que le coordinateur a accès à ce programme
  if (session.user.role === 'COORDINATOR' && programme.userId !== session.user.id) {
    return res.status(403).json({ error: 'Accès non autorisé à ce programme' });
  }

  // Calculer la progression réelle basée sur les modules
  const modulesTermines = programme.modules.filter(m => m.status === 'TERMINE').length;
  const progressionReelle = programme.modules.length > 0
    ? Math.round((modulesTermines / programme.modules.length) * 100)
    : 0;

  // Vérifier si en retard
  const now = new Date();
  const fin = new Date(programme.dateFin);
  const enRetard = now > fin && programme.progression < 100 && programme.status !== 'TERMINE';

  return res.status(200).json({
    programme: {
      ...programme,
      progressionReelle,
      enRetard
    }
  });
}

async function handlePut(req, res, id, session) {
  const programme = await prisma.programme.findUnique({
    where: { id }
  });

  if (!programme) {
    return res.status(404).json({ error: 'Programme non trouvé' });
  }

  // Vérifier que le coordinateur a accès
  if (session.user.role === 'COORDINATOR' && programme.userId !== session.user.id) {
    return res.status(403).json({ error: 'Accès non autorisé' });
  }

  const {
    name,
    description,
    niveau,
    semestre,
    totalVHT,
    dateDebut,
    dateFin,
    status,
    progression
  } = req.body;

  const updateData = {};

  if (name !== undefined) updateData.name = name.trim();
  if (description !== undefined) updateData.description = description?.trim() || null;
  if (niveau !== undefined) updateData.niveau = niveau.trim();
  if (semestre !== undefined) updateData.semestre = semestre;
  if (totalVHT !== undefined) updateData.totalVHT = parseInt(totalVHT);
  if (dateDebut !== undefined) updateData.dateDebut = new Date(dateDebut);
  if (dateFin !== undefined) updateData.dateFin = new Date(dateFin);
  if (status !== undefined) updateData.status = status;
  if (progression !== undefined) updateData.progression = Math.min(100, Math.max(0, parseInt(progression)));

  // Validation des dates
  if (updateData.dateDebut && updateData.dateFin) {
    if (updateData.dateFin <= updateData.dateDebut) {
      return res.status(400).json({
        error: 'La date de fin doit être après la date de début'
      });
    }
  }

  const updatedProgramme = await prisma.programme.update({
    where: { id },
    data: updateData,
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
      action: 'MODIFICATION',
      entite: 'Programme',
      entiteId: programme.id,
      description: `Modification du programme ${updatedProgramme.code} - ${updatedProgramme.name}`,
      ancienneValeur: JSON.stringify(programme),
      nouvelleValeur: JSON.stringify(updatedProgramme),
      userId: session.user.id,
      userName: session.user.name,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    }
  });

  return res.status(200).json({
    programme: updatedProgramme,
    message: 'Programme mis à jour avec succès'
  });
}

async function handleDelete(req, res, id, session) {
  const programme = await prisma.programme.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          modules: true,
          activitesAcademiques: true,
          indicateursAcademiques: true
        }
      }
    }
  });

  if (!programme) {
    return res.status(404).json({ error: 'Programme non trouvé' });
  }

  // Vérifier que le coordinateur a accès
  if (session.user.role === 'COORDINATOR' && programme.userId !== session.user.id) {
    return res.status(403).json({ error: 'Accès non autorisé' });
  }

  // Vérifier si le programme a des dépendances
  const totalDependances = programme._count.modules +
    programme._count.activitesAcademiques +
    programme._count.indicateursAcademiques;

  if (totalDependances > 0) {
    return res.status(400).json({
      error: 'Impossible de supprimer ce programme',
      message: `Ce programme contient ${programme._count.modules} module(s), ${programme._count.activitesAcademiques} activité(s) et ${programme._count.indicateursAcademiques} indicateur(s).`,
      counts: programme._count
    });
  }

  await prisma.programme.delete({
    where: { id }
  });

  // Enregistrer dans le journal
  await prisma.journalActivite.create({
    data: {
      action: 'SUPPRESSION',
      entite: 'Programme',
      entiteId: programme.id,
      description: `Suppression du programme ${programme.code} - ${programme.name}`,
      ancienneValeur: JSON.stringify(programme),
      userId: session.user.id,
      userName: session.user.name,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    }
  });

  return res.status(200).json({ message: 'Programme supprimé avec succès' });
}
