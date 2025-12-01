import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const session = await getServerSession(req, res);

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      // Récupérer une évaluation spécifique
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
        return res.status(404).json({ error: 'Évaluation non trouvée' });
      }

      return res.status(200).json(evaluation);

    } else if (req.method === 'PUT') {
      // Mettre à jour une évaluation
      const {
        dateEnvoi,
        dateDebut,
        dateFin,
        lienEvaluation,
        noteQualiteCours,
        noteQualitePedagogie,
        noteDisponibilite,
        nombreReponses,
        tauxParticipation,
        commentaires
      } = req.body;

      const updateData = {};
      if (dateEnvoi !== undefined) updateData.dateEnvoi = dateEnvoi ? new Date(dateEnvoi) : null;
      if (dateDebut !== undefined) updateData.dateDebut = dateDebut ? new Date(dateDebut) : null;
      if (dateFin !== undefined) updateData.dateFin = dateFin ? new Date(dateFin) : null;
      if (lienEvaluation !== undefined) updateData.lienEvaluation = lienEvaluation;
      if (noteQualiteCours !== undefined) updateData.noteQualiteCours = noteQualiteCours ? parseFloat(noteQualiteCours) : null;
      if (noteQualitePedagogie !== undefined) updateData.noteQualitePedagogie = noteQualitePedagogie ? parseFloat(noteQualitePedagogie) : null;
      if (noteDisponibilite !== undefined) updateData.noteDisponibilite = noteDisponibilite ? parseFloat(noteDisponibilite) : null;
      if (nombreReponses !== undefined) updateData.nombreReponses = nombreReponses;
      if (tauxParticipation !== undefined) updateData.tauxParticipation = tauxParticipation ? parseFloat(tauxParticipation) : null;
      if (commentaires !== undefined) updateData.commentaires = commentaires;

      // Recalculer la note moyenne
      if (noteQualiteCours !== undefined || noteQualitePedagogie !== undefined || noteDisponibilite !== undefined) {
        const currentEval = await prisma.evaluationEnseignement.findUnique({
          where: { id }
        });
        const notes = [
          noteQualiteCours !== undefined ? noteQualiteCours : currentEval.noteQualiteCours,
          noteQualitePedagogie !== undefined ? noteQualitePedagogie : currentEval.noteQualitePedagogie,
          noteDisponibilite !== undefined ? noteDisponibilite : currentEval.noteDisponibilite
        ].filter(n => n != null);

        updateData.noteMoyenne = notes.length > 0
          ? notes.reduce((sum, n) => sum + parseFloat(n), 0) / notes.length
          : null;
      }

      const evaluation = await prisma.evaluationEnseignement.update({
        where: { id },
        data: updateData,
        include: {
          module: true,
          intervenant: true
        }
      });

      return res.status(200).json(evaluation);

    } else if (req.method === 'DELETE') {
      // Supprimer une évaluation
      await prisma.evaluationEnseignement.delete({
        where: { id }
      });

      return res.status(200).json({ message: 'Évaluation supprimée avec succès' });

    } else {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

  } catch (error) {
    console.error('Erreur API évaluation enseignement:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}
