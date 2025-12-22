// pages/api/seances/[id]/complete.js
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const { id } = req.query;

    if (req.method === 'POST') {
      return await handleComplete(id, session, req.body, res);
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (error) {
    console.error('Erreur API complete seance:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}

async function handleComplete(seanceId, session, body, res) {
  // Get the seance with module and programme info
  const seance = await prisma.seance.findUnique({
    where: { id: seanceId },
    include: {
      module: {
        include: {
          programme: true,
          seances: true
        }
      },
      intervenant: true
    }
  });

  if (!seance) {
    return res.status(404).json({ error: 'Séance introuvable' });
  }

  // Check authorization: intervenant can only complete their own sessions
  // Coordinators and admins can complete any session
  let isAuthorized = false;

  if (session.user.role === 'ADMIN' || session.user.role === 'COORDINATOR') {
    isAuthorized = true;
  } else {
    // For teachers/intervenants, check if their email matches the session's intervenant email
    isAuthorized = seance.intervenant.email === session.user.email;
  }

  if (!isAuthorized) {
    return res.status(403).json({ error: 'Non autorisé à compléter cette séance' });
  }

  // Check if already completed
  if (seance.status === 'TERMINE') {
    return res.status(400).json({ error: 'Cette séance est déjà marquée comme terminée' });
  }

  const { notes, realDuration } = body;
  const duration = realDuration || seance.duree;

  // Update seance status to TERMINE
  const updatedSeance = await prisma.seance.update({
    where: { id: seanceId },
    data: {
      status: 'TERMINE',
      notes: notes || seance.notes,
      duree: duration
    }
  });

  // Calculate module progression
  const moduleId = seance.moduleId;
  const module = seance.module;

  // Get all completed sessions for this module
  const completedSessions = await prisma.seance.findMany({
    where: {
      moduleId,
      status: 'TERMINE'
    }
  });

  // Calculate total hours completed
  const totalHeuresEffectuees = completedSessions.reduce((sum, s) => sum + s.duree, 0);
  const vht = module.vht;

  // Calculate progression percentage
  const progression = Math.min(Math.round((totalHeuresEffectuees / vht) * 100), 100);

  // Determine module status
  let moduleStatus = module.status;
  if (progression >= 100) {
    moduleStatus = 'TERMINE';
  } else if (progression > 0 && moduleStatus === 'PLANIFIE') {
    moduleStatus = 'EN_COURS';
  }

  // Update module
  const updatedModule = await prisma.module.update({
    where: { id: moduleId },
    data: {
      progression,
      status: moduleStatus,
      dateDebut: module.dateDebut || new Date(),
      dateFin: progression >= 100 ? new Date() : module.dateFin
    }
  });

  // Update programme progression
  const programmeId = module.programmeId;
  const allModules = await prisma.module.findMany({
    where: { programmeId }
  });

  // Calculate average progression of all modules
  const totalProgression = allModules.reduce((sum, m) => sum + (m.id === moduleId ? progression : m.progression), 0);
  const programmeProgression = Math.round(totalProgression / allModules.length);

  // Determine programme status
  let programmeStatus = module.programme.status;
  const allModulesCompleted = allModules.every(m =>
    m.id === moduleId ? progression >= 100 : m.progression >= 100
  );

  if (allModulesCompleted) {
    programmeStatus = 'TERMINE';
  } else if (programmeProgression > 0 && programmeStatus === 'PLANIFIE') {
    programmeStatus = 'EN_COURS';
  }

  // Update programme
  await prisma.programme.update({
    where: { id: programmeId },
    data: {
      progression: programmeProgression,
      status: programmeStatus
    }
  });

  // Log the action
  await prisma.journalActivite.create({
    data: {
      action: 'MODIFICATION',
      entite: 'Seance',
      entiteId: seanceId,
      description: `Séance marquée comme terminée - Module ${module.code}: ${progression}% complété`,
      userId: session.user.id,
      userName: session.user.name,
      nouvelleValeur: JSON.stringify({
        status: 'TERMINE',
        moduleProgression: progression,
        programmeProgression
      })
    }
  });

  return res.status(200).json({
    message: 'Séance marquée comme terminée avec succès',
    seance: updatedSeance,
    module: {
      id: updatedModule.id,
      code: updatedModule.code,
      progression: updatedModule.progression,
      status: updatedModule.status,
      heuresEffectuees: totalHeuresEffectuees,
      heuresTotal: vht
    },
    programme: {
      progression: programmeProgression,
      status: programmeStatus
    }
  });
}
