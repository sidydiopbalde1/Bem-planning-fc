// lib/withApiHandler.js
// Wrapper universel pour tous les endpoints API avec journalisation automatique

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from './prisma';

/**
 * Configuration par défaut
 */
const DEFAULT_CONFIG = {
  // Journaliser automatiquement toutes les requêtes modificatrices
  logMutations: true,
  // Journaliser les GET (optionnel, désactivé par défaut pour éviter le bruit)
  logReads: false,
  // Exiger l'authentification
  requireAuth: false,
  // Rôles autorisés (null = tous les rôles)
  roles: null,
  // Nom de l'entité pour les logs (auto-détecté si non fourni)
  entity: null,
};

/**
 * Chemins à ignorer pour le logging
 */
const IGNORED_PATHS = [
  '/api/admin/logs',
  '/api/auth/session',
  '/api/auth/csrf',
  '/api/auth/providers',
  '/api/auth/callback',
];

/**
 * Extrait l'IP du client
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.socket?.remoteAddress ||
         'unknown';
}

/**
 * Extrait le nom de l'entité depuis le chemin
 */
function getEntityFromPath(path) {
  const cleanPath = path.replace('/api/', '').split('?')[0];

  const entityMapping = {
    'admin/users': 'User',
    'admin/salles': 'Salle',
    'admin/periodes': 'PeriodeAcademique',
    'admin/stats': 'Statistiques',
    'admin/export': 'Export',
    'programmes': 'Programme',
    'modules': 'Module',
    'seances': 'Seance',
    'intervenants': 'Intervenant',
    'coordinateur/programmes': 'Programme',
    'coordinateur/modules': 'Module',
    'coordinateur/evaluations': 'Evaluation',
    'coordinateur/notifications': 'Notification',
    'coordinateur/dashboard': 'Dashboard',
    'coordinateur/alerts': 'Alerte',
    'rotations-weekend': 'RotationWeekend',
    'periodes-academiques': 'PeriodeAcademique',
    'activites-academiques': 'ActiviteAcademique',
    'indicateurs-academiques': 'IndicateurAcademique',
    'resultats-etudiants': 'ResultatEtudiant',
    'evaluations-enseignements': 'EvaluationEnseignement',
    'user': 'UserProfile',
    'planning': 'Planning',
    'calendar': 'Calendrier',
    'statistics': 'Statistiques',
    'evaluation': 'Evaluation',
    'cron': 'CronJob',
  };

  for (const [pathKey, entity] of Object.entries(entityMapping)) {
    if (cleanPath.startsWith(pathKey)) {
      return entity;
    }
  }

  const segments = cleanPath.split('/').filter(Boolean);
  return segments[0] ? segments[0].charAt(0).toUpperCase() + segments[0].slice(1) : 'API';
}

/**
 * Extrait l'ID de l'entité
 */
function extractEntityId(path, body, responseData) {
  const pathParts = path.split('/');
  const idPattern = /^[a-zA-Z0-9_-]{10,}$|^\d+$/;

  for (let i = pathParts.length - 1; i >= 0; i--) {
    const part = pathParts[i];
    if (idPattern.test(part) && !['api', 'admin', 'coordinateur'].includes(part)) {
      return part;
    }
  }

  return responseData?.id || body?.id || 'N/A';
}

/**
 * Détermine le type d'action
 */
function getActionType(method, path) {
  if (path.includes('/import')) return 'CREATION';
  if (path.includes('/export')) return 'EXPORT_DONNEES';

  switch (method) {
    case 'POST': return 'CREATION';
    case 'PUT':
    case 'PATCH': return 'MODIFICATION';
    case 'DELETE': return 'SUPPRESSION';
    default: return 'MODIFICATION';
  }
}

/**
 * Génère la description de l'action
 */
function generateDescription(method, entity, entityId, statusCode, duration) {
  const actions = {
    'GET': 'Consultation',
    'POST': 'Création',
    'PUT': 'Modification',
    'PATCH': 'Mise à jour',
    'DELETE': 'Suppression'
  };

  let desc = `${actions[method] || method} ${entity}`;
  if (entityId && entityId !== 'N/A') desc += ` (${entityId})`;
  desc += ` - ${statusCode >= 400 ? 'Échec' : 'Succès'}`;
  desc += ` [${duration}ms]`;

  return desc;
}

/**
 * Enregistre l'activité dans le journal
 */
