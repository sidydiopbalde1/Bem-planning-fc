// pages/api/coordinateur/alerts/weekly-report.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { sendEmail, emailTemplates } from '../../../../lib/email';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    // Allow ADMIN to trigger for all coordinators, or COORDINATOR for themselves
    if (!session || !['COORDINATOR', 'ADMIN'].includes(session.user.role)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    if (req.method === 'POST') {
      return await handlePost(req, res, session);
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (error) {
    console.error('Erreur API weekly report:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
}

async function handlePost(req, res, session) {
  const { coordinatorId } = req.body;

  // Determine which coordinators to send reports to
  let coordinators = [];

  if (coordinatorId) {
    // Send to specific coordinator
    const user = await prisma.user.findUnique({
      where: { id: coordinatorId },
      select: { id: true, name: true, email: true, role: true }
    });

    if (user && ['COORDINATOR', 'ADMIN'].includes(user.role)) {
      coordinators = [user];
    }
  } else if (session.user.role === 'ADMIN') {
    // Admin can send to all coordinators
    coordinators = await prisma.user.findMany({
      where: { role: { in: ['COORDINATOR', 'ADMIN'] } },
      select: { id: true, name: true, email: true, role: true }
    });
  } else {
    // Coordinator can only send to themselves
    coordinators = [{
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role
    }];
  }

  const results = {
    sent: 0,
    failed: 0,
    errors: []
  };

  const now = new Date();

  for (const coordinator of coordinators) {
    try {
      // Get coordinator's statistics
      const programmeWhere = { userId: coordinator.id };
      const moduleWhere = { userId: coordinator.id };

      const programmes = await prisma.programme.findMany({
        where: programmeWhere,
        include: {
          _count: { select: { modules: true } }
        }
      });

      const modules = await prisma.module.findMany({
        where: moduleWhere,
        include: {
          _count: { select: { seances: true } }
        }
      });

      const programmesStats = {
        total: programmes.length,
        enCours: programmes.filter(p => p.status === 'EN_COURS').length,
        termines: programmes.filter(p => p.status === 'TERMINE').length,
        planifies: programmes.filter(p => p.status === 'PLANIFIE').length,
        progressionMoyenne: programmes.length > 0
          ? Math.round(programmes.reduce((sum, p) => sum + p.progression, 0) / programmes.length)
          : 0
      };

      const modulesStats = {
        total: modules.length,
        enCours: modules.filter(m => m.status === 'EN_COURS').length,
        termines: modules.filter(m => m.status === 'TERMINE').length,
        avecIntervenant: modules.filter(m => m.intervenantId).length,
        sansIntervenant: modules.filter(m => !m.intervenantId).length,
        totalVHT: modules.reduce((sum, m) => sum + (m.vht || 0), 0)
      };

      // Get programmes in delay
      const programmesEnRetard = programmes.filter(p => {
        const fin = new Date(p.dateFin);
        return now > fin && p.progression < 100 && p.status !== 'TERMINE';
      });

      // Get modules without instructor
      const modulesSansIntervenant = modules.filter(m =>
        !m.intervenantId && m.status !== 'ANNULE'
      );

      const stats = {
        programmesStats,
        modulesStats,
        programmesEnRetard,
        modulesSansIntervenant
      };

      // Send email
      if (coordinator.email) {
        const template = emailTemplates.rapportHebdomadaire(coordinator, stats);
        const result = await sendEmail({
          to: coordinator.email,
          subject: template.subject,
          html: template.html,
          text: template.text
        });

        if (result.success) {
          results.sent++;

          // Log the report
          await prisma.journalActivite.create({
            data: {
              action: 'RAPPORT',
              entite: 'Coordinateur',
              entiteId: coordinator.id,
              description: `Rapport hebdomadaire envoyé à ${coordinator.name}`,
              userId: session.user.id,
              userName: session.user.name
            }
          });
        } else {
          results.failed++;
          results.errors.push({
            coordinator: coordinator.name,
            error: result.error || result.message
          });
        }
      } else {
        results.failed++;
        results.errors.push({
          coordinator: coordinator.name,
          error: 'Email non configuré'
        });
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        coordinator: coordinator.name,
        error: error.message
      });
    }
  }

  return res.status(200).json({
    message: 'Envoi des rapports hebdomadaires terminé',
    results: {
      coordinatorsCount: coordinators.length,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors
    }
  });
}
