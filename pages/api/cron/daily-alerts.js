// pages/api/cron/daily-alerts.js
// This endpoint should be called by a cron job daily
// Example: curl -X POST http://localhost:3000/api/cron/daily-alerts -H "Authorization: Bearer YOUR_CRON_SECRET"

import { PrismaClient } from '@prisma/client';
import { sendEmail, emailTemplates } from '../../../lib/email';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST' && req.method !== 'GET') {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    // Vérifier l'authentification : Vercel envoie "Authorization: Bearer <CRON_SECRET>"
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return res.status(500).json({ error: 'Cron not configured' });
    }

    const authHeader = req.headers.authorization;
    const queryKey = req.query.key;
    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` || queryKey === cronSecret;

    if (!isAuthorized) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const now = new Date();
    const results = {
      programmesEnRetard: { count: 0, emailsSent: 0 },
      modulesSansIntervenant: { count: 0, emailsSent: 0 },
      modulesProchains: { count: 0, emailsSent: 0 },
      errors: []
    };

    // 1. Check for delayed programmes
    const programmesEnRetard = await prisma.programme.findMany({
      where: {
        status: { not: 'TERMINE' },
        dateFin: { lt: now },
        progression: { lt: 100 }
      },
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

    for (const programme of programmesEnRetard) {
      results.programmesEnRetard.count++;

      if (programme.user?.email) {
        const template = emailTemplates.programmeEnRetard(programme, programme.user);
        const emailResult = await sendEmail({
          to: programme.user.email,
          subject: template.subject,
          html: template.html,
          text: template.text
        });

        if (emailResult.success) {
          results.programmesEnRetard.emailsSent++;

          await prisma.journalActivite.create({
            data: {
              action: 'ALERTE_AUTO',
              entite: 'Programme',
              entiteId: programme.id,
              description: `Alerte automatique: Programme en retard ${programme.code}`,
              userId: programme.user.id,
              userName: 'Système'
            }
          });
        } else {
          results.errors.push({
            type: 'programme_en_retard',
            id: programme.id,
            error: emailResult.error || emailResult.message
          });
        }
      }
    }

    // 2. Check for modules without instructor (starting in next 14 days)
    const quatorzJours = new Date();
    quatorzJours.setDate(quatorzJours.getDate() + 14);

    const modulesSansIntervenant = await prisma.module.findMany({
      where: {
        intervenantId: null,
        status: { notIn: ['ANNULE', 'TERMINE'] },
        OR: [
          { dateDebut: { gte: now, lte: quatorzJours } },
          { dateDebut: null } 
        ]
      },
      include: {
        programme: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Group by coordinator
    const modulesByCoordinator = {};
    for (const module of modulesSansIntervenant) {
      results.modulesSansIntervenant.count++;

      const coordinatorId = module.programme.user.id;
      if (!modulesByCoordinator[coordinatorId]) {
        modulesByCoordinator[coordinatorId] = {
          coordinator: module.programme.user,
          modules: []
        };
      }
      modulesByCoordinator[coordinatorId].modules.push({
        module,
        programme: module.programme
      });
    }

    // Send emails (one per module to avoid spam)
    for (const coordinatorId in modulesByCoordinator) {
      const { coordinator, modules } = modulesByCoordinator[coordinatorId];

      if (coordinator?.email && modules.length > 0) {
        // Send only for the first 5 most urgent modules
        const urgentModules = modules.slice(0, 5);

        for (const { module, programme } of urgentModules) {
          const template = emailTemplates.moduleSansIntervenant(module, programme, coordinator);
          const emailResult = await sendEmail({
            to: coordinator.email,
            subject: template.subject,
            html: template.html,
            text: template.text
          });

          if (emailResult.success) {
            results.modulesSansIntervenant.emailsSent++;

            await prisma.journalActivite.create({
              data: {
                action: 'ALERTE_AUTO',
                entite: 'Module',
                entiteId: module.id,
                description: `Alerte automatique: Module sans intervenant ${module.code}`,
                userId: coordinator.id,
                userName: 'Système'
              }
            });
          } else {
            results.errors.push({
              type: 'module_sans_intervenant',
              id: module.id,
              error: emailResult.error || emailResult.message
            });
          }
        }
      }
    }

    // 3. Check for upcoming modules (starting in next 7 days)
    const septJours = new Date();
    septJours.setDate(septJours.getDate() + 7);

    const modulesProchains = await prisma.module.findMany({
      where: {
        dateDebut: {
          gte: now,
          lte: septJours
        },
        status: { notIn: ['ANNULE', 'TERMINE'] }
      },
      include: {
        intervenant: {
          select: {
            id: true,
            prenom: true,
            nom: true
          }
        },
        programme: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Group by coordinator
    const upcomingByCoordinator = {};
    for (const module of modulesProchains) {
      results.modulesProchains.count++;

      const coordinatorId = module.programme.user.id;
      if (!upcomingByCoordinator[coordinatorId]) {
        upcomingByCoordinator[coordinatorId] = {
          coordinator: module.programme.user,
          modules: []
        };
      }
      upcomingByCoordinator[coordinatorId].modules.push({
        module,
        programme: module.programme
      });
    }

    // Send emails
    for (const coordinatorId in upcomingByCoordinator) {
      const { coordinator, modules } = upcomingByCoordinator[coordinatorId];

      if (coordinator?.email) {
        for (const { module, programme } of modules) {
          const template = emailTemplates.moduleProchainement(module, programme, coordinator);
          const emailResult = await sendEmail({
            to: coordinator.email,
            subject: template.subject,
            html: template.html,
            text: template.text
          });

          if (emailResult.success) {
            results.modulesProchains.emailsSent++;

            await prisma.journalActivite.create({
              data: {
                action: 'ALERTE_AUTO',
                entite: 'Module',
                entiteId: module.id,
                description: `Alerte automatique: Module démarrant prochainement ${module.code}`,
                userId: coordinator.id,
                userName: 'Système'
              }
            });
          } else {
            results.errors.push({
              type: 'module_prochain',
              id: module.id,
              error: emailResult.error || emailResult.message
            });
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Alertes quotidiennes traitées',
      timestamp: new Date().toISOString(),
      results: {
        programmesEnRetard: results.programmesEnRetard,
        modulesSansIntervenant: results.modulesSansIntervenant,
        modulesProchains: results.modulesProchains,
        totalEmailsSent:
          results.programmesEnRetard.emailsSent +
          results.modulesSansIntervenant.emailsSent +
          results.modulesProchains.emailsSent,
        errorsCount: results.errors.length,
        errors: results.errors
      }
    });
  } catch (error) {
    console.error('Erreur dans daily-alerts:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      details: error.message
    });
  }
}
