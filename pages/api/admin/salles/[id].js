// pages/api/admin/salles/[id].js
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
    console.error('Erreur API salle:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
}

async function handleGet(req, res, id) {
  const salle = await prisma.salle.findUnique({
    where: { id }
  });

  if (!salle) {
    return res.status(404).json({ error: 'Salle non trouvée' });
  }

  return res.status(200).json({ salle });
}

async function handlePut(req, res, id, session) {
  const { nom, batiment, capacite, equipements, disponible } = req.body;

  const salle = await prisma.salle.findUnique({
    where: { id }
  });

  if (!salle) {
    return res.status(404).json({ error: 'Salle non trouvée' });
  }

  // Vérifier si le nouveau nom n'est pas déjà pris par une autre salle
  if (nom && nom !== salle.nom) {
    const existingSalle = await prisma.salle.findUnique({
      where: { nom }
    });

    if (existingSalle) {
      return res.status(400).json({
        error: 'Une salle avec ce nom existe déjà'
      });
    }
  }

  const updateData = {};
  if (nom !== undefined) updateData.nom = nom.trim();
  if (batiment !== undefined) updateData.batiment = batiment.trim();
  if (capacite !== undefined) updateData.capacite = parseInt(capacite);
  if (equipements !== undefined) updateData.equipements = equipements?.trim() || null;
  if (disponible !== undefined) updateData.disponible = disponible;

  const updatedSalle = await prisma.salle.update({
    where: { id },
    data: updateData
  });

  // Enregistrer dans le journal d'activités
  await prisma.journalActivite.create({
    data: {
      action: 'MODIFICATION',
      entite: 'Salle',
      entiteId: salle.id,
      description: `Modification de la salle ${updatedSalle.nom}`,
      ancienneValeur: JSON.stringify(salle),
      nouvelleValeur: JSON.stringify(updatedSalle),
      userId: session.user.id,
      userName: session.user.name,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    }
  });

  return res.status(200).json({
    salle: updatedSalle,
    message: 'Salle mise à jour avec succès'
  });
}

async function handleDelete(req, res, id, session) {
  const salle = await prisma.salle.findUnique({
    where: { id }
  });

  if (!salle) {
    return res.status(404).json({ error: 'Salle non trouvée' });
  }

  // Vérifier si la salle est utilisée dans des séances
  const seancesCount = await prisma.seance.count({
    where: { salle: salle.nom }
  });

  if (seancesCount > 0) {
    return res.status(400).json({
      error: 'Impossible de supprimer cette salle',
      message: `Cette salle est utilisée dans ${seancesCount} séance(s). Veuillez d'abord réassigner ces séances.`,
      count: seancesCount
    });
  }

  await prisma.salle.delete({
    where: { id }
  });

  // Enregistrer dans le journal d'activités
  await prisma.journalActivite.create({
    data: {
      action: 'SUPPRESSION',
      entite: 'Salle',
      entiteId: salle.id,
      description: `Suppression de la salle ${salle.nom}`,
      ancienneValeur: JSON.stringify(salle),
      userId: session.user.id,
      userName: session.user.name,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    }
  });

  return res.status(200).json({ message: 'Salle supprimée avec succès' });
}
