// pages/api/intervenants/export.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';
import xlsx from 'xlsx';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Vérifier que l'utilisateur n'est pas un simple intervenant (TEACHER)
    // Seuls les ADMIN et COORDINATOR peuvent exporter la liste des intervenants
    if (session.user.role === 'TEACHER') {
      return res.status(403).json({
        error: 'Accès refusé. Vous n\'avez pas les permissions nécessaires pour exporter les intervenants.'
      });
    }

    // Récupérer tous les intervenants avec leurs disponibilités
    const intervenants = await prisma.intervenant.findMany({
      include: {
        disponibilites: true
      },
      orderBy: { nom: 'asc' }
    });

    // Créer un nouveau workbook
    const workbook = xlsx.utils.book_new();

    // Données des intervenants
    const intervenantsData = intervenants.map(i => ({
      civilite: i.civilite,
      nom: i.nom,
      prenom: i.prenom,
      email: i.email,
      telephone: i.telephone || '',
      grade: i.grade || '',
      specialite: i.specialite || '',
      etablissement: i.etablissement || '',
      disponible: i.disponible,
      heuresMaxJour: i.heuresMaxJour,
      heuresMaxSemaine: i.heuresMaxSemaine,
      joursPreferences: i.joursPreferences || '',
      creneauxPreferences: i.creneauxPreferences || ''
    }));

    // Données des disponibilités
    const disponibilitesData = [];
    intervenants.forEach(i => {
      i.disponibilites.forEach(d => {
        disponibilitesData.push({
          email: i.email,
          jourSemaine: d.jourSemaine,
          heureDebut: d.heureDebut,
          heureFin: d.heureFin,
          type: d.type,
          recurrent: d.recurrent,
          dateDebut: d.dateDebut ? d.dateDebut.toISOString().split('T')[0] : '',
          dateFin: d.dateFin ? d.dateFin.toISOString().split('T')[0] : ''
        });
      });
    });

    // Créer les feuilles
    const intervenantsWorksheet = xlsx.utils.json_to_sheet(intervenantsData);
    intervenantsWorksheet['!cols'] = [
      { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 30 },
      { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 35 },
      { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 30 }, { wch: 25 }
    ];

    xlsx.utils.book_append_sheet(workbook, intervenantsWorksheet, 'Intervenants');

    if (disponibilitesData.length > 0) {
      const disponibilitesWorksheet = xlsx.utils.json_to_sheet(disponibilitesData);
      disponibilitesWorksheet['!cols'] = [
        { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
      ];
      xlsx.utils.book_append_sheet(workbook, disponibilitesWorksheet, 'Disponibilites');
    }

    // Générer le buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Définir les headers pour le téléchargement
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=intervenants-export.xlsx');
    res.setHeader('Content-Length', buffer.length);

    // Logger l'action
    await prisma.journalActivite.create({
      data: {
        action: 'EXPORT_DONNEES',
        entite: 'Intervenant',
        entiteId: 'EXPORT_ALL',
        description: `Export Excel: ${intervenants.length} intervenants avec ${disponibilitesData.length} disponibilités`,
        userId: session.user.id,
        userName: session.user.name,
      },
    });

    // Envoyer le fichier
    res.send(buffer);

  } catch (error) {
    console.error('Erreur export Excel intervenants:', error);
    return res.status(500).json({
      error: 'Erreur lors de l\'export Excel'
    });
  } finally {
    await prisma.$disconnect();
  }
}
