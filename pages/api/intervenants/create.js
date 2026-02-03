// pages/api/intervenants/create.js
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

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

    // Vérifier que l'utilisateur n'est pas un simple intervenant (TEACHER)
    // Seuls les ADMIN et COORDINATOR peuvent créer des intervenants
    if (session.user.role === 'TEACHER') {
      return res.status(403).json({
        error: 'Accès refusé. Vous n\'avez pas les permissions nécessaires pour créer un intervenant.'
      });
    }

    const {
      civilite,
      nom,
      prenom,
      email,
      telephone,
      grade,
      specialite,
      etablissement,
      disponible = true
    } = req.body;

    // Validation des données
    const errors = {};
    
    if (!civilite) {
      errors.civilite = 'La civilité est requise';
    }

    if (!nom?.trim()) {
      errors.nom = 'Le nom est requis';
    }

    if (!prenom?.trim()) {
      errors.prenom = 'Le prénom est requis';
    }

    if (!email?.trim()) {
      errors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Format d\'email invalide';
    }

    if (telephone && !/^[\d\s\-\+\(\)\.]+$/.test(telephone)) {
      errors.telephone = 'Format de téléphone invalide';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    // Vérification de l'unicité de l'email
    const existingIntervenant = await prisma.intervenant.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingIntervenant) {
      return res.status(400).json({ 
        errors: { email: 'Cet email est déjà utilisé par un autre intervenant' }
      });
    }

    // Création de l'intervenant
    const intervenant = await prisma.intervenant.create({
      data: {
        civilite,
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.toLowerCase().trim(),
        telephone: telephone?.trim() || null,
        grade: grade?.trim() || null,
        specialite: specialite?.trim() || null,
        etablissement: etablissement?.trim() || null,
        disponible
      },
      include: {
        modules: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    res.status(201).json({ 
      message: 'Intervenant créé avec succès',
      intervenant 
    });

  } catch (error) {
    console.error('Erreur création intervenant:', error);
    
    // Gestion des erreurs Prisma spécifiques
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        errors: { email: 'Cet email est déjà utilisé par un autre intervenant' }
      });
    }

    res.status(500).json({ 
      error: 'Erreur interne du serveur' 
    });
  } finally {
    await prisma.$disconnect();
  }
}
