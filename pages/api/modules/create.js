// pages/api/modules/create.js
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
      programmeId,
      code,
      name,
      description,
      cm,
      td,
      tp,
      tpe,
      vht,
      coefficient,
      credits,
      intervenantId,
      dateDebut,
      dateFin,
      status = 'PLANIFIE'
    } = req.body;

    // Validation des données
    const errors = {};
    
    if (!programmeId) {
      errors.programmeId = 'L\'ID du programme est requis';
    }

    if (!code?.trim()) {
      errors.code = 'Le code du module est requis';
    } else if (!/^[A-Z0-9-_]+$/.test(code)) {
      errors.code = 'Le code doit contenir uniquement des majuscules, chiffres, tirets et underscores';
    }

    if (!name?.trim()) {
      errors.name = 'Le nom du module est requis';
    }

    if (vht <= 0) {
      errors.vht = 'Le volume horaire total doit être supérieur à 0';
    }

    if (coefficient <= 0) {
      errors.coefficient = 'Le coefficient doit être supérieur à 0';
    }

    if (credits <= 0) {
      errors.credits = 'Le nombre de crédits doit être supérieur à 0';
    }

    if (dateDebut && dateFin && new Date(dateDebut) >= new Date(dateFin)) {
      errors.dateFin = 'La date de fin doit être postérieure à la date de début';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    // Vérifier que le programme appartient à l'utilisateur
    const programme = await prisma.programme.findFirst({
      where: {
        id: programmeId,
        userId: session.user.id
      }
    });

    if (!programme) {
      return res.status(404).json({ error: 'Programme non trouvé' });
    }

    // Vérifier l'unicité du code dans le programme
    const existingModule = await prisma.module.findFirst({
      where: {
        code: code.trim().toUpperCase(),
        programmeId
      }
    });

    if (existingModule) {
      return res.status(400).json({ 
        errors: { code: 'Ce code de module existe déjà dans ce programme' }
      });
    }

    // Vérifier que l'intervenant existe et est disponible (si spécifié)
    if (intervenantId) {
      const intervenant = await prisma.intervenant.findFirst({
        where: {
          id: intervenantId,
          disponible: true
        }
      });

      if (!intervenant) {
        return res.status(400).json({
          errors: { intervenantId: 'Intervenant non trouvé ou indisponible' }
        });
      }
    }

    // Création du module
    const module = await prisma.module.create({
      data: {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description?.trim() || null,
        cm: cm || 0,
        td: td || 0,
        tp: tp || 0,
        tpe: tpe || 0,
        vht,
        coefficient,
        credits,
        status,
        dateDebut: dateDebut ? new Date(dateDebut) : null,
        dateFin: dateFin ? new Date(dateFin) : null,
        programmeId,
        intervenantId: intervenantId || null,
        userId: session.user.id,
        progression: 0
      },
      include: {
        programme: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        intervenant: {
          select: {
            id: true,
            civilite: true,
            nom: true,
            prenom: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({ 
      message: 'Module créé avec succès',
      module 
    });

  } catch (error) {
    console.error('Erreur création module:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        errors: { code: 'Ce code de module existe déjà' }
      });
    }

    res.status(500).json({ 
      error: 'Erreur interne du serveur' 
    });
  } finally {
    await prisma.$disconnect();
  }
}