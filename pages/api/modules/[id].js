// pages/api/modules/[id].js
import { PrismaClient } from '@prisma/client';
import { withAuth } from '../../../lib/withApiHandler';

const prisma = new PrismaClient();

async function handler(req, res) {
  const { id } = req.query;
  const session = req.session;

  try {
    if (req.method === 'GET') {
      // Récupérer les détails d'un module
      const module = await prisma.module.findFirst({
        where: {
          id,
          userId: session.user.id
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
              email: true,
              telephone: true,
              grade: true,
              specialite: true
            }
          },
          seances: {
            include: {
              intervenant: {
                select: {
                  civilite: true,
                  nom: true,
                  prenom: true
                }
              }
            },
            orderBy: {
              dateSeance: 'asc'
            }
          }
        }
      });

      if (!module) {
        return res.status(404).json({ error: 'Module non trouvé' });
      }

      res.status(200).json({ module });

    } else if (req.method === 'PUT') {
      // Mise à jour d'un module
      const {
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
        status
      } = req.body;

      // Validation
      const errors = {};
      
      if (!code?.trim()) {
        errors.code = 'Le code du module est requis';
      }
      
      if (!name?.trim()) {
        errors.name = 'Le nom du module est requis';
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ errors });
      }

      // Vérifier que le module appartient à l'utilisateur
      const existingModule = await prisma.module.findFirst({
        where: {
          id,
          userId: session.user.id
        }
      });

      if (!existingModule) {
        return res.status(404).json({ error: 'Module non trouvé' });
      }

      // Vérifier l'unicité du code (sauf pour le module actuel)
      const codeConflict = await prisma.module.findFirst({
        where: {
          code: code.trim().toUpperCase(),
          programmeId: existingModule.programmeId,
          NOT: { id }
        }
      });

      if (codeConflict) {
        return res.status(400).json({ 
          errors: { code: 'Ce code de module existe déjà dans ce programme' }
        });
      }

      // Mise à jour
      const updatedModule = await prisma.module.update({
        where: { id },
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
          status: status || existingModule.status,
          dateDebut: dateDebut ? new Date(dateDebut) : existingModule.dateDebut,
          dateFin: dateFin ? new Date(dateFin) : existingModule.dateFin,
          intervenantId: intervenantId || null
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

      res.status(200).json({ 
        message: 'Module mis à jour avec succès',
        module: updatedModule 
      });

    } else if (req.method === 'DELETE') {
      // Vérifier que le module appartient à l'utilisateur
      const module = await prisma.module.findFirst({
        where: {
          id,
          userId: session.user.id
        },
        include: {
          seances: {
            where: {
              status: { not: 'ANNULE' },
              dateSeance: { gte: new Date() }
            }
          }
        }
      });

      if (!module) {
        return res.status(404).json({ error: 'Module non trouvé' });
      }

      // Vérifier s'il y a des séances futures non annulées
      if (module.seances.length > 0) {
        return res.status(400).json({ 
          error: `Impossible de supprimer ce module car il contient ${module.seances.length} séance(s) future(s). Veuillez d'abord annuler toutes les séances.`
        });
      }

      // Supprimer le module (cascade supprime les séances)
      await prisma.module.delete({
        where: { id }
      });

      res.status(200).json({ message: 'Module supprimé avec succès' });

    } else {
      res.status(405).json({ error: 'Method Not Allowed' });
    }

  } catch (error) {
    console.error('Erreur API module:', error);
    
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

export default withAuth(handler, { entity: 'Module' });