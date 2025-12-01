import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[SEED] Debut du seeding...\n');

  // ============================================================================
  // 1. NETTOYAGE DE LA BASE
  // ============================================================================
  console.log('[CLEAN] Nettoyage de la base...');
  await prisma.conflit.deleteMany({});
  await prisma.seance.deleteMany({});
  await prisma.evaluationEnseignement.deleteMany({});
  await prisma.resultatEtudiant.deleteMany({});
  await prisma.disponibiliteIntervenant.deleteMany({});
  await prisma.module.deleteMany({});
  await prisma.indicateurAcademique.deleteMany({});
  await prisma.activiteAcademique.deleteMany({});
  await prisma.programme.deleteMany({});
  await prisma.intervenant.deleteMany({});
  await prisma.salle.deleteMany({});
  await prisma.periodeAcademique.deleteMany({});
  await prisma.journalActivite.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('[OK] Base nettoyee\n');

  // ============================================================================
  // 2. CRÉATION DES UTILISATEURS
  // ============================================================================
  console.log('[CREATE] Creation des utilisateurs...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@bem.sn',
      name: 'Administrateur BEM',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const coordUser = await prisma.user.create({
    data: {
      email: 'coordinateur@bem.sn',
      name: 'Coordinateur Pedagogique',
      password: hashedPassword,
      role: 'COORDINATOR',
    },
  });

  const teacherUser = await prisma.user.create({
    data: {
      email: 'enseignant@bem.sn',
      name: 'Enseignant Test',
      password: hashedPassword,
      role: 'TEACHER',
    },
  });

  console.log('[OK] 3 utilisateurs crees\n');

  // ============================================================================
  // 3. CRÉATION DES INTERVENANTS
  // ============================================================================
  console.log('[CREATE] Creation des intervenants...');

  const intervenant1 = await prisma.intervenant.create({
    data: {
      civilite: 'Pr',
      nom: 'Diop',
      prenom: 'Amadou',
      email: 'amadou.diop@bem.sn',
      telephone: '+221 77 123 45 67',
      grade: 'Professeur',
      specialite: 'Intelligence Artificielle',
      etablissement: 'BEM',
      disponible: true,
      heuresMaxSemaine: 20,
      heuresMaxJour: 6,
      joursPreferences: JSON.stringify(['LUNDI', 'MARDI', 'MERCREDI']),
      creneauxPreferences: JSON.stringify(['MATIN']),
    },
  });

  const intervenant2 = await prisma.intervenant.create({
    data: {
      civilite: 'Dr',
      nom: 'Ndiaye',
      prenom: 'Fatou',
      email: 'fatou.ndiaye@bem.sn',
      telephone: '+221 77 234 56 78',
      grade: 'Maitre de conferences',
      specialite: 'Developpement Web',
      etablissement: 'BEM',
      disponible: true,
      heuresMaxSemaine: 18,
      heuresMaxJour: 5,
      joursPreferences: JSON.stringify(['MARDI', 'JEUDI']),
      creneauxPreferences: JSON.stringify(['APRES_MIDI']),
    },
  });

  const intervenant3 = await prisma.intervenant.create({
    data: {
      civilite: 'M.',
      nom: 'Sall',
      prenom: 'Moussa',
      email: 'moussa.sall@bem.sn',
      telephone: '+221 77 345 67 89',
      grade: 'ATER',
      specialite: 'Base de donnees',
      etablissement: 'BEM',
      disponible: true,
      heuresMaxSemaine: 15,
      heuresMaxJour: 4,
    },
  });

  // Disponibilités pour intervenant1 (Amadou Diop)
  await prisma.disponibiliteIntervenant.createMany({
    data: [
      {
        intervenantId: intervenant1.id,
        jourSemaine: 1, // Lundi
        heureDebut: '08:00',
        heureFin: '12:00',
        type: 'DISPONIBLE',
        recurrent: true,
      },
      {
        intervenantId: intervenant1.id,
        jourSemaine: 2, // Mardi
        heureDebut: '08:00',
        heureFin: '16:00',
        type: 'DISPONIBLE',
        recurrent: true,
      },
      {
        intervenantId: intervenant1.id,
        jourSemaine: 3, // Mercredi
        heureDebut: '14:00',
        heureFin: '18:00',
        type: 'INDISPONIBLE', // Indisponible l'apres-midi
        recurrent: true,
      },
    ],
  });

  console.log('[OK] 3 intervenants crees avec disponibilites\n');

  // ============================================================================
  // 4. CRÉATION DES SALLES
  // ============================================================================
  console.log('[CREATE] Creation des salles...');

  await prisma.salle.createMany({
    data: [
      {
        nom: 'Amphi A',
        batiment: 'Batiment Principal',
        capacite: 150,
        equipements: JSON.stringify(['Projecteur', 'Micro', 'Tableau interactif']),
        disponible: true,
      },
      {
        nom: 'Salle TP 01',
        batiment: 'Batiment Informatique',
        capacite: 30,
        equipements: JSON.stringify(['30 PC', 'Projecteur']),
        disponible: true,
      },
      {
        nom: 'Salle TD 12',
        batiment: 'Batiment B',
        capacite: 40,
        equipements: JSON.stringify(['Tableau blanc', 'Projecteur']),
        disponible: true,
      },
      {
        nom: 'Labo Reseau',
        batiment: 'Batiment Informatique',
        capacite: 25,
        equipements: JSON.stringify(['Switches', 'Routeurs', '25 PC']),
        disponible: false, // Indisponible (en maintenance)
      },
    ],
  });

  console.log('[OK] 4 salles creees\n');

  // ============================================================================
  // 5. CRÉATION DE LA PÉRIODE ACADÉMIQUE
  // ============================================================================
  console.log('[CREATE] Creation de la periode academique...');

  await prisma.periodeAcademique.create({
    data: {
      nom: 'Annee 2024-2025',
      annee: '2024-2025',
      debutS1: new Date('2024-10-01'),
      finS1: new Date('2025-01-31'),
      debutS2: new Date('2025-02-01'),
      finS2: new Date('2025-06-30'),
      vacancesNoel: new Date('2024-12-20'),
      finVacancesNoel: new Date('2025-01-05'),
      vacancesPaques: new Date('2025-04-15'),
      finVacancesPaques: new Date('2025-04-25'),
      active: true,
    },
  });

  console.log('[OK] Periode academique creee\n');

  // ============================================================================
  // 6. CRÉATION DES PROGRAMMES
  // ============================================================================
  console.log('[CREATE] Creation des programmes...');

  const programme1 = await prisma.programme.create({
    data: {
      code: 'L3-INFO',
      name: 'Licence 3 Informatique',
      description: 'Programme de Licence 3 en Informatique - Specialite Genie Logiciel',
      semestre: 'SEMESTRE_5',
      niveau: 'L3',
      dateDebut: new Date('2024-10-01'),
      dateFin: new Date('2025-01-31'),
      status: 'EN_COURS',
      progression: 35,
      totalVHT: 450,
      userId: adminUser.id,
    },
  });

  const programme2 = await prisma.programme.create({
    data: {
      code: 'M1-IA',
      name: 'Master 1 Intelligence Artificielle',
      description: 'Programme de Master 1 en Intelligence Artificielle',
      semestre: 'SEMESTRE_1',
      niveau: 'M1',
      dateDebut: new Date('2024-10-15'),
      dateFin: new Date('2025-02-15'),
      status: 'PLANIFIE',
      progression: 10,
      totalVHT: 380,
      userId: coordUser.id,
    },
  });

  console.log('[OK] 2 programmes crees\n');

  // ============================================================================
  // 7. CRÉATION DES MODULES
  // ============================================================================
  console.log('[CREATE] Creation des modules...');

  const module1 = await prisma.module.create({
    data: {
      code: 'INF301',
      name: 'Developpement Web Avance',
      description: 'React, Next.js, Node.js, MongoDB',
      cm: 20,
      td: 15,
      tp: 25,
      tpe: 20,
      vht: 60,
      coefficient: 3,
      credits: 6,
      status: 'EN_COURS',
      progression: 40,
      dateDebut: new Date('2024-10-15'),
      dateFin: new Date('2024-12-20'),
      programmeId: programme1.id,
      intervenantId: intervenant2.id,
      userId: adminUser.id,
    },
  });

  const module2 = await prisma.module.create({
    data: {
      code: 'INF302',
      name: 'Intelligence Artificielle',
      description: 'Machine Learning, Deep Learning, NLP',
      cm: 25,
      td: 15,
      tp: 20,
      tpe: 25,
      vht: 60,
      coefficient: 4,
      credits: 7,
      status: 'EN_COURS',
      progression: 30,
      dateDebut: new Date('2024-10-01'),
      dateFin: new Date('2024-12-15'),
      programmeId: programme1.id,
      intervenantId: intervenant1.id,
      userId: adminUser.id,
    },
  });

  const module3 = await prisma.module.create({
    data: {
      code: 'INF303',
      name: 'Base de Donnees Avancees',
      description: 'PostgreSQL, MongoDB, Optimisation',
      cm: 18,
      td: 12,
      tp: 20,
      tpe: 15,
      vht: 50,
      coefficient: 3,
      credits: 5,
      status: 'PLANIFIE',
      progression: 15,
      dateDebut: new Date('2024-11-01'),
      dateFin: new Date('2025-01-15'),
      programmeId: programme1.id,
      intervenantId: intervenant3.id,
      userId: coordUser.id,
    },
  });

  const module4 = await prisma.module.create({
    data: {
      code: 'IA401',
      name: 'Deep Learning',
      description: 'Reseaux de neurones profonds, CNN, RNN, Transformers',
      cm: 30,
      td: 20,
      tp: 30,
      tpe: 40,
      vht: 80,
      coefficient: 5,
      credits: 8,
      status: 'PLANIFIE',
      progression: 5,
      dateDebut: new Date('2024-10-20'),
      dateFin: new Date('2025-01-30'),
      programmeId: programme2.id,
      intervenantId: intervenant1.id,
      userId: coordUser.id,
    },
  });

  console.log('[OK] 4 modules crees\n');

  // ============================================================================
  // 8. CRÉATION DES SÉANCES (AVEC CONFLITS INTENTIONNELS)
  // ============================================================================
  console.log('[CREATE] Creation des seances...\n');

  // --- Seances normales ---
  const seance1 = await prisma.seance.create({
    data: {
      dateSeance: new Date('2025-11-26'), // Mercredi
      heureDebut: '08:00',
      heureFin: '10:00',
      duree: 120,
      typeSeance: 'CM',
      salle: 'Amphi A',
      batiment: 'Batiment Principal',
      status: 'CONFIRME',
      notes: 'Introduction au Machine Learning',
      objectifs: 'Comprendre les concepts de base du ML',
      moduleId: module2.id,
      intervenantId: intervenant1.id,
    },
  });

  const seance2 = await prisma.seance.create({
    data: {
      dateSeance: new Date('2025-11-26'), // Mercredi
      heureDebut: '10:30',
      heureFin: '12:30',
      duree: 120,
      typeSeance: 'TD',
      salle: 'Salle TD 12',
      batiment: 'Batiment B',
      status: 'CONFIRME',
      notes: 'Exercices React',
      objectifs: 'Maitriser les hooks React',
      moduleId: module1.id,
      intervenantId: intervenant2.id,
    },
  });

  const seance3 = await prisma.seance.create({
    data: {
      dateSeance: new Date('2025-11-27'), // Jeudi
      heureDebut: '14:00',
      heureFin: '16:00',
      duree: 120,
      typeSeance: 'TP',
      salle: 'Salle TP 01',
      batiment: 'Batiment Informatique',
      status: 'PLANIFIE',
      notes: 'TP Base de donnees',
      objectifs: 'Optimisation de requetes SQL',
      moduleId: module3.id,
      intervenantId: intervenant3.id,
    },
  });

  console.log('[OK] 3 seances normales creees');

  // --- CONFLIT 1: INTERVENANT_DOUBLE_BOOKING (CRITIQUE) ---
  console.log('\n[CONFLICT] Creation du conflit 1: Double booking intervenant...');

  const seance4_conflit = await prisma.seance.create({
    data: {
      dateSeance: new Date('2025-11-26'), // Mercredi - MEME JOUR que seance1
      heureDebut: '08:30', // Chevauchement avec seance1 (08:00-10:00)
      heureFin: '10:30',
      duree: 120,
      typeSeance: 'CM',
      salle: 'Salle TD 12', // Salle differente mais meme intervenant
      batiment: 'Batiment B',
      status: 'PLANIFIE',
      notes: 'Cours Deep Learning',
      moduleId: module4.id,
      intervenantId: intervenant1.id, // MEME INTERVENANT que seance1
    },
  });

  const conflit1 = await prisma.conflit.create({
    data: {
      type: 'INTERVENANT_DOUBLE_BOOKING',
      description: `L'intervenant Pr Amadou Diop est planifie pour deux seances en meme temps le 26/11/2025: CM Intelligence Artificielle (08:00-10:00) et CM Deep Learning (08:30-10:30)`,
      severite: 'CRITIQUE',
      seanceId1: seance1.id,
      seanceId2: seance4_conflit.id,
      ressourceType: 'INTERVENANT',
      ressourceId: intervenant1.id,
      resolu: false,
    },
  });

  console.log(`   [OK] Conflit CRITIQUE cree: ${conflit1.type} (${intervenant1.nom})`);

  // --- CONFLIT 2: SALLE_DOUBLE_BOOKING (HAUTE) ---
  console.log('\n[CONFLICT] Creation du conflit 2: Double booking salle...');

  const seance5_conflit = await prisma.seance.create({
    data: {
      dateSeance: new Date('2025-11-26'), // Mercredi - MEME JOUR que seance2
      heureDebut: '11:00', // Chevauchement avec seance2 (10:30-12:30)
      heureFin: '13:00',
      duree: 120,
      typeSeance: 'TD',
      salle: 'Salle TD 12', // MEME SALLE que seance2
      batiment: 'Batiment B',
      status: 'PLANIFIE',
      notes: 'TD Base de donnees',
      moduleId: module3.id,
      intervenantId: intervenant3.id, // Intervenant different
    },
  });

  const conflit2 = await prisma.conflit.create({
    data: {
      type: 'SALLE_DOUBLE_BOOKING',
      description: `La salle TD 12 est reservee pour deux seances en meme temps le 26/11/2025: TD React (10:30-12:30) et TD Base de donnees (11:00-13:00)`,
      severite: 'HAUTE',
      seanceId1: seance2.id,
      seanceId2: seance5_conflit.id,
      ressourceType: 'SALLE',
      ressourceId: 'Salle TD 12',
      resolu: false,
    },
  });

  console.log(`   [OK] Conflit HAUTE severite cree: ${conflit2.type} (Salle TD 12)`);

  // --- CONFLIT 3: CHEVAUCHEMENT_HORAIRE (MOYENNE) ---
  console.log('\n[CONFLICT] Creation du conflit 3: Chevauchement horaire...');

  const seance6_conflit = await prisma.seance.create({
    data: {
      dateSeance: new Date('2025-11-27'), // Jeudi - MEME JOUR que seance3
      heureDebut: '15:30', // Chevauchement partiel avec seance3 (14:00-16:00)
      heureFin: '17:30',
      duree: 120,
      typeSeance: 'TP',
      salle: 'Salle TP 01', // MEME SALLE
      batiment: 'Batiment Informatique',
      status: 'PLANIFIE',
      notes: 'TP Reseau',
      moduleId: module1.id,
      intervenantId: intervenant2.id,
    },
  });

  const conflit3 = await prisma.conflit.create({
    data: {
      type: 'CHEVAUCHEMENT_HORAIRE',
      description: `Chevauchement horaire pour la salle TP 01 le 27/11/2025: TP Base de donnees (14:00-16:00) et TP Reseau (15:30-17:30)`,
      severite: 'MOYENNE',
      seanceId1: seance3.id,
      seanceId2: seance6_conflit.id,
      ressourceType: 'SALLE',
      ressourceId: 'Salle TP 01',
      resolu: false,
    },
  });

  console.log(`   [OK] Conflit MOYENNE severite cree: ${conflit3.type}`);

  // --- CONFLIT 4: SURCHARGE_INTERVENANT (BASSE - Avertissement) ---
  console.log('\n[CONFLICT] Creation du conflit 4: Surcharge intervenant (Avertissement)...');

  // Creer plusieurs seances pour le meme jour pour l'intervenant 2
  const seance7 = await prisma.seance.create({
    data: {
      dateSeance: new Date('2025-11-28'), // Vendredi
      heureDebut: '08:00',
      heureFin: '10:00',
      duree: 120,
      typeSeance: 'CM',
      salle: 'Amphi A',
      batiment: 'Batiment Principal',
      status: 'PLANIFIE',
      moduleId: module1.id,
      intervenantId: intervenant2.id,
    },
  });

  const seance8 = await prisma.seance.create({
    data: {
      dateSeance: new Date('2025-11-28'), // Vendredi - meme jour
      heureDebut: '10:30',
      heureFin: '12:30',
      duree: 120,
      typeSeance: 'TD',
      salle: 'Salle TD 12',
      batiment: 'Batiment B',
      status: 'PLANIFIE',
      moduleId: module1.id,
      intervenantId: intervenant2.id,
    },
  });

  const seance9_surcharge = await prisma.seance.create({
    data: {
      dateSeance: new Date('2025-11-28'), // Vendredi - meme jour
      heureDebut: '14:00',
      heureFin: '17:00', // 3 heures
      duree: 180,
      typeSeance: 'TP',
      salle: 'Salle TP 01',
      batiment: 'Batiment Informatique',
      status: 'PLANIFIE',
      notes: '3eme seance de la journee',
      moduleId: module1.id,
      intervenantId: intervenant2.id, // Total: 7h dans la journee, max = 5h
    },
  });

  const conflit4 = await prisma.conflit.create({
    data: {
      type: 'SURCHARGE_INTERVENANT',
      description: `Dr Fatou Ndiaye depasse sa charge horaire maximale journaliere (5h): 7 heures planifiees le 28/11/2025`,
      severite: 'BASSE', // Avertissement
      seanceId1: seance9_surcharge.id,
      ressourceType: 'INTERVENANT',
      ressourceId: intervenant2.id,
      resolu: false,
    },
  });

  console.log(`   [OK] Conflit BASSE severite (Avertissement) cree: ${conflit4.type} (${intervenant2.nom})`);

  // --- CONFLIT 5: CONTRAINTE_CALENDAIRE (BASSE) ---
  console.log('\n[CONFLICT] Creation du conflit 5: Contrainte calendaire...');

  const seance10_calendrier = await prisma.seance.create({
    data: {
      dateSeance: new Date('2025-11-30'), // Dimanche
      heureDebut: '10:00',
      heureFin: '12:00',
      duree: 120,
      typeSeance: 'EXAMEN',
      salle: 'Amphi A',
      batiment: 'Batiment Principal',
      status: 'PLANIFIE',
      notes: 'Examen planifie un dimanche',
      moduleId: module2.id,
      intervenantId: intervenant1.id,
    },
  });

  const conflit5 = await prisma.conflit.create({
    data: {
      type: 'CONTRAINTE_CALENDAIRE',
      description: `Seance planifiee un dimanche (30/11/2025), jour normalement non ouvrable`,
      severite: 'BASSE',
      seanceId1: seance10_calendrier.id,
      ressourceType: 'CALENDRIER',
      ressourceId: 'DIMANCHE',
      resolu: false,
    },
  });

  console.log(`   [OK] Conflit BASSE severite cree: ${conflit5.type}`);

  // --- UN CONFLIT RÉSOLU (pour exemple) ---
  console.log('\n[OK] Creation d\'un conflit resolu (pour exemple)...');

  const seance11 = await prisma.seance.create({
    data: {
      dateSeance: new Date('2025-11-25'), // Mardi
      heureDebut: '14:00',
      heureFin: '16:00',
      duree: 120,
      typeSeance: 'CM',
      salle: 'Amphi A',
      batiment: 'Batiment Principal',
      status: 'REPORTE', // Reporte pour resoudre le conflit
      notes: 'Seance initialement en conflit, maintenant reportee',
      moduleId: module3.id,
      intervenantId: intervenant3.id,
    },
  });

  const seance12 = await prisma.seance.create({
    data: {
      dateSeance: new Date('2025-11-25'), // Mardi
      heureDebut: '14:00',
      heureFin: '16:00',
      duree: 120,
      typeSeance: 'TD',
      salle: 'Amphi A',
      batiment: 'Batiment Principal',
      status: 'CONFIRME',
      moduleId: module1.id,
      intervenantId: intervenant2.id,
    },
  });

  const conflitResolu = await prisma.conflit.create({
    data: {
      type: 'SALLE_DOUBLE_BOOKING',
      description: `Conflit resolu: La seance de BDD a ete reportee a une autre date`,
      severite: 'MOYENNE',
      seanceId1: seance11.id,
      seanceId2: seance12.id,
      ressourceType: 'SALLE',
      ressourceId: 'Amphi A',
      resolu: true,
      resolution: 'Seance de Base de Donnees reportee au 02/12/2025',
      resoluPar: adminUser.id,
      resoluLe: new Date(),
    },
  });

  console.log(`   [OK] Conflit RESOLU cree pour demonstration`);

  console.log('\n[OK] Toutes les seances creees (normales + conflits)\n');

  // ============================================================================
  // 9. CRÉATION D'ENTRÉES DANS LE JOURNAL D'ACTIVITÉS
  // ============================================================================
  console.log('[CREATE] Creation d\'entrees dans le journal d\'activites...');

  await prisma.journalActivite.createMany({
    data: [
      {
        action: 'CREATION',
        entite: 'Programme',
        entiteId: programme1.id,
        description: 'Creation du programme L3 Informatique',
        userId: adminUser.id,
        userName: adminUser.name,
        ipAddress: '192.168.1.100',
      },
      {
        action: 'PLANIFICATION_AUTO',
        entite: 'Module',
        entiteId: module1.id,
        description: 'Planification automatique du module Developpement Web',
        userId: coordUser.id,
        userName: coordUser.name,
        ipAddress: '192.168.1.101',
      },
      {
        action: 'RESOLUTION_CONFLIT',
        entite: 'Conflit',
        entiteId: conflitResolu.id,
        description: 'Resolution du conflit de salle - Report de seance',
        ancienneValeur: JSON.stringify({ resolu: false }),
        nouvelleValeur: JSON.stringify({ resolu: true, resolution: 'Report' }),
        userId: adminUser.id,
        userName: adminUser.name,
        ipAddress: '192.168.1.100',
      },
    ],
  });

  console.log('[OK] 3 entrees de journal creees\n');

  // ============================================================================
  // 10. DONNÉES DES TABLEAUX DE BORD ACADÉMIQUES
  // ============================================================================
  console.log('[CREATE] Creation des donnees des tableaux de bord academiques...\n');

  // Récupérer la période académique
  const periode = await prisma.periodeAcademique.findFirst({ where: { active: true } });

  // --- Activités Académiques ---
  console.log('[CREATE] Activites academiques...');
  await prisma.activiteAcademique.createMany({
    data: [
      {
        nom: 'Démarrage officiel des cours',
        description: 'Lancement du semestre 1 de l\'année académique 2024-2025',
        datePrevue: new Date('2024-10-01'),
        dateReelle: new Date('2024-10-01'),
        type: 'DEMARRAGE_COURS',
        programmeId: programme1.id,
        periodeId: periode.id,
      },
      {
        nom: 'Examens de fin de semestre',
        description: 'Examens finaux pour le semestre 1',
        datePrevue: new Date('2025-01-20'),
        dateReelle: null,
        type: 'EXAMEN',
        programmeId: programme1.id,
        periodeId: periode.id,
      },
      {
        nom: 'Conseil de classe / délibération',
        description: 'Délibération des résultats du semestre 1',
        datePrevue: new Date('2025-01-28'),
        dateReelle: null,
        type: 'DELIBERATION',
        programmeId: programme1.id,
        periodeId: periode.id,
      },
      {
        nom: 'Remise des bulletins de note',
        description: 'Distribution des bulletins aux étudiants',
        datePrevue: new Date('2025-02-05'),
        dateReelle: null,
        type: 'BULLETINS',
        programmeId: programme1.id,
        periodeId: periode.id,
      },
      {
        nom: 'Sessions de rattrapage',
        description: 'Examens de rattrapage pour le semestre 1',
        datePrevue: new Date('2025-02-15'),
        dateReelle: null,
        type: 'RATTRAPAGE',
        programmeId: programme1.id,
        periodeId: periode.id,
      },
      {
        nom: 'Démarrage officiel des cours',
        description: 'Lancement du Master 1 IA',
        datePrevue: new Date('2024-10-15'),
        dateReelle: new Date('2024-10-16'),
        type: 'DEMARRAGE_COURS',
        programmeId: programme2.id,
        periodeId: periode.id,
      },
    ],
  });
  console.log('[OK] 6 activites academiques creees');

  // --- Indicateurs Académiques ---
  console.log('[CREATE] Indicateurs academiques...');
  await prisma.indicateurAcademique.createMany({
    data: [
      {
        nom: 'Taux de réussite des étudiants',
        description: 'Pourcentage d\'étudiants ayant validé leur semestre',
        valeurCible: 75.0,
        valeurReelle: 78.5,
        periodicite: 'SEMESTRIELLE',
        methodeCalcul: '(Nb étudiants validés / Nb total étudiants inscrits) × 100',
        unite: '%',
        type: 'REUSSITE',
        programmeId: programme1.id,
        periodeId: periode.id,
        responsableId: coordUser.id,
        dateCollecte: new Date('2024-12-01'),
      },
      {
        nom: 'Taux d\'abandon des étudiants',
        description: 'Pourcentage d\'étudiants ayant abandonné le programme',
        valeurCible: 5.0,
        valeurReelle: 3.2,
        periodicite: 'SEMESTRIELLE',
        methodeCalcul: '(Nb abandons / Nb total étudiants inscrits) × 100',
        unite: '%',
        type: 'ABANDON',
        programmeId: programme1.id,
        periodeId: periode.id,
        responsableId: coordUser.id,
        dateCollecte: new Date('2024-12-01'),
      },
      {
        nom: 'Respect des échéances',
        description: 'Pourcentage d\'activités réalisées dans les délais',
        valeurCible: 95.0,
        valeurReelle: 92.0,
        periodicite: 'MENSUELLE',
        methodeCalcul: '(Nb échéances respectées / Nb échéances prévues) × 100',
        unite: '%',
        type: 'RESPECT_ECHEANCES',
        programmeId: programme1.id,
        periodeId: periode.id,
        responsableId: adminUser.id,
        dateCollecte: new Date('2024-12-01'),
      },
      {
        nom: 'Délai de traitement des vacations',
        description: 'Délai moyen pour traiter les demandes de vacation',
        valeurCible: 3.0,
        valeurReelle: 2.5,
        periodicite: 'MENSUELLE',
        methodeCalcul: 'Date de saisie KAIROS - Date de fin du cours',
        unite: 'jours',
        type: 'TRAITEMENT_VACATIONS',
        programmeId: programme1.id,
        periodeId: periode.id,
        responsableId: adminUser.id,
        dateCollecte: new Date('2024-12-01'),
      },
    ],
  });
  console.log('[OK] 4 indicateurs academiques crees');

  // --- Résultats Étudiants ---
  console.log('[CREATE] Resultats etudiants...');
  await prisma.resultatEtudiant.createMany({
    data: [
      {
        numeroEtudiant: '2021001',
        nomEtudiant: 'Sow',
        prenomEtudiant: 'Awa',
        emailEtudiant: 'awa.sow@bem.sn',
        moduleId: module1.id,
        noteCC: 14.5,
        noteExamen: 15.0,
        noteFinale: 14.75,
        statut: 'VALIDE',
        mention: 'AB',
        vhDeroule: 24,
        progressionPct: 40,
        presences: 10,
        absences: 2,
        tauxPresence: 83.33,
      },
      {
        numeroEtudiant: '2021002',
        nomEtudiant: 'Fall',
        prenomEtudiant: 'Ibrahima',
        emailEtudiant: 'ibrahima.fall@bem.sn',
        moduleId: module1.id,
        noteCC: 12.0,
        noteExamen: 13.5,
        noteFinale: 12.75,
        statut: 'VALIDE',
        mention: 'PASSABLE',
        vhDeroule: 24,
        progressionPct: 40,
        presences: 11,
        absences: 1,
        tauxPresence: 91.67,
      },
      {
        numeroEtudiant: '2021003',
        nomEtudiant: 'Ba',
        prenomEtudiant: 'Mariama',
        emailEtudiant: 'mariama.ba@bem.sn',
        moduleId: module1.id,
        noteCC: 16.0,
        noteExamen: 17.5,
        noteFinale: 16.75,
        statut: 'VALIDE',
        mention: 'TB',
        vhDeroule: 24,
        progressionPct: 40,
        presences: 12,
        absences: 0,
        tauxPresence: 100.0,
      },
      {
        numeroEtudiant: '2021004',
        nomEtudiant: 'Diallo',
        prenomEtudiant: 'Mamadou',
        emailEtudiant: 'mamadou.diallo@bem.sn',
        moduleId: module1.id,
        noteCC: 8.5,
        noteExamen: 9.0,
        noteFinale: 8.75,
        statut: 'INVALIDE',
        mention: null,
        vhDeroule: 24,
        progressionPct: 40,
        presences: 8,
        absences: 4,
        tauxPresence: 66.67,
      },
      {
        numeroEtudiant: '2021005',
        nomEtudiant: 'Ndiaye',
        prenomEtudiant: 'Khadija',
        emailEtudiant: 'khadija.ndiaye@bem.sn',
        moduleId: module1.id,
        noteCC: null,
        noteExamen: null,
        noteFinale: null,
        statut: 'ABANDONNE',
        mention: null,
        vhDeroule: 12,
        progressionPct: 20,
        presences: 5,
        absences: 7,
        tauxPresence: 41.67,
      },
      // Module 2 - IA
      {
        numeroEtudiant: '2021001',
        nomEtudiant: 'Sow',
        prenomEtudiant: 'Awa',
        emailEtudiant: 'awa.sow@bem.sn',
        moduleId: module2.id,
        noteCC: 15.0,
        noteExamen: 16.0,
        noteFinale: 15.5,
        statut: 'VALIDE',
        mention: 'B',
        vhDeroule: 18,
        progressionPct: 30,
        presences: 8,
        absences: 1,
        tauxPresence: 88.89,
      },
      {
        numeroEtudiant: '2021002',
        nomEtudiant: 'Fall',
        prenomEtudiant: 'Ibrahima',
        emailEtudiant: 'ibrahima.fall@bem.sn',
        moduleId: module2.id,
        noteCC: 13.5,
        noteExamen: 14.0,
        noteFinale: 13.75,
        statut: 'VALIDE',
        mention: 'AB',
        vhDeroule: 18,
        progressionPct: 30,
        presences: 9,
        absences: 0,
        tauxPresence: 100.0,
      },
      {
        numeroEtudiant: '2021003',
        nomEtudiant: 'Ba',
        prenomEtudiant: 'Mariama',
        emailEtudiant: 'mariama.ba@bem.sn',
        moduleId: module2.id,
        noteCC: 17.0,
        noteExamen: 18.0,
        noteFinale: 17.5,
        statut: 'VALIDE',
        mention: 'TB',
        vhDeroule: 18,
        progressionPct: 30,
        presences: 9,
        absences: 0,
        tauxPresence: 100.0,
      },
    ],
  });
  console.log('[OK] 8 resultats etudiants crees');

  // --- Évaluations d'Enseignements ---
  console.log('[CREATE] Evaluations d\'enseignements...');
  await prisma.evaluationEnseignement.createMany({
    data: [
      {
        moduleId: module1.id,
        intervenantId: intervenant2.id,
        dateEnvoi: new Date('2024-11-15'),
        dateDebut: new Date('2024-11-15'),
        dateFin: new Date('2024-11-30'),
        lienEvaluation: 'https://forms.bem.sn/eval-dev-web',
        noteQualiteCours: 8.5,
        noteQualitePedagogie: 9.0,
        noteDisponibilite: 8.0,
        noteMoyenne: 8.5,
        nombreReponses: 45,
        tauxParticipation: 90.0,
        commentaires: 'Cours très apprécié, intervenante disponible et pédagogue',
      },
      {
        moduleId: module2.id,
        intervenantId: intervenant1.id,
        dateEnvoi: new Date('2024-11-10'),
        dateDebut: new Date('2024-11-10'),
        dateFin: new Date('2024-11-25'),
        lienEvaluation: 'https://forms.bem.sn/eval-ia',
        noteQualiteCours: 9.0,
        noteQualitePedagogie: 8.5,
        noteDisponibilite: 7.5,
        noteMoyenne: 8.33,
        nombreReponses: 42,
        tauxParticipation: 84.0,
        commentaires: 'Contenu excellent mais rythme un peu rapide',
      },
    ],
  });
  console.log('[OK] 2 evaluations d\'enseignements creees\n');

  // ============================================================================
  // 11. RÉSUMÉ
  // ============================================================================
  console.log('============================================================');
  console.log('RESUME DU SEEDING');
  console.log('============================================================\n');

  const stats = {
    users: await prisma.user.count(),
    intervenants: await prisma.intervenant.count(),
    salles: await prisma.salle.count(),
    periodesAcademiques: await prisma.periodeAcademique.count(),
    programmes: await prisma.programme.count(),
    modules: await prisma.module.count(),
    seances: await prisma.seance.count(),
    conflits: await prisma.conflit.count(),
    conflitsResolus: await prisma.conflit.count({ where: { resolu: true } }),
    conflitsNonResolus: await prisma.conflit.count({ where: { resolu: false } }),
    journalActivites: await prisma.journalActivite.count(),
    activitesAcademiques: await prisma.activiteAcademique.count(),
    indicateursAcademiques: await prisma.indicateurAcademique.count(),
    resultatsEtudiants: await prisma.resultatEtudiant.count(),
    evaluationsEnseignements: await prisma.evaluationEnseignement.count(),
  };

  console.log(`Utilisateurs: ${stats.users}`);
  console.log(`Intervenants: ${stats.intervenants}`);
  console.log(`Salles: ${stats.salles}`);
  console.log(`Periodes academiques: ${stats.periodesAcademiques}`);
  console.log(`Programmes: ${stats.programmes}`);
  console.log(`Modules: ${stats.modules}`);
  console.log(`Seances: ${stats.seances}`);
  console.log(`Conflits totaux: ${stats.conflits}`);
  console.log(`  - Resolus: ${stats.conflitsResolus}`);
  console.log(`  - Non resolus: ${stats.conflitsNonResolus}`);
  console.log(`Entrees journal: ${stats.journalActivites}`);
  console.log(`\nTABLEAUX DE BORD ACADEMIQUES:`);
  console.log(`Activites academiques: ${stats.activitesAcademiques}`);
  console.log(`Indicateurs academiques: ${stats.indicateursAcademiques}`);
  console.log(`Resultats etudiants: ${stats.resultatsEtudiants}`);
  console.log(`Evaluations enseignements: ${stats.evaluationsEnseignements}\n`);

  console.log('============================================================');
  console.log('TYPES DE CONFLITS CREES:');
  console.log('============================================================\n');

  const conflitsByType = await prisma.conflit.groupBy({
    by: ['type', 'severite'],
    _count: true,
    where: { resolu: false },
  });

  conflitsByType.forEach((c) => {
    console.log(`[${c.severite}] ${c.type}: ${c._count} conflit(s)`);
  });

  console.log('\n============================================================');
  console.log('IDENTIFIANTS DE CONNEXION:');
  console.log('============================================================\n');
  console.log('Admin:');
  console.log('  Email: admin@bem.sn');
  console.log('  Password: password123\n');
  console.log('Coordinateur:');
  console.log('  Email: coordinateur@bem.sn');
  console.log('  Password: password123\n');
  console.log('Enseignant:');
  console.log('  Email: enseignant@bem.sn');
  console.log('  Password: password123\n');

  console.log('============================================================');
  console.log('SEEDING TERMINE AVEC SUCCES!');
  console.log('============================================================\n');
}

main()
  .catch((e) => {
    console.error('\n[ERROR] Erreur pendant le seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
