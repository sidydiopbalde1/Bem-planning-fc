// lib/middleware/requireRole.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../pages/api/auth/[...nextauth]';

/**
 * Middleware pour vérifier l'authentification et les rôles
 * @param {Array<string>|string} allowedRoles - Rôle(s) autorisé(s) pour accéder à la route
 * @returns {Function} Middleware function
 */
export function requireRole(allowedRoles) {
  // Normaliser en tableau
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (req, res, handler) => {
    try {
      // Vérifier l'authentification
      const session = await getServerSession(req, res, authOptions);

      if (!session || !session.user) {
        return res.status(401).json({
          error: 'Non authentifié',
          message: 'Vous devez être connecté pour accéder à cette ressource'
        });
      }

      // Vérifier le rôle
      const userRole = session.user.role;

      if (!roles.includes(userRole)) {
        return res.status(403).json({
          error: 'Accès refusé',
          message: `Cette action nécessite un des rôles suivants : ${roles.join(', ')}`,
          requiredRoles: roles,
          userRole: userRole
        });
      }

      // Ajouter la session à la requête pour utilisation ultérieure
      req.session = session;
      req.user = session.user;

      // Exécuter le handler
      return await handler(req, res);

    } catch (error) {
      console.error('Erreur middleware requireRole:', error);
      return res.status(500).json({
        error: 'Erreur interne du serveur',
        message: 'Une erreur est survenue lors de la vérification des permissions'
      });
    }
  };
}

/**
 * Middleware simplifié pour admin uniquement
 */
export function requireAdmin(req, res, handler) {
  return requireRole('ADMIN')(req, res, handler);
}

/**
 * Middleware pour admin ou coordinateur
 */
export function requireCoordinator(req, res, handler) {
  return requireRole(['ADMIN', 'COORDINATOR'])(req, res, handler);
}

/**
 * Helper pour vérifier uniquement l'authentification (sans vérifier le rôle)
 */
export async function requireAuth(req, res, handler) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({
        error: 'Non authentifié',
        message: 'Vous devez être connecté pour accéder à cette ressource'
      });
    }

    req.session = session;
    req.user = session.user;

    return await handler(req, res);

  } catch (error) {
    console.error('Erreur middleware requireAuth:', error);
    return res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
}

/**
 * Helper pour enregistrer les actions dans le journal d'activités
 */
export async function logActivity(prisma, data) {
  try {
    await prisma.journalActivite.create({
      data: {
        action: data.action,
        entite: data.entite,
        entiteId: data.entiteId,
        description: data.description,
        ancienneValeur: data.ancienneValeur || null,
        nouvelleValeur: data.nouvelleValeur || null,
        userId: data.userId,
        userName: data.userName || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement dans le journal:', error);
    // Ne pas faire échouer la requête si le logging échoue
  }
}

/**
 * Extrait l'IP du client de la requête
 */
export function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.socket.remoteAddress ||
         'unknown';
}
