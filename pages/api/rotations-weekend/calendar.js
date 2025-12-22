// pages/api/rotations-weekend/calendar.js
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]';

const prisma = new PrismaClient();

/**
 * Génère un fichier iCal pour les rotations d'un responsable
 * Compatible avec Google Calendar, Apple Calendar, Outlook, etc.
 */
export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const { responsableId, annee } = req.query;

    // Vérifier les permissions
    const isOwnCalendar = responsableId === session.user.id;
    const isAdmin = ['ADMIN', 'COORDINATOR'].includes(session.user.role);

    if (!isOwnCalendar && !isAdmin) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Récupérer les rotations
    const where = {
      responsableId: responsableId || session.user.id
    };

    if (annee) {
      where.annee = parseInt(annee);
    }

    const rotations = await prisma.rotationWeekend.findMany({
      where,
      include: {
        responsable: true
      },
      orderBy: {
        dateDebut: 'asc'
      }
    });

    // Générer le fichier iCal
    const icalContent = generateICalendar(rotations, session.user.name);

    // Définir les headers pour le téléchargement
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="rotations-weekend-${responsableId || session.user.id}.ics"`);

    return res.status(200).send(icalContent);

  } catch (error) {
    console.error('Erreur export calendrier:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Génère le contenu d'un fichier iCalendar (format .ics)
 */
function generateICalendar(rotations, userName) {
  const now = new Date();
  const timestamp = formatDateToIcal(now);

  // Header du fichier iCal
  let ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BEM Planning FC//Rotations Weekend//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Rotations Weekend - ${userName}`,
    'X-WR-TIMEZONE:Africa/Dakar',
    'X-WR-CALDESC:Planning des rotations de supervision weekend'
  ].join('\r\n');

  // Ajouter chaque rotation comme événement
  rotations.forEach((rotation) => {
    const event = generateICalEvent(rotation, timestamp);
    ical += '\r\n' + event;
  });

  // Footer du fichier iCal
  ical += '\r\nEND:VCALENDAR\r\n';

  return ical;
}

/**
 * Génère un événement iCal pour une rotation
 */
function generateICalEvent(rotation, timestamp) {
  const startDate = new Date(rotation.dateDebut);
  const endDate = new Date(rotation.dateFin);

  // Format de date iCal: YYYYMMDDTHHmmss
  const dtstart = formatDateToIcal(startDate);
  const dtend = formatDateToIcal(endDate);

  // UID unique pour l'événement
  const uid = `rotation-${rotation.id}@bem-planning-fc.com`;

  // Description de l'événement
  let description = `Rotation de supervision des cours du weekend\\n\\n`;
  description += `Responsable: ${rotation.responsable.name}\\n`;
  description += `Séances prévues: ${rotation.nbSeancesTotal}\\n`;
  description += `Statut: ${rotation.status}\\n`;

  if (rotation.commentaire) {
    description += `\\nCommentaire: ${rotation.commentaire}`;
  }

  description += `\\n\\nVoir les détails: ${process.env.NEXTAUTH_URL}/rotations-weekend/${rotation.id}`;

  // Titre de l'événement
  const summary = `🔄 Supervision Weekend - Semaine ${rotation.semaineNumero}`;

  // Alarme: rappel 2 jours avant
  const alarmDate = new Date(startDate);
  alarmDate.setDate(alarmDate.getDate() - 2);
  const alarmTrigger = formatDateToIcal(alarmDate);

  // Couleur de l'événement selon le statut
  const colorMap = {
    PLANIFIE: 'BLUE',
    CONFIRME: 'GREEN',
    EN_COURS: 'YELLOW',
    TERMINE: 'GRAY',
    ABSENT: 'RED',
    ANNULE: 'GRAY'
  };
  const color = colorMap[rotation.status] || 'BLUE';

  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${timestamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:BEM - Campus`,
    `STATUS:${rotation.status === 'ANNULE' ? 'CANCELLED' : 'CONFIRMED'}`,
    `TRANSP:OPAQUE`,
    `SEQUENCE:0`,
    `PRIORITY:${rotation.status === 'EN_COURS' ? '1' : '5'}`,
    `CLASS:PUBLIC`,
    `CATEGORIES:Supervision,Weekend,BEM`,
    `COLOR:${color}`,
    // Alarme de rappel
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:Rappel: Rotation de supervision ce weekend`,
    `TRIGGER;VALUE=DATE-TIME:${alarmTrigger}`,
    'END:VALARM',
    'END:VEVENT'
  ].join('\r\n');
}

/**
 * Formate une date au format iCal: YYYYMMDDTHHmmssZ
 */
function formatDateToIcal(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}
