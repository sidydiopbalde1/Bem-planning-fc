// pages/api/planning/schedule.js - Algorithme de planification automatique
import { PrismaClient } from '@prisma/client';
import { getSession } from 'next-auth/react';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  if (req.method === 'POST') {
    return generateSchedule(req, res, session);
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}

async function generateSchedule(req, res, session) {
  try {
    const { 
      programmeId, 
      startDate, 
      endDate, 
      preferences = {},
      constraints = {} 
    } = req.body;

    // Récupérer le programme et ses modules
    const programme = await prisma.programme.findFirst({
      where: {
        id: programmeId,
        userId: session.user.id
      },
      include: {
        modules: {
          where: {
            status: { not: 'TERMINE' }
          },
          include: {
            intervenant: true
          }
        }
      }
    });

    if (!programme) {
      return res.status(404).json({ error: 'Programme non trouvé' });
    }

    // Récupérer les contraintes (salles disponibles, horaires, etc.)
    const availableRooms = await prisma.salle.findMany({
      where: { disponible: true }
    });

    // Générer le planning automatiquement
    const schedule = await generateOptimalSchedule({
      programme,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      availableRooms,
      preferences,
      constraints,
      userId: session.user.id
    });

    return res.status(200).json({
      message: 'Planning généré avec succès',
      schedule,
      statistics: {
        totalSessions: schedule.sessions.length,
        conflicts: schedule.conflicts.length,
        coverage: calculateCoverage(programme.modules, schedule.sessions)
      }
    });
  } catch (error) {
    console.error('Erreur génération planning:', error);
    return res.status(500).json({ error: 'Erreur lors de la génération du planning' });
  }
}

// Algorithme de planification automatique (version simplifiée)
async function generateOptimalSchedule({ 
  programme, 
  startDate, 
  endDate, 
  availableRooms, 
  preferences,
  constraints,
  userId 
}) {
  const sessions = [];
  const conflicts = [];
  const workingDays = getWorkingDays(startDate, endDate);
  const timeSlots = generateTimeSlots(preferences.startTime || '08:00', preferences.endTime || '18:00');

  // Trier les modules par priorité (coefficient, prérequis, etc.)
  const sortedModules = programme.modules.sort((a, b) => {
    return (b.coefficient * b.vht) - (a.coefficient * a.vht);
  });

  for (const module of sortedModules) {
    const sessionsNeeded = calculateSessionsNeeded(module);
    
    for (let i = 0; i < sessionsNeeded.length; i++) {
      const session = sessionsNeeded[i];
      const slot = findBestTimeSlot({
        module,
        session,
        workingDays,
        timeSlots,
        availableRooms,
        existingSessions: sessions,
        constraints
      });

      if (slot) {
        sessions.push({
          moduleId: module.id,
          intervenantId: module.intervenantId,
          dateSeance: slot.date,
          heureDebut: slot.startTime,
          heureFin: slot.endTime,
          duree: session.duration,
          typeSeance: session.type,
          salle: slot.room?.nom,
          batiment: slot.room?.batiment,
          status: 'PLANIFIE'
        });
      } else {
        conflicts.push({
          type: 'PLANNING_IMPOSSIBLE',
          description: `Impossible de planifier le module "${module.name}"`,
          moduleId: module.id
        });
      }
    }
  }

  return { sessions, conflicts };
}

// Fonctions utilitaires pour la planification
function getWorkingDays(startDate, endDate) {
  const days = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclure weekends
      days.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  
  return days;
}

function generateTimeSlots(startTime, endTime) {
  const slots = [];
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  
  for (let time = start; time < end; time += 60) { // Créneaux d'1h
    slots.push({
      startTime: minutesToTime(time),
      endTime: minutesToTime(time + 120), // Séances de 2h par défaut
      duration: 120
    });
  }
  
  return slots;
}

function calculateSessionsNeeded(module) {
  const sessions = [];
  
  // Sessions de CM
  if (module.cm > 0) {
    const cmSessions = Math.ceil(module.cm / 2); // 2h par séance
    for (let i = 0; i < cmSessions; i++) {
      sessions.push({
        type: 'CM',
        duration: Math.min(120, (module.cm - i * 2) * 60)
      });
    }
  }
  
  // Sessions de TD
  if (module.td > 0) {
    const tdSessions = Math.ceil(module.td / 2);
    for (let i = 0; i < tdSessions; i++) {
      sessions.push({
        type: 'TD',
        duration: Math.min(120, (module.td - i * 2) * 60)
      });
    }
  }
  
  // Sessions de TP
  if (module.tp > 0) {
    const tpSessions = Math.ceil(module.tp / 2);
    for (let i = 0; i < tpSessions; i++) {
      sessions.push({
        type: 'TP',
        duration: Math.min(120, (module.tp - i * 2) * 60)
      });
    }
  }
  
  return sessions;
}

function findBestTimeSlot({ module, session, workingDays, timeSlots, availableRooms, existingSessions, constraints }) {
  for (const day of workingDays) {
    for (const timeSlot of timeSlots) {
      for (const room of availableRooms) {
        const slot = {
          date: day,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          room
        };
        
        if (isSlotAvailable(slot, module, existingSessions, constraints)) {
          return slot;
        }
      }
    }
  }
  
  return null; // Aucun créneau disponible
}

function isSlotAvailable(slot, module, existingSessions, constraints) {
  // Vérifier les conflits avec les séances existantes
  for (const session of existingSessions) {
    if (session.dateSeance.toDateString() === slot.date.toDateString()) {
      const sessionStart = timeToMinutes(session.heureDebut);
      const sessionEnd = timeToMinutes(session.heureFin);
      const slotStart = timeToMinutes(slot.startTime);
      const slotEnd = timeToMinutes(slot.endTime);
      
      // Conflit intervenant
      if (session.intervenantId === module.intervenantId && 
          hasTimeOverlap(slotStart, slotEnd, sessionStart, sessionEnd)) {
        return false;
      }
      
      // Conflit salle
      if (session.salle === slot.room?.nom && 
          hasTimeOverlap(slotStart, slotEnd, sessionStart, sessionEnd)) {
        return false;
      }
    }
  }
  
  return true;
}

function calculateCoverage(modules, sessions) {
  const totalVht = modules.reduce((sum, module) => sum + module.vht, 0);
  const scheduledTime = sessions.reduce((sum, session) => sum + (session.duree / 60), 0);
  
  return Math.round((scheduledTime / totalVht) * 100);
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}