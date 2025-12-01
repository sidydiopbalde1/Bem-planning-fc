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
      // Récupérer un résultat spécifique
      const resultat = await prisma.resultatEtudiant.findUnique({
        where: { id },
        include: {
          module: {
            include: {
              programme: true,
              intervenant: true
            }
          }
        }
      });

      if (!resultat) {
        return res.status(404).json({ error: 'Résultat non trouvé' });
      }

      return res.status(200).json(resultat);

    } else if (req.method === 'PUT') {
      // Mettre à jour un résultat
      const {
        noteCC,
        noteExamen,
        noteFinale,
        statut,
        mention,
        vhDeroule,
        progressionPct,
        presences,
        absences
      } = req.body;

      const updateData = {};
      if (noteCC !== undefined) updateData.noteCC = noteCC ? parseFloat(noteCC) : null;
      if (noteExamen !== undefined) updateData.noteExamen = noteExamen ? parseFloat(noteExamen) : null;
      if (noteFinale !== undefined) updateData.noteFinale = noteFinale ? parseFloat(noteFinale) : null;
      if (statut) updateData.statut = statut;
      if (mention !== undefined) updateData.mention = mention;
      if (vhDeroule !== undefined) updateData.vhDeroule = vhDeroule;
      if (progressionPct !== undefined) updateData.progressionPct = progressionPct;
      if (presences !== undefined) updateData.presences = presences;
      if (absences !== undefined) updateData.absences = absences;

      // Recalculer le taux de présence si nécessaire
      if (presences !== undefined || absences !== undefined) {
        const currentResultat = await prisma.resultatEtudiant.findUnique({
          where: { id }
        });
        const newPresences = presences !== undefined ? presences : currentResultat.presences;
        const newAbsences = absences !== undefined ? absences : currentResultat.absences;
        const total = newPresences + newAbsences;
        updateData.tauxPresence = total > 0 ? (newPresences / total) * 100 : 0;
      }

      const resultat = await prisma.resultatEtudiant.update({
        where: { id },
        data: updateData,
        include: {
          module: true
        }
      });

      return res.status(200).json(resultat);

    } else if (req.method === 'DELETE') {
      // Supprimer un résultat
      await prisma.resultatEtudiant.delete({
        where: { id }
      });

      return res.status(200).json({ message: 'Résultat supprimé avec succès' });

    } else {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

  } catch (error) {
    console.error('Erreur API résultat étudiant:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}
