// pages/api/programmes/index.js
import { PrismaClient } from '@prisma/client';
import { getSession } from 'next-auth/react';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  switch (req.method) {
    case 'GET':
      return handleGET(req, res, session);
    case 'POST':
      return handlePOST(req, res, session);
    default:
      return res.status(405).json({ error: 'Méthode non autorisée' });
  }
}

// Récupérer tous les programmes
async function handleGET(req, res, session) {
  try {
    const { search, status, semestre, page = 1, limit = 10 } = req.query;
    
    const where = {
      userId: session.user.id,
    };

    // Filtres
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (semestre) {
      where.semestre = semestre;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [programmes, total] = await Promise.all([
      prisma.programme.findMany({
        where,
        include: {
          modules: {
            include: {
              intervenant: true,
            },
          },
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.programme.count({ where }),
    ]);

    // Calculer les statistiques pour chaque programme
    const programmesWithStats = programmes.map(programme => {
      const totalModules = programme.modules.length;
      const modulesTermines = programme.modules.filter(m => m.status === 'TERMINE').length;
      const modulesEnCours = programme.modules.filter(m => m.status === 'EN_COURS').length;
      
      // Calculer la progression moyenne
      const progressionMoyenne = totalModules > 0 
        ? Math.round(programme.modules.reduce((sum, m) => sum + m.progression, 0) / totalModules)
        : 0;

      // Vérifier les alertes
      const alertes = [];
      const now = new Date();
      
      // Alerte retard
      if (programme.dateFin < now && programme.status !== 'TERMINE') {
        alertes.push({ type: 'RETARD', message: 'Programme en retard' });
      }
      
      // Alerte approche échéance
      const uneSemanneAvant = new Date();
      uneSemanneAvant.setDate(now.getDate() + 7);
      if (programme.dateFin <= uneSemanneAvant && programme.status === 'EN_COURS') {
        alertes.push({ type: 'ECHEANCE', message: 'Échéance proche' });
      }

      return {
        ...programme,
        stats: {
          totalModules,
          modulesTermines,
          modulesEnCours,
          progressionMoyenne,
          alertes,
        },
      };
    });

    return res.status(200).json({
      programmes: programmesWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Erreur GET /api/programmes:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

// Créer un nouveau programme
async function handlePOST(req, res, session) {
  try {
    const { name, code, description, semestre, niveau, dateDebut, dateFin, modules = [] } = req.body;

    // Validation
    if (!name || !code || !semestre || !dateDebut || !dateFin) {
      return res.status(400).json({ 
        error: 'Champs requis manquants',
        required: ['name', 'code', 'semestre', 'dateDebut', 'dateFin']
      });
    }

    // Vérifier l'unicité du code
    const existingProgramme = await prisma.programme.findUnique({
      where: { code },
    });

    if (existingProgramme) {
      return res.status(400).json({ error: 'Ce code programme existe déjà' });
    }

    // Calculer le volume horaire total des modules
    const totalVHT = modules.reduce((sum, module) => sum + (module.vht || 0), 0);

    // Créer le programme avec ses modules
    const programme = await prisma.programme.create({
      data: {
        name,
        code,
        description,
        semestre,
        niveau,
        dateDebut: new Date(dateDebut),
        dateFin: new Date(dateFin),
        totalVHT,
        userId: session.user.id,
        modules: {
          create: modules.map(module => ({
            code: module.code,
            name: module.name,
            description: module.description,
            cm: module.cm || 0,
            td: module.td || 0,
            tp: module.tp || 0,
            tpe: module.tpe || 0,
            vht: module.vht,
            coefficient: module.coefficient || 1,
            credits: module.credits || 1,
            userId: session.user.id,
          })),
        },
      },
      include: {
        modules: true,
      },
    });

    return res.status(201).json(programme);
  } catch (error) {
    console.error('Erreur POST /api/programmes:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Code programme déjà existant' });
    }
    
    return res.status(500).json({ error: 'Erreur lors de la création du programme' });
  }
}