// pages/api/admin/periodes.js
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res, session);
      default:
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }
  } catch (error) {
    console.error('Erreur API périodes:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
}

async function handleGet(req, res) {
  const { search, active, annee } = req.query;

  const where = {};

  if (search) {
    where.OR = [
      { nom: { contains: search, mode: 'insensitive' } },
      { annee: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (active !== undefined) {
    where.active = active === 'true';
  }

  if (annee) {
    where.annee = annee;
  }

  const [periodes, total] = await Promise.all([
    prisma.periodeAcademique.findMany({
      where,
      orderBy: [
        { active: 'desc' },
        { annee: 'desc' }
      ],
      include: {
        _count: {
          select: {
            activitesAcademiques: true,
            indicateursAcademiques: true
          }
        }
      }
    }),
    prisma.periodeAcademique.count({ where })
  ]);

  const stats = {
    total,
    active: await prisma.periodeAcademique.count({ where: { active: true } }),
    inactive: await prisma.periodeAcademique.count({ where: { active: false } })
  };

  return res.status(200).json({ periodes, stats });
}

async function handlePost(req, res, session) {
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

  // Validation des champs obligatoires
  if (!nom || !annee || !debutS1 || !finS1 || !debutS2 || !finS2 || !vacancesNoel || !finVacancesNoel) {
    return res.status(400).json({
      error: 'Tous les champs obligatoires doivent être renseignés'
    });
  }

  // Vérifier les dates
  const dateDebutS1 = new Date(debutS1);
  const dateFinS1 = new Date(finS1);
  const dateDebutS2 = new Date(debutS2);
  const dateFinS2 = new Date(finS2);
  const dateVacancesNoel = new Date(vacancesNoel);
  const dateFinVacancesNoel = new Date(finVacancesNoel);

  if (dateFinS1 <= dateDebutS1) {
    return res.status(400).json({ error: 'La date de fin S1 doit être après la date de début S1' });
  }

  if (dateFinS2 <= dateDebutS2) {
    return res.status(400).json({ error: 'La date de fin S2 doit être après la date de début S2' });
  }

  if (dateFinVacancesNoel <= dateVacancesNoel) {
    return res.status(400).json({ error: 'La date de fin des vacances de Noël doit être après la date de début' });
  }

  // Si on active cette période, désactiver les autres
  if (active) {
    await prisma.periodeAcademique.updateMany({
      where: { active: true },
      data: { active: false }
    });
  }

  const periode = await prisma.periodeAcademique.create({
    data: {
      nom: nom.trim(),
      annee: annee.trim(),
      debutS1: dateDebutS1,
      finS1: dateFinS1,
      debutS2: dateDebutS2,
      finS2: dateFinS2,
      vacancesNoel: dateVacancesNoel,
      finVacancesNoel: dateFinVacancesNoel,
      vacancesPaques: vacancesPaques ? new Date(vacancesPaques) : null,
      finVacancesPaques: finVacancesPaques ? new Date(finVacancesPaques) : null,
      active: active === true
    }
  });

  // Enregistrer dans le journal d'activités
  await prisma.journalActivite.create({
    data: {
      action: 'CREATION',
      entite: 'PeriodeAcademique',
      entiteId: periode.id,
      description: `Création de la période académique ${periode.nom} (${periode.annee})`,
      nouvelleValeur: JSON.stringify(periode),
      userId: session.user.id,
      userName: session.user.name,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    }
  });

  return res.status(201).json({ periode, message: 'Période académique créée avec succès' });
}
