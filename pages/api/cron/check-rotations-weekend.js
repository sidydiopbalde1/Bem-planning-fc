// pages/api/cron/check-rotations-weekend.js
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../../../lib/email';

const prisma = new PrismaClient();

/**
 * Cron job pour vérifier les rotations et envoyer les notifications
 * À exécuter quotidiennement (ex: tous les jours à 9h00)
 *
 * Configuration Vercel cron:
 * "0 9 * * *" = Tous les jours à 9h00
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
    console.log('[CRON] Démarrage vérification rotations weekend...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dans7Jours = new Date(today);
    dans7Jours.setDate(dans7Jours.getDate() + 7);

    const dans2Jours = new Date(today);
    dans2Jours.setDate(dans2Jours.getDate() + 2);

    let notificationsSent = 0;
    let rappelsSent = 0;
    let errors = [];

    // ========== NOTIFICATIONS 7 JOURS AVANT ==========
    const rotations7Jours = await prisma.rotationWeekend.findMany({
      where: {
        dateDebut: {
          gte: dans7Jours,
          lt: new Date(dans7Jours.getTime() + 24 * 60 * 60 * 1000) // Même jour
        },
        status: 'PLANIFIE',
        notificationEnvoyee: false
      },
      include: {
        responsable: true
      }
    });

    for (const rotation of rotations7Jours) {
      try {
        // Notification dans l'app
        await prisma.notification.create({
          data: {
            titre: 'Rotation Weekend dans 7 jours',
            message: `Vous êtes assigné à la supervision du weekend du ${new Date(rotation.dateDebut).toLocaleDateString('fr-FR')}. ${rotation.nbSeancesTotal} séance(s) prévue(s).`,
            type: 'SYSTEME',
            priorite: 'NORMALE',
            destinataireId: rotation.responsableId,
            entite: 'RotationWeekend',
            entiteId: rotation.id,
            lienAction: `/rotations-weekend/${rotation.id}`
          }
        });

        // Email
        const emailSent = await sendRotationEmail(
          rotation.responsable.email,
          rotation.responsable.name,
          rotation,
          '7 jours'
        );

        if (emailSent) {
          // Marquer notification envoyée
          await prisma.rotationWeekend.update({
            where: { id: rotation.id },
            data: { notificationEnvoyee: true }
          });

          notificationsSent++;
          console.log(`✓ Notification envoyée à ${rotation.responsable.name}`);
        }
      } catch (error) {
        console.error(`Erreur notification ${rotation.id}:`, error);
        errors.push({
          rotationId: rotation.id,
          responsable: rotation.responsable.name,
          error: error.message
        });
      }
    }

    // ========== RAPPELS 48H AVANT ==========
    const rotations2Jours = await prisma.rotationWeekend.findMany({
      where: {
        dateDebut: {
          gte: dans2Jours,
          lt: new Date(dans2Jours.getTime() + 24 * 60 * 60 * 1000)
        },
        status: { in: ['PLANIFIE', 'CONFIRME'] },
        rappelEnvoye: false
      },
      include: {
        responsable: true
      }
    });

    for (const rotation of rotations2Jours) {
      try {
        // Notification dans l'app
        await prisma.notification.create({
          data: {
            titre: '⚠️ Rappel: Rotation ce weekend',
            message: `Rappel: Vous superviserez les cours ce weekend (${new Date(rotation.dateDebut).toLocaleDateString('fr-FR')}). Pensez à confirmer votre présence.`,
            type: 'SYSTEME',
            priorite: 'HAUTE',
            destinataireId: rotation.responsableId,
            entite: 'RotationWeekend',
            entiteId: rotation.id,
            lienAction: `/rotations-weekend/${rotation.id}`
          }
        });

        // Email de rappel
        const emailSent = await sendRotationEmail(
          rotation.responsable.email,
          rotation.responsable.name,
          rotation,
          '48 heures',
          true
        );

        if (emailSent) {
          // Marquer rappel envoyé
          await prisma.rotationWeekend.update({
            where: { id: rotation.id },
            data: { rappelEnvoye: true }
          });

          rappelsSent++;
          console.log(`✓ Rappel envoyé à ${rotation.responsable.name}`);
        }
      } catch (error) {
        console.error(`Erreur rappel ${rotation.id}:`, error);
        errors.push({
          rotationId: rotation.id,
          responsable: rotation.responsable.name,
          error: error.message
        });
      }
    }

    // ========== VÉRIFIER ROTATIONS EN COURS ==========
    const rotationsEnCours = await prisma.rotationWeekend.findMany({
      where: {
        dateDebut: {
          lte: today
        },
        dateFin: {
          gte: today
        },
        status: 'CONFIRME'
      }
    });

    // Marquer comme EN_COURS
    for (const rotation of rotationsEnCours) {
      await prisma.rotationWeekend.update({
        where: { id: rotation.id },
        data: { status: 'EN_COURS' }
      });
    }

    console.log(`[CRON] Terminé: ${notificationsSent} notifications, ${rappelsSent} rappels, ${rotationsEnCours.length} en cours`);

    return res.status(200).json({
      success: true,
      message: 'Vérification rotations terminée',
      stats: {
        notificationsSent,
        rappelsSent,
        rotationsEnCours: rotationsEnCours.length,
        errors: errors.length
      },
      errors
    });

  } catch (error) {
    console.error('[CRON] Erreur:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification',
      details: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Envoie un email de notification/rappel pour une rotation
 */
