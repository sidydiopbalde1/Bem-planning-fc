// pages/api/rotations-weekend/[id]/absence.js
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import RotationWeekendManager from '../../../../lib/rotation-weekend';

const prisma = new PrismaClient();

/**
 * POST /api/rotations-weekend/[id]/absence
 * Déclare une absence et déclenche le remplacement automatique
 */
export default async function handler(req, res) {
  const { id } = req.query;

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { raison } = req.body;

    if (!raison) {
      return res.status(400).json({ error: 'La raison de l\'absence est requise' });
    }

    const rotation = await prisma.rotationWeekend.findUnique({
      where: { id },
      include: { responsable: true }
    });

    if (!rotation) {
      return res.status(404).json({ error: 'Rotation introuvable' });
    }

    // Vérifier que l'utilisateur est le responsable de cette rotation ou un admin
    const isResponsable = rotation.responsableId === session.user.id;
    const isAdmin = ['ADMIN', 'COORDINATOR'].includes(session.user.role);

    if (!isResponsable && !isAdmin) {
      return res.status(403).json({
        error: 'Non autorisé',
        message: 'Seul le responsable assigné ou un admin peut déclarer une absence'
      });
    }

    // Vérifier que la rotation n'est pas déjà marquée comme absente
    if (rotation.status === 'ABSENT') {
      return res.status(400).json({
        error: 'Absence déjà déclarée',
        message: 'Cette rotation est déjà marquée comme absence'
      });
    }

    // Déclencher le remplacement automatique
    const nouvelleRotation = await RotationWeekendManager.gererRemplacement(id, raison);

    // Logger l'action
    await prisma.journalActivite.create({
      data: {
        action: 'ALERTE',
        entite: 'RotationWeekend',
        entiteId: id,
        description: `Absence déclarée - Remplacement: ${nouvelleRotation.responsable.name}`,
        userId: session.user.id,
        userName: session.user.name,
        nouvelleValeur: JSON.stringify({
          rotationOriginal: id,
          nouvelleRotation: nouvelleRotation.id,
          raison
        })
      }
    });

    return res.status(200).json({
      message: 'Absence déclarée et remplacement effectué avec succès',
      rotationOriginale: rotation,
      nouveauResponsable: nouvelleRotation
    });

  } catch (error) {
    console.error('Erreur lors de la déclaration d\'absence:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}
