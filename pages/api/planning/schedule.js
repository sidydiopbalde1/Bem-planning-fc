// pages/api/planning/schedule.js
// API de génération et suggestion automatique de créneaux
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]';

const prisma = new PrismaClient();

// Configuration des créneaux horaires standards
const CRENEAUX_CONFIG = {
  debutJournee: '08:00',
  finJournee: '18:00',
  pauseDebutMidi: '12:00',
  pauseFinMidi: '14:00',
  dureeMinSeance: 60,      // minutes
  dureeMaxSeance: 240,     // minutes
  dureeParDefaut: 120,     // minutes
  pauseEntreSeances: 15,   // minutes
  joursOuvrables: [1, 2, 3, 4, 5], // Lundi à Vendredi
};

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    switch (req.method) {
      case 'GET':
        return getSuggestedSlots(req, res, session);
      case 'POST':
        return generateAutoPlanning(req, res, session);
      default:
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }
  } catch (error) {
    console.error('Erreur API planning/schedule:', error);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * GET - Suggérer des créneaux disponibles pour une séance
 * Query params: moduleId, intervenantId, typeSeance, duree, startDate, endDate
 */
async function getSuggestedSlots(req, res, session) {
  const {
    moduleId,
    intervenantId,
    typeSeance = 'CM',
    duree = CRENEAUX_CONFIG.dureeParDefaut,
    startDate,
    endDate,
    salle,
    limit = 10
  } = req.query;

  if (!moduleId || !intervenantId) {
    return res.status(400).json({
      error: 'moduleId et intervenantId sont requis'
    });
  }

  // Vérifier que le module appartient à l'utilisateur
  const module = await prisma.module.findFirst({
    where: { id: moduleId, userId: session.user.id },
    include: { programme: true }
  });

  if (!module) {
    return res.status(404).json({ error: 'Module non trouvé' });
  }

  // Vérifier la disponibilité de l'intervenant
  const intervenant = await prisma.intervenant.findUnique({
    where: { id: intervenantId }
  });

  if (!intervenant || !intervenant.disponible) {
    return res.status(400).json({ error: 'Intervenant non disponible' });
  }

  // Définir la période de recherche
  const dateDebut = startDate
    ? new Date(startDate)
    : new Date();
  const dateFin = endDate
    ? new Date(endDate)
    : new Date(dateDebut.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 jours

  // Récupérer les séances existantes de l'intervenant
  const seancesIntervenant = await prisma.seance.findMany({
    where: {
      intervenantId,
      dateSeance: { gte: dateDebut, lte: dateFin },
      status: { not: 'ANNULE' }
    },
    orderBy: [{ dateSeance: 'asc' }, { heureDebut: 'asc' }]
  });

  // Récupérer les séances dans la salle (si spécifiée)
  let seancesSalle = [];
  if (salle) {
    seancesSalle = await prisma.seance.findMany({
      where: {
        salle,
        dateSeance: { gte: dateDebut, lte: dateFin },
        status: { not: 'ANNULE' }
      },
      orderBy: [{ dateSeance: 'asc' }, { heureDebut: 'asc' }]
    });
  }

  // Récupérer les périodes académiques pour éviter les vacances
  const periodeActive = await prisma.periodeAcademique.findFirst({
    where: { active: true }
  });

  // Générer les créneaux disponibles
  const creneauxDisponibles = generateAvailableSlots(
    dateDebut,
    dateFin,
    parseInt(duree),
    seancesIntervenant,
    seancesSalle,
    periodeActive,
    parseInt(limit)
  );

  // Calculer le score de chaque créneau
  const creneauxScores = creneauxDisponibles.map(creneau => ({
    ...creneau,
    score: calculateSlotScore(creneau, module, intervenant, seancesIntervenant),
    recommandation: getSlotRecommendation(creneau, module)
  }));

  // Trier par score décroissant
  creneauxScores.sort((a, b) => b.score - a.score);

  return res.status(200).json({
    suggestions: creneauxScores,
    metadata: {
      module: { id: module.id, name: module.name },
      intervenant: {
        id: intervenant.id,
        nom: `${intervenant.prenom} ${intervenant.nom}`
      },
      periode: { debut: dateDebut, fin: dateFin },
      totalSuggestions: creneauxScores.length
    }
  });
}

/**
 * POST - Générer automatiquement un planning pour un module
 */
async function generateAutoPlanning(req, res, session) {
  const {
    moduleId,
    intervenantId,
    startDate,
    endDate,
    preferences = {}
  } = req.body;

  if (!moduleId || !intervenantId || !startDate) {
    return res.status(400).json({
      error: 'moduleId, intervenantId et startDate sont requis'
    });
  }

  // Vérifier le module
  const module = await prisma.module.findFirst({
    where: { id: moduleId, userId: session.user.id }
  });

  if (!module) {
    return res.status(404).json({ error: 'Module non trouvé' });
  }

  // Calculer les heures à planifier
  const heuresAPlanifier = {
    CM: module.cm,
    TD: module.td,
    TP: module.tp
  };

  const totalHeures = module.cm + module.td + module.tp;

  if (totalHeures === 0) {
    return res.status(400).json({
      error: 'Aucune heure à planifier pour ce module'
    });
  }

  // Générer le planning
  const planningGenere = await generateModulePlanning(
    module,
    intervenantId,
    new Date(startDate),
    endDate ? new Date(endDate) : null,
    heuresAPlanifier,
    preferences,
    session.user.id
  );

  return res.status(200).json({
    message: 'Planning généré avec succès',
    planning: planningGenere,
    statistiques: {
      totalSeances: planningGenere.seances.length,
      heuresPlanifiees: planningGenere.heuresPlanifiees,
      heuresRestantes: totalHeures - planningGenere.heuresPlanifiees,
      conflitsEvites: planningGenere.conflitsEvites
    }
  });
}

/**
 * Génère les créneaux disponibles
 */
function generateAvailableSlots(
  dateDebut,
  dateFin,
  dureeMinutes,
  seancesIntervenant,
  seancesSalle,
  periode,
  limit
) {
  const slots = [];
  const currentDate = new Date(dateDebut);

  // Créer un index des séances par date pour recherche rapide
  const seancesParDate = {};
  [...seancesIntervenant, ...seancesSalle].forEach(seance => {
    const dateKey = seance.dateSeance.toISOString().split('T')[0];
    if (!seancesParDate[dateKey]) {
      seancesParDate[dateKey] = [];
    }
    seancesParDate[dateKey].push(seance);
  });

  while (currentDate <= dateFin && slots.length < limit) {
    const jourSemaine = currentDate.getDay();

    // Vérifier si c'est un jour ouvrable
    if (CRENEAUX_CONFIG.joursOuvrables.includes(jourSemaine)) {
      // Vérifier si ce n'est pas pendant les vacances
      if (!isVacationDay(currentDate, periode)) {
        const dateKey = currentDate.toISOString().split('T')[0];
        const seancesJour = seancesParDate[dateKey] || [];

        // Générer les créneaux pour cette journée
        const creneauxJour = generateDaySlots(
          new Date(currentDate),
          dureeMinutes,
          seancesJour
        );

        slots.push(...creneauxJour);
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return slots.slice(0, limit);
}

/**
 * Génère les créneaux disponibles pour une journée
 */
function generateDaySlots(date, dureeMinutes, seancesExistantes) {
  const slots = [];
  const joursNom = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  // Créneaux du matin
  const creneauxMatin = [
    { debut: '08:00', fin: '10:00' },
    { debut: '10:15', fin: '12:00' }
  ];

  // Créneaux de l'après-midi
  const creneauxApresMidi = [
    { debut: '14:00', fin: '16:00' },
    { debut: '16:15', fin: '18:00' }
  ];

  const tousCreneaux = [...creneauxMatin, ...creneauxApresMidi];

  for (const creneau of tousCreneaux) {
    // Vérifier si le créneau est suffisamment long
    const dureeCreneauMinutes = calculateDurationMinutes(creneau.debut, creneau.fin);

    if (dureeCreneauMinutes >= dureeMinutes) {
      // Vérifier s'il n'y a pas de conflit
      const hasConflict = seancesExistantes.some(seance =>
        hasTimeOverlap(creneau.debut, creneau.fin, seance.heureDebut, seance.heureFin)
      );

      if (!hasConflict) {
        // Ajuster la fin selon la durée demandée
        const finAjustee = addMinutesToTime(creneau.debut, dureeMinutes);

        slots.push({
          date: date.toISOString().split('T')[0],
          jourSemaine: joursNom[date.getDay()],
          heureDebut: creneau.debut,
          heureFin: finAjustee,
          duree: dureeMinutes,
          periode: creneau.debut < '12:00' ? 'matin' : 'apres-midi',
          disponibilite: 'LIBRE'
        });
      }
    }
  }

  return slots;
}

/**
 * Calcule le score d'un créneau (pour recommandation)
 */
function calculateSlotScore(slot, module, intervenant, seancesIntervenant) {
  let score = 100;

  // Bonus pour les créneaux du matin (généralement préférés)
  if (slot.periode === 'matin') {
    score += 10;
  }

  // Bonus pour les mardis et jeudis (jours traditionnels de cours)
  if (['Mardi', 'Jeudi'].includes(slot.jourSemaine)) {
    score += 5;
  }

  // Malus si l'intervenant a déjà beaucoup de séances cette semaine
  const dateSlot = new Date(slot.date);
  const debutSemaine = getStartOfWeek(dateSlot);
  const finSemaine = getEndOfWeek(dateSlot);

  const seancesSemaine = seancesIntervenant.filter(s => {
    const dateSeance = new Date(s.dateSeance);
    return dateSeance >= debutSemaine && dateSeance <= finSemaine;
  });

  // Malus progressif selon la charge
  if (seancesSemaine.length > 3) score -= 10;
  if (seancesSemaine.length > 5) score -= 15;
  if (seancesSemaine.length > 7) score -= 20;

  // Bonus si le créneau est proche de la date de début du module
  if (module.dateDebut) {
    const joursAvantDebut = Math.abs(
      (dateSlot - new Date(module.dateDebut)) / (1000 * 60 * 60 * 24)
    );
    if (joursAvantDebut < 7) score += 15;
    else if (joursAvantDebut < 14) score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Génère une recommandation textuelle pour un créneau
 */
function getSlotRecommendation(slot, module) {
  if (slot.score >= 90) {
    return 'Fortement recommandé - Créneau optimal';
  } else if (slot.score >= 75) {
    return 'Recommandé - Bon créneau';
  } else if (slot.score >= 50) {
    return 'Acceptable - Créneau standard';
  } else {
    return 'Déconseillé - Considérer d\'autres options';
  }
}

/**
 * Génère automatiquement le planning d'un module
 */
async function generateModulePlanning(
  module,
  intervenantId,
  startDate,
  endDate,
  heuresAPlanifier,
  preferences,
  userId
) {
  const seancesGenerees = [];
  let conflitsEvites = 0;
  let heuresPlanifiees = 0;

  const dateFin = endDate || new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000);

  // Récupérer les séances existantes
  const seancesExistantes = await prisma.seance.findMany({
    where: {
      intervenantId,
      dateSeance: { gte: startDate, lte: dateFin },
      status: { not: 'ANNULE' }
    }
  });

  // Créer un index des séances par date
  const seancesParDate = {};
  seancesExistantes.forEach(seance => {
    const dateKey = seance.dateSeance.toISOString().split('T')[0];
    if (!seancesParDate[dateKey]) seancesParDate[dateKey] = [];
    seancesParDate[dateKey].push(seance);
  });

  // Planifier chaque type de séance
  for (const [type, heures] of Object.entries(heuresAPlanifier)) {
    if (heures <= 0) continue;

    let heuresRestantes = heures;
    const dureeSeance = preferences.dureeSeance || 120; // 2h par défaut
    const currentDate = new Date(startDate);

    while (heuresRestantes > 0 && currentDate <= dateFin) {
      const jourSemaine = currentDate.getDay();

      if (CRENEAUX_CONFIG.joursOuvrables.includes(jourSemaine)) {
        const dateKey = currentDate.toISOString().split('T')[0];
        const seancesJour = seancesParDate[dateKey] || [];

        // Trouver un créneau libre
        const creneauLibre = findFreeSlot(seancesJour, dureeSeance);

        if (creneauLibre) {
          const seanceData = {
            moduleId: module.id,
            intervenantId,
            dateSeance: new Date(currentDate),
            heureDebut: creneauLibre.debut,
            heureFin: creneauLibre.fin,
            duree: dureeSeance,
            typeSeance: type,
            status: 'PLANIFIE'
          };

          seancesGenerees.push(seanceData);
          heuresPlanifiees += dureeSeance / 60;
          heuresRestantes -= dureeSeance / 60;

          // Ajouter à l'index pour éviter les doublons
          if (!seancesParDate[dateKey]) seancesParDate[dateKey] = [];
          seancesParDate[dateKey].push({
            heureDebut: creneauLibre.debut,
            heureFin: creneauLibre.fin
          });
        } else {
          conflitsEvites++;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return {
    seances: seancesGenerees,
    heuresPlanifiees,
    conflitsEvites,
    moduleId: module.id,
    intervenantId
  };
}

/**
 * Trouve un créneau libre dans une journée
 */
function findFreeSlot(seancesJour, dureeMinutes) {
  const creneaux = [
    { debut: '08:00', fin: '10:00' },
    { debut: '10:15', fin: '12:00' },
    { debut: '14:00', fin: '16:00' },
    { debut: '16:15', fin: '18:00' }
  ];

  for (const creneau of creneaux) {
    const dureeCreneauMinutes = calculateDurationMinutes(creneau.debut, creneau.fin);

    if (dureeCreneauMinutes >= dureeMinutes) {
      const hasConflict = seancesJour.some(seance =>
        hasTimeOverlap(creneau.debut, creneau.fin, seance.heureDebut, seance.heureFin)
      );

      if (!hasConflict) {
        return {
          debut: creneau.debut,
          fin: addMinutesToTime(creneau.debut, dureeMinutes)
        };
      }
    }
  }

  return null;
}

// Fonctions utilitaires
function calculateDurationMinutes(debut, fin) {
  const [h1, m1] = debut.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  return (h2 * 60 + m2) - (h1 * 60 + m1);
}

function addMinutesToTime(time, minutes) {
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60);
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

function hasTimeOverlap(debut1, fin1, debut2, fin2) {
  return debut1 < fin2 && fin1 > debut2;
}

function isVacationDay(date, periode) {
  if (!periode) return false;

  // Vérifier vacances de Noël
  if (periode.vacancesNoel && periode.finVacancesNoel) {
    if (date >= new Date(periode.vacancesNoel) &&
        date <= new Date(periode.finVacancesNoel)) {
      return true;
    }
  }

  // Vérifier vacances de Pâques
  if (periode.vacancesPaques && periode.finVacancesPaques) {
    if (date >= new Date(periode.vacancesPaques) &&
        date <= new Date(periode.finVacancesPaques)) {
      return true;
    }
  }

  return false;
}

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function getEndOfWeek(date) {
  const start = getStartOfWeek(date);
  return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
}