async function sendRotationEmail(email, name, rotation, delai, isRappel = false) {
  try {
    const subject = isRappel
      ? `⚠️ Rappel: Supervision Weekend - ${new Date(rotation.dateDebut).toLocaleDateString('fr-FR')}`
      : `📅 Rotation Weekend dans ${delai} - ${new Date(rotation.dateDebut).toLocaleDateString('fr-FR')}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; border-left: 4px solid #DC2626; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .button { display: inline-block; background: #DC2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
          ${isRappel ? '.urgent { background: #fef3c7; border-left-color: #f59e0b; padding: 15px; border-radius: 5px; margin: 15px 0; }' : ''}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">${isRappel ? '⚠️ Rappel Important' : '📅 Rotation Weekend'}</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Système de gestion BEM Planning FC</p>
          </div>

          <div class="content">
            <p>Bonjour <strong>${name}</strong>,</p>

            ${isRappel ? `
              <div class="urgent">
                <strong>⚠️ Rappel important:</strong> Votre rotation de supervision est prévue <strong>ce weekend</strong> !
              </div>
            ` : `
              <p>Vous avez été assigné à la supervision des cours du weekend dans <strong>${delai}</strong>.</p>
            `}

            <div class="info-box">
              <h3 style="margin-top: 0; color: #DC2626;">Détails de la Rotation</h3>
              <p><strong>Date:</strong> ${new Date(rotation.dateDebut).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })} - ${new Date(rotation.dateFin).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}</p>
              <p><strong>Semaine:</strong> ${rotation.semaineNumero}</p>
              <p><strong>Séances prévues:</strong> ${rotation.nbSeancesTotal}</p>
              <p><strong>Statut:</strong> ${rotation.status}</p>
            </div>

            ${isRappel ? `
              <div class="info-box" style="border-left-color: #10b981;">
                <h4 style="margin-top: 0; color: #10b981;">À faire avant le weekend:</h4>
                <ul>
                  <li>Confirmer votre présence dans l'application</li>
                  <li>Consulter le planning des séances à superviser</li>
                  <li>En cas d'empêchement, déclarer votre absence au plus tôt</li>
                </ul>
              </div>
            ` : `
              <p><strong>Rappel:</strong> Vous recevrez un rappel 48h avant le weekend.</p>
            `}

            <p style="text-align: center;">
              <a href="${process.env.NEXTAUTH_URL}/rotations-weekend/${rotation.id}" class="button">
                Voir les Détails
              </a>
            </p>

            ${!isRappel ? `
              <p style="color: #6b7280; font-size: 14px;">
                <strong>Note:</strong> Si vous n'êtes pas disponible pour ce weekend, veuillez déclarer votre absence
                le plus tôt possible dans l'application pour qu'un remplaçant soit assigné automatiquement.
              </p>
            ` : ''}
          </div>

          <div class="footer">
            <p>Ce message a été envoyé automatiquement par le système BEM Planning FC.</p>
            <p>Pour toute question, contactez l'administrateur.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: email,
      subject,
      html
    });

    return true;
  } catch (error) {
    console.error('Erreur envoi email:', error);
    return false;
  }
}
