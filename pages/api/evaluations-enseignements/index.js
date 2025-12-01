import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const session = await getServerSession(req, res);

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  try {
    if (req.method === 'GET') {
      // Récupérer toutes les évaluations d'enseignement
      const { moduleId, intervenantId } = req.query;

      const where = {};
      if (moduleId) where.moduleId = moduleId;
      if (intervenantId) where.intervenantId = intervenantId;

      const evaluations = await prisma.evaluationEnseignement.findMany({
        where,
        include: {
          module: {
            select: {
              name: true,
              code: true,
              programme: {
                select: { name: true, code: true }
              }
            }
          },
          intervenant: {
            select: {
              civilite: true,
              nom: true,
              prenom: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json(evaluations);

    } else if (req.method === 'POST') {
      // Créer une nouvelle évaluation d'enseignement
      const {
        moduleId,
        intervenantId,
        dateEnvoi,
        dateDebut,
        dateFin,
        lienEvaluation,
        noteQualiteCours,
        noteQualitePedagogie,
        noteDisponibilite,
        noteMoyenne,
        nombreReponses,
        tauxParticipation,
        commentaires
      } = req.body;

      // Validation
      if (!moduleId || !intervenantId) {
        return res.status(400).json({
          error: 'Champs requis: moduleId, intervenantId'
        });
      }

      // Calculer la note moyenne si les notes individuelles sont fournies
      let noteMoyenneCalculee = noteMoyenne;
      if (!noteMoyenne && (noteQualiteCours || noteQualitePedagogie || noteDisponibilite)) {
        const notes = [noteQualiteCours, noteQualitePedagogie, noteDisponibilite].filter(n => n != null);
        noteMoyenneCalculee = notes.length > 0
          ? notes.reduce((sum, n) => sum + parseFloat(n), 0) / notes.length
          : null;
      }

      const evaluation = await prisma.evaluationEnseignement.create({
        data: {
          moduleId,
          intervenantId,
          dateEnvoi: dateEnvoi ? new Date(dateEnvoi) : null,
          dateDebut: dateDebut ? new Date(dateDebut) : null,
          dateFin: dateFin ? new Date(dateFin) : null,
          lienEvaluation,
          noteQualiteCours: noteQualiteCours ? parseFloat(noteQualiteCours) : null,
          noteQualitePedagogie: noteQualitePedagogie ? parseFloat(noteQualitePedagogie) : null,
          noteDisponibilite: noteDisponibilite ? parseFloat(noteDisponibilite) : null,
          noteMoyenne: noteMoyenneCalculee ? parseFloat(noteMoyenneCalculee) : null,
          nombreReponses: nombreReponses || 0,
          tauxParticipation: tauxParticipation ? parseFloat(tauxParticipation) : null,
          commentaires
        },
        include: {
          module: true,
          intervenant: true
        }
      });

      return res.status(201).json(evaluation);

    } else {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

  } catch (error) {
    console.error('Erreur API évaluations enseignements:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}
