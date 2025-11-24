// pages/api/statistics/index.js
// API de statistiques avancées pour le planning
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { type = 'global', startDate, endDate, programmeId } = req.query;

    let statistics;

    switch (type) {
      case 'global':
        statistics = await getGlobalStatistics(session.user.id);
        break;
      case 'intervenants':
        statistics = await getIntervenantsStatistics(session.user.id, startDate, endDate);
        break;
      case 'salles':
        statistics = await getSallesStatistics(startDate, endDate);
        break;
      case 'programmes':
        statistics = await getProgrammesStatistics(session.user.id);
        break;
      case 'planning':
        statistics = await getPlanningStatistics(session.user.id, startDate, endDate);
        break;
      case 'performance':
        statistics = await getPerformanceIndicators(session.user.id);
        break;
      default:
        return res.status(400).json({ error: 'Type de statistique invalide' });
    }

    return res.status(200).json({
      type,
      periode: { startDate, endDate },
      statistics,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur API statistics:', error);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Statistiques globales du système
 */
async function getGlobalStatistics(userId) {
  const [
    totalProgrammes,
    totalModules,
    totalIntervenants,
    totalSeances,
    programmesEnCours,
    seancesTerminees,
    conflitsNonResolus
  ] = await Promise.all([
    prisma.programme.count({ where: { userId } }),
    prisma.module.count({ where: { userId } }),
    prisma.intervenant.count(),
    prisma.seance.count({
      where: { module: { userId } }
    }),
    prisma.programme.count({
      where: { userId, status: 'EN_COURS' }
    }),
    prisma.seance.count({
      where: { module: { userId }, status: 'TERMINE' }
    }),
    prisma.conflit.count({ where: { resolu: false } })
  ]);

  // Calcul des heures totales planifiées
  const heuresPlanifiees = await prisma.seance.aggregate({
    where: { module: { userId }, status: { not: 'ANNULE' } },
    _sum: { duree: true }
  });

  // Progression moyenne des programmes
  const progressionMoyenne = await prisma.programme.aggregate({
    where: { userId },
    _avg: { progression: true }
  });

  return {
    totaux: {
      programmes: totalProgrammes,
      modules: totalModules,
      intervenants: totalIntervenants,
      seances: totalSeances
    },
    activite: {
      programmesEnCours,
      seancesTerminees,
      tauxCompletion: totalSeances > 0
        ? Math.round((seancesTerminees / totalSeances) * 100)
        : 0
    },
    heures: {
      totalPlanifie: Math.round((heuresPlanifiees._sum.duree || 0) / 60),
      totalRealise: Math.round((seancesTerminees * 120) / 60) // estimation 2h/séance
    },
    qualite: {
      conflitsEnAttente: conflitsNonResolus,
      progressionMoyenne: Math.round(progressionMoyenne._avg.progression || 0)
    }
  };
}

/**
 * Statistiques détaillées par intervenant
 */
async function getIntervenantsStatistics(userId, startDate, endDate) {
  const dateFilters = {};
  if (startDate) dateFilters.gte = new Date(startDate);
  if (endDate) dateFilters.lte = new Date(endDate);

  const intervenants = await prisma.intervenant.findMany({
    include: {
      modules: {
        where: { userId },
        select: { id: true, name: true, vht: true }
      },
      seances: {
        where: {
          module: { userId },
          ...(startDate || endDate ? { dateSeance: dateFilters } : {})
        },
        select: {
          id: true,
          duree: true,
          status: true,
          typeSeance: true,
          dateSeance: true
        }
      }
    }
  });

  const statistiquesIntervenants = intervenants.map(intervenant => {
    const totalHeures = intervenant.seances.reduce((acc, s) => acc + (s.duree || 0), 0) / 60;
    const seancesTerminees = intervenant.seances.filter(s => s.status === 'TERMINE').length;
    const seancesTotal = intervenant.seances.length;

    // Répartition par type de séance
    const repartitionTypes = intervenant.seances.reduce((acc, s) => {
      acc[s.typeSeance] = (acc[s.typeSeance] || 0) + 1;
      return acc;
    }, {});

    // Calcul de la charge hebdomadaire moyenne
    const seancesParSemaine = calculateWeeklyLoad(intervenant.seances);

    return {
      id: intervenant.id,
      nom: `${intervenant.civilite} ${intervenant.prenom} ${intervenant.nom}`,
      email: intervenant.email,
      grade: intervenant.grade,
      specialite: intervenant.specialite,
      disponible: intervenant.disponible,
      statistiques: {
        modulesAssignes: intervenant.modules.length,
        totalSeances: seancesTotal,
        seancesTerminees,
        totalHeures: Math.round(totalHeures * 10) / 10,
        tauxRealisation: seancesTotal > 0
          ? Math.round((seancesTerminees / seancesTotal) * 100)
          : 0,
        chargeHebdomadaireMoyenne: seancesParSemaine,
        repartitionTypes
      },
      indicateurs: {
        surcharge: seancesParSemaine > 20, // Plus de 20h/semaine
        sousUtilise: seancesParSemaine < 5 && intervenant.disponible,
        efficacite: seancesTotal > 0
          ? Math.round((seancesTerminees / seancesTotal) * 100)
          : 0
      }
    };
  });

  // Trier par charge horaire décroissante
  statistiquesIntervenants.sort((a, b) =>
    b.statistiques.totalHeures - a.statistiques.totalHeures
  );

  return {
    intervenants: statistiquesIntervenants,
    resume: {
      totalIntervenants: intervenants.length,
      disponibles: intervenants.filter(i => i.disponible).length,
      enSurcharge: statistiquesIntervenants.filter(i => i.indicateurs.surcharge).length,
      sousUtilises: statistiquesIntervenants.filter(i => i.indicateurs.sousUtilise).length,
      chargeGlobaleMoyenne: Math.round(
        statistiquesIntervenants.reduce((acc, i) => acc + i.statistiques.chargeHebdomadaireMoyenne, 0)
        / statistiquesIntervenants.length * 10
      ) / 10
    }
  };
}

/**
 * Statistiques d'occupation des salles
 */
async function getSallesStatistics(startDate, endDate) {
  const dateFilters = {};
  if (startDate) dateFilters.gte = new Date(startDate);
  if (endDate) dateFilters.lte = new Date(endDate);

  // Récupérer toutes les salles définies
  const salles = await prisma.salle.findMany();

  // Récupérer les séances avec salles
  const seancesAvecSalle = await prisma.seance.findMany({
    where: {
      salle: { not: null },
      ...(startDate || endDate ? { dateSeance: dateFilters } : {}),
      status: { not: 'ANNULE' }
    },
    select: {
      salle: true,
      batiment: true,
      duree: true,
      dateSeance: true,
      heureDebut: true,
      heureFin: true,
      typeSeance: true
    }
  });

  // Grouper par salle
  const occupationParSalle = {};
  seancesAvecSalle.forEach(seance => {
    const salleName = seance.salle;
    if (!occupationParSalle[salleName]) {
      occupationParSalle[salleName] = {
        nom: salleName,
        batiment: seance.batiment,
        totalSeances: 0,
        totalHeures: 0,
        joursUtilises: new Set(),
        typesSeances: {}
      };
    }
    occupationParSalle[salleName].totalSeances++;
    occupationParSalle[salleName].totalHeures += (seance.duree || 0) / 60;
    occupationParSalle[salleName].joursUtilises.add(
      seance.dateSeance.toISOString().split('T')[0]
    );
    occupationParSalle[salleName].typesSeances[seance.typeSeance] =
      (occupationParSalle[salleName].typesSeances[seance.typeSeance] || 0) + 1;
  });

  // Calculer le taux d'occupation
  const nombreJoursOuvrables = calculateWorkingDays(
    startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate ? new Date(endDate) : new Date()
  );
  const heuresDisponiblesParJour = 8; // 8h par jour

  const statistiquesSalles = Object.values(occupationParSalle).map(salle => ({
    ...salle,
    joursUtilises: salle.joursUtilises.size,
    tauxOccupation: Math.round(
      (salle.totalHeures / (nombreJoursOuvrables * heuresDisponiblesParJour)) * 100
    ),
    heuresMoyennesParJour: salle.joursUtilises.size > 0
      ? Math.round((salle.totalHeures / salle.joursUtilises.size) * 10) / 10
      : 0
  }));

  // Trier par taux d'occupation décroissant
  statistiquesSalles.sort((a, b) => b.tauxOccupation - a.tauxOccupation);

  return {
    salles: statistiquesSalles,
    sallesDefinies: salles.length,
    resume: {
      totalSallesUtilisees: statistiquesSalles.length,
      tauxOccupationMoyen: Math.round(
        statistiquesSalles.reduce((acc, s) => acc + s.tauxOccupation, 0)
        / (statistiquesSalles.length || 1)
      ),
      sallesPlusUtilisees: statistiquesSalles.slice(0, 5).map(s => s.nom),
      salleSousUtilisees: statistiquesSalles
        .filter(s => s.tauxOccupation < 20)
        .map(s => s.nom)
    }
  };
}

/**
 * Statistiques par programme
 */
async function getProgrammesStatistics(userId) {
  const programmes = await prisma.programme.findMany({
    where: { userId },
    include: {
      modules: {
        include: {
          seances: {
            select: {
              id: true,
              duree: true,
              status: true,
              typeSeance: true
            }
          },
          intervenant: {
            select: { nom: true, prenom: true }
          }
        }
      }
    }
  });

  const statistiquesProgrammes = programmes.map(programme => {
    const totalModules = programme.modules.length;
    const modulesTermines = programme.modules.filter(m => m.status === 'TERMINE').length;

    const totalSeances = programme.modules.reduce(
      (acc, m) => acc + m.seances.length, 0
    );
    const seancesTerminees = programme.modules.reduce(
      (acc, m) => acc + m.seances.filter(s => s.status === 'TERMINE').length, 0
    );

    const heuresPlanifiees = programme.modules.reduce(
      (acc, m) => acc + m.seances.reduce((a, s) => a + (s.duree || 0), 0), 0
    ) / 60;

    const heuresRealisees = programme.modules.reduce(
      (acc, m) => acc + m.seances
        .filter(s => s.status === 'TERMINE')
        .reduce((a, s) => a + (s.duree || 0), 0), 0
    ) / 60;

    // Intervenants impliqués
    const intervenants = [...new Set(
      programme.modules
        .filter(m => m.intervenant)
        .map(m => `${m.intervenant.prenom} ${m.intervenant.nom}`)
    )];

    // Vérifier si en retard
    const estEnRetard = programme.dateFin < new Date() &&
      programme.status !== 'TERMINE' &&
      programme.status !== 'ANNULE';

    return {
      id: programme.id,
      nom: programme.name,
      code: programme.code,
      niveau: programme.niveau,
      semestre: programme.semestre,
      status: programme.status,
      progression: programme.progression,
      dates: {
        debut: programme.dateDebut,
        fin: programme.dateFin,
        enRetard: estEnRetard
      },
      statistiques: {
        modules: {
          total: totalModules,
          termines: modulesTermines,
          tauxCompletion: totalModules > 0
            ? Math.round((modulesTermines / totalModules) * 100)
            : 0
        },
        seances: {
          total: totalSeances,
          terminees: seancesTerminees,
          tauxRealisation: totalSeances > 0
            ? Math.round((seancesTerminees / totalSeances) * 100)
            : 0
        },
        heures: {
          planifiees: Math.round(heuresPlanifiees * 10) / 10,
          realisees: Math.round(heuresRealisees * 10) / 10,
          restantes: Math.round((heuresPlanifiees - heuresRealisees) * 10) / 10
        },
        intervenants: intervenants.length
      },
      intervenantsAssignes: intervenants
    };
  });

  // Résumé global
  const resume = {
    totalProgrammes: programmes.length,
    parStatus: programmes.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {}),
    enRetard: statistiquesProgrammes.filter(p => p.dates.enRetard).length,
    progressionMoyenne: Math.round(
      statistiquesProgrammes.reduce((acc, p) => acc + p.progression, 0)
      / (statistiquesProgrammes.length || 1)
    )
  };

  return {
    programmes: statistiquesProgrammes,
    resume
  };
}

/**
 * Statistiques de planning (vue temporelle)
 */
async function getPlanningStatistics(userId, startDate, endDate) {
  const debut = startDate
    ? new Date(startDate)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const fin = endDate
    ? new Date(endDate)
    : new Date();

  const seances = await prisma.seance.findMany({
    where: {
      module: { userId },
      dateSeance: { gte: debut, lte: fin }
    },
    include: {
      module: {
        select: { name: true, code: true }
      },
      intervenant: {
        select: { nom: true, prenom: true }
      }
    },
    orderBy: { dateSeance: 'asc' }
  });

  // Distribution par jour de la semaine
  const parJourSemaine = [0, 0, 0, 0, 0, 0, 0]; // Dim à Sam
  const joursNom = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  // Distribution par type
  const parType = {};

  // Distribution par status
  const parStatus = {};

  // Distribution par semaine
  const parSemaine = {};

  seances.forEach(seance => {
    const jour = new Date(seance.dateSeance).getDay();
    parJourSemaine[jour]++;

    parType[seance.typeSeance] = (parType[seance.typeSeance] || 0) + 1;
    parStatus[seance.status] = (parStatus[seance.status] || 0) + 1;

    const semaineKey = getWeekKey(new Date(seance.dateSeance));
    if (!parSemaine[semaineKey]) {
      parSemaine[semaineKey] = { seances: 0, heures: 0 };
    }
    parSemaine[semaineKey].seances++;
    parSemaine[semaineKey].heures += (seance.duree || 0) / 60;
  });

  // Formater distribution par jour
  const distributionJours = joursNom.map((nom, index) => ({
    jour: nom,
    nombreSeances: parJourSemaine[index],
    pourcentage: seances.length > 0
      ? Math.round((parJourSemaine[index] / seances.length) * 100)
      : 0
  }));

  return {
    periode: { debut, fin },
    totalSeances: seances.length,
    distributions: {
      parJourSemaine: distributionJours.filter(d => d.nombreSeances > 0),
      parType,
      parStatus,
      parSemaine: Object.entries(parSemaine).map(([semaine, data]) => ({
        semaine,
        ...data,
        heures: Math.round(data.heures * 10) / 10
      }))
    },
    moyennes: {
      seancesParJour: Math.round((seances.length / calculateWorkingDays(debut, fin)) * 10) / 10,
      heuresParSemaine: Object.values(parSemaine).length > 0
        ? Math.round(
            Object.values(parSemaine).reduce((acc, s) => acc + s.heures, 0)
            / Object.values(parSemaine).length * 10
          ) / 10
        : 0
    }
  };
}

/**
 * Indicateurs de performance (KPI)
 */
async function getPerformanceIndicators(userId) {
  const now = new Date();
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
  const debutSemaine = getStartOfWeek(now);

  // Données du mois en cours
  const [
    seancesMois,
    seancesSemaine,
    conflitsMois,
    programmesActifs
  ] = await Promise.all([
    prisma.seance.count({
      where: {
        module: { userId },
        dateSeance: { gte: debutMois },
        status: 'TERMINE'
      }
    }),
    prisma.seance.count({
      where: {
        module: { userId },
        dateSeance: { gte: debutSemaine },
        status: 'TERMINE'
      }
    }),
    prisma.conflit.count({
      where: {
        createdAt: { gte: debutMois }
      }
    }),
    prisma.programme.count({
      where: { userId, status: 'EN_COURS' }
    })
  ]);

  // Taux de réalisation
  const seancesPlanifieesMois = await prisma.seance.count({
    where: {
      module: { userId },
      dateSeance: { gte: debutMois, lte: now },
      status: { not: 'ANNULE' }
    }
  });

  // Heures totales réalisées ce mois
  const heuresMois = await prisma.seance.aggregate({
    where: {
      module: { userId },
      dateSeance: { gte: debutMois },
      status: 'TERMINE'
    },
    _sum: { duree: true }
  });

  return {
    periode: {
      mois: now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      semaineCourante: `Semaine du ${debutSemaine.toLocaleDateString('fr-FR')}`
    },
    kpi: {
      tauxRealisation: seancesPlanifieesMois > 0
        ? Math.round((seancesMois / seancesPlanifieesMois) * 100)
        : 100,
      seancesRealiseesMois: seancesMois,
      seancesRealiseesSemaine: seancesSemaine,
      heuresRealiseesMois: Math.round((heuresMois._sum.duree || 0) / 60),
      conflitsGeneres: conflitsMois,
      programmesActifs
    },
    tendances: {
      rythmeHebdomadaire: seancesSemaine,
      objectifMensuel: 40, // À paramétrer
      progressionObjectif: Math.round((seancesMois / 40) * 100)
    },
    alertes: generatePerformanceAlerts(seancesMois, conflitsMois, programmesActifs)
  };
}

// Fonctions utilitaires
function calculateWeeklyLoad(seances) {
  if (seances.length === 0) return 0;

  const semaines = new Set();
  let totalHeures = 0;

  seances.forEach(seance => {
    semaines.add(getWeekKey(new Date(seance.dateSeance)));
    totalHeures += (seance.duree || 0) / 60;
  });

  return semaines.size > 0 ? Math.round((totalHeures / semaines.size) * 10) / 10 : 0;
}

function calculateWorkingDays(start, end) {
  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }

  return count || 1;
}

function getWeekKey(date) {
  const start = getStartOfWeek(date);
  return start.toISOString().split('T')[0];
}

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function generatePerformanceAlerts(seancesMois, conflits, programmesActifs) {
  const alertes = [];

  if (seancesMois < 10) {
    alertes.push({
      type: 'WARNING',
      message: 'Faible activité ce mois-ci',
      suggestion: 'Planifier davantage de séances'
    });
  }

  if (conflits > 5) {
    alertes.push({
      type: 'ERROR',
      message: `${conflits} conflits générés ce mois`,
      suggestion: 'Vérifier la planification des intervenants'
    });
  }

  if (programmesActifs === 0) {
    alertes.push({
      type: 'INFO',
      message: 'Aucun programme en cours',
      suggestion: 'Démarrer un nouveau programme'
    });
  }

  return alertes;
}
