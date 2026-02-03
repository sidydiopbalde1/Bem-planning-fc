// pages/api/seances/import.js
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

    // Vérifier que la feuille Seances existe
    if (!workbook.SheetNames.includes('Seances')) {
      return res.status(400).json({
        error: 'Le fichier doit contenir une feuille "Seances"'
      });
    }

    const seancesSheet = workbook.Sheets['Seances'];
    const seancesData = xlsx.utils.sheet_to_json(seancesSheet);

    if (!seancesData || seancesData.length === 0) {
      return res.status(400).json({ error: 'Aucune séance trouvée dans la feuille' });
    }

    // Validation des séances
    const requiredFields = ['moduleCode', 'intervenantEmail', 'dateSeance', 'heureDebut', 'heureFin', 'typeSeance'];
    const errors = [];

    for (let i = 0; i < seancesData.length; i++) {
      const seance = seancesData[i];
      const missingFields = requiredFields.filter(field =>
        !seance[field] || seance[field].toString().trim() === ''
      );

      if (missingFields.length > 0) {
        errors.push(`Ligne ${i + 2}: Champs manquants: ${missingFields.join(', ')}`);
      }

      // Valider le type de séance
      const typesValides = ['CM', 'TD', 'TP', 'EXAMEN', 'RATTRAPAGE'];
      if (seance.typeSeance && !typesValides.includes(seance.typeSeance)) {
        errors.push(`Ligne ${i + 2}: Type de séance invalide. Valeurs acceptées: ${typesValides.join(', ')}`);
      }

      // Valider le statut
      const statutsValides = ['PLANIFIE', 'CONFIRME', 'EN_COURS', 'TERMINE', 'REPORTE', 'ANNULE'];
      if (seance.status && !statutsValides.includes(seance.status)) {
        errors.push(`Ligne ${i + 2}: Statut invalide. Valeurs acceptées: ${statutsValides.join(', ')}`);
      }

      // Valider le format de date
      try {
        new Date(seance.dateSeance);
      } catch (e) {
        errors.push(`Ligne ${i + 2}: Format de date invalide`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Erreurs de validation',
        details: errors
      });
    }

    // Créer les séances avec transaction
    const result = await prisma.$transaction(async (tx) => {
      const createdSeances = [];
      const skippedSeances = [];

      for (let i = 0; i < seancesData.length; i++) {
        const seanceData = seancesData[i];

        // Trouver le module par code
        const module = await tx.module.findUnique({
          where: { code: seanceData.moduleCode }
        });

        if (!module) {
          skippedSeances.push({
            ligne: i + 2,
            raison: `Module "${seanceData.moduleCode}" introuvable`
          });
          continue;
        }

        // Trouver l'intervenant par email
        const intervenant = await tx.intervenant.findUnique({
          where: { email: seanceData.intervenantEmail }
        });

        if (!intervenant) {
          skippedSeances.push({
            ligne: i + 2,
            raison: `Intervenant "${seanceData.intervenantEmail}" introuvable`
          });
          continue;
        }

        // Calculer la durée en minutes
        const [heureDebutH, heureDebutM] = seanceData.heureDebut.split(':').map(Number);
        const [heureFinH, heureFinM] = seanceData.heureFin.split(':').map(Number);
        const duree = (heureFinH * 60 + heureFinM) - (heureDebutH * 60 + heureDebutM);

        if (duree <= 0) {
          skippedSeances.push({
            ligne: i + 2,
            raison: 'Heure de fin doit être après heure de début'
          });
          continue;
        }

        // Créer la séance
        const seance = await tx.seance.create({
          data: {
            moduleId: module.id,
            intervenantId: intervenant.id,
            dateSeance: new Date(seanceData.dateSeance),
            heureDebut: seanceData.heureDebut,
            heureFin: seanceData.heureFin,
            duree: duree,
            typeSeance: seanceData.typeSeance,
            salle: seanceData.salle || null,
            batiment: seanceData.batiment || null,
            status: seanceData.status || 'PLANIFIE',
            notes: seanceData.notes || null,
            objectifs: seanceData.objectifs || null,
          },
        });

        createdSeances.push(seance);
      }

      // Logger l'action
      await tx.journalActivite.create({
        data: {
          action: 'CREATION',
          entite: 'Seance',
          entiteId: 'BULK_IMPORT',
          description: `Import Excel: ${createdSeances.length} séance(s) créée(s)`,
          nouvelleValeur: JSON.stringify({
            seancesCount: createdSeances.length,
            skipped: skippedSeances.length
          }),
          userId: session.user.id,
          userName: session.user.name,
        },
      });

      return {
        seances: createdSeances,
        skipped: skippedSeances
      };
    });

    // Supprimer le fichier temporaire
    fs.unlinkSync(file.filepath);

    return res.status(201).json({
      success: true,
      message: `${result.seances.length} séance(s) importée(s) avec succès`,
      data: {
        seancesCount: result.seances.length,
        skipped: result.skipped,
      },
    });

  } catch (error) {
    console.error('Erreur import Excel séances:', error);
    return res.status(500).json({
      error: error.message || 'Erreur lors de l\'importation du fichier Excel'
    });
  } finally {
    await prisma.$disconnect();
  }
}