async function logActivity(req, method, statusCode, startTime, config, responseData) {
  const path = req.url || '';

  // Ne pas journaliser les chemins ignorés
  if (IGNORED_PATHS.some(p => path.startsWith(p))) return;

  const duration = Date.now() - startTime;
  const entity = config.entity || getEntityFromPath(path);
  const entityId = extractEntityId(path, req.body, responseData);
  const actionType = getActionType(method, path);

  try {
    // Masquer les données sensibles
    let safeBody = null;
    if (req.body && typeof req.body === 'object') {
      safeBody = { ...req.body };
      ['password', 'token', 'secret', 'accessToken', 'refreshToken'].forEach(key => {
        if (safeBody[key]) safeBody[key] = '[MASQUÉ]';
      });
    }

    await prisma.journalActivite.create({
      data: {
        action: actionType,
        entite: entity,
        entiteId: String(entityId),
        description: generateDescription(method, entity, entityId, statusCode, duration),
        ancienneValeur: null,
        nouvelleValeur: safeBody ? JSON.stringify(safeBody) : null,
        userId: req.user?.id || 'anonymous',
        userName: req.user?.name || req.user?.email || 'Anonyme',
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent'] || null,
      }
    });
  } catch (error) {
    console.error('Erreur journalisation:', error.message);
  }
}

/**
 * Wrapper principal pour les handlers API
 *
 * Usage:
 *   export default withApiHandler(handler)
 *   export default withApiHandler(handler, { requireAuth: true })
 *   export default withApiHandler(handler, { roles: ['ADMIN'] })
 *   export default withApiHandler(handler, { entity: 'MonEntite' })
 */
export function withApiHandler(handler, options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };

  return async (req, res) => {
    const startTime = Date.now();
    const method = req.method || 'UNKNOWN';

    // Déterminer si on doit journaliser cette requête
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    const shouldLog = (isMutation && config.logMutations) || (method === 'GET' && config.logReads);

    // Vérifier l'authentification si requise
    if (config.requireAuth || config.roles) {
      try {
        const session = await getServerSession(req, res, authOptions);

        if (!session || !session.user) {
          if (shouldLog) {
            await logActivity(req, method, 401, startTime, config, null);
          }
          return res.status(401).json({
            error: 'Non authentifié',
            message: 'Vous devez être connecté pour accéder à cette ressource'
          });
        }

        // Vérifier les rôles
        if (config.roles) {
          const allowedRoles = Array.isArray(config.roles) ? config.roles : [config.roles];
          if (!allowedRoles.includes(session.user.role)) {
            if (shouldLog) {
              req.user = session.user;
              await logActivity(req, method, 403, startTime, config, null);
            }
            return res.status(403).json({
              error: 'Accès refusé',
              message: `Cette action nécessite un des rôles suivants : ${allowedRoles.join(', ')}`
            });
          }
        }

        req.session = session;
        req.user = session.user;
      } catch (error) {
        console.error('Erreur vérification auth:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
      }
    } else {
      // Récupérer la session même si non requise (pour le logging)
      try {
        const session = await getServerSession(req, res, authOptions);
        if (session?.user) {
          req.session = session;
          req.user = session.user;
        }
      } catch (e) {
        // Ignorer les erreurs de session
      }
    }

    // Intercepter la réponse pour capturer le status code
    let responseData = null;
    let statusCode = 200;

    const originalJson = res.json.bind(res);
    res.json = (data) => {
      responseData = data;
      statusCode = res.statusCode;
      return originalJson(data);
    };

    try {
      // Exécuter le handler original
      await handler(req, res);
      statusCode = res.statusCode;
    } catch (error) {
      console.error('Erreur handler API:', error);
      statusCode = 500;
      if (!res.headersSent) {
        res.status(500).json({ error: 'Erreur interne du serveur' });
      }
    } finally {
      // Journaliser si nécessaire
      if (shouldLog) {
        await logActivity(req, method, statusCode, startTime, config, responseData);
      }
    }
  };
}

/**
 * Raccourcis pour les cas d'utilisation courants
 */

// Handler avec authentification requise
export function withAuth(handler, options = {}) {
  return withApiHandler(handler, { ...options, requireAuth: true });
}

// Handler admin uniquement
export function withAdmin(handler, options = {}) {
  return withApiHandler(handler, { ...options, requireAuth: true, roles: ['ADMIN'] });
}

// Handler coordinateur (admin ou coordinator)
export function withCoordinator(handler, options = {}) {
  return withApiHandler(handler, { ...options, requireAuth: true, roles: ['ADMIN', 'COORDINATOR'] });
}

// Handler avec logging des GET aussi
export function withFullLogging(handler, options = {}) {
  return withApiHandler(handler, { ...options, logReads: true });
}

export default withApiHandler;
