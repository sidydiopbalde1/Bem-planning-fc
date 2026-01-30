// pages/api/programmes/export.js
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

    const { id } = req.query;

    if (id) {
      // Export d'un programme spécifique avec ses modules
      const programme = await prisma.programme.findUnique({
        where: { id },
        include: {
          modules: {
            orderBy: { code: 'asc' }
          }
        }
      });

      if (!programme) {
        return res.status(404).json({ error: 'Programme non trouvé' });
      }

      // Créer un nouveau workbook
      const workbook = xlsx.utils.book_new();

      // Données du programme
      const programmeData = [{
        code: programme.code,
        name: programme.name,
        semestre: programme.semestre,
        niveau: programme.niveau,
        dateDebut: programme.dateDebut.toISOString().split('T')[0],
        dateFin: programme.dateFin.toISOString().split('T')[0],
        description: programme.description || '',
        status: programme.status,
        progression: programme.progression,
        totalVHT: programme.totalVHT
      }];

      // Données des modules
      const modulesData = programme.modules.map(module => ({
        code: module.code,
        name: module.name,
        cm: module.cm,
        td: module.td,
        tp: module.tp,
        tpe: module.tpe,
        coefficient: module.coefficient,
        credits: module.credits,
        description: module.description || '',
        status: module.status,
        progression: module.progression
      }));

      // Créer les feuilles
      const programmeWorksheet = xlsx.utils.json_to_sheet(programmeData);
      programmeWorksheet['!cols'] = [
        { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 10 },
        { wch: 12 }, { wch: 12 }, { wch: 40 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }
      ];

      const modulesWorksheet = xlsx.utils.json_to_sheet(modulesData);
      modulesWorksheet['!cols'] = [
        { wch: 12 }, { wch: 35 }, { wch: 8 }, { wch: 8 },
        { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 10 },
        { wch: 40 }, { wch: 12 }, { wch: 12 }
      ];

      // Ajouter les feuilles au workbook
      xlsx.utils.book_append_sheet(workbook, programmeWorksheet, 'Programme');
      xlsx.utils.book_append_sheet(workbook, modulesWorksheet, 'Modules');

      // Générer le buffer
      const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Définir les headers pour le téléchargement
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=programme-${programme.code}.xlsx`);
      res.setHeader('Content-Length', buffer.length);

      // Logger l'action
      await prisma.journalActivite.create({
        data: {
          action: 'EXPORT_DONNEES',
          entite: 'Programme',
          entiteId: programme.id,
          description: `Export Excel: Programme "${programme.name}" avec ${programme.modules.length} modules`,
          userId: session.user.id,
          userName: session.user.name,
        },
      });

      // Envoyer le fichier
      res.send(buffer);

    } else {
      // Export de tous les programmes
      const programmes = await prisma.programme.findMany({
        include: {
          modules: true,
          _count: {
            select: { modules: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Créer un nouveau workbook
      const workbook = xlsx.utils.book_new();

      // Liste des programmes
      const programmesData = programmes.map(p => ({
        code: p.code,
        name: p.name,
        semestre: p.semestre,
        niveau: p.niveau,
        dateDebut: p.dateDebut.toISOString().split('T')[0],
        dateFin: p.dateFin.toISOString().split('T')[0],
        description: p.description || '',
        status: p.status,
        progression: p.progression,
        totalVHT: p.totalVHT,
        nombreModules: p._count.modules
      }));

      // Tous les modules
      const allModules = [];
      programmes.forEach(p => {
        p.modules.forEach(m => {
          allModules.push({
            programmeCode: p.code,
            programmeName: p.name,
            moduleCode: m.code,
            moduleName: m.name,
            cm: m.cm,
            td: m.td,
            tp: m.tp,
            tpe: m.tpe,
            vht: m.vht,
            coefficient: m.coefficient,
            credits: m.credits,
            status: m.status,
            progression: m.progression
          });
        });
      });

      // Créer les feuilles
      const programmesWorksheet = xlsx.utils.json_to_sheet(programmesData);
      programmesWorksheet['!cols'] = [
        { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 10 },
        { wch: 12 }, { wch: 12 }, { wch: 40 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 15 }
      ];

      const modulesWorksheet = xlsx.utils.json_to_sheet(allModules);
      modulesWorksheet['!cols'] = [
        { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 35 },
        { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
        { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }
      ];

      // Ajouter les feuilles au workbook
      xlsx.utils.book_append_sheet(workbook, programmesWorksheet, 'Programmes');
      xlsx.utils.book_append_sheet(workbook, modulesWorksheet, 'Tous les Modules');

      // Générer le buffer
      const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Définir les headers pour le téléchargement
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=tous-les-programmes.xlsx');
      res.setHeader('Content-Length', buffer.length);

      // Logger l'action
      await prisma.journalActivite.create({
        data: {
          action: 'EXPORT_DONNEES',
          entite: 'Programme',
          entiteId: 'EXPORT_ALL',
          description: `Export Excel: ${programmes.length} programmes avec ${allModules.length} modules au total`,
          userId: session.user.id,
          userName: session.user.name,
        },
      });

      // Envoyer le fichier
      res.send(buffer);
    }

  } catch (error) {
    console.error('Erreur export Excel:', error);
    return res.status(500).json({
      error: 'Erreur lors de l\'export Excel'
    });
  } finally {
    await prisma.$disconnect();
  }
}
