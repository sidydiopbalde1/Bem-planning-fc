// prisma/seed-test.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedTestData() {
  console.log('🌱 Création des données de test...\n');

  try {
    // 1. Créer un coordinateur
    console.log('👤 Création du coordinateur...');
    const coordinator = await prisma.user.upsert({
      where: { email: 'coord@test.com' },
      update: {},
      create: {
        email: 'coord@test.com',
        name: 'Coordinateur Test',
        role: 'COORDINATOR',
        password: await bcrypt.hash('Test123!', 10)
      }
    });
    console.log('   ✅ Coordinateur créé:', coordinator.email);

    // 2. Créer un compte intervenant (User)
    console.log('\n👨‍🏫 Création du compte intervenant...');
    const teacherUser = await prisma.user.upsert({
      where: { email: 'prof@test.com' },
      update: {},
      create: {
        email: 'prof@test.com',
        name: 'Prof Test',
        role: 'TEACHER',
        password: await bcrypt.hash('Test123!', 10)
      }
    });
    console.log('   ✅ User créé:', teacherUser.email);

    // 3. Créer l'intervenant
    const intervenant = await prisma.intervenant.upsert({
      where: { email: 'prof@test.com' },
      update: {},
      create: {
        civilite: 'M.',
        nom: 'Test',
        prenom: 'Professeur',
        email: 'prof@test.com',
        telephone: '0123456789',
        grade: 'Maître de conférences',
        specialite: 'Informatique',
        etablissement: 'Université Test',
        disponible: true
      }
    });
    console.log('   ✅ Intervenant créé:', intervenant.prenom, intervenant.nom);

    // 4. Créer un programme
    console.log('\n📚 Création du programme...');
    const programme = await prisma.programme.create({
      data: {
        code: 'TEST-L3',
        name: 'Licence 3 Informatique Test',
        semestre: 'SEMESTRE_1',
        niveau: 'L3',
        description: 'Programme de test pour la gestion de progression',
        dateDebut: new Date('2024-09-01'),
        dateFin: new Date('2025-06-30'),
        status: 'EN_COURS',
        progression: 0,
        totalVHT: 120,
        userId: coordinator.id
      }
    });
    console.log('   ✅ Programme créé:', programme.code, '-', programme.name);

    // 5. Créer des modules
    console.log('\n📖 Création des modules...');
    const module1 = await prisma.module.create({
      data: {
        code: 'INFO-TEST-101',
        name: 'Introduction à la Programmation',
        description: 'Module de test pour les bases de la programmation',
        cm: 20,
        td: 15,
        tp: 10,
        tpe: 5,
        vht: 50,
        coefficient: 2,
        credits: 5,
        status: 'EN_COURS',
        progression: 0,
        programmeId: programme.id,
        intervenantId: intervenant.id,
        userId: coordinator.id
      }
    });
    console.log('   ✅ Module 1:', module1.code, '-', module1.name);

    const module2 = await prisma.module.create({
      data: {
        code: 'INFO-TEST-102',
        name: 'Algorithmique Avancée',
        description: 'Module de test pour algorithmique',
        cm: 15,
        td: 10,
        tp: 15,
        tpe: 0,
        vht: 40,
        coefficient: 2,
        credits: 4,
        status: 'PLANIFIE',
        progression: 0,
        programmeId: programme.id,
        intervenantId: intervenant.id,
        userId: coordinator.id
      }
    });
    console.log('   ✅ Module 2:', module2.code, '-', module2.name);

    // 6. Créer des séances
    console.log('\n📅 Création des séances...');
    const now = new Date();

    // Séance passée d'il y a 3 jours (non terminée - pour test notification)
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const seance1 = await prisma.seance.create({
      data: {
        dateSeance: threeDaysAgo,
        heureDebut: '08:00',
        heureFin: '10:00',
        duree: 2,
        typeSeance: 'CM',
        status: 'PLANIFIE',
        salle: 'A101',
        batiment: 'Bâtiment A',
        notes: 'Séance de test - passée non terminée',
        moduleId: module1.id,
        intervenantId: intervenant.id
      }
    });
    console.log('   ✅ Séance 1 (passée, non terminée):', seance1.dateSeance.toISOString().split('T')[0], seance1.heureDebut);

    // Séance d'hier (non terminée)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const seance2 = await prisma.seance.create({
      data: {
        dateSeance: yesterday,
        heureDebut: '10:00',
        heureFin: '12:00',
        duree: 2,
        typeSeance: 'TD',
        status: 'PLANIFIE',
        salle: 'B202',
        batiment: 'Bâtiment B',
        notes: 'Séance de test - hier',
        moduleId: module1.id,
        intervenantId: intervenant.id
      }
    });
    console.log('   ✅ Séance 2 (hier, non terminée):', seance2.dateSeance.toISOString().split('T')[0], seance2.heureDebut);

    // Séance terminée (pour voir la progression)
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const seance3 = await prisma.seance.create({
      data: {
        dateSeance: twoDaysAgo,
        heureDebut: '14:00',
        heureFin: '16:00',
        duree: 2,
        typeSeance: 'CM',
        status: 'TERMINE',
        salle: 'C303',
        batiment: 'Bâtiment C',
        notes: 'Séance terminée - exemple',
        moduleId: module1.id,
        intervenantId: intervenant.id
      }
    });
    console.log('   ✅ Séance 3 (terminée):', seance3.dateSeance.toISOString().split('T')[0], seance3.heureDebut);

    // Séance aujourd'hui
    const seance4 = await prisma.seance.create({
      data: {
        dateSeance: now,
        heureDebut: '08:00',
        heureFin: '10:00',
        duree: 2,
        typeSeance: 'TP',
        status: 'EN_COURS',
        salle: 'D404',
        batiment: 'Bâtiment D',
        moduleId: module1.id,
        intervenantId: intervenant.id
      }
    });
    console.log('   ✅ Séance 4 (aujourd\'hui, en cours):', seance4.dateSeance.toISOString().split('T')[0], seance4.heureDebut);

    // Séances à venir
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const seance5 = await prisma.seance.create({
      data: {
        dateSeance: nextWeek,
        heureDebut: '14:00',
        heureFin: '16:00',
        duree: 2,
        typeSeance: 'TD',
        status: 'PLANIFIE',
        salle: 'A101',
        moduleId: module1.id,
        intervenantId: intervenant.id
      }
    });
    console.log('   ✅ Séance 5 (semaine prochaine):', seance5.dateSeance.toISOString().split('T')[0], seance5.heureDebut);

    // Séances pour module 2
    const seance6 = await prisma.seance.create({
      data: {
        dateSeance: nextWeek,
        heureDebut: '10:00',
        heureFin: '12:00',
        duree: 2,
        typeSeance: 'CM',
        status: 'PLANIFIE',
        salle: 'B202',
        moduleId: module2.id,
        intervenantId: intervenant.id
      }
    });
    console.log('   ✅ Séance 6 (module 2):', seance6.dateSeance.toISOString().split('T')[0], seance6.heureDebut);

    // Mettre à jour la progression du module 1 (1 séance terminée sur 50h = 4%)
    await prisma.module.update({
      where: { id: module1.id },
      data: { progression: 4 }
    });

    console.log('\n✨ Données de test créées avec succès!\n');
    console.log('━'.repeat(60));
    console.log('📋 INFORMATIONS DE CONNEXION');
    console.log('━'.repeat(60));
    console.log('\n🔐 Compte Intervenant:');
    console.log('   Email    :', 'prof@test.com');
    console.log('   Mot de passe:', 'Test123!');
    console.log('   URL      :', 'http://localhost:3000/intervenant/mes-seances');

    console.log('\n🔐 Compte Coordinateur:');
    console.log('   Email    :', 'coord@test.com');
    console.log('   Mot de passe:', 'Test123!');

    console.log('\n📊 Statistiques:');
    console.log('   Programmes :', '1');
    console.log('   Modules    :', '2');
    console.log('   Séances    :', '6 (dont 2 non terminées passées)');

    console.log('\n🧪 Tests à effectuer:');
    console.log('   1. Se connecter avec prof@test.com');
    console.log('   2. Aller sur /intervenant/mes-seances');
    console.log('   3. Marquer une séance passée comme terminée');
    console.log('   4. Vérifier la mise à jour de la progression');
    console.log('   5. Tester le cron job pour les notifications');

    console.log('\n📧 Test Cron Job (notifications):');
    console.log('   curl -X POST "http://localhost:3000/api/cron/check-unfinished-sessions?key=VOTRE_CLE"');

    console.log('\n' + '━'.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Erreur lors de la création des données:', error);
    throw error;
  }
}

seedTestData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
