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
      // Récupérer une période spécifique
      const periode = await prisma.periodeAcademique.findUnique({
        where: { id },
        include: {
          activitesAcademiques: true,
          indicateursAcademiques: true
        }
      });

      if (!periode) {
        return res.status(404).json({ error: 'Période non trouvée' });
      }

      return res.status(200).json(periode);

    } else if (req.method === 'PUT') {
      // Mettre à jour une période
      const {
        nom,
        annee,
        debutS1,
        finS1,
        debutS2,
        finS2,
        vacancesNoel,
        finVacancesNoel,
        vacancesPaques,
        finVacancesPaques,
        active
      } = req.body;

      const updateData = {};
      if (nom) updateData.nom = nom;
      if (annee) updateData.annee = annee;
      if (debutS1) updateData.debutS1 = new Date(debutS1);
      if (finS1) updateData.finS1 = new Date(finS1);
      if (debutS2) updateData.debutS2 = new Date(debutS2);
      if (finS2) updateData.finS2 = new Date(finS2);
      if (vacancesNoel) updateData.vacancesNoel = new Date(vacancesNoel);
      if (finVacancesNoel) updateData.finVacancesNoel = new Date(finVacancesNoel);
      if (vacancesPaques !== undefined) updateData.vacancesPaques = vacancesPaques ? new Date(vacancesPaques) : null;
      if (finVacancesPaques !== undefined) updateData.finVacancesPaques = finVacancesPaques ? new Date(finVacancesPaques) : null;

      // Si cette période doit être activée, désactiver toutes les autres
      if (active !== undefined) {
        if (active) {
          await prisma.periodeAcademique.updateMany({
            where: { active: true, id: { not: id } },
            data: { active: false }
          });
        }
        updateData.active = active;
      }

      const periode = await prisma.periodeAcademique.update({
        where: { id },
        data: updateData
      });

      return res.status(200).json(periode);

    } else if (req.method === 'DELETE') {
      // Supprimer une période
      await prisma.periodeAcademique.delete({
        where: { id }
      });

      return res.status(200).json({ message: 'Période supprimée avec succès' });

    } else {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

  } catch (error) {
    console.error('Erreur API période académique:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}
