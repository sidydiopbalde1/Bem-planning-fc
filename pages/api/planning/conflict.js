// pages/api/planning/conflicts.js
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
      return getConflicts(req, res, session);
    case 'PUT':
      return resolveConflict(req, res, session);
    case 'DELETE':
      return deleteConflict(req, res, session);
    default:
      return res.status(405).json({ error: 'Méthode non autorisée' });
  }
}

async function getConflicts(req, res, session) {
  try {
    const { start, end, type, resolved = 'false' } = req.query;
    
    const where = {
      resolu: resolved === 'true'
    };

    // Filtrer par type de conflit
    if (type) {
      where.type = type;
    }

    // Filtrer par période (via les séances associées)
    if (start && end) {
      where.OR = [
        {
          seanceId1: {
            in: await prisma.seance.findMany({
              where: {
                dateSeance: {
                  gte: new Date(start),
                  lte: new Date(end)
                },
                module: {
                  programme: {
                    userId: session.user.id
                  }
                }
              },
              select: { id: true }
            }).then(seances => seances.map(s => s.id))
          }
        }
      ];
    }

    const conflicts = await prisma.conflit.findMany({
      where,
      include: {
        seance1: {
          include: {
            module: {
              include: {
                programme: {
                  select: { name: true, code: true }
                }
              }
            },
            intervenant: {
              select: { civilite: true, nom: true, prenom: true }
            }
          }
        },
        seance2: {
          include: {
            module: {
              include: {
                programme: {
                  select: { name: true, code: true }
                }
              }
            },
            intervenant: {
              select: { civilite: true, nom: true, prenom: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Analyser les conflits pour fournir des suggestions de résolution
    const conflictsWithSuggestions = conflicts.map(conflict => ({
      ...conflict,
      suggestions: generateResolutionSuggestions(conflict)
    }));

    return res.status(200).json({
      conflicts: conflictsWithSuggestions,
      total: conflicts.length,
      statistics: {
        byType: await getConflictStatsByType(session.user.id),
        resolved: conflicts.filter(c => c.resolu).length,
        pending: conflicts.filter(c => !c.resolu).length
      }
    });
  } catch (error) {
    console.error('Erreur GET /api/planning/conflicts:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function resolveConflict(req, res, session) {
  try {
    const { conflictId, resolution, action } = req.body;
    
    if (!conflictId || !resolution) {
      return res.status(400).json({ error: 'ID du conflit et résolution requis' });
    }

    // Vérifier que le conflit appartient à l'utilisateur
    const conflict = await prisma.conflit.findFirst({
      where: {
        id: conflictId,
        seance1: {
          module: {
            programme: {
              userId: session.user.id
            }
          }
        }
      },
      include: {
        seance1: true,
        seance2: true
      }
    });

    if (!conflict) {
      return res.status(404).json({ error: 'Conflit non trouvé' });
    }

    // Appliquer la résolution selon l'action
    switch (action) {
      case 'MOVE_SEANCE':
        // Déplacer une des séances
        const { seanceId, newDate, newStartTime, newEndTime } = req.body;
        await prisma.seance.update({
          where: { id: seanceId },
          data: {
            dateSeance: new Date(newDate),
            heureDebut: newStartTime,
            heureFin: newEndTime,
            updatedAt: new Date()
          }
        });
        break;

      case 'CHANGE_ROOM':
        // Changer la salle d'une séance
        const { targetSeanceId, newRoom } = req.body;
        await prisma.seance.update({
          where: { id: targetSeanceId },
          data: {
            salle: newRoom,
            updatedAt: new Date()
          }
        });
        break;

      case 'CANCEL_SEANCE':
        // Annuler une séance
        const { seanceToCancel } = req.body;
        await prisma.seance.update({
          where: { id: seanceToCancel },
          data: {
            status: 'ANNULE',
            updatedAt: new Date()
          }
        });
        break;

      case 'SPLIT_SEANCE':
        // Diviser une séance en plusieurs parties
        // Implementation plus complexe...
        break;
    }

    // Marquer le conflit comme résolu
    const resolvedConflict = await prisma.conflit.update({
      where: { id: conflictId },
      data: {
        resolu: true,
        resolution,
        updatedAt: new Date()
      }
    });

    return res.status(200).json({
      message: 'Conflit résolu avec succès',
      conflict: resolvedConflict
    });
  } catch (error) {
    console.error('Erreur PUT /api/planning/conflicts:', error);
    return res.status(500).json({ error: 'Erreur lors de la résolution du conflit' });
  }
}

async function deleteConflict(req, res, session) {
  try {
    const { id } = req.query;
    
    const deletedConflict = await prisma.conflit.deleteMany({
      where: {
        id,
        seance1: {
          module: {
            programme: {
              userId: session.user.id
            }
          }
        }
      }
    });

    if (deletedConflict.count === 0) {
      return res.status(404).json({ error: 'Conflit non trouvé' });
    }

    return res.status(200).json({ message: 'Conflit supprimé' });
  } catch (error) {
    console.error('Erreur DELETE /api/planning/conflicts:', error);
    return res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
}

// Fonctions utilitaires pour les suggestions de résolution
function generateResolutionSuggestions(conflict) {
  const suggestions = [];

  switch (conflict.type) {
    case 'INTERVENANT_DOUBLE_BOOKING':
      suggestions.push({
        action: 'MOVE_SEANCE',
        description: 'Déplacer une des séances à un autre créneau',
        priority: 'HIGH',
        effort: 'MEDIUM'
      });
      suggestions.push({
        action: 'CHANGE_INTERVENANT',
        description: 'Assigner un autre intervenant disponible',
        priority: 'MEDIUM',
        effort: 'LOW'
      });
      break;

    case 'SALLE_DOUBLE_BOOKING':
      suggestions.push({
        action: 'CHANGE_ROOM',
        description: 'Réserver une autre salle disponible',
        priority: 'HIGH',
        effort: 'LOW'
      });
      suggestions.push({
        action: 'MOVE_SEANCE',
        description: 'Reporter la séance à un autre moment',
        priority: 'MEDIUM',
        effort: 'MEDIUM'
      });
      break;

    case 'CONTRAINTE_CALENDAIRE':
      suggestions.push({
        action: 'MOVE_SEANCE',
        description: 'Programmer la séance un jour ouvrable',
        priority: 'HIGH',
        effort: 'LOW'
      });
      break;
  }

  return suggestions;
}

async function getConflictStatsByType(userId) {
  const stats = await prisma.conflit.groupBy({
    by: ['type'],
    where: {
      seance1: {
        module: {
          programme: {
            userId
          }
        }
      }
    },
    _count: {
      type: true
    }
  });

  return stats.reduce((acc, stat) => {
    acc[stat.type] = stat._count.type;
    return acc;
  }, {});
}