// pages/api/programmes/[id].js
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
      // Récupérer les détails d'un programme
      const programme = await prisma.programme.findFirst({
        where: {
          id,
          userId: session.user.id
        },
        include: {
          modules: {
            include: {
              intervenant: {
                select: {
                  id: true,
                  civilite: true,
                  nom: true,
                  prenom: true,
                  email: true
                }
              },
              seances: {
                select: {
                  id: true,
                  dateSeance: true,
                  heureDebut: true,
                  heureFin: true,
                  status: true
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      });
        console.log(programme);
      if (!programme) {
        return res.status(404).json({ error: 'Programme non trouvé bbbbbbbb' });
      }

      res.status(200).json({ programme });

    } else if (req.method === 'PUT') {
      // Mise à jour d'un programme
      const {
        name,
        code,
        description,
        semestre,
        niveau,
        dateDebut,
        dateFin,
        totalVHT,
        status
      } = req.body;

      // Validation
      const errors = {};
      
      if (!name?.trim()) {
        errors.name = 'Le nom du programme est requis';
      }
      
      if (!code?.trim()) {
        errors.code = 'Le code du programme est requis';
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ errors });
      }

      // Vérifier que le programme appartient à l'utilisateur
      const existingProgramme = await prisma.programme.findFirst({
        where: {
          id,
          userId: session.user.id
        }
      });

      if (!existingProgramme) {
        return res.status(404).json({ error: 'Programme non trouvé' });
      }

      // Vérifier l'unicité du code (sauf pour le programme actuel)
      const codeConflict = await prisma.programme.findFirst({
        where: {
          code: code.trim().toUpperCase(),
          NOT: { id }
        }
      });

      if (codeConflict) {
        return res.status(400).json({ 
          errors: { code: 'Ce code de programme existe déjà' }
        });
      }

      // Mise à jour
      const updatedProgramme = await prisma.programme.update({
        where: { id },
        data: {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description?.trim() || null,
          semestre,
          niveau,
          dateDebut: dateDebut ? new Date(dateDebut) : existingProgramme.dateDebut,
          dateFin: dateFin ? new Date(dateFin) : existingProgramme.dateFin,
          totalVHT: totalVHT ? parseInt(totalVHT) : existingProgramme.totalVHT,
          status: status || existingProgramme.status
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

      res.status(200).json({ 
        message: 'Programme mis à jour avec succès',
        programme: updatedProgramme 
      });

    } else if (req.method === 'DELETE') {
      // Vérifier que le programme appartient à l'utilisateur
      const programme = await prisma.programme.findFirst({
        where: {
          id,
          userId: session.user.id
        },
        include: {
          modules: {
            include: {
              seances: {
                where: {
                  status: { not: 'ANNULE' },
                  dateSeance: { gte: new Date() }
                }
              }
            }
          }
        }
      });

      if (!programme) {
        return res.status(404).json({ error: 'Programme non trouvé' });
      }

      // Vérifier s'il y a des séances futures non annulées
      const seancesFutures = programme.modules.reduce((total, module) => {
        return total + module.seances.length;
      }, 0);

      if (seancesFutures > 0) {
        return res.status(400).json({ 
          error: `Impossible de supprimer ce programme car il contient ${seancesFutures} séance(s) future(s). Veuillez d'abord annuler toutes les séances.`
        });
      }

      // Supprimer le programme (cascade supprime modules et séances)
      await prisma.programme.delete({
        where: { id }
      });

      res.status(200).json({ message: 'Programme supprimé avec succès' });

    } else {
      res.status(405).json({ error: 'Method Not Allowed' });
    }

  } catch (error) {
    console.error('Erreur API programme:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        errors: { code: 'Ce code de programme existe déjà' }
      });
    }

    res.status(500).json({ 
      error: 'Erreur interne du serveur' 
    });
  } finally {
    await prisma.$disconnect();
  }
}