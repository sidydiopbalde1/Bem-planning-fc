// pages/api/admin/users/index.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { withAdmin } from '../../../../lib/withApiHandler';
import { logActivity, getClientIp } from '../../../../lib/middleware/requireRole';

const prisma = new PrismaClient();

async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await getUsers(req, res);
      case 'POST':
        return await createUser(req, res);
      default:
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }
  } catch (error) {
    console.error(`Erreur API admin/users [${method}]:`, error);
    return res.status(500).json({
      error: 'Erreur interne du serveur',
      message: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * GET /api/admin/users
 * Récupère la liste de tous les utilisateurs
 */
async function getUsers(req, res) {
  const { search, role, sortBy = 'createdAt', order = 'desc', page = 1, limit = 12 } = req.query;

  // Construction de la requête avec filtres
  const where = {};

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (role && ['ADMIN', 'COORDINATOR', 'TEACHER'].includes(role)) {
    where.role = role;
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Récupération des utilisateurs avec pagination
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
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
        }
      },
      orderBy: { [sortBy]: order },
      skip,
      take: parseInt(limit)
    }),
    prisma.user.count({ where })
  ]);

  // Statistiques globales
  const stats = await prisma.user.groupBy({
    by: ['role'],
    _count: true
  });

  return res.status(200).json({
    users,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    },
    stats: {
      total,
      byRole: stats.reduce((acc, stat) => {
        acc[stat.role] = stat._count;
        return acc;
      }, {})
    }
  });
}

/**
 * POST /api/admin/users
 * Crée un nouvel utilisateur
 */
async function createUser(req, res) {
  const { email, name, password, role } = req.body;

  // Validation
  if (!email?.trim() || !name?.trim() || !password || !role) {
    return res.status(400).json({
      error: 'Données invalides',
      message: 'Email, nom, mot de passe et rôle sont requis'
    });
  }

  if (!['ADMIN', 'COORDINATOR', 'TEACHER'].includes(role)) {
    return res.status(400).json({
      error: 'Rôle invalide',
      message: 'Le rôle doit être ADMIN, COORDINATOR ou TEACHER'
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: 'Mot de passe trop court',
      message: 'Le mot de passe doit contenir au moins 8 caractères'
    });
  }

  // Vérifier si l'email existe déjà
  const existingUser = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() }
  });

  if (existingUser) {
    return res.status(409).json({
      error: 'Email déjà utilisé',
      message: 'Un utilisateur avec cet email existe déjà'
    });
  }

  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(password, 12);

  // Créer l'utilisateur
  const newUser = await prisma.user.create({
    data: {
      email: email.trim().toLowerCase(),
      name: name.trim(),
      password: hashedPassword,
      role
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true
    }
  });

  // Enregistrer dans le journal
  await logActivity(prisma, {
    action: 'CREATION',
    entite: 'User',
    entiteId: newUser.id,
    description: `Création de l'utilisateur ${newUser.email} avec le rôle ${role}`,
    nouvelleValeur: JSON.stringify({ email: newUser.email, name: newUser.name, role }),
    userId: req.user.id,
    userName: req.user.name,
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent']
  });

  return res.status(201).json({
    message: 'Utilisateur créé avec succès',
    user: newUser
  });
}

export default withAdmin(handler, { entity: 'User' });
