// pages/api/intervenants/[id].js - Pour suppression et détails
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    if (req.method === 'GET') {
      // Récupérer les détails d'un intervenant
      const intervenant = await prisma.intervenant.findUnique({
        where: { id },
        include: {
          modules: {
            include: {
              programme: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  status: true
                }
              }
            }
          },
          seances: {
            include: {
              module: {
                select: {
                  name: true,
                  code: true
                }
              }
            },
            orderBy: {
              dateSeance: 'desc'
            },
            take: 10
          }
        }
      });

      if (!intervenant) {
        return res.status(404).json({ error: 'Intervenant non trouvé' });
      }

      res.status(200).json({ intervenant });

    } else if (req.method === 'DELETE') {
      // Vérifier si l'intervenant existe
      const intervenant = await prisma.intervenant.findUnique({
        where: { id },
        include: {
          modules: true,
          seances: true
        }
      });

      if (!intervenant) {
        return res.status(404).json({ error: 'Intervenant non trouvé' });
      }

      // Vérifier s'il y a des modules ou séances en cours
      const modulesEnCours = intervenant.modules.filter(m => m.status === 'EN_COURS');
      const seancesAVenir = intervenant.seances.filter(s => 
        new Date(s.dateSeance) > new Date() && s.status !== 'ANNULE'
      );

      if (modulesEnCours.length > 0 || seancesAVenir.length > 0) {
        return res.status(400).json({ 
          error: 'Impossible de supprimer cet intervenant car il a des modules en cours ou des séances planifiées' 
        });
      }

      // Supprimer l'intervenant
      await prisma.intervenant.delete({
        where: { id }
      });

      res.status(200).json({ message: 'Intervenant supprimé avec succès' });

    } else if (req.method === 'PUT') {
      // Mise à jour complète de l'intervenant
      const {
        civilite,
        nom,
        prenom,
        email,
        telephone,
        grade,
        specialite,
        etablissement,
        disponible
      } = req.body;

      // Validation des données
      const errors = {};
      
      if (!civilite) errors.civilite = 'La civilité est requise';
      if (!nom?.trim()) errors.nom = 'Le nom est requis';
      if (!prenom?.trim()) errors.prenom = 'Le prénom est requis';
      if (!email?.trim()) {
        errors.email = 'L\'email est requis';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = 'Format d\'email invalide';
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ errors });
      }

      // Vérifier l'unicité de l'email (sauf pour l'intervenant actuel)
      const existingIntervenant = await prisma.intervenant.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          NOT: { id }
        }
      });

      if (existingIntervenant) {
        return res.status(400).json({ 
          errors: { email: 'Cet email est déjà utilisé par un autre intervenant' }
        });
      }

      // Mise à jour
      const updatedIntervenant = await prisma.intervenant.update({
        where: { id },
        data: {
          civilite,
          nom: nom.trim(),
          prenom: prenom.trim(),
          email: email.toLowerCase().trim(),
          telephone: telephone?.trim() || null,
          grade: grade?.trim() || null,
          specialite: specialite?.trim() || null,
          etablissement: etablissement?.trim() || null,
          disponible: disponible ?? true
        },
        include: {
          modules: {
            select: {
              id: true,
              name: true,
              code: true,
              status: true
            }
          }
        }
      });

      res.status(200).json({ 
        message: 'Intervenant mis à jour avec succès',
        intervenant: updatedIntervenant 
      });

    } else {
      res.status(405).json({ error: 'Method Not Allowed' });
    }

  } catch (error) {
    console.error('Erreur API intervenant:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        errors: { email: 'Cet email est déjà utilisé par un autre intervenant' }
      });
    }

    res.status(500).json({ error: 'Erreur interne du serveur' });
  } finally {
    await prisma.$disconnect();
  }
}