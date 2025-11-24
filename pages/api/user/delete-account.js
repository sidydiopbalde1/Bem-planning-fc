// pages/api/user/delete-account.js
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Vérifier s'il y a des séances futures
    const futureSeances = await prisma.seance.count({
      where: {
        module: {
          userId: session.user.id
        },
        dateSeance: {
          gte: new Date()
        },
        status: { not: 'ANNULE' }
      }
    });

    if (futureSeances > 0) {
      return res.status(400).json({ 
        error: `Impossible de supprimer le compte. Vous avez ${futureSeances} séance(s) future(s). Veuillez les annuler d'abord.`
      });
    }

    // Supprimer toutes les données de l'utilisateur
    // L'ordre est important à cause des contraintes de clés étrangères
    
    // 1. Supprimer les séances
    await prisma.seance.deleteMany({
      where: {
        module: {
          userId: session.user.id
        }
      }
    });

    // 2. Supprimer les modules
    await prisma.module.deleteMany({
      where: {
        userId: session.user.id
      }
    });

    // 3. Supprimer les programmes
    await prisma.programme.deleteMany({
      where: {
        userId: session.user.id
      }
    });

    // 4. Supprimer l'utilisateur
    await prisma.user.delete({
      where: { id: session.user.id }
    });

    res.status(200).json({ message: 'Compte supprimé avec succès' });

  } catch (error) {
    console.error('Erreur suppression compte:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du compte' });
  } finally {
    await prisma.$disconnect();
  }
}