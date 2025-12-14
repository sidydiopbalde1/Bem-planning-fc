// pages/api/seances/export.js
import { getServerSession } from 'next-auth';
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

    const { moduleId, programmeId, startDate, endDate } = req.query;

    // Construire le filtre
    const where = {};

    if (moduleId) {
      where.moduleId = moduleId;
    }

    if (startDate && endDate) {
      where.dateSeance = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Récupérer les séances
    const seances = await prisma.seance.findMany({
      where,
      include: {
        module: {
          include: {
            programme: true
          }
        },
        intervenant: true
      },
      orderBy: { dateSeance: 'asc' }
    });

    // Si filtré par programme
    let filteredSeances = seances;
    if (programmeId) {
      filteredSeances = seances.filter(s => s.module.programmeId === programmeId);
    }

    // Créer un nouveau workbook
    const workbook = xlsx.utils.book_new();

    // Données des séances
    const seancesData = filteredSeances.map(s => ({
      programmeCode: s.module.programme.code,
      programmeName: s.module.programme.name,
      moduleCode: s.module.code,
      moduleName: s.module.name,
      intervenantNom: `${s.intervenant.civilite} ${s.intervenant.prenom} ${s.intervenant.nom}`,
      intervenantEmail: s.intervenant.email,
      dateSeance: s.dateSeance.toISOString().split('T')[0],
      heureDebut: s.heureDebut,
      heureFin: s.heureFin,
      duree: s.duree,
      typeSeance: s.typeSeance,
      salle: s.salle || '',
      batiment: s.batiment || '',
      status: s.status,
      notes: s.notes || '',
      objectifs: s.objectifs || ''
    }));

    // Créer la feuille
    const seancesWorksheet = xlsx.utils.json_to_sheet(seancesData);
    seancesWorksheet['!cols'] = [
      { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 35 },
      { wch: 30 }, { wch: 30 }, { wch: 12 }, { wch: 10 },
      { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 15 },
      { wch: 15 }, { wch: 12 }, { wch: 35 }, { wch: 35 }
    ];

    xlsx.utils.book_append_sheet(workbook, seancesWorksheet, 'Seances');

    // Ajouter une feuille de statistiques
    const statsData = [
      { Statistique: 'Nombre total de séances', Valeur: filteredSeances.length },
      { Statistique: 'Séances planifiées', Valeur: filteredSeances.filter(s => s.status === 'PLANIFIE').length },
      { Statistique: 'Séances confirmées', Valeur: filteredSeances.filter(s => s.status === 'CONFIRME').length },
      { Statistique: 'Séances terminées', Valeur: filteredSeances.filter(s => s.status === 'TERMINE').length },
      { Statistique: 'CM', Valeur: filteredSeances.filter(s => s.typeSeance === 'CM').length },
      { Statistique: 'TD', Valeur: filteredSeances.filter(s => s.typeSeance === 'TD').length },
      { Statistique: 'TP', Valeur: filteredSeances.filter(s => s.typeSeance === 'TP').length },
      { Statistique: 'Volume horaire total', Valeur: `${filteredSeances.reduce((sum, s) => sum + s.duree, 0)} minutes` },
    ];

    const statsWorksheet = xlsx.utils.json_to_sheet(statsData);
    statsWorksheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
    xlsx.utils.book_append_sheet(workbook, statsWorksheet, 'Statistiques');

    // Générer le buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Nom du fichier
    let filename = 'seances-export';
    if (moduleId) {
      const module = await prisma.module.findUnique({ where: { id: moduleId } });
      filename = `seances-${module?.code || 'module'}`;
    } else if (programmeId) {
      const programme = await prisma.programme.findUnique({ where: { id: programmeId } });
      filename = `seances-${programme?.code || 'programme'}`;
    }

    // Définir les headers pour le téléchargement
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
    res.setHeader('Content-Length', buffer.length);

    // Logger l'action
    await prisma.journalActivite.create({
      data: {
        action: 'EXPORT_DONNEES',
        entite: 'Seance',
        entiteId: moduleId || programmeId || 'EXPORT_ALL',
        description: `Export Excel: ${filteredSeances.length} séances`,
        userId: session.user.id,
        userName: session.user.name,
      },
    });

    // Envoyer le fichier
    res.send(buffer);

  } catch (error) {
    console.error('Erreur export Excel séances:', error);
    return res.status(500).json({
      error: 'Erreur lors de l\'export Excel'
    });
  } finally {
    await prisma.$disconnect();
  }
}
