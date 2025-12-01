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
      // Récupérer un indicateur spécifique
      const indicateur = await prisma.indicateurAcademique.findUnique({
        where: { id },
        include: {
          programme: true,
          periode: true,
          responsable: true
        }
      });

      if (!indicateur) {
        return res.status(404).json({ error: 'Indicateur non trouvé' });
      }

      return res.status(200).json(indicateur);

    } else if (req.method === 'PUT') {
      // Mettre à jour un indicateur
      const {
        nom,
        description,
        valeurCible,
        valeurReelle,
        periodicite,
        methodeCalcul,
        unite,
        type,
        responsableId,
        dateCollecte
      } = req.body;

      const updateData = {};
      if (nom) updateData.nom = nom;
      if (description !== undefined) updateData.description = description;
      if (valeurCible !== undefined) updateData.valeurCible = valeurCible ? parseFloat(valeurCible) : null;
      if (valeurReelle !== undefined) updateData.valeurReelle = valeurReelle ? parseFloat(valeurReelle) : null;
      if (periodicite) updateData.periodicite = periodicite;
      if (methodeCalcul !== undefined) updateData.methodeCalcul = methodeCalcul;
      if (unite) updateData.unite = unite;
      if (type) updateData.type = type;
      if (responsableId !== undefined) updateData.responsableId = responsableId;
      if (dateCollecte !== undefined) updateData.dateCollecte = dateCollecte ? new Date(dateCollecte) : null;

      const indicateur = await prisma.indicateurAcademique.update({
        where: { id },
        data: updateData,
        include: {
          programme: true,
          periode: true,
          responsable: true
        }
      });

      return res.status(200).json(indicateur);

    } else if (req.method === 'DELETE') {
      // Supprimer un indicateur
      await prisma.indicateurAcademique.delete({
        where: { id }
      });

      return res.status(200).json({ message: 'Indicateur supprimé avec succès' });

    } else {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

  } catch (error) {
    console.error('Erreur API indicateur académique:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}
