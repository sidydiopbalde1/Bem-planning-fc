// lib/middleware/apiLogger.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '../prisma';

/**
 * Détermine le type d'action basé sur la méthode HTTP et le contexte
 */
function getActionType(method, path, body) {
  switch (method) {
    case 'POST':
      if (path.includes('/import')) return 'IMPORT_DONNEES';
      if (path.includes('/export')) return 'EXPORT_DONNEES';
      return 'CREATION';
    case 'PUT':
    case 'PATCH':
      return 'MODIFICATION';
    case 'DELETE':
      return 'SUPPRESSION';
    case 'GET':
      if (path.includes('/export')) return 'EXPORT_DONNEES';
      return 'CONSULTATION';
    default:
      return 'AUTRE';
  }
}

/**
 * Extrait le nom de l'entité depuis le chemin de l'API
 */
function getEntityFromPath(path) {
  // Nettoyer le chemin
  const cleanPath = path.replace('/api/', '').split('?')[0];
  const segments = cleanPath.split('/').filter(Boolean);

  // Mapping des chemins vers les noms d'entités
  const entityMapping = {
    'admin/users': 'User',
    'admin/salles': 'Salle',
    'admin/periodes': 'PeriodeAcademique',
    'admin/logs': 'JournalActivite',
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
    'user/profile': 'UserProfile',
    'user/preferences': 'UserPreferences',
    'user/export-data': 'UserData',
    'user/delete-account': 'User',
    'user/stats': 'UserStats',
    'planning': 'Planning',
    'calendar': 'Calendrier',
    'statistics': 'Statistiques',
    'evaluation': 'Evaluation',
    'cron': 'CronJob',
    'auth': 'Authentification'
  };

  // Chercher la correspondance la plus longue
  for (const [pathKey, entity] of Object.entries(entityMapping)) {
    if (cleanPath.startsWith(pathKey)) {
      return entity;
    }
  }

  // Par défaut, utiliser le premier segment capitalisé
  if (segments.length > 0) {
    return segments[0].charAt(0).toUpperCase() + segments[0].slice(1);
  }

  return 'Unknown';
}

/**
 * Extrait l'ID de l'entité depuis le chemin ou le body
 */
function getEntityId(path, body, responseData) {
  // Chercher un ID dans le chemin (format: /api/xxx/[id])
  const pathParts = path.split('/');
  const idPattern = /^[a-zA-Z0-9_-]{10,}$|^\d+$/;

  for (let i = pathParts.length - 1; i >= 0; i--) {
    const part = pathParts[i];
    if (idPattern.test(part) && !['api', 'admin', 'coordinateur'].includes(part)) {
      return part;
    }
  }

  // Chercher dans la réponse
  if (responseData?.id) {
    return responseData.id;
  }

  // Chercher dans le body
  if (body?.id) {
    return body.id;
  }

  return 'N/A';
}

/**
 * Génère une description lisible de l'action
 */
function generateDescription(method, path, entity, entityId, body, statusCode, responseData) {
  const actionDescriptions = {
    'GET': 'Consultation',
    'POST': 'Création',
    'PUT': 'Modification',
    'PATCH': 'Modification partielle',
    'DELETE': 'Suppression'
  };

  const action = actionDescriptions[method] || method;
  let description = `${action} ${entity}`;

  if (entityId && entityId !== 'N/A') {
    description += ` (ID: ${entityId})`;
  }

  // Ajouter des détails contextuels
  if (path.includes('/import')) {
    description = `Import de données ${entity}`;
  } else if (path.includes('/export')) {
    description = `Export de données ${entity}`;
  } else if (path.includes('/complete')) {
    description = `Marquage comme complété ${entity}`;
  } else if (path.includes('/disponibilite') || path.includes('/disponibilites')) {
    description = `Gestion disponibilité ${entity}`;
  } else if (path.includes('/absence')) {
    description = `Gestion absence ${entity}`;
  }

  // Ajouter le statut si erreur
  if (statusCode >= 400) {
    description += ` - Échec (${statusCode})`;
  }

  return description;
}

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
 * Actions à ignorer pour le logging (trop fréquentes ou non pertinentes)
 */
const IGNORED_PATHS = [
  '/api/admin/logs', // Éviter les boucles infinies
  '/api/auth/session', // Vérifications de session fréquentes
  '/api/auth/csrf', // Token CSRF
  '/api/auth/providers', // Liste des providers
  '/api/_next', // Next.js internal
];

/**
 * Méthodes à ignorer pour certains chemins (éviter le spam de GET)
 */
const IGNORED_GET_PATHS = [
  '/api/admin/stats',
  '/api/coordinateur/dashboard',
  '/api/statistics',
  '/api/user/stats',
];

/**
 * Middleware principal de journalisation pour les API
 * Wrap les handlers d'API pour logger automatiquement toutes les requêtes
 */
