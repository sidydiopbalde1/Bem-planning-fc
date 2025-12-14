// pages/api/intervenants/template.js
import xlsx from 'xlsx';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Créer un nouveau workbook
    const workbook = xlsx.utils.book_new();

    // Données d'exemple pour la feuille Intervenants
    const intervenantsData = [
      {
        civilite: 'Dr.',
        nom: 'DIOP',
        prenom: 'Amadou',
        email: 'amadou.diop@example.com',
        telephone: '+221771234567',
        grade: 'Maître de Conférences',
        specialite: 'Informatique',
        etablissement: 'Université Cheikh Anta Diop',
        disponible: true,
        heuresMaxJour: 6,
        heuresMaxSemaine: 20,
        joursPreferences: 'Lundi, Mercredi, Vendredi',
        creneauxPreferences: 'Matin'
      },
      {
        civilite: 'Pr.',
        nom: 'FALL',
        prenom: 'Fatou',
        email: 'fatou.fall@example.com',
        telephone: '+221771234568',
        grade: 'Professeur',
        specialite: 'Mathématiques',
        etablissement: 'ESP Dakar',
        disponible: true,
        heuresMaxJour: 8,
        heuresMaxSemaine: 24,
        joursPreferences: 'Mardi, Jeudi',
        creneauxPreferences: 'Après-midi'
      },
      {
        civilite: 'M.',
        nom: 'SECK',
        prenom: 'Moussa',
        email: 'moussa.seck@example.com',
        telephone: '+221771234569',
        grade: 'Vacataire',
        specialite: 'Gestion',
        etablissement: 'BEM',
        disponible: true,
        heuresMaxJour: 4,
        heuresMaxSemaine: 15,
        joursPreferences: 'Mercredi, Samedi',
        creneauxPreferences: 'Soir'
      }
    ];

    // Données d'exemple pour la feuille Disponibilités
    const disponibilitesData = [
      {
        email: 'amadou.diop@example.com',
        jourSemaine: 1,
        heureDebut: '08:00',
        heureFin: '12:00',
        type: 'DISPONIBLE',
        recurrent: true,
        dateDebut: '',
        dateFin: ''
      },
      {
        email: 'amadou.diop@example.com',
        jourSemaine: 3,
        heureDebut: '08:00',
        heureFin: '12:00',
        type: 'DISPONIBLE',
        recurrent: true,
        dateDebut: '',
        dateFin: ''
      },
      {
        email: 'amadou.diop@example.com',
        jourSemaine: 5,
        heureDebut: '14:00',
        heureFin: '18:00',
        type: 'PREFERENCE',
        recurrent: true,
        dateDebut: '',
        dateFin: ''
      },
      {
        email: 'fatou.fall@example.com',
        jourSemaine: 2,
        heureDebut: '09:00',
        heureFin: '17:00',
        type: 'DISPONIBLE',
        recurrent: true,
        dateDebut: '',
        dateFin: ''
      },
      {
        email: 'fatou.fall@example.com',
        jourSemaine: 4,
        heureDebut: '14:00',
        heureFin: '18:00',
        type: 'DISPONIBLE',
        recurrent: true,
        dateDebut: '',
        dateFin: ''
      },
      {
        email: 'moussa.seck@example.com',
        jourSemaine: 3,
        heureDebut: '18:00',
        heureFin: '21:00',
        type: 'DISPONIBLE',
        recurrent: true,
        dateDebut: '',
        dateFin: ''
      },
      {
        email: 'moussa.seck@example.com',
        jourSemaine: 6,
        heureDebut: '09:00',
        heureFin: '13:00',
        type: 'DISPONIBLE',
        recurrent: true,
        dateDebut: '',
        dateFin: ''
      }
    ];

    // Créer la feuille Intervenants
    const intervenantsWorksheet = xlsx.utils.json_to_sheet(intervenantsData);

    // Définir la largeur des colonnes pour la feuille Intervenants
    intervenantsWorksheet['!cols'] = [
      { wch: 10 }, // civilite
      { wch: 15 }, // nom
      { wch: 15 }, // prenom
      { wch: 30 }, // email
      { wch: 15 }, // telephone
      { wch: 25 }, // grade
      { wch: 20 }, // specialite
      { wch: 35 }, // etablissement
      { wch: 12 }, // disponible
      { wch: 15 }, // heuresMaxJour
      { wch: 18 }, // heuresMaxSemaine
      { wch: 30 }, // joursPreferences
      { wch: 25 }, // creneauxPreferences
    ];

    // Créer la feuille Disponibilités
    const disponibilitesWorksheet = xlsx.utils.json_to_sheet(disponibilitesData);

    // Définir la largeur des colonnes pour la feuille Disponibilités
    disponibilitesWorksheet['!cols'] = [
      { wch: 30 }, // email
      { wch: 12 }, // jourSemaine
      { wch: 12 }, // heureDebut
      { wch: 12 }, // heureFin
      { wch: 15 }, // type
      { wch: 12 }, // recurrent
      { wch: 12 }, // dateDebut
      { wch: 12 }, // dateFin
    ];

    // Ajouter les feuilles au workbook
    xlsx.utils.book_append_sheet(workbook, intervenantsWorksheet, 'Intervenants');
    xlsx.utils.book_append_sheet(workbook, disponibilitesWorksheet, 'Disponibilites');

    // Ajouter une feuille d'instructions
    const instructionsData = [
      { Instructions: 'FORMAT DU FICHIER' },
      { Instructions: '' },
      { Instructions: 'FEUILLE "Intervenants" - Champs requis :' },
      { Instructions: '• civilite : M., Mme, Dr., Pr.' },
      { Instructions: '• nom : Nom de famille' },
      { Instructions: '• prenom : Prénom' },
      { Instructions: '• email : Adresse email unique' },
      { Instructions: '' },
      { Instructions: 'FEUILLE "Intervenants" - Champs optionnels :' },
      { Instructions: '• telephone : Format +221XXXXXXXXX' },
      { Instructions: '• grade : Titre académique ou professionnel' },
      { Instructions: '• specialite : Domaine d\'expertise' },
      { Instructions: '• etablissement : Institution d\'origine' },
      { Instructions: '• disponible : true ou false (défaut: true)' },
      { Instructions: '• heuresMaxJour : Nombre (défaut: 6)' },
      { Instructions: '• heuresMaxSemaine : Nombre (défaut: 20)' },
      { Instructions: '• joursPreferences : Exemple: "Lundi, Mercredi"' },
      { Instructions: '• creneauxPreferences : Exemple: "Matin"' },
      { Instructions: '' },
      { Instructions: 'FEUILLE "Disponibilites" - Optionnelle :' },
      { Instructions: '• email : Doit correspondre à un email dans Intervenants' },
      { Instructions: '• jourSemaine : 1=Lundi, 2=Mardi, ..., 7=Dimanche' },
      { Instructions: '• heureDebut : Format HH:MM (ex: 08:00)' },
      { Instructions: '• heureFin : Format HH:MM (ex: 12:00)' },
      { Instructions: '• type : DISPONIBLE, INDISPONIBLE ou PREFERENCE' },
      { Instructions: '• recurrent : true (hebdomadaire) ou false (ponctuel)' },
      { Instructions: '• dateDebut : YYYY-MM-DD (optionnel, pour disponibilités ponctuelles)' },
      { Instructions: '• dateFin : YYYY-MM-DD (optionnel, pour disponibilités ponctuelles)' },
      { Instructions: '' },
      { Instructions: 'NOTES :' },
      { Instructions: '• Les lignes avec email déjà existant seront ignorées' },
      { Instructions: '• La feuille Disponibilites est optionnelle' },
      { Instructions: '• Vous pouvez ajouter les disponibilités plus tard' },
    ];

    const instructionsWorksheet = xlsx.utils.json_to_sheet(instructionsData);
    instructionsWorksheet['!cols'] = [{ wch: 80 }];
    xlsx.utils.book_append_sheet(workbook, instructionsWorksheet, 'Instructions');

    // Générer le buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Définir les headers pour le téléchargement
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=intervenants-template.xlsx');
    res.setHeader('Content-Length', buffer.length);

    // Envoyer le fichier
    res.send(buffer);

  } catch (error) {
    console.error('Erreur génération template intervenants:', error);
    return res.status(500).json({
      error: 'Erreur lors de la génération du template Excel'
    });
  }
}
