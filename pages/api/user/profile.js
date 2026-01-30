// pages/api/user/profile.js
import { PrismaClient } from '@prisma/client';
import { withAuth } from '../../../lib/withApiHandler';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const session = req.session;

  try {
    const { name, currentPassword, newPassword } = req.body;

    // Validation
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Le nom est requis' });
    }

    // Récupérer l'utilisateur actuel
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const updateData = { name: name.trim() };

    // Gestion du changement de mot de passe
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Le mot de passe actuel est requis' });
      }

      // Vérifier le mot de passe actuel
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
      }

      // Hacher le nouveau mot de passe
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      updateData.password = hashedNewPassword;
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        updatedAt: true
      }
    });

    res.status(200).json({ 
      message: 'Profil mis à jour avec succès',
      user: updatedUser 
    });

  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  } finally {
    await prisma.$disconnect();
  }
}

export default withAuth(handler, { entity: 'UserProfile' });