// pages/api/seances/template.js
import xlsx from 'xlsx';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Créer un nouveau workbook
    const workbook = xlsx.utils.book_new();

    // Données d'exemple pour la feuille Séances
    const seancesData = [
      {
        moduleCode: 'INF301',
        intervenantEmail: 'amadou.diop@example.com',
        dateSeance: '2024-10-15',
        heureDebut: '08:00',
        heureFin: '10:00',
        typeSeance: 'CM',
        salle: 'A101',
        batiment: 'Bâtiment A',
        status: 'PLANIFIE',
        notes: 'Première séance du module',
        objectifs: 'Introduction à la POO'
      },
      {
        moduleCode: 'INF301',
        intervenantEmail: 'amadou.diop@example.com',
        dateSeance: '2024-10-17',
        heureDebut: '14:00',
        heureFin: '16:00',
        typeSeance: 'TD',
        salle: 'B205',
        batiment: 'Bâtiment B',
        status: 'PLANIFIE',
        notes: '',
        objectifs: 'Exercices pratiques POO'
      },
      {
        moduleCode: 'INF302',
        intervenantEmail: 'fatou.fall@example.com',
        dateSeance: '2024-10-16',
        heureDebut: '09:00',
        heureFin: '12:00',
        typeSeance: 'TP',
        salle: 'Labo Info 1',
        batiment: 'Bâtiment C',
        status: 'PLANIFIE',
        notes: 'Apporter ordinateur portable',
        objectifs: 'Manipulation SQL'
      },
      {
        moduleCode: 'INF303',
        intervenantEmail: 'moussa.seck@example.com',
        dateSeance: '2024-10-18',
        heureDebut: '10:00',
        heureFin: '12:00',
        typeSeance: 'CM',
        salle: 'Amphi 1',
        batiment: 'Bâtiment A',
        status: 'PLANIFIE',
        notes: '',
        objectifs: 'Introduction au Génie Logiciel'
      },
      {
        moduleCode: 'INF301',
        intervenantEmail: 'amadou.diop@example.com',
        dateSeance: '2024-12-20',
        heureDebut: '08:00',
        heureFin: '10:00',
        typeSeance: 'EXAMEN',
        salle: 'A101',
        batiment: 'Bâtiment A',
        status: 'PLANIFIE',
        notes: 'Examen final',
        objectifs: 'Évaluation des connaissances'
      }
    ];

    // Créer la feuille Séances
    const seancesWorksheet = xlsx.utils.json_to_sheet(seancesData);

    // Définir la largeur des colonnes
    seancesWorksheet['!cols'] = [
      { wch: 12 }, // moduleCode
      { wch: 30 }, // intervenantEmail
      { wch: 12 }, // dateSeance
      { wch: 12 }, // heureDebut
      { wch: 12 }, // heureFin
      { wch: 12 }, // typeSeance
      { wch: 15 }, // salle
      { wch: 15 }, // batiment
      { wch: 12 }, // status
      { wch: 35 }, // notes
      { wch: 35 }, // objectifs
    ];

    // Ajouter la feuille au workbook
    xlsx.utils.book_append_sheet(workbook, seancesWorksheet, 'Seances');

    // Ajouter une feuille d'instructions
    const instructionsData = [
      { Instructions: 'FORMAT DU FICHIER SÉANCES' },
      { Instructions: '' },
      { Instructions: 'FEUILLE "Seances" - Champs requis :' },
      { Instructions: '• moduleCode : Code du module (doit exister dans la base)' },
      { Instructions: '• intervenantEmail : Email de l\'intervenant (doit exister)' },
      { Instructions: '• dateSeance : Date au format YYYY-MM-DD' },
      { Instructions: '• heureDebut : Heure de début au format HH:MM (ex: 08:00)' },
      { Instructions: '• heureFin : Heure de fin au format HH:MM (ex: 10:00)' },
      { Instructions: '• typeSeance : CM, TD, TP, EXAMEN ou RATTRAPAGE' },
      { Instructions: '' },
      { Instructions: 'FEUILLE "Seances" - Champs optionnels :' },
      { Instructions: '• salle : Nom de la salle' },
      { Instructions: '• batiment : Nom du bâtiment' },
      { Instructions: '• status : PLANIFIE, CONFIRME, EN_COURS, TERMINE, REPORTE, ANNULE' },
      { Instructions: '• notes : Notes ou remarques sur la séance' },
      { Instructions: '• objectifs : Objectifs pédagogiques de la séance' },
      { Instructions: '' },
      { Instructions: 'TYPES DE SÉANCES :' },
      { Instructions: '• CM : Cours Magistral' },
      { Instructions: '• TD : Travaux Dirigés' },
      { Instructions: '• TP : Travaux Pratiques' },
      { Instructions: '• EXAMEN : Examen ou contrôle' },
      { Instructions: '• RATTRAPAGE : Session de rattrapage' },
      { Instructions: '' },
      { Instructions: 'STATUTS DISPONIBLES :' },
      { Instructions: '• PLANIFIE : Séance planifiée mais non confirmée' },
      { Instructions: '• CONFIRME : Séance confirmée' },
      { Instructions: '• EN_COURS : Séance en cours' },
      { Instructions: '• TERMINE : Séance terminée' },
      { Instructions: '• REPORTE : Séance reportée' },
      { Instructions: '• ANNULE : Séance annulée' },
      { Instructions: '' },
      { Instructions: 'NOTES IMPORTANTES :' },
      { Instructions: '• Le module (moduleCode) doit exister avant l\'import' },
      { Instructions: '• L\'intervenant (intervenantEmail) doit exister avant l\'import' },
      { Instructions: '• L\'heure de fin doit être après l\'heure de début' },
      { Instructions: '• La durée est calculée automatiquement' },
      { Instructions: '• Les séances avec des codes invalides seront ignorées' },
      { Instructions: '• Un rapport des séances ignorées est fourni après l\'import' },
    ];

    const instructionsWorksheet = xlsx.utils.json_to_sheet(instructionsData);
    instructionsWorksheet['!cols'] = [{ wch: 80 }];
    xlsx.utils.book_append_sheet(workbook, instructionsWorksheet, 'Instructions');

    // Générer le buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Définir les headers pour le téléchargement
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=seances-template.xlsx');
    res.setHeader('Content-Length', buffer.length);

    // Envoyer le fichier
    res.send(buffer);

  } catch (error) {
    console.error('Erreur génération template séances:', error);
    return res.status(500).json({
      error: 'Erreur lors de la génération du template Excel'
    });
  }
}
