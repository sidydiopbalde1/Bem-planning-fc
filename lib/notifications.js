// lib/notifications.js
import { PrismaClient } from '@prisma/client';
import { sendEmail, emailTemplates } from './email';

const prisma = new PrismaClient();

/**
 * Create a notification for a user
 */
export async function createNotification({
  titre,
  message,
  type,
  priorite = 'NORMALE',
  destinataireId,
  entite = null,
  entiteId = null,
  lienAction = null
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        titre,
        message,
        type,
        priorite,
        destinataireId,
        entite,
        entiteId,
        lienAction
      }
    });

    return { success: true, notification };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Notify about schedule modification
 */
export async function notifyModificationPlanning(seance, modification, destinataireIds = []) {
  try {
    const seanceWithDetails = await prisma.seance.findUnique({
      where: { id: seance.id },
      include: {
        module: {
          include: {
            programme: true
          }
        },
        intervenant: true
      }
    });

    if (!seanceWithDetails) {
      return { success: false, error: 'Séance introuvable' };
    }

    const results = {
      notifications: [],
      emails: []
    };

    // Determine recipients if not specified
    let recipients = destinataireIds;
    if (recipients.length === 0) {
      // Notify the intervenant
      const intervenantUser = await prisma.user.findFirst({
        where: {
          email: seanceWithDetails.intervenant?.email,
          role: 'TEACHER'
        }
      });

      if (intervenantUser) {
        recipients.push(intervenantUser.id);
      }

      // Notify the coordinator
      const coordinatorUser = await prisma.user.findFirst({
        where: {
          id: seanceWithDetails.module.userId
        }
      });

      if (coordinatorUser) {
        recipients.push(coordinatorUser.id);
      }
    }

    // Create notifications
    for (const destinataireId of recipients) {
      const notif = await createNotification({
        titre: 'Modification de planning',
        message: `La séance ${seanceWithDetails.module.code} du ${new Date(seanceWithDetails.dateSeance).toLocaleDateString('fr-FR')} a été modifiée`,
        type: 'MODIFICATION_PLANNING',
        priorite: 'HAUTE',
        destinataireId,
        entite: 'Seance',
        entiteId: seanceWithDetails.id,
        lienAction: '/planning'
      });

      if (notif.success) {
        results.notifications.push(notif.notification);
      }

      // Send email
      const user = await prisma.user.findUnique({
        where: { id: destinataireId }
      });

      if (user?.email) {
        const template = emailTemplates.modificationPlanning(
          seanceWithDetails,
          modification,
          user
        );

        const emailResult = await sendEmail({
          to: user.email,
          subject: template.subject,
          html: template.html,
          text: template.text
        });

        results.emails.push({
          to: user.email,
          success: emailResult.success
        });
      }
    }

    return { success: true, results };
  } catch (error) {
    console.error('Error notifying schedule modification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Notify about detected conflict
 */
export async function notifyConflit(conflit) {
  try {
    const conflitWithDetails = await prisma.conflit.findUnique({
      where: { id: conflit.id },
      include: {
        seance1: {
          include: {
            module: {
              include: {
                programme: {
                  include: {
                    user: true
                  }
                }
              }
            },
            intervenant: true
          }
        },
        seance2: {
          include: {
            module: {
              include: {
                programme: {
                  include: {
                    user: true
                  }
                }
              }
            },
            intervenant: true
          }
        }
      }
    });

    if (!conflitWithDetails) {
      return { success: false, error: 'Conflit introuvable' };
    }

    // Get all affected coordinators
    const coordinatorIds = new Set();
    coordinatorIds.add(conflitWithDetails.seance1.module.programme.user.id);
    if (conflitWithDetails.seance2) {
      coordinatorIds.add(conflitWithDetails.seance2.module.programme.user.id);
    }

    const results = {
      notifications: [],
      emails: []
    };

    // Notify each coordinator
    for (const coordinatorId of coordinatorIds) {
      const coordinator = await prisma.user.findUnique({
        where: { id: coordinatorId }
      });

      if (!coordinator) continue;

      // Create notification
      const notif = await createNotification({
        titre: `Conflit détecté: ${conflitWithDetails.type}`,
        message: conflitWithDetails.description,
        type: 'CONFLIT_DETECTE',
        priorite: conflitWithDetails.severite === 'CRITIQUE' ? 'URGENTE' :
                  conflitWithDetails.severite === 'HAUTE' ? 'HAUTE' : 'NORMALE',
        destinataireId: coordinatorId,
        entite: 'Conflit',
        entiteId: conflitWithDetails.id,
        lienAction: '/coordinateur/conflits'
      });

      if (notif.success) {
        results.notifications.push(notif.notification);
      }

      // Send email
      if (coordinator.email) {
        const template = emailTemplates.conflitDetecte(
          conflitWithDetails,
          conflitWithDetails.seance1,
          conflitWithDetails.seance2,
          coordinator
        );

        const emailResult = await sendEmail({
          to: coordinator.email,
          subject: template.subject,
          html: template.html,
          text: template.text
        });

        results.emails.push({
          to: coordinator.email,
          success: emailResult.success
        });
      }
    }

    return { success: true, results };
  } catch (error) {
    console.error('Error notifying conflict:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Batch create notifications
 */
export async function createNotifications(notificationsData) {
  try {
    const notifications = await prisma.notification.createMany({
      data: notificationsData
    });

    return { success: true, count: notifications.count };
  } catch (error) {
    console.error('Error creating notifications:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark notifications as read
 */
export async function markNotificationsAsRead(notificationIds, userId) {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        destinataireId: userId
      },
      data: {
        lu: true
      }
    });

    return { success: true, count: result.count };
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Notify intervenant about unfinished session
 */
export async function notifySeanceNonTerminee(seanceId) {
  try {
    const seance = await prisma.seance.findUnique({
      where: { id: seanceId },
      include: {
        module: {
          include: {
            programme: true
          }
        },
        intervenant: true
      }
    });

    if (!seance) {
      return { success: false, error: 'Séance introuvable' };
    }

    // Check if seance is past and not marked as complete
    const now = new Date();
    const seanceDateTime = new Date(seance.dateSeance);
    const [hours, minutes] = seance.heureFin.split(':');
    seanceDateTime.setHours(parseInt(hours), parseInt(minutes));

    if (seanceDateTime >= now || seance.status === 'TERMINE' || seance.status === 'ANNULE') {
      return { success: false, error: 'La séance n\'est pas éligible pour notification' };
    }

    // Find user account for the intervenant
    const intervenantUser = await prisma.user.findFirst({
      where: {
        email: seance.intervenant.email
      }
    });

    if (!intervenantUser) {
      console.warn(`No user account found for intervenant ${seance.intervenant.email}`);
      return { success: false, error: 'Compte utilisateur intervenant introuvable' };
    }

    // Create notification
    const notif = await createNotification({
      titre: 'Séance non marquée comme terminée',
      message: `La séance ${seance.module.code} du ${new Date(seance.dateSeance).toLocaleDateString('fr-FR')} à ${seance.heureDebut} n'a pas été marquée comme terminée. Merci de compléter cette séance pour mettre à jour la progression du module.`,
      type: 'SEANCE_NON_TERMINEE',
      priorite: 'HAUTE',
      destinataireId: intervenantUser.id,
      entite: 'Seance',
      entiteId: seance.id,
      lienAction: '/intervenant/mes-seances'
    });

    // Send email
    const template = emailTemplates.seanceNonTerminee(seance, seance.intervenant);

    const emailResult = await sendEmail({
      to: seance.intervenant.email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });

    return {
      success: true,
      notification: notif.notification,
      emailSent: emailResult.success
    };
  } catch (error) {
    console.error('Error notifying unfinished session:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Find and notify all unfinished sessions
 */
export async function notifyAllSeancesNonTerminees() {
  try {
    const now = new Date();

    // Find all past sessions not marked as complete
    // Sessions from at least 2 hours ago to avoid notifying too early
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const unfinishedSessions = await prisma.seance.findMany({
      where: {
        dateSeance: {
          lt: twoHoursAgo
        },
        status: {
          notIn: ['TERMINE', 'ANNULE']
        }
      },
      include: {
        module: true,
        intervenant: true
      }
    });

    const results = {
      total: unfinishedSessions.length,
      notified: 0,
      failed: 0,
      errors: []
    };

    for (const seance of unfinishedSessions) {
      // Check if already notified today
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const existingNotification = await prisma.notification.findFirst({
        where: {
          entite: 'Seance',
          entiteId: seance.id,
          type: 'SEANCE_NON_TERMINEE',
          createdAt: {
            gte: todayStart
          }
        }
      });

      // Skip if already notified today
      if (existingNotification) {
        continue;
      }

      const result = await notifySeanceNonTerminee(seance.id);

      if (result.success) {
        results.notified++;
      } else {
        results.failed++;
        results.errors.push({
          seanceId: seance.id,
          error: result.error
        });
      }
    }

    return { success: true, results };
  } catch (error) {
    console.error('Error notifying all unfinished sessions:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}
