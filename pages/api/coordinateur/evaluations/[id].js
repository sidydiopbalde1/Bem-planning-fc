// pages/api/coordinateur/evaluations/[id].js
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import { sendEmail, emailTemplates } from '../../../../lib/email';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !['COORDINATOR', 'ADMIN'].includes(session.user.role)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const { id } = req.query;

    if (req.method === 'GET') {
      return await handleGet(req, res, id);
    }

    if (req.method === 'PUT') {
      return await handlePut(req, res, session, id);
    }

    if (req.method === 'DELETE') {
      return await handleDelete(req, res, session, id);
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (error) {
    console.error('Erreur API evaluation [id]:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}

async function handleGet(req, res, id) {
  const evaluation = await prisma.evaluationEnseignement.findUnique({
    where: { id },
    include: {
      module: {
        include: {
          programme: true
        }
      },
      intervenant: true
    }
  });

  if (!evaluation) {
    return res.status(404).json({ error: 'Campagne d\'évaluation introuvable' });
  }

  return res.status(200).json({ evaluation });
}

async function handlePut(req, res, session, id) {
  const { dateDebut, dateFin, nombreInvitations, statut, action } = req.body;

  // Check if evaluation exists
  const evaluation = await prisma.evaluationEnseignement.findUnique({
    where: { id },
    include: {
      module: {
        include: {
          programme: true
        }
      },
      intervenant: true
    }
  });

  if (!evaluation) {
    return res.status(404).json({ error: 'Campagne d\'évaluation introuvable' });
  }

  // Handle special actions
  if (action === 'envoyer') {
    return await handleEnvoyerCampagne(req, res, session, evaluation);
  }

  if (action === 'terminer') {
    return await handleTerminerCampagne(req, res, session, evaluation);
  }

  // Update evaluation
  const updateData = {};
  if (dateDebut) updateData.dateDebut = new Date(dateDebut);
  if (dateFin) updateData.dateFin = new Date(dateFin);
  if (nombreInvitations !== undefined) updateData.nombreInvitations = nombreInvitations;
  if (statut) updateData.statut = statut;

  // Validate dates if both are provided
  if (updateData.dateDebut && updateData.dateFin && updateData.dateDebut >= updateData.dateFin) {
    return res.status(400).json({ error: 'La date de début doit être antérieure à la date de fin' });
  }

  const updatedEvaluation = await prisma.evaluationEnseignement.update({
    where: { id },
    data: updateData,
    include: {
      module: {
        include: {
          programme: true
        }
      },
      intervenant: true
    }
  });

  // Log the action
  await prisma.journalActivite.create({
    data: {
      action: 'MODIFICATION',
      entite: 'EvaluationEnseignement',
      entiteId: id,
      description: `Modification de la campagne d'évaluation ${evaluation.module.code}`,
      userId: session.user.id,
      userName: session.user.name
    }
  });

  return res.status(200).json({
    message: 'Campagne d\'évaluation mise à jour avec succès',
    evaluation: updatedEvaluation
  });
}

async function handleEnvoyerCampagne(req, res, session, evaluation) {
  // Update status to ENVOYEE
  const now = new Date();
  const updatedEvaluation = await prisma.evaluationEnseignement.update({
    where: { id: evaluation.id },
    data: {
      statut: 'ENVOYEE',
      dateEnvoi: now
    },
    include: {
      module: {
        include: {
          programme: true
        }
      },
      intervenant: true
    }
  });

  // Send notification to intervenant
  if (evaluation.intervenant?.email) {
    const template = emailTemplates.evaluationDisponible(
      evaluation.module,
      evaluation.intervenant,
      evaluation.lienEvaluation
    );

    await sendEmail({
      to: evaluation.intervenant.email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  // Create notification
  await prisma.notification.create({
    data: {
      titre: 'Campagne d\'évaluation envoyée',
      message: `La campagne d'évaluation pour le module ${evaluation.module.code} a été envoyée aux étudiants`,
      type: 'EVALUATION_DISPONIBLE',
      priorite: 'NORMALE',
      destinataireId: session.user.id,
      entite: 'EvaluationEnseignement',
      entiteId: evaluation.id,
      lienAction: `/coordinateur/evaluations/${evaluation.id}`
    }
  });

  // Log the action
  await prisma.journalActivite.create({
    data: {
      action: 'MODIFICATION',
      entite: 'EvaluationEnseignement',
      entiteId: evaluation.id,
      description: `Envoi de la campagne d'évaluation ${evaluation.module.code}`,
      userId: session.user.id,
      userName: session.user.name
    }
  });

  return res.status(200).json({
    message: 'Campagne d\'évaluation envoyée avec succès',
    evaluation: updatedEvaluation
  });
}

async function handleTerminerCampagne(req, res, session, evaluation) {
  // Calculate participation rate
  const tauxParticipation = evaluation.nombreInvitations > 0
    ? (evaluation.nombreReponses / evaluation.nombreInvitations) * 100
    : 0;

  // Calculate average note
  const noteMoyenne = [
    evaluation.noteQualiteCours,
    evaluation.noteQualitePedagogie,
    evaluation.noteDisponibilite
  ].filter(n => n !== null).reduce((sum, n, _, arr) => sum + n / arr.length, 0);

  // Update status to TERMINEE
  const updatedEvaluation = await prisma.evaluationEnseignement.update({
    where: { id: evaluation.id },
    data: {
      statut: 'TERMINEE',
      tauxParticipation,
      noteMoyenne: noteMoyenne || null
    },
    include: {
      module: {
        include: {
          programme: true
        }
      },
      intervenant: true
    }
  });

  // Log the action
  await prisma.journalActivite.create({
    data: {
      action: 'MODIFICATION',
      entite: 'EvaluationEnseignement',
      entiteId: evaluation.id,
      description: `Clôture de la campagne d'évaluation ${evaluation.module.code}`,
      userId: session.user.id,
      userName: session.user.name
    }
  });

  return res.status(200).json({
    message: 'Campagne d\'évaluation terminée avec succès',
    evaluation: updatedEvaluation
  });
}

async function handleDelete(req, res, session, id) {
  // Check if evaluation exists
  const evaluation = await prisma.evaluationEnseignement.findUnique({
    where: { id },
    include: {
      module: true
    }
  });

  if (!evaluation) {
    return res.status(404).json({ error: 'Campagne d\'évaluation introuvable' });
  }

  // Don't allow deletion of sent or completed campaigns
  if (['ENVOYEE', 'EN_COURS', 'TERMINEE'].includes(evaluation.statut)) {
    return res.status(400).json({
      error: 'Impossible de supprimer une campagne envoyée ou terminée',
      suggestion: 'Vous pouvez l\'annuler en changeant son statut à ANNULEE'
    });
  }

  // Delete evaluation
  await prisma.evaluationEnseignement.delete({
    where: { id }
  });

  // Log the action
  await prisma.journalActivite.create({
    data: {
      action: 'SUPPRESSION',
      entite: 'EvaluationEnseignement',
      entiteId: id,
      description: `Suppression de la campagne d'évaluation ${evaluation.module.code}`,
      userId: session.user.id,
      userName: session.user.name
    }
  });

  return res.status(200).json({
    message: 'Campagne d\'évaluation supprimée avec succès'
  });
}
