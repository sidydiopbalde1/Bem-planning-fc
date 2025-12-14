// pages/api/admin/users/[id].js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { requireAdmin, logActivity, getClientIp } from '../../../../lib/middleware/requireRole';

const prisma = new PrismaClient();

async function handler(req, res) {
  const { method, query } = req;
  const { id } = query;

  if (!id) {
    return res.status(400).json({ error: 'ID utilisateur requis' });
  }

  try {
    switch (method) {
      case 'GET':
        return await getUser(req, res, id);
      case 'PUT':
        return await updateUser(req, res, id);
      case 'DELETE':
        return await deleteUser(req, res, id);
      default:
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }
  } catch (error) {
    console.error(`Erreur API admin/users/[id] [${method}]:`, error);
    return res.status(500).json({
      error: 'Erreur interne du serveur',
      message: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * GET /api/admin/users/[id]
 * Récupère les détails d'un utilisateur
 */
async function getUser(req, res, userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          programmes: true,
          modules: true
        }
      },
      programmes: {
        select: {
          id: true,
          nom: true,
          code: true
        },
        take: 10
      },
      modules: {
        select: {
          id: true,
          nom: true,
          code: true
        },
        take: 10
      }
    }
  });

  if (!user) {
    return res.status(404).json({
      error: 'Utilisateur non trouvé',
      message: `Aucun utilisateur trouvé avec l'ID ${userId}`
    });
  }

  return res.status(200).json({ user });
}

/**
 * PUT /api/admin/users/[id]
 * Met à jour un utilisateur
 */
async function updateUser(req, res, userId) {
  const { email, name, role, password } = req.body;

  // Empêcher un admin de se supprimer ses propres droits admin
  if (userId === req.user.id && role && role !== 'ADMIN') {
    return res.status(400).json({
      error: 'Action interdite',
      message: 'Vous ne pouvez pas modifier votre propre rôle'
    });
  }

  // Vérifier que l'utilisateur existe
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true
    }
  });

  if (!existingUser) {
    return res.status(404).json({
      error: 'Utilisateur non trouvé'
    });
  }

  // Construire les données de mise à jour
  const updateData = {};
  const changes = [];

  if (email && email !== existingUser.email) {
    // Vérifier que le nouvel email n'est pas déjà utilisé
    const emailTaken = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (emailTaken) {
      return res.status(409).json({
        error: 'Email déjà utilisé',
        message: 'Un autre utilisateur utilise déjà cet email'
      });
    }

    updateData.email = email.trim().toLowerCase();
    changes.push(`email: ${existingUser.email} → ${updateData.email}`);
  }

  if (name && name !== existingUser.name) {
    updateData.name = name.trim();
    changes.push(`nom: ${existingUser.name} → ${updateData.name}`);
  }

  if (role && role !== existingUser.role) {
    if (!['ADMIN', 'COORDINATOR', 'TEACHER'].includes(role)) {
      return res.status(400).json({
        error: 'Rôle invalide',
        message: 'Le rôle doit être ADMIN, COORDINATOR ou TEACHER'
      });
    }
    updateData.role = role;
    changes.push(`rôle: ${existingUser.role} → ${role}`);
  }

  if (password) {
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Mot de passe trop court',
        message: 'Le mot de passe doit contenir au moins 8 caractères'
      });
    }
    updateData.password = await bcrypt.hash(password, 12);
    changes.push('mot de passe modifié');
  }

  // Si aucune modification
  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({
      error: 'Aucune modification',
      message: 'Aucune donnée à mettre à jour'
    });
  }

  // Mettre à jour l'utilisateur
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      updatedAt: true
    }
  });

  // Enregistrer dans le journal
  await logActivity(prisma, {
    action: 'MODIFICATION',
    entite: 'User',
    entiteId: userId,
    description: `Modification de l'utilisateur ${updatedUser.email}: ${changes.join(', ')}`,
    ancienneValeur: JSON.stringify({
      email: existingUser.email,
      name: existingUser.name,
      role: existingUser.role
    }),
    nouvelleValeur: JSON.stringify({
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role
    }),
    userId: req.user.id,
    userName: req.user.name,
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent']
  });

  return res.status(200).json({
    message: 'Utilisateur mis à jour avec succès',
    user: updatedUser,
    changes
  });
}

/**
 * DELETE /api/admin/users/[id]
 * Supprime un utilisateur
 */
async function deleteUser(req, res, userId) {
  // Empêcher un admin de se supprimer lui-même
  if (userId === req.user.id) {
    return res.status(400).json({
      error: 'Action interdite',
      message: 'Vous ne pouvez pas supprimer votre propre compte'
    });
  }

  // Vérifier que l'utilisateur existe
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      _count: {
        select: {
          programmes: true,
          modules: true
        }
      }
    }
  });

  if (!user) {
    return res.status(404).json({
      error: 'Utilisateur non trouvé'
    });
  }

  // Vérifier s'il est le dernier admin
  if (user.role === 'ADMIN') {
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });

    if (adminCount <= 1) {
      return res.status(400).json({
        error: 'Suppression impossible',
        message: 'Impossible de supprimer le dernier administrateur du système'
      });
    }
  }

  // Avertir si l'utilisateur a des données associées
  if (user._count.programmes > 0 || user._count.modules > 0) {
    const { force } = req.query;

    if (!force) {
      return res.status(400).json({
        error: 'Utilisateur avec données associées',
        message: `Cet utilisateur a ${user._count.programmes} programme(s) et ${user._count.modules} module(s). Utilisez ?force=true pour confirmer la suppression.`,
        counts: user._count
      });
    }
  }

  // Supprimer l'utilisateur (cascade configuré dans Prisma)
  await prisma.user.delete({
    where: { id: userId }
  });

  // Enregistrer dans le journal
  await logActivity(prisma, {
    action: 'SUPPRESSION',
    entite: 'User',
    entiteId: userId,
    description: `Suppression de l'utilisateur ${user.email} (${user.role})`,
    ancienneValeur: JSON.stringify({
      email: user.email,
      name: user.name,
      role: user.role
    }),
    userId: req.user.id,
    userName: req.user.name,
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent']
  });

  return res.status(200).json({
    message: 'Utilisateur supprimé avec succès',
    deletedUser: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  });
}

export default function (req, res) {
  return requireAdmin(req, res, handler);
}
