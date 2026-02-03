// pages/api/admin/stats/salles.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    return await handleGet(req, res);
  } catch (error) {
    console.error('Erreur API stats salles:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
}

async function handleGet(req, res) {
  const { dateDebut, dateFin } = req.query;

  // Dates par défaut : dernier mois
  const endDate = dateFin ? new Date(dateFin) : new Date();
  const startDate = dateDebut ? new Date(dateDebut) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Statistiques générales des salles
  const [
    totalSalles,
    sallesDisponibles,
    sallesParBatiment,
    seancesParSalle,
    capaciteTotale
  ] = await Promise.all([
    // Total des salles
    prisma.salle.count(),

    // Salles disponibles
    prisma.salle.count({ where: { disponible: true } }),

    // Répartition par bâtiment
    prisma.salle.groupBy({
      by: ['batiment'],
      _count: { batiment: true },
      _sum: { capacite: true },
      _avg: { capacite: true }
    }),

    // Nombre de séances par salle dans la période
    prisma.seance.groupBy({
      by: ['salle'],
      where: {
        dateSeance: {
          gte: startDate,
          lte: endDate
        },
        salle: { not: null }
      },
      _count: { salle: true },
      _sum: { duree: true }
    }),

    // Capacité totale
    prisma.salle.aggregate({
      _sum: { capacite: true },
      _avg: { capacite: true }
    })
  ]);

  // Calculer le taux d'occupation par salle
  const salles = await prisma.salle.findMany({
    select: {
      id: true,
      nom: true,
      batiment: true,
      capacite: true
    }
  });

  const occupationParSalle = await Promise.all(
    salles.map(async (salle) => {
      const seances = await prisma.seance.findMany({
        where: {
          salle: salle.nom,
          dateSeance: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          duree: true,
          dateSeance: true
        }
      });

      const totalHeures = seances.reduce((sum, s) => sum + (s.duree || 0), 0);

      // Calculer le nombre de jours ouvrables dans la période
      const joursOuvrables = calculateWorkingDays(startDate, endDate);
      const heuresDisponibles = joursOuvrables * 10; // 10h/jour en moyenne

      const tauxOccupation = heuresDisponibles > 0
        ? Math.round((totalHeures / heuresDisponibles) * 100)
        : 0;

      return {
        salle: salle.nom,
        batiment: salle.batiment,
        capacite: salle.capacite,
        nombreSeances: seances.length,
        heuresUtilisees: totalHeures,
        heuresDisponibles,
        tauxOccupation
      };
    })
  );

  // Top 10 des salles les plus utilisées
  const top10Salles = occupationParSalle
    .sort((a, b) => b.tauxOccupation - a.tauxOccupation)
    .slice(0, 10);

  // Salles sous-utilisées (< 30%)
  const sallesSousUtilisees = occupationParSalle
    .filter(s => s.tauxOccupation < 30)
    .sort((a, b) => a.tauxOccupation - b.tauxOccupation);

  // Statistiques par bâtiment
  const statsBatiment = sallesParBatiment.map(bat => {
    const sallesBat = occupationParSalle.filter(s => s.batiment === bat.batiment);
    const tauxMoyen = sallesBat.length > 0
      ? Math.round(sallesBat.reduce((sum, s) => sum + s.tauxOccupation, 0) / sallesBat.length)
      : 0;

    return {
      batiment: bat.batiment,
      nombreSalles: bat._count.batiment,
      capaciteTotale: bat._sum.capacite || 0,
      capaciteMoyenne: Math.round(bat._avg.capacite || 0),
      tauxOccupationMoyen: tauxMoyen
    };
  });

  // Tendances par jour de la semaine
  const seances = await prisma.seance.findMany({
    where: {
      dateSeance: {
        gte: startDate,
        lte: endDate
      },
      salle: { not: null }
    },
    select: {
      dateSeance: true,
      duree: true,
      salle: true
    }
  });

  const tendancesJourSemaine = [0, 1, 2, 3, 4, 5, 6].map(jour => {
    const seancesJour = seances.filter(s => new Date(s.dateSeance).getDay() === jour);
    const heures = seancesJour.reduce((sum, s) => sum + (s.duree || 0), 0);

    return {
      jour: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][jour],
      nombreSeances: seancesJour.length,
      heuresUtilisees: heures
    };
  });

  return res.status(200).json({
    periode: {
      debut: startDate,
      fin: endDate,
      joursOuvrables: calculateWorkingDays(startDate, endDate)
    },
    general: {
      totalSalles,
      sallesDisponibles,
      sallesOccupees: totalSalles - sallesDisponibles,
      capaciteTotale: capaciteTotale._sum.capacite || 0,
      capaciteMoyenne: Math.round(capaciteTotale._avg.capacite || 0)
    },
    occupation: {
      parSalle: occupationParSalle,
      top10: top10Salles,
      sousUtilisees: sallesSousUtilisees,
      tauxGlobal: Math.round(
        occupationParSalle.reduce((sum, s) => sum + s.tauxOccupation, 0) /
        (occupationParSalle.length || 1)
      )
    },
    batiments: statsBatiment,
    tendances: {
      parJourSemaine: tendancesJourSemaine
    }
  });
}

function calculateWorkingDays(startDate, endDate) {
  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    // Lundi à Vendredi (1-5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}
