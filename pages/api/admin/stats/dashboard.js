// pages/api/admin/stats/dashboard.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
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
    console.error('Erreur API stats dashboard:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
}

async function handleGet(req, res) {
  // KPIs principaux
  const [
    // Utilisateurs
    totalUtilisateurs,
    utilisateursParRole,
    derniereConnexion,

    // Programmes et modules
    totalProgrammes,
    programmesParStatut,
    totalModules,
    modulesParStatut,

    // Intervenants
    totalIntervenants,
    intervenantsActifs,

    // Salles
    totalSalles,
    sallesDisponibles,

    // Séances
    totalSeances,
    seancesParStatut,
    seancesCeMois,

    // Conflits
    conflitsNonResolus,
    conflitsParType,

    // Périodes académiques
    periodeActive,

    // Activité récente (30 derniers jours)
    activitesRecentes,
    actionsParType
  ] = await Promise.all([
    // Utilisateurs
    prisma.user.count(),
    prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    }),
    prisma.journalActivite.findFirst({
      where: { action: 'CONNEXION' },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    }),

    // Programmes
    prisma.programme.count(),
    prisma.programme.groupBy({
      by: ['status'],
      _count: { status: true }
    }),

    // Modules
    prisma.module.count(),
    prisma.module.groupBy({
      by: ['status'],
      _count: { status: true }
    }),

    // Intervenants
    prisma.intervenant.count(),
    prisma.intervenant.count({ where: { disponible: true } }),

    // Salles
    prisma.salle.count(),
    prisma.salle.count({ where: { disponible: true } }),

    // Séances
    prisma.seance.count(),
    prisma.seance.groupBy({
      by: ['status'],
      _count: { status: true }
    }),
    prisma.seance.count({
      where: {
        dateSeance: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          lte: new Date()
        }
      }
    }),

    // Conflits
    prisma.conflit.count({ where: { resolu: false } }),
    prisma.conflit.groupBy({
      by: ['type'],
      _count: { type: true },
      where: { resolu: false }
    }),

    // Période académique active
    prisma.periodeAcademique.findFirst({
      where: { active: true }
    }),

    // Activité récente
    prisma.journalActivite.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    }),
    prisma.journalActivite.groupBy({
      by: ['action'],
      _count: { action: true },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    })
  ]);

  // Calculer la progression des programmes
  const programmes = await prisma.programme.findMany({
    select: {
      id: true,
      name: true,
      progression: true,
      status: true
    }
  });

  const progressionMoyenne = programmes.length > 0
    ? Math.round(programmes.reduce((sum, p) => sum + p.progression, 0) / programmes.length)
    : 0;

  // Activité par jour (derniers 30 jours)
  const activiteParJour = await getActivityByDay(30);

  // Taux de complétion des modules
  const modulesTermines = modulesParStatut.find(s => s.status === 'TERMINE')?._count.status || 0;
  const tauxCompletionModules = totalModules > 0
    ? Math.round((modulesTermines / totalModules) * 100)
    : 0;

  // Statistiques de séances
  const seancesTerminees = seancesParStatut.find(s => s.status === 'TERMINE')?._count.status || 0;
  const seancesEnCours = seancesParStatut.find(s => s.status === 'EN_COURS')?._count.status || 0;
  const seancesPlanifiees = seancesParStatut.find(s => s.status === 'PLANIFIE')?._count.status || 0;

  // Top 5 utilisateurs les plus actifs
  const topUtilisateurs = await prisma.journalActivite.groupBy({
    by: ['userId', 'userName'],
    _count: { userId: true },
    where: {
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    },
    orderBy: {
      _count: {
        userId: 'desc'
      }
    },
    take: 5
  });

  // Tendances mensuelles (6 derniers mois)
  const tendancesMensuelles = await getTendancesMensuelles(6);

  return res.status(200).json({
    kpis: {
      utilisateurs: {
        total: totalUtilisateurs,
        parRole: utilisateursParRole.map(r => ({
          role: r.role,
          count: r._count.role
        })),
        derniereConnexion: derniereConnexion?.createdAt
      },
      programmes: {
        total: totalProgrammes,
        parStatut: programmesParStatut.map(s => ({
          statut: s.status,
          count: s._count.status
        })),
        progressionMoyenne
      },
      modules: {
        total: totalModules,
        parStatut: modulesParStatut.map(s => ({
          statut: s.status,
          count: s._count.status
        })),
        tauxCompletion: tauxCompletionModules
      },
      intervenants: {
        total: totalIntervenants,
        actifs: intervenantsActifs,
        inactifs: totalIntervenants - intervenantsActifs
      },
      salles: {
        total: totalSalles,
        disponibles: sallesDisponibles,
        occupees: totalSalles - sallesDisponibles
      },
      seances: {
        total: totalSeances,
        ceMois: seancesCeMois,
        terminees: seancesTerminees,
        enCours: seancesEnCours,
        planifiees: seancesPlanifiees
      },
      conflits: {
        total: conflitsNonResolus,
        parType: conflitsParType.map(c => ({
          type: c.type,
          count: c._count.type
        }))
      }
    },
    periodeAcademique: periodeActive ? {
      nom: periodeActive.nom,
      annee: periodeActive.annee,
      debutS1: periodeActive.debutS1,
      finS2: periodeActive.finS2
    } : null,
    activite: {
      derniers30Jours: activitesRecentes,
      parType: actionsParType.map(a => ({
        type: a.action,
        count: a._count.action
      })),
      parJour: activiteParJour,
      topUtilisateurs: topUtilisateurs.map(u => ({
        nom: u.userName || 'Inconnu',
        actions: u._count.userId
      }))
    },
    tendances: tendancesMensuelles,
    sante: {
      score: calculateHealthScore({
        conflitsNonResolus,
        tauxCompletionModules,
        progressionMoyenne,
        sallesDisponibles,
        totalSalles
      }),
      alertes: generateAlertes({
        conflitsNonResolus,
        tauxCompletionModules,
        progressionMoyenne
      })
    }
  });
}

