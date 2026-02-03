// pages/api/programmes/import.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import formidable from 'formidable';
import xlsx from 'xlsx';
import fs from 'fs';

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !['COORDINATOR', 'ADMIN'].includes(session.user.role)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Parse le fichier uploadé
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB max
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = files.file?.[0] || files.file;

    if (!file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    // Lire le fichier Excel
    const workbook = xlsx.readFile(file.filepath);

    // Vérifier que les feuilles nécessaires existent
    if (!workbook.SheetNames.includes('Programme') || !workbook.SheetNames.includes('Modules')) {
      return res.status(400).json({
        error: 'Le fichier doit contenir deux feuilles: "Programme" et "Modules"'
      });
    }

    const programmeSheet = workbook.Sheets['Programme'];
    const modulesSheet = workbook.Sheets['Modules'];

    // Lire les données du programme
    const programmeData = xlsx.utils.sheet_to_json(programmeSheet)[0];

    if (!programmeData) {
      return res.status(400).json({ error: 'Aucune donnée de programme trouvée' });
    }

    // Validation des champs requis du programme
    const requiredFields = ['code', 'name', 'semestre', 'niveau', 'dateDebut', 'dateFin'];
    const missingFields = requiredFields.filter(field => !programmeData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Champs manquants dans la feuille Programme: ${missingFields.join(', ')}`
      });
    }

    // Lire les modules
    const modulesData = xlsx.utils.sheet_to_json(modulesSheet);

    if (!modulesData || modulesData.length === 0) {
      return res.status(400).json({ error: 'Aucun module trouvé dans la feuille Modules' });
    }

    // Validation des modules
    const moduleRequiredFields = ['code', 'name', 'cm', 'td', 'tp', 'tpe', 'coefficient', 'credits'];
    for (let i = 0; i < modulesData.length; i++) {
      const module = modulesData[i];
      const missingModuleFields = moduleRequiredFields.filter(field =>
        module[field] === undefined || module[field] === null || module[field] === ''
      );

      if (missingModuleFields.length > 0) {
        return res.status(400).json({
          error: `Module ligne ${i + 2}: Champs manquants: ${missingModuleFields.join(', ')}`
        });
      }
    }

    // Calculer le VHT total du programme (somme des VHT des modules)
    const totalVHT = modulesData.reduce((sum, module) => {
      const vht = (parseInt(module.cm) || 0) +
                  (parseInt(module.td) || 0) +
                  (parseInt(module.tp) || 0) +
                  (parseInt(module.tpe) || 0);
      return sum + vht;
    }, 0);

    // Créer le programme avec transaction
    const result = await prisma.$transaction(async (tx) => {
      // Vérifier si le code programme existe déjà
      const existingProgramme = await tx.programme.findUnique({
        where: { code: programmeData.code }
      });

      if (existingProgramme) {
        throw new Error(`Un programme avec le code "${programmeData.code}" existe déjà`);
      }

      // Créer le programme
      const programme = await tx.programme.create({
        data: {
          code: programmeData.code,
          name: programmeData.name,
          description: programmeData.description || '',
          semestre: programmeData.semestre,
          niveau: programmeData.niveau,
          dateDebut: new Date(programmeData.dateDebut),
          dateFin: new Date(programmeData.dateFin),
          totalVHT: totalVHT,
          status: 'PLANIFIE',
          progression: 0,
          userId: session.user.id,
        },
      });

      // Créer les modules
      const createdModules = [];
      for (const moduleData of modulesData) {
        // Vérifier si le code module existe déjà
        const existingModule = await tx.module.findUnique({
          where: { code: moduleData.code }
        });

        if (existingModule) {
          throw new Error(`Un module avec le code "${moduleData.code}" existe déjà`);
        }

        const vht = (parseInt(moduleData.cm) || 0) +
                    (parseInt(moduleData.td) || 0) +
                    (parseInt(moduleData.tp) || 0) +
                    (parseInt(moduleData.tpe) || 0);

        const module = await tx.module.create({
          data: {
            code: moduleData.code,
            name: moduleData.name,
            description: moduleData.description || '',
            cm: parseInt(moduleData.cm) || 0,
            td: parseInt(moduleData.td) || 0,
            tp: parseInt(moduleData.tp) || 0,
            tpe: parseInt(moduleData.tpe) || 0,
            vht: vht,
            coefficient: parseInt(moduleData.coefficient) || 1,
            credits: parseInt(moduleData.credits) || 1,
            status: 'PLANIFIE',
            progression: 0,
            programmeId: programme.id,
            userId: session.user.id,
          },
        });
        createdModules.push(module);
      }

      // Logger l'action dans le journal
      await tx.journalActivite.create({
        data: {
          action: 'CREATION',
          entite: 'Programme',
          entiteId: programme.id,
          description: `Import Excel: Programme "${programme.name}" avec ${createdModules.length} modules`,
          nouvelleValeur: JSON.stringify({ programme, modulesCount: createdModules.length }),
          userId: session.user.id,
          userName: session.user.name,
        },
      });

      return { programme, modules: createdModules };
    });

    // Supprimer le fichier temporaire
    fs.unlinkSync(file.filepath);

    return res.status(201).json({
      success: true,
      message: `Programme "${result.programme.name}" importé avec succès`,
      data: {
        programme: result.programme,
        modulesCount: result.modules.length,
      },
    });

  } catch (error) {
    console.error('Erreur import Excel:', error);
    return res.status(500).json({
      error: error.message || 'Erreur lors de l\'importation du fichier Excel'
    });
  } finally {
    await prisma.$disconnect();
  }
}
