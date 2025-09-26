// pages/api/programmes/create.js - Version finale corrigée
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const {
      name,
      code,
      description,
      semestre,
      niveau,
      dateDebut,
      dateFin,
      totalVHT,
      status = 'PLANIFIE'
    } = req.body;

    // Validation des données
    const errors = {};
    
    if (!name?.trim()) {
      errors.name = 'Le nom du programme est requis';
    }

    if (!code?.trim()) {
      errors.code = 'Le code du programme est requis';
    }

    if (!semestre) {
      errors.semestre = 'Le semestre est requis';
    }

    if (!niveau) {
      errors.niveau = 'Le niveau est requis';
    }

    if (!dateDebut) {
      errors.dateDebut = 'La date de début est requise';
    }

    if (!dateFin) {
      errors.dateFin = 'La date de fin est requise';
    }

    if (dateDebut && dateFin && new Date(dateDebut) >= new Date(dateFin)) {
      errors.dateFin = 'La date de fin doit être postérieure à la date de début';
    }

    if (!totalVHT || totalVHT <= 0) {
      errors.totalVHT = 'Le volume horaire total doit être supérieur à 0';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    // Vérification de l'unicité du code
    const existingProgramme = await prisma.programme.findUnique({
      where: { code: code.trim().toUpperCase() }
    });

    if (existingProgramme) {
      return res.status(400).json({ 
        errors: { code: 'Ce code de programme existe déjà' }
      });
    }

    // Création du programme
    const programme = await prisma.programme.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim() || null,
        semestre,
        niveau,
        dateDebut: new Date(dateDebut),
        dateFin: new Date(dateFin),
        totalVHT: parseInt(totalVHT),
        status,
        userId: session.user.id,
        progression: 0
      },
      include: {
        modules: {
          include: {
            intervenant: {
              select: { nom: true, prenom: true, civilite: true }
            }
          }
        }
      }
    });

    res.status(201).json({ 
      message: 'Programme créé avec succès',
      programme 
    });

  } catch (error) {
    console.error('Erreur création programme:', error);
    
    // Gestion des erreurs Prisma spécifiques
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        errors: { code: 'Ce code de programme existe déjà' }
      });
    }

    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}