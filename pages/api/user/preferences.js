// pages/api/user/preferences.js
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    if (req.method === 'GET') {
      // Récupérer les préférences (simulées pour l'instant)
      // En réalité, vous pourriez les stocker dans une table UserPreferences
      const defaultPreferences = {
        language: 'fr',
        timezone: 'Europe/Paris',
        dateFormat: 'dd/MM/yyyy',
        notifications: {
          email: true,
          desktop: false,
          newProgramme: true,
          seanceReminder: true,
          conflictAlert: true
        },
        theme: 'light',
        defaultView: 'month'
      };

      res.status(200).json({ preferences: defaultPreferences });

    } else if (req.method === 'PUT') {
      const { preferences } = req.body;

      if (!preferences) {
        return res.status(400).json({ error: 'Préférences requises' });
      }

      // Ici, vous pourriez sauvegarder dans une table UserPreferences
      // Pour l'instant, on simule la sauvegarde
      
      res.status(200).json({ 
        message: 'Préférences sauvegardées avec succès',
        preferences 
      });

    } else {
      res.status(405).json({ error: 'Method Not Allowed' });
    }

  } catch (error) {
    console.error('Erreur préférences:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  } finally {
    await prisma.$disconnect();
  }
}