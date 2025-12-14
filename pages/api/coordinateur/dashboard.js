// pages/api/coordinateur/dashboard.js
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !['COORDINATOR', 'ADMIN'].includes(session.user.role)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    if (req.method === 'GET') {
      return await handleGet(req, res, session);
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (error) {
    console.error('Erreur API dashboard:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
}

async function handleGet(req, res, session) {
  const userId = session.user.role === 'COORDINATOR' ? session.user.id : null;

  // Base where clause for coordinator data isolation
  const programmeWhere = userId ? { userId } : {};
  const moduleWhere = userId ? { userId } : {};

  // Get programmes statistics
  const programmes = await prisma.programme.findMany({
    where: programmeWhere,
    include: {
      _count: {
        select: { modules: true }
      }
    }
  });

  const programmesStats = {
    total: programmes.length,
    enCours: programmes.filter(p => p.status === 'EN_COURS').length,
    termines: programmes.filter(p => p.status === 'TERMINE').length,
    planifies: programmes.filter(p => p.status === 'PLANIFIE').length,
    progressionMoyenne: programmes.length > 0
      ? Math.round(programmes.reduce((sum, p) => sum + p.progression, 0) / programmes.length)
      : 0
  };

  // Get modules statistics
  const modules = await prisma.module.findMany({
    where: moduleWhere,
    include: {
      _count: {
        select: { seances: true }
      }
    }
  });

  const modulesStats = {
    total: modules.length,
    enCours: modules.filter(m => m.status === 'EN_COURS').length,
    termines: modules.filter(m => m.status === 'TERMINE').length,
    planifies: modules.filter(m => m.status === 'PLANIFIE').length,
    avecIntervenant: modules.filter(m => m.intervenantId).length,
    sansIntervenant: modules.filter(m => !m.intervenantId).length,
    totalVHT: modules.reduce((sum, m) => sum + (m.vht || 0), 0),
    totalSeances: modules.reduce((sum, m) => sum + (m._count.seances || 0), 0)
  };

  // Get programmes in delay
  const now = new Date();
  const programmesEnRetard = programmes.filter(p => {
    const fin = new Date(p.dateFin);
    return now > fin && p.progression < 100 && p.status !== 'TERMINE';
  }).map(p => ({
    id: p.id,
    code: p.code,
    name: p.name,
    progression: p.progression,
    dateFin: p.dateFin
  }));

  // Get modules without instructor
  const modulesSansIntervenant = modules
    .filter(m => !m.intervenantId && m.status !== 'ANNULE')
    .slice(0, 10)
    .map(m => ({
      id: m.id,
      code: m.code,
      name: m.name,
      vht: m.vht,
      status: m.status
    }));

  // Get upcoming modules (starting soon)
  const trentJours = new Date();
  trentJours.setDate(trentJours.getDate() + 30);

  const modulesProchains = modules
    .filter(m => {
      if (!m.dateDebut || m.status === 'ANNULE') return false;
      const debut = new Date(m.dateDebut);
      return debut >= now && debut <= trentJours;
    })
    .sort((a, b) => new Date(a.dateDebut) - new Date(b.dateDebut))
    .slice(0, 10)
    .map(m => ({
      id: m.id,
      code: m.code,
      name: m.name,
      dateDebut: m.dateDebut,
      vht: m.vht,
      intervenantId: m.intervenantId
    }));

  // Get recent activity (from journal)
  const recentActivity = await prisma.journalActivite.findMany({
    where: userId ? { userId } : {},
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      action: true,
      entite: true,
      description: true,
      createdAt: true,
      userName: true
    }
  });

  // Calculate progression by programme
  const progressionParProgramme = programmes.map(p => ({
    id: p.id,
    code: p.code,
    name: p.name,
    progression: p.progression,
    modulesCount: p._count.modules,
    status: p.status
  }));

  // Calculate VHT by type
  const vhtParType = {
    CM: modules.reduce((sum, m) => sum + (m.cm || 0), 0),
    TD: modules.reduce((sum, m) => sum + (m.td || 0), 0),
    TP: modules.reduce((sum, m) => sum + (m.tp || 0), 0),
    TPE: modules.reduce((sum, m) => sum + (m.tpe || 0), 0)
  };

  // Calculate average progression by status
  const progressionParStatut = {
    PLANIFIE: {
      count: programmes.filter(p => p.status === 'PLANIFIE').length,
      avgProgression: programmes.filter(p => p.status === 'PLANIFIE').length > 0
        ? Math.round(programmes.filter(p => p.status === 'PLANIFIE').reduce((sum, p) => sum + p.progression, 0) / programmes.filter(p => p.status === 'PLANIFIE').length)
        : 0
    },
    EN_COURS: {
      count: programmes.filter(p => p.status === 'EN_COURS').length,
      avgProgression: programmes.filter(p => p.status === 'EN_COURS').length > 0
        ? Math.round(programmes.filter(p => p.status === 'EN_COURS').reduce((sum, p) => sum + p.progression, 0) / programmes.filter(p => p.status === 'EN_COURS').length)
        : 0
    },
    TERMINE: {
      count: programmes.filter(p => p.status === 'TERMINE').length,
      avgProgression: 100
    }
  };

  return res.status(200).json({
    programmesStats,
    modulesStats,
    programmesEnRetard,
    modulesSansIntervenant,
    modulesProchains,
    recentActivity,
    progressionParProgramme,
    vhtParType,
    progressionParStatut
  });
}
