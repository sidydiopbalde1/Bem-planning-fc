// pages/api/admin/periodes/[id].js
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const { id } = req.query;

    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, id);
      case 'PUT':
        return await handlePut(req, res, id, session);
      case 'DELETE':
        return await handleDelete(req, res, id, session);
      default:
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }
  } catch (error) {
    console.error('Erreur API période:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
}

async function handleGet(req, res, id) {
  const periode = await prisma.periodeAcademique.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          activitesAcademiques: true,
          indicateursAcademiques: true
        }
      }
    }
  });

  if (!periode) {
    return res.status(404).json({ error: 'Période académique non trouvée' });
  }

  return res.status(200).json({ periode });
}

async function handlePut(req, res, id, session) {
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

  const periode = await prisma.periodeAcademique.findUnique({
    where: { id }
  });

  if (!periode) {
    return res.status(404).json({ error: 'Période académique non trouvée' });
  }

  const updateData = {};

  if (nom !== undefined) updateData.nom = nom.trim();
  if (annee !== undefined) updateData.annee = annee.trim();
  if (debutS1 !== undefined) updateData.debutS1 = new Date(debutS1);
  if (finS1 !== undefined) updateData.finS1 = new Date(finS1);
  if (debutS2 !== undefined) updateData.debutS2 = new Date(debutS2);
  if (finS2 !== undefined) updateData.finS2 = new Date(finS2);
  if (vacancesNoel !== undefined) updateData.vacancesNoel = new Date(vacancesNoel);
  if (finVacancesNoel !== undefined) updateData.finVacancesNoel = new Date(finVacancesNoel);
  if (vacancesPaques !== undefined) updateData.vacancesPaques = vacancesPaques ? new Date(vacancesPaques) : null;
  if (finVacancesPaques !== undefined) updateData.finVacancesPaques = finVacancesPaques ? new Date(finVacancesPaques) : null;
  if (active !== undefined) updateData.active = active;

  // Si on active cette période, désactiver les autres
  if (active === true && !periode.active) {
    await prisma.periodeAcademique.updateMany({
      where: {
        id: { not: id },
        active: true
      },
      data: { active: false }
    });
  }

  const updatedPeriode = await prisma.periodeAcademique.update({
    where: { id },
    data: updateData
  });

  // Enregistrer dans le journal d'activités
  await prisma.journalActivite.create({
    data: {
      action: 'MODIFICATION',
      entite: 'PeriodeAcademique',
      entiteId: periode.id,
      description: `Modification de la période académique ${updatedPeriode.nom} (${updatedPeriode.annee})`,
      ancienneValeur: JSON.stringify(periode),
      nouvelleValeur: JSON.stringify(updatedPeriode),
      userId: session.user.id,
      userName: session.user.name,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    }
  });

  return res.status(200).json({
    periode: updatedPeriode,
    message: 'Période académique mise à jour avec succès'
  });
}

async function handleDelete(req, res, id, session) {
  const periode = await prisma.periodeAcademique.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          activitesAcademiques: true,
          indicateursAcademiques: true
        }
      }
    }
  });

  if (!periode) {
    return res.status(404).json({ error: 'Période académique non trouvée' });
  }

  // Vérifier si la période est utilisée
  const totalUsage = periode._count.activitesAcademiques + periode._count.indicateursAcademiques;

  if (totalUsage > 0) {
    return res.status(400).json({
      error: 'Impossible de supprimer cette période académique',
      message: `Cette période est utilisée dans ${periode._count.activitesAcademiques} activité(s) académique(s) et ${periode._count.indicateursAcademiques} indicateur(s).`,
      counts: periode._count
    });
  }

  await prisma.periodeAcademique.delete({
    where: { id }
  });

  // Enregistrer dans le journal d'activités
  await prisma.journalActivite.create({
    data: {
      action: 'SUPPRESSION',
      entite: 'PeriodeAcademique',
      entiteId: periode.id,
      description: `Suppression de la période académique ${periode.nom} (${periode.annee})`,
      ancienneValeur: JSON.stringify(periode),
      userId: session.user.id,
      userName: session.user.name,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    }
  });

  return res.status(200).json({ message: 'Période académique supprimée avec succès' });
}