async function getActivityByDay(days) {
  const activities = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const count = await prisma.journalActivite.count({
      where: {
        createdAt: {
          gte: date,
          lt: nextDate
        }
      }
    });

    activities.push({
      date: date.toISOString().split('T')[0],
      count
    });
  }

  return activities;
}

async function getTendancesMensuelles(months) {
  const tendances = [];
  const today = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

    const [seances, modules, programmes] = await Promise.all([
      prisma.seance.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextMonth
          }
        }
      }),
      prisma.module.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextMonth
          }
        }
      }),
      prisma.programme.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextMonth
          }
        }
      })
    ]);

    tendances.push({
      mois: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
      seances,
      modules,
      programmes
    });
  }

  return tendances;
}

function calculateHealthScore(data) {
  let score = 100;

  // Pénalité pour les conflits non résolus
  if (data.conflitsNonResolus > 0) {
    score -= Math.min(data.conflitsNonResolus * 5, 30);
  }

  // Pénalité pour faible taux de complétion
  if (data.tauxCompletionModules < 50) {
    score -= (50 - data.tauxCompletionModules) / 2;
  }

  // Pénalité pour faible progression
  if (data.progressionMoyenne < 50) {
    score -= (50 - data.progressionMoyenne) / 2;
  }

  // Bonus pour bonne disponibilité des salles
  const tauxDispoSalles = data.totalSalles > 0
    ? (data.sallesDisponibles / data.totalSalles) * 100
    : 0;

  if (tauxDispoSalles > 80) {
    score += 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function generateAlertes(data) {
  const alertes = [];

  if (data.conflitsNonResolus > 10) {
    alertes.push({
      type: 'CRITIQUE',
      message: `${data.conflitsNonResolus} conflits non résolus nécessitent votre attention`,
      action: 'Consulter les conflits'
    });
  } else if (data.conflitsNonResolus > 0) {
    alertes.push({
      type: 'AVERTISSEMENT',
      message: `${data.conflitsNonResolus} conflit(s) en attente de résolution`,
      action: 'Voir les conflits'
    });
  }

  if (data.tauxCompletionModules < 30) {
    alertes.push({
      type: 'AVERTISSEMENT',
      message: 'Taux de complétion des modules faible',
      action: 'Voir les modules'
    });
  }

  if (data.progressionMoyenne < 20) {
    alertes.push({
      type: 'INFO',
      message: 'Progression moyenne des programmes en dessous de 20%',
      action: 'Voir les programmes'
    });
  }

  return alertes;
}
