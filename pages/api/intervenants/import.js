// pages/api/intervenants/import.js
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

    // Vérifier que la feuille Intervenants existe
    if (!workbook.SheetNames.includes('Intervenants')) {
      return res.status(400).json({
        error: 'Le fichier doit contenir une feuille "Intervenants"'
      });
    }

    const intervenantsSheet = workbook.Sheets['Intervenants'];
    const intervenantsData = xlsx.utils.sheet_to_json(intervenantsSheet);

    if (!intervenantsData || intervenantsData.length === 0) {
      return res.status(400).json({ error: 'Aucun intervenant trouvé dans la feuille' });
    }

    // Vérifier si la feuille Disponibilités existe (optionnel)
    let disponibilitesData = [];
    if (workbook.SheetNames.includes('Disponibilites')) {
      const disponibilitesSheet = workbook.Sheets['Disponibilites'];
      disponibilitesData = xlsx.utils.sheet_to_json(disponibilitesSheet);
    }

    // Validation des intervenants
    const requiredFields = ['civilite', 'nom', 'prenom', 'email'];
    const errors = [];

    for (let i = 0; i < intervenantsData.length; i++) {
      const intervenant = intervenantsData[i];
      const missingFields = requiredFields.filter(field =>
        !intervenant[field] || intervenant[field].toString().trim() === ''
      );

      if (missingFields.length > 0) {
        errors.push(`Ligne ${i + 2}: Champs manquants: ${missingFields.join(', ')}`);
      }

      // Valider l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (intervenant.email && !emailRegex.test(intervenant.email)) {
        errors.push(`Ligne ${i + 2}: Email invalide: ${intervenant.email}`);
      }

      // Valider la civilité
      const civiliteValides = ['M.', 'Mme', 'Dr.', 'Pr.'];
      if (intervenant.civilite && !civiliteValides.includes(intervenant.civilite)) {
        errors.push(`Ligne ${i + 2}: Civilité invalide. Valeurs acceptées: ${civiliteValides.join(', ')}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Erreurs de validation',
        details: errors
      });
    }

    // Créer les intervenants avec transaction
    const result = await prisma.$transaction(async (tx) => {
      const createdIntervenants = [];
      const skippedIntervenants = [];
      const createdDisponibilites = [];

      for (const intervenantData of intervenantsData) {
        // Vérifier si l'email existe déjà
        const existingIntervenant = await tx.intervenant.findUnique({
          where: { email: intervenantData.email }
        });

        if (existingIntervenant) {
          skippedIntervenants.push({
            email: intervenantData.email,
            raison: 'Email déjà existant'
          });
          continue;
        }

        // Créer l'intervenant
        const intervenant = await tx.intervenant.create({
          data: {
            civilite: intervenantData.civilite,
            nom: intervenantData.nom,
            prenom: intervenantData.prenom,
            email: intervenantData.email,
            telephone: intervenantData.telephone || null,
            grade: intervenantData.grade || null,
            specialite: intervenantData.specialite || null,
            etablissement: intervenantData.etablissement || null,
            disponible: intervenantData.disponible !== undefined ?
              intervenantData.disponible === 'true' || intervenantData.disponible === true : true,
            heuresMaxJour: parseInt(intervenantData.heuresMaxJour) || 6,
            heuresMaxSemaine: parseInt(intervenantData.heuresMaxSemaine) || 20,
            joursPreferences: intervenantData.joursPreferences || null,
            creneauxPreferences: intervenantData.creneauxPreferences || null,
          },
        });

        createdIntervenants.push(intervenant);

        // Créer les disponibilités si présentes
        const disponibilitesPourIntervenant = disponibilitesData.filter(
          d => d.email === intervenantData.email
        );

        for (const dispo of disponibilitesPourIntervenant) {
          if (dispo.jourSemaine !== undefined && dispo.heureDebut && dispo.heureFin) {
            const disponibilite = await tx.disponibiliteIntervenant.create({
              data: {
                intervenantId: intervenant.id,
                jourSemaine: parseInt(dispo.jourSemaine),
                heureDebut: dispo.heureDebut.toString(),
                heureFin: dispo.heureFin.toString(),
                type: dispo.type || 'DISPONIBLE',
                recurrent: dispo.recurrent !== undefined ?
                  dispo.recurrent === 'true' || dispo.recurrent === true : true,
                dateDebut: dispo.dateDebut ? new Date(dispo.dateDebut) : null,
                dateFin: dispo.dateFin ? new Date(dispo.dateFin) : null,
              },
            });
            createdDisponibilites.push(disponibilite);
          }
        }
      }

      // Logger l'action
      await tx.journalActivite.create({
        data: {
          action: 'CREATION',
          entite: 'Intervenant',
          entiteId: 'BULK_IMPORT',
          description: `Import Excel: ${createdIntervenants.length} intervenant(s) avec ${createdDisponibilites.length} disponibilité(s)`,
          nouvelleValeur: JSON.stringify({
            intervenantsCount: createdIntervenants.length,
            disponibilitesCount: createdDisponibilites.length,
            skipped: skippedIntervenants.length
          }),
          userId: session.user.id,
          userName: session.user.name,
        },
      });

      return {
        intervenants: createdIntervenants,
        disponibilites: createdDisponibilites,
        skipped: skippedIntervenants
      };
    });

    // Supprimer le fichier temporaire
    fs.unlinkSync(file.filepath);

    return res.status(201).json({
      success: true,
      message: `${result.intervenants.length} intervenant(s) importé(s) avec succès`,
      data: {
        intervenantsCount: result.intervenants.length,
        disponibilitesCount: result.disponibilites.length,
        skipped: result.skipped,
      },
    });

  } catch (error) {
    console.error('Erreur import Excel intervenants:', error);
    return res.status(500).json({
      error: error.message || 'Erreur lors de l\'importation du fichier Excel'
    });
  } finally {
    await prisma.$disconnect();
  }
}