export function withApiLogging(handler, options = {}) {
  const {
    logGets = false, // Par défaut, ne pas logger les GET (trop de bruit)
    entity = null,   // Forcer un nom d'entité spécifique
    skipAuth = false // Autoriser les requêtes non authentifiées
  } = options;

  return async (req, res) => {
    const startTime = Date.now();
    const path = req.url || '';
    const method = req.method || 'UNKNOWN';

    // Vérifier si ce chemin doit être ignoré
    if (IGNORED_PATHS.some(ignoredPath => path.startsWith(ignoredPath))) {
      return handler(req, res);
    }

    // Ignorer les GET sur certains chemins
    if (method === 'GET' && !logGets && IGNORED_GET_PATHS.some(p => path.startsWith(p))) {
      return handler(req, res);
    }

    // Ne logger que les méthodes modificatrices par défaut
    const shouldLog = logGets || ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    if (!shouldLog) {
      return handler(req, res);
    }

    // Récupérer la session utilisateur
    let session = null;
    try {
      session = await getServerSession(req, res, authOptions);
    } catch (error) {
      console.error('Erreur récupération session pour logging:', error);
    }

    // Si pas de session et skipAuth n'est pas activé, on exécute quand même le handler
    // mais on ne loggera qu'avec des infos limitées
    const userId = session?.user?.id || 'anonymous';
    const userName = session?.user?.name || session?.user?.email || 'Anonyme';

    // Capturer le body de la requête
    let requestBody = null;
    try {
      if (req.body && Object.keys(req.body).length > 0) {
        requestBody = { ...req.body };
        // Masquer les données sensibles
        if (requestBody.password) requestBody.password = '[MASQUÉ]';
        if (requestBody.token) requestBody.token = '[MASQUÉ]';
        if (requestBody.secret) requestBody.secret = '[MASQUÉ]';
      }
    } catch (e) {
      // Ignorer les erreurs de parsing
    }

    // Intercepter la réponse pour capturer le status code et les données
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    const originalEnd = res.end.bind(res);

    let responseData = null;
    let statusCode = 200;

    res.json = (data) => {
      responseData = data;
      statusCode = res.statusCode;
      return originalJson(data);
    };

    res.send = (data) => {
      statusCode = res.statusCode;
      if (typeof data === 'object') {
        responseData = data;
      }
      return originalSend(data);
    };

    res.end = (data) => {
      statusCode = res.statusCode;
      return originalEnd(data);
    };

    try {
      // Exécuter le handler original
      await handler(req, res);
    } catch (error) {
      statusCode = 500;
      throw error;
    } finally {
      // Logger après l'exécution du handler
      const duration = Date.now() - startTime;
      const entityName = entity || getEntityFromPath(path);
      const entityId = getEntityId(path, requestBody, responseData);
      const actionType = getActionType(method, path, requestBody);

      try {
        // Ne pas logger les erreurs 401/403 comme des activités normales
        // mais les logger quand même pour la sécurité
        const description = generateDescription(
          method, path, entityName, entityId, requestBody, statusCode, responseData
        );

        await prisma.journalActivite.create({
          data: {
            action: actionType === 'CONSULTATION' ? 'MODIFICATION' :
                   actionType === 'IMPORT_DONNEES' ? 'CREATION' :
                   actionType === 'AUTRE' ? 'MODIFICATION' : actionType,
            entite: entityName,
            entiteId: String(entityId),
            description: `${description} (${duration}ms)`,
            ancienneValeur: null,
            nouvelleValeur: requestBody ? JSON.stringify(requestBody) : null,
            userId: userId,
            userName: userName,
            ipAddress: getClientIp(req),
            userAgent: req.headers['user-agent'] || null,
          }
        });
      } catch (logError) {
        console.error('Erreur lors de la journalisation API:', logError);
        // Ne jamais faire échouer la requête à cause du logging
      }
    }
  };
}

/**
 * HOC pour wrapper un handler avec authentification et logging
 * Combine requireAuth + withApiLogging
 */
export function withAuthAndLogging(handler, options = {}) {
  const { roles = null, ...loggingOptions } = options;

  return withApiLogging(async (req, res) => {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({
        error: 'Non authentifié',
        message: 'Vous devez être connecté pour accéder à cette ressource'
      });
    }

    // Vérifier les rôles si spécifiés
    if (roles) {
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      if (!allowedRoles.includes(session.user.role)) {
        return res.status(403).json({
          error: 'Accès refusé',
          message: `Cette action nécessite un des rôles suivants : ${allowedRoles.join(', ')}`
        });
      }
    }

    req.session = session;
    req.user = session.user;

    return handler(req, res);
  }, loggingOptions);
}

/**
 * Export des utilitaires pour utilisation manuelle si besoin
 */
export { getClientIp, getEntityFromPath, getActionType };
