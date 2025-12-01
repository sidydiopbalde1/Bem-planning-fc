import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const session = await getServerSession(req, res);

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      // Récupérer une activité spécifique
      const activite = await prisma.activiteAcademique.findUnique({
        where: { id },
        include: {
          programme: true,
          periode: true
        }
      });

      if (!activite) {
        return res.status(404).json({ error: 'Activité non trouvée' });
      }

      return res.status(200).json(activite);

    } else if (req.method === 'PUT') {
      // Mettre à jour une activité
      const { nom, description, datePrevue, dateReelle, type } = req.body;

      const updateData = {};
      if (nom) updateData.nom = nom;
      if (description !== undefined) updateData.description = description;
      if (datePrevue !== undefined) updateData.datePrevue = datePrevue ? new Date(datePrevue) : null;
      if (dateReelle !== undefined) updateData.dateReelle = dateReelle ? new Date(dateReelle) : null;
      if (type) updateData.type = type;

      const activite = await prisma.activiteAcademique.update({
        where: { id },
        data: updateData,
        include: {
          programme: true,
          periode: true
        }
      });

      return res.status(200).json(activite);

    } else if (req.method === 'DELETE') {
      // Supprimer une activité
      await prisma.activiteAcademique.delete({
        where: { id }
      });

      return res.status(200).json({ message: 'Activité supprimée avec succès' });

    } else {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

  } catch (error) {
    console.error('Erreur API activité académique:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}
