// pages/api/evaluation/[token].js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { token } = req.query;

  try {
    if (req.method === 'GET') {
      return await handleGet(token, res);
    }

    if (req.method === 'POST') {
      return await handlePost(token, req.body, res);
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (error) {
    console.error('Erreur API evaluation:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}

async function handleGet(token, res) {
  if (!token) {
    return res.status(400).json({ error: 'Token manquant' });
  }

  // Find evaluation by link containing this token
  const lienEvaluation = `${process.env.NEXTAUTH_URL}/evaluation/${token}`;

  const evaluation = await prisma.evaluationEnseignement.findFirst({
    where: {
      lienEvaluation
    },
    include: {
      module: {
        include: {
          programme: {
            select: {
              name: true,
              code: true
            }
          }
        }
      },
      intervenant: {
        select: {
          civilite: true,
          nom: true,
          prenom: true
        }
      }
    }
  });

  if (!evaluation) {
    return res.status(404).json({ error: 'Évaluation introuvable' });
  }

  // Check if evaluation is active
  const now = new Date();
  const dateDebut = evaluation.dateDebut ? new Date(evaluation.dateDebut) : null;
  const dateFin = evaluation.dateFin ? new Date(evaluation.dateFin) : null;

  if (dateDebut && now < dateDebut) {
    return res.status(403).json({
      error: 'Cette évaluation n\'est pas encore ouverte',
      dateDebut: evaluation.dateDebut
    });
  }

  if (dateFin && now > dateFin) {
    return res.status(403).json({
      error: 'Cette évaluation est fermée',
      dateFin: evaluation.dateFin
    });
  }

  // Don't send sensitive data
  const {
    noteQualiteCours,
    noteQualitePedagogie,
    noteDisponibilite,
    noteMoyenne,
    nombreReponses,
    tauxParticipation,
    commentaires: existingCommentaires,
    ...publicData
  } = evaluation;

  return res.status(200).json(publicData);
}

async function handlePost(token, body, res) {
  if (!token) {
    return res.status(400).json({ error: 'Token manquant' });
  }

  const { noteQualiteCours, noteQualitePedagogie, noteDisponibilite, commentaires } = body;

  // Validate ratings (1-5 scale)
  const notes = [noteQualiteCours, noteQualitePedagogie, noteDisponibilite].filter(n => n != null);

  if (notes.length === 0) {
    return res.status(400).json({ error: 'Au moins une note est requise' });
  }

  for (const note of notes) {
    if (note < 1 || note > 5) {
      return res.status(400).json({ error: 'Les notes doivent être entre 1 et 5' });
    }
  }

  // Find evaluation
  const lienEvaluation = `${process.env.NEXTAUTH_URL}/evaluation/${token}`;

  const evaluation = await prisma.evaluationEnseignement.findFirst({
    where: {
      lienEvaluation
    }
  });

  if (!evaluation) {
    return res.status(404).json({ error: 'Évaluation introuvable' });
  }

  // Check if evaluation is active
  const now = new Date();
  const dateDebut = evaluation.dateDebut ? new Date(evaluation.dateDebut) : null;
  const dateFin = evaluation.dateFin ? new Date(evaluation.dateFin) : null;

  if (dateDebut && now < dateDebut) {
    return res.status(403).json({
      error: 'Cette évaluation n\'est pas encore ouverte'
    });
  }

  if (dateFin && now > dateFin) {
    return res.status(403).json({
      error: 'Cette évaluation est fermée'
    });
  }

  // Calculate average
  const validNotes = [noteQualiteCours, noteQualitePedagogie, noteDisponibilite].filter(n => n != null);
  const newAverage = validNotes.reduce((sum, n) => sum + n, 0) / validNotes.length;

  // Update evaluation with new response
  const currentReponses = evaluation.nombreReponses;
  const currentMoyenne = evaluation.noteMoyenne || 0;
  const currentQualiteCours = evaluation.noteQualiteCours || 0;
  const currentQualitePedagogie = evaluation.noteQualitePedagogie || 0;
  const currentDisponibilite = evaluation.noteDisponibilite || 0;

  // Calculate cumulative averages
  const updatedNombreReponses = currentReponses + 1;
  const updatedNoteMoyenne = ((currentMoyenne * currentReponses) + newAverage) / updatedNombreReponses;

  const updatedQualiteCours = noteQualiteCours
    ? ((currentQualiteCours * currentReponses) + noteQualiteCours) / updatedNombreReponses
    : currentQualiteCours;

  const updatedQualitePedagogie = noteQualitePedagogie
    ? ((currentQualitePedagogie * currentReponses) + noteQualitePedagogie) / updatedNombreReponses
    : currentQualitePedagogie;

  const updatedDisponibilite = noteDisponibilite
    ? ((currentDisponibilite * currentReponses) + noteDisponibilite) / updatedNombreReponses
    : currentDisponibilite;

  // Calculate participation rate
  const tauxParticipation = evaluation.nombreInvitations > 0
    ? (updatedNombreReponses / evaluation.nombreInvitations) * 100
    : null;

  // Append new comment to existing comments
  const allCommentaires = evaluation.commentaires
    ? `${evaluation.commentaires}\n\n---\n\n${commentaires || ''}`
    : commentaires;

  const updatedEvaluation = await prisma.evaluationEnseignement.update({
    where: { id: evaluation.id },
    data: {
      nombreReponses: updatedNombreReponses,
      noteMoyenne: updatedNoteMoyenne,
      noteQualiteCours: updatedQualiteCours,
      noteQualitePedagogie: updatedQualitePedagogie,
      noteDisponibilite: updatedDisponibilite,
      tauxParticipation,
      commentaires: allCommentaires,
      statut: evaluation.statut === 'BROUILLON' ? 'EN_COURS' : evaluation.statut
    }
  });

  return res.status(200).json({
    message: 'Évaluation enregistrée avec succès',
    nombreReponses: updatedNombreReponses
  });
}
