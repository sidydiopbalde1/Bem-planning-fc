// pages/api/rotations-weekend/index.js
import { PrismaClient } from '@prisma/client';
import { withCoordinator } from '../../../lib/withApiHandler';
import RotationWeekendManager from '../../../lib/rotation-weekend';
import { sendEmail, emailTemplates } from '../../../lib/email';

const prisma = new PrismaClient();

async function handler(req, res) {
  const session = req.session;

  try {
    if (req.method === 'GET') {
      return await handleGet(req, res, session);
    } else if (req.method === 'POST') {
      return await handlePost(req, res, session);
    } else {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

  } catch (error) {
    console.error('Erreur API rotations-weekend:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}

export default withCoordinator(handler, { entity: 'RotationWeekend' });

/**
 * GET /api/rotations-weekend
 * Récupère les rotations avec filtres
 */
async function handleGet(req, res, session) {
  const {
    annee,
    mois,
    responsableId,
    status,
    dateDebut,
    dateFin,
    includeStats = 'false',
    page = '1',
    limit = '50'
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Construire les filtres
  const where = {};

  if (annee) {
    where.annee = parseInt(annee);
  }

  if (mois) {
    where.dateDebut = {
      gte: new Date(annee, parseInt(mois) - 1, 1),
      lt: new Date(annee, parseInt(mois), 1)
    };
  }

  if (responsableId) {
    where.responsableId = responsableId;
  }

  if (status) {
    where.status = status;
  }

  if (dateDebut && dateFin) {
    where.dateDebut = {
      gte: new Date(dateDebut),
      lte: new Date(dateFin)
    };
  }

  // Récupérer les rotations
  const rotations = await prisma.rotationWeekend.findMany({
    where,
    include: {
      responsable: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      substitut: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      rapportSupervision: true
    },
    orderBy: {
      dateDebut: 'asc'
    },
    skip,
    take: limitNum
  });

  const total = await prisma.rotationWeekend.count({ where });

  const response = {
    rotations,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  };

  // Ajouter les stats si demandé
  if (includeStats === 'true') {
    const stats = await getStatsRotations(where);
    response.stats = stats;
  }

  return res.status(200).json(response);
}

/**
 * POST /api/rotations-weekend
 * Génère automatiquement les rotations
 */
async function handlePost(req, res, session) {
  const { nbSemaines = 12, dateDebut } = req.body;

  // Récupérer tous les coordinateurs
  const coordinateurs = await prisma.user.findMany({
    where: { role: 'COORDINATOR' },
    select: { id: true, name: true, email: true }
  });

  if (coordinateurs.length === 0) {
    return res.status(400).json({
      error: 'Aucun coordinateur disponible',
      message: 'Il faut au moins un coordinateur pour créer des rotations'
    });
  }

  const responsableIds = coordinateurs.map(c => c.id);
  const startDate = dateDebut ? new Date(dateDebut) : new Date();

  // Générer les rotations
  const rotations = await RotationWeekendManager.genererRotations(
    parseInt(nbSemaines),
    responsableIds,
    startDate
  );

  // Logger l'action
  await prisma.journalActivite.create({
    data: {
      action: 'PLANIFICATION_AUTO',
      entite: 'RotationWeekend',
      description: `Génération automatique de ${rotations.length} rotations weekend`,
      userId: session.user.id,
      userName: session.user.name,
      nouvelleValeur: JSON.stringify({
        nbSemaines,
        nbRotations: rotations.length,
        dateDebut: startDate
      })
    }
  });

  const rotationsParCoordinateur = coordinateurs.map(c => ({
    id: c.id,
    name: c.name,
    nbWeekends: rotations.filter(r => r.responsableId === c.id).length
  }));

  // Récupérer les rotations avec les détails des responsables pour les emails
  const rotationsAvecDetails = await prisma.rotationWeekend.findMany({
    where: {
      id: { in: rotations.map(r => r.id) }
    },
    include: {
      responsable: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { dateDebut: 'asc' }
  });

  // Envoyer les emails aux coordinateurs concernés et à l'admin
  try {
    // Emails aux coordinateurs qui ont des weekends assignés
    const coordinateursAvecWeekends = coordinateurs.filter(c =>
      rotations.some(r => r.responsableId === c.id)
    );

    const emailPromises = coordinateursAvecWeekends.map(coordinateur => {
      const template = emailTemplates.rotationsWeekendGenerees(
        coordinateur,
        rotationsParCoordinateur,
        rotationsAvecDetails
      );
      return sendEmail({
        to: coordinateur.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      });
    });

    // Récupérer les admins pour les notifier aussi
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, name: true, email: true }
    });

    admins.forEach(admin => {
      const template = emailTemplates.rotationsWeekendGenerees(
        admin,
        rotationsParCoordinateur,
        rotationsAvecDetails
      );
      emailPromises.push(
        sendEmail({
          to: admin.email,
          subject: template.subject,
          html: template.html,
          text: template.text
        })
      );
    });

    await Promise.allSettled(emailPromises);
    console.log(`Emails de rotation weekend envoyés à ${coordinateursAvecWeekends.length} coordinateur(s) et ${admins.length} admin(s)`);
  } catch (emailError) {
    console.error('Erreur lors de l\'envoi des emails de rotation:', emailError);
    // On ne bloque pas la réponse si les emails échouent
  }

  return res.status(201).json({
    message: `${rotations.length} rotations générées avec succès`,
    rotations,
    stats: {
      total: rotations.length,
      responsables: rotationsParCoordinateur
    }
  });
}

/**
 * Calcule les statistiques globales des rotations
 */
async function getStatsRotations(where) {
  const rotations = await prisma.rotationWeekend.findMany({
    where,
    include: {
      rapportSupervision: true
    }
  });

  const totalWeekends = rotations.length;
  const weekendsTermines = rotations.filter(r =>
    r.status === 'TERMINE' || r.status === 'TERMINE_SANS_RAPPORT'
  ).length;
  const weekendsAbsences = rotations.filter(r => r.status === 'ABSENT').length;
  const weekendsEnCours = rotations.filter(r => r.status === 'EN_COURS').length;

  const tauxCompletion = totalWeekends > 0
    ? ((weekendsTermines / totalWeekends) * 100).toFixed(2)
    : 0;

  const tauxAbsence = totalWeekends > 0
    ? ((weekendsAbsences / totalWeekends) * 100).toFixed(2)
    : 0;

  const nbSeancesTotal = rotations.reduce((sum, r) => sum + r.nbSeancesTotal, 0);
  const nbSeancesRealisees = rotations.reduce((sum, r) => sum + r.nbSeancesRealisees, 0);

  const satisfactions = rotations
    .filter(r => r.rapportSupervision?.satisfaction)
    .map(r => r.rapportSupervision.satisfaction);

  const moyenneSatisfaction = satisfactions.length > 0
    ? (satisfactions.reduce((sum, s) => sum + s, 0) / satisfactions.length).toFixed(2)
    : null;

  return {
    totalWeekends,
    weekendsTermines,
    weekendsAbsences,
    weekendsEnCours,
    tauxCompletion: parseFloat(tauxCompletion),
    tauxAbsence: parseFloat(tauxAbsence),
    nbSeancesTotal,
    nbSeancesRealisees,
    moyenneSatisfaction: moyenneSatisfaction ? parseFloat(moyenneSatisfaction) : null
  };
}
