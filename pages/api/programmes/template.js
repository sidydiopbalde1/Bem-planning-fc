// pages/api/programmes/template.js
import xlsx from 'xlsx';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Créer un nouveau workbook
    const workbook = xlsx.utils.book_new();

    // Données d'exemple pour la feuille Programme
    const programmeData = [
      {
        code: 'L3-INFO-2024',
        name: 'Licence 3 Informatique',
        semestre: 'SEMESTRE_1',
        niveau: 'L3',
        dateDebut: '2024-10-01',
        dateFin: '2025-02-28',
        description: 'Programme de Licence 3 en Informatique'
      }
    ];

    // Données d'exemple pour la feuille Modules
    const modulesData = [
      {
        code: 'INF301',
        name: 'Programmation Orientée Objet',
        cm: 20,
        td: 15,
        tp: 10,
        tpe: 5,
        coefficient: 3,
        credits: 5,
        description: 'Introduction à la POO avec Java'
      },
      {
        code: 'INF302',
        name: 'Bases de Données Avancées',
        cm: 18,
        td: 12,
        tp: 15,
        tpe: 5,
        coefficient: 3,
        credits: 5,
        description: 'SQL avancé et optimisation'
      },
      {
        code: 'INF303',
        name: 'Génie Logiciel',
        cm: 15,
        td: 10,
        tp: 10,
        tpe: 5,
        coefficient: 2,
        credits: 4,
        description: 'Méthodes agiles et UML'
      }
    ];

    // Créer la feuille Programme
    const programmeWorksheet = xlsx.utils.json_to_sheet(programmeData);

    // Définir la largeur des colonnes pour la feuille Programme
    programmeWorksheet['!cols'] = [
      { wch: 15 }, // code
      { wch: 30 }, // name
      { wch: 15 }, // semestre
      { wch: 10 }, // niveau
      { wch: 12 }, // dateDebut
      { wch: 12 }, // dateFin
      { wch: 40 }, // description
    ];

    // Créer la feuille Modules
    const modulesWorksheet = xlsx.utils.json_to_sheet(modulesData);

    // Définir la largeur des colonnes pour la feuille Modules
    modulesWorksheet['!cols'] = [
      { wch: 12 }, // code
      { wch: 35 }, // name
      { wch: 8 },  // cm
      { wch: 8 },  // td
      { wch: 8 },  // tp
      { wch: 8 },  // tpe
      { wch: 12 }, // coefficient
      { wch: 10 }, // credits
      { wch: 40 }, // description
    ];

    // Ajouter les feuilles au workbook
    xlsx.utils.book_append_sheet(workbook, programmeWorksheet, 'Programme');
    xlsx.utils.book_append_sheet(workbook, modulesWorksheet, 'Modules');

    // Générer le buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Définir les headers pour le téléchargement
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=programme-template.xlsx');
    res.setHeader('Content-Length', buffer.length);

    // Envoyer le fichier
    res.send(buffer);

  } catch (error) {
    console.error('Erreur génération template:', error);
    return res.status(500).json({
      error: 'Erreur lors de la génération du template Excel'
    });
  }
}
