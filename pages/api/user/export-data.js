// pages/api/user/export-data.js
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Récupérer toutes les données de l'utilisateur
    const userData = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        programmes: {
          include: {
            modules: {
              include: {
                seances: true,
                intervenant: {
                  select: {
                    civilite: true,
                    nom: true,
                    prenom: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!userData) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Nettoyer les données sensibles
    const exportData = {
      user: {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        createdAt: userData.createdAt
      },
      programmes: userData.programmes,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    // Définir les headers pour le téléchargement
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="planning-fc-export.json"');
    
    res.status(200).json(exportData);

  } catch (error) {
    console.error('Erreur export données:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export' });
  } finally {
    await prisma.$disconnect();
  }
}