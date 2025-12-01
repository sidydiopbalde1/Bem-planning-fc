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
      // Récupérer toutes les périodes académiques
      const periodes = await prisma.periodeAcademique.findMany({
        orderBy: { annee: 'desc' }
      });

      return res.status(200).json(periodes);

    } else if (req.method === 'POST') {
      // Créer une nouvelle période académique
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

      // Validation
      if (!nom || !annee || !debutS1 || !finS1 || !debutS2 || !finS2 || !vacancesNoel || !finVacancesNoel) {
        return res.status(400).json({
          error: 'Champs requis: nom, annee, debutS1, finS1, debutS2, finS2, vacancesNoel, finVacancesNoel'
        });
      }

      // Si cette période doit être active, désactiver toutes les autres
      if (active) {
        await prisma.periodeAcademique.updateMany({
          where: { active: true },
          data: { active: false }
        });
      }

      const periode = await prisma.periodeAcademique.create({
        data: {
          nom,
          annee,
          debutS1: new Date(debutS1),
          finS1: new Date(finS1),
          debutS2: new Date(debutS2),
          finS2: new Date(finS2),
          vacancesNoel: new Date(vacancesNoel),
          finVacancesNoel: new Date(finVacancesNoel),
          vacancesPaques: vacancesPaques ? new Date(vacancesPaques) : null,
          finVacancesPaques: finVacancesPaques ? new Date(finVacancesPaques) : null,
          active: active || false
        }
      });

      return res.status(201).json(periode);

    } else {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

  } catch (error) {
    console.error('Erreur API périodes académiques:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}
