// pages/api/admin/salles.js
import { PrismaClient } from '@prisma/client';
import { withAdmin } from '../../../lib/withApiHandler';

const prisma = new PrismaClient();

async function handler(req, res) {
  const session = req.session;

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res, session);
      default:
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }
  } catch (error) {
    console.error('Erreur API salles:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
}

export default withAdmin(handler, { entity: 'Salle' });

async function handleGet(req, res) {
  const { search, batiment, disponible, page = 1, limit = 12 } = req.query;

  const where = {};

  if (search) {
    where.OR = [
      { nom: { contains: search, mode: 'insensitive' } },
      { batiment: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (batiment) {
    where.batiment = batiment;
  }

  if (disponible !== undefined) {
    where.disponible = disponible === 'true';
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [salles, total, batiments] = await Promise.all([
    prisma.salle.findMany({
      where,
      orderBy: [
        { batiment: 'asc' },
        { nom: 'asc' }
      ],
      skip,
      take: parseInt(limit)
    }),
    prisma.salle.count({ where }),
    prisma.salle.groupBy({
      by: ['batiment'],
      _count: { batiment: true }
    })
  ]);

  const stats = {
    total,
    disponibles: await prisma.salle.count({ where: { disponible: true } }),
    occupees: await prisma.salle.count({ where: { disponible: false } }),
    batiments: batiments.map(b => ({
      nom: b.batiment,
      count: b._count.batiment
    }))
  };

  return res.status(200).json({
    salles,
    stats,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}

async function handlePost(req, res, session) {
  const { nom, batiment, capacite, equipements, disponible } = req.body;

  if (!nom || !batiment || !capacite) {
    return res.status(400).json({
      error: 'Les champs nom, bâtiment et capacité sont obligatoires'
    });
  }

  // Vérifier si une salle avec ce nom existe déjà
  const existingSalle = await prisma.salle.findUnique({
    where: { nom }
  });

  if (existingSalle) {
    return res.status(400).json({
      error: 'Une salle avec ce nom existe déjà'
    });
  }

  const salle = await prisma.salle.create({
    data: {
      nom: nom.trim(),
      batiment: batiment.trim(),
      capacite: parseInt(capacite),
      equipements: equipements?.trim() || null,
      disponible: disponible !== false
    }
  });

  // Enregistrer dans le journal d'activités
  await prisma.journalActivite.create({
    data: {
      action: 'CREATION',
      entite: 'Salle',
      entiteId: salle.id,
      description: `Création de la salle ${salle.nom}`,
      nouvelleValeur: JSON.stringify(salle),
      userId: session.user.id,
      userName: session.user.name,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    }
  });

  return res.status(201).json({ salle, message: 'Salle créée avec succès' });
}
