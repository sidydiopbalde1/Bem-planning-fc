// pages/api/cron/check-unfinished-sessions.js
import { notifyAllSeancesNonTerminees } from '../../../lib/notifications';

/**
 * Cron job to check for unfinished sessions and notify instructors
 *
 * This endpoint should be called daily (e.g., every day at 6 PM)
 *
 * Setup with cron:
 * - Using Vercel Cron: Add to vercel.json
 * - Using external service: Call this endpoint via curl or similar
 *
 * Example with crontab:
 * 0 18 * * * curl -X POST https://yourdomain.com/api/cron/check-unfinished-sessions?key=YOUR_SECRET_KEY
 */
export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // Vérifier l'authentification : Vercel envoie "Authorization: Bearer <CRON_SECRET>"
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return res.status(500).json({ error: 'Cron not configured' });
  }

  const authHeader = req.headers.authorization;
  const queryKey = req.query.key;
  const isAuthorized =
    authHeader === `Bearer ${cronSecret}` || queryKey === cronSecret;

  if (!isAuthorized) {
    console.error('Unauthorized cron request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('[CRON] Starting check for unfinished sessions...');

    const result = await notifyAllSeancesNonTerminees();

    if (result.success) {
      console.log('[CRON] Check completed successfully:', result.results);
      return res.status(200).json({
        success: true,
        message: 'Notifications sent for unfinished sessions',
        stats: result.results
      });
    } else {
      console.error('[CRON] Check failed:', result.error);
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('[CRON] Error checking unfinished sessions:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}
