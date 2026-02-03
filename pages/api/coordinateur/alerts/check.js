// pages/api/coordinateur/alerts/check.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { sendEmail, emailTemplates } from '../../../../lib/email';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !['COORDINATOR', 'ADMIN'].includes(session.user.role)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    if (req.method === 'POST') {
      return await handlePost(req, res, session);
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (error) {
    console.error('Erreur API alerts check:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
}

async function handlePost(req, res, session) {
  const { type = 'all' } = req.body; // 'all', 'delays', 'missing_instructors', 'upcoming'
  const userId = session.user.role === 'COORDINATOR' ? session.user.id : null;
  const programmeWhere = userId ? { userId } : {};
  const moduleWhere = userId ? { userId } : {};

  const alerts = {
    programmesEnRetard: [],
    modulesSansIntervenant: [],
    modulesProchains: [],
    emailsSent: 0,
    errors: []
  };

  const now = new Date();

  // Check for delayed programmes
  if (type === 'all' || type === 'delays') {
    const programmes = await prisma.programme.findMany({
      where: {
        ...programmeWhere,
        status: { not: 'TERMINE' },
        dateFin: { lt: now }
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

    const programmesEnRetard = programmes.filter(p => p.progression < 100);

    for (const programme of programmesEnRetard) {
      alerts.programmesEnRetard.push({
        id: programme.id,
        code: programme.code,
        name: programme.name,
        progression: programme.progression
      });

      // Send email to coordinator
      if (programme.user?.email) {
        const template = emailTemplates.programmeEnRetard(programme, programme.user);
        const result = await sendEmail({
          to: programme.user.email,
          subject: template.subject,
          html: template.html,
          text: template.text
        });

        if (result.success) {
          alerts.emailsSent++;

          // Log the alert
          await prisma.journalActivite.create({
            data: {
              action: 'ALERTE',
              entite: 'Programme',
              entiteId: programme.id,
              description: `Alerte envoyée: Programme en retard ${programme.code}`,
              userId: session.user.id,
              userName: session.user.name
            }
          });
        } else {
          alerts.errors.push({
            type: 'email',
            programme: programme.code,
            error: result.error || result.message
          });
        }
      }
    }
  }

  // Check for modules without instructor
  if (type === 'all' || type === 'missing_instructors') {
    const modules = await prisma.module.findMany({
      where: {
        ...moduleWhere,
        intervenantId: null,
        status: { notIn: ['ANNULE', 'TERMINE'] }
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

    // Group by coordinator to send one email per coordinator
    const modulesByCoordinator = {};

    for (const module of modules) {
      alerts.modulesSansIntervenant.push({
        id: module.id,
        code: module.code,
        name: module.name,
        vht: module.vht
      });

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

    // Send emails to coordinators
    for (const coordinatorId in modulesByCoordinator) {
      const { coordinator, modules: coordModules } = modulesByCoordinator[coordinatorId];

      if (coordinator?.email) {
        // Send one email per module (you could batch them if preferred)
        for (const { module, programme } of coordModules) {
          const template = emailTemplates.moduleSansIntervenant(module, programme, coordinator);
          const result = await sendEmail({
            to: coordinator.email,
            subject: template.subject,
            html: template.html,
            text: template.text
          });

          if (result.success) {
            alerts.emailsSent++;

            await prisma.journalActivite.create({
              data: {
                action: 'ALERTE',
                entite: 'Module',
                entiteId: module.id,
                description: `Alerte envoyée: Module sans intervenant ${module.code}`,
                userId: session.user.id,
                userName: session.user.name
              }
            });
          } else {
            alerts.errors.push({
              type: 'email',
              module: module.code,
              error: result.error || result.message
            });
          }
        }
      }
    }
  }

  // Check for upcoming modules (starting in next 7 days)
  if (type === 'all' || type === 'upcoming') {
    const septJours = new Date();
    septJours.setDate(septJours.getDate() + 7);

    const modules = await prisma.module.findMany({
      where: {
        ...moduleWhere,
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
    const modulesByCoordinator = {};

    for (const module of modules) {
      alerts.modulesProchains.push({
        id: module.id,
        code: module.code,
        name: module.name,
        dateDebut: module.dateDebut
      });

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

    // Send emails
    for (const coordinatorId in modulesByCoordinator) {
      const { coordinator, modules: coordModules } = modulesByCoordinator[coordinatorId];

      if (coordinator?.email) {
        for (const { module, programme } of coordModules) {
          const template = emailTemplates.moduleProchainement(module, programme, coordinator);
          const result = await sendEmail({
            to: coordinator.email,
            subject: template.subject,
            html: template.html,
            text: template.text
          });

          if (result.success) {
            alerts.emailsSent++;

            await prisma.journalActivite.create({
              data: {
                action: 'ALERTE',
                entite: 'Module',
                entiteId: module.id,
                description: `Alerte envoyée: Module démarrant prochainement ${module.code}`,
                userId: session.user.id,
                userName: session.user.name
              }
            });
          } else {
            alerts.errors.push({
              type: 'email',
              module: module.code,
              error: result.error || result.message
            });
          }
        }
      }
    }
  }

  return res.status(200).json({
    message: 'Vérification des alertes terminée',
    alerts,
    summary: {
      programmesEnRetard: alerts.programmesEnRetard.length,
      modulesSansIntervenant: alerts.modulesSansIntervenant.length,
      modulesProchains: alerts.modulesProchains.length,
      emailsSent: alerts.emailsSent,
      errorsCount: alerts.errors.length
    }
  });
}
