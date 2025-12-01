import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConflicts() {
  console.log('============================================================');
  console.log('TEST DES CONFLITS DE PLANIFICATION');
  console.log('============================================================\n');

  // 1. Recuperer tous les conflits non resolus
  console.log('[1] CONFLITS NON RESOLUS:\n');
  const conflitsNonResolus = await prisma.conflit.findMany({
    where: { resolu: false },
    include: {
      seance1: {
        include: {
          module: true,
          intervenant: true,
        },
      },
      seance2: {
        include: {
          module: true,
          intervenant: true,
        },
      },
    },
    orderBy: [
      { severite: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  conflitsNonResolus.forEach((conflit, index) => {
    console.log(`\n--- Conflit #${index + 1} ---`);
    console.log(`Type: ${conflit.type}`);
    console.log(`Severite: ${conflit.severite}`);
    console.log(`Description: ${conflit.description}`);
    console.log(`Ressource: ${conflit.ressourceType} - ${conflit.ressourceId}`);

    console.log(`\nSeance 1:`);
    console.log(`  - Module: ${conflit.seance1.module.name}`);
    console.log(`  - Date: ${conflit.seance1.dateSeance.toLocaleDateString('fr-FR')}`);
    console.log(`  - Horaire: ${conflit.seance1.heureDebut} - ${conflit.seance1.heureFin}`);
    console.log(`  - Salle: ${conflit.seance1.salle}`);
    console.log(`  - Intervenant: ${conflit.seance1.intervenant.prenom} ${conflit.seance1.intervenant.nom}`);

    if (conflit.seance2) {
      console.log(`\nSeance 2:`);
      console.log(`  - Module: ${conflit.seance2.module.name}`);
      console.log(`  - Date: ${conflit.seance2.dateSeance.toLocaleDateString('fr-FR')}`);
      console.log(`  - Horaire: ${conflit.seance2.heureDebut} - ${conflit.seance2.heureFin}`);
      console.log(`  - Salle: ${conflit.seance2.salle}`);
      console.log(`  - Intervenant: ${conflit.seance2.intervenant.prenom} ${conflit.seance2.intervenant.nom}`);
    }
  });

  // 2. Statistiques par type de conflit
  console.log('\n\n============================================================');
  console.log('[2] STATISTIQUES PAR TYPE DE CONFLIT:\n');

  const statsByType = await prisma.conflit.groupBy({
    by: ['type'],
    _count: true,
    where: { resolu: false },
  });

  statsByType.forEach((stat) => {
    console.log(`${stat.type}: ${stat._count} conflit(s)`);
  });

  // 3. Statistiques par severite
  console.log('\n\n============================================================');
  console.log('[3] STATISTIQUES PAR SEVERITE:\n');

  const statsBySeverite = await prisma.conflit.groupBy({
    by: ['severite'],
    _count: true,
    where: { resolu: false },
  });

  const severiteOrder = ['CRITIQUE', 'HAUTE', 'MOYENNE', 'BASSE'];
  statsBySeverite
    .sort((a, b) => severiteOrder.indexOf(a.severite) - severiteOrder.indexOf(b.severite))
    .forEach((stat) => {
      console.log(`${stat.severite}: ${stat._count} conflit(s)`);
    });

  // 4. Conflits critiques necessitant une action immediate
  console.log('\n\n============================================================');
  console.log('[4] CONFLITS CRITIQUES (ACTION IMMEDIATE REQUISE):\n');

  const conflitsCritiques = await prisma.conflit.findMany({
    where: {
      resolu: false,
      severite: 'CRITIQUE',
    },
    include: {
      seance1: {
        include: {
          module: { select: { name: true } },
          intervenant: { select: { nom: true, prenom: true } },
        },
      },
      seance2: {
        include: {
          module: { select: { name: true } },
          intervenant: { select: { nom: true, prenom: true } },
        },
      },
    },
  });

  if (conflitsCritiques.length === 0) {
    console.log('Aucun conflit critique.');
  } else {
    conflitsCritiques.forEach((conflit, index) => {
      console.log(`\n[CRITIQUE ${index + 1}] ${conflit.type}`);
      console.log(`Description: ${conflit.description}`);
      console.log(`Date du conflit: ${conflit.seance1.dateSeance.toLocaleDateString('fr-FR')}`);
    });
  }

  // 5. Charge horaire des intervenants
  console.log('\n\n============================================================');
  console.log('[5] CHARGE HORAIRE DES INTERVENANTS:\n');

  const intervenants = await prisma.intervenant.findMany({
    include: {
      seances: {
        where: {
          status: {
            in: ['PLANIFIE', 'CONFIRME', 'EN_COURS'],
          },
        },
        select: {
          dateSeance: true,
          duree: true,
        },
      },
    },
  });

  intervenants.forEach((intervenant) => {
    const totalHeures = intervenant.seances.reduce((acc, seance) => acc + seance.duree, 0) / 60;
    const nbSeances = intervenant.seances.length;

    console.log(`\n${intervenant.civilite} ${intervenant.prenom} ${intervenant.nom}:`);
    console.log(`  - Nombre de seances: ${nbSeances}`);
    console.log(`  - Total heures planifiees: ${totalHeures.toFixed(1)}h`);
    console.log(`  - Max heures/semaine: ${intervenant.heuresMaxSemaine}h`);
    console.log(`  - Max heures/jour: ${intervenant.heuresMaxJour}h`);

    // Verifier les surcharges journalieres
    const seancesParJour = {};
    intervenant.seances.forEach((seance) => {
      const dateKey = seance.dateSeance.toISOString().split('T')[0];
      if (!seancesParJour[dateKey]) {
        seancesParJour[dateKey] = 0;
      }
      seancesParJour[dateKey] += seance.duree;
    });

    const joursEnSurcharge = Object.entries(seancesParJour).filter(
      ([, duree]) => duree / 60 > intervenant.heuresMaxJour
    );

    if (joursEnSurcharge.length > 0) {
      console.log(`  [ALERTE] ${joursEnSurcharge.length} jour(s) en surcharge:`);
      joursEnSurcharge.forEach(([date, duree]) => {
        console.log(`    - ${date}: ${(duree / 60).toFixed(1)}h (max: ${intervenant.heuresMaxJour}h)`);
      });
    }
  });

  // 6. Occupation des salles
  console.log('\n\n============================================================');
  console.log('[6] OCCUPATION DES SALLES:\n');

  const seancesParSalle = await prisma.seance.groupBy({
    by: ['salle'],
    _count: true,
    where: {
      salle: { not: null },
      status: { in: ['PLANIFIE', 'CONFIRME', 'EN_COURS'] },
    },
    orderBy: {
      _count: { salle: 'desc' },
    },
  });

  seancesParSalle.forEach((stat) => {
    console.log(`${stat.salle}: ${stat._count} seance(s) planifiee(s)`);
  });

  // 7. Conflits resolus (pour reference)
  console.log('\n\n============================================================');
  console.log('[7] CONFLITS RESOLUS (HISTORIQUE):\n');

  const conflitsResolus = await prisma.conflit.findMany({
    where: { resolu: true },
    select: {
      type: true,
      description: true,
      resolution: true,
      resoluLe: true,
    },
  });

  if (conflitsResolus.length === 0) {
    console.log('Aucun conflit resolu pour le moment.');
  } else {
    conflitsResolus.forEach((conflit, index) => {
      console.log(`\n[Resolu ${index + 1}] ${conflit.type}`);
      console.log(`Description: ${conflit.description}`);
      console.log(`Resolution: ${conflit.resolution}`);
      console.log(`Resolu le: ${conflit.resoluLe.toLocaleString('fr-FR')}`);
    });
  }

  // 8. Resume final
  console.log('\n\n============================================================');
  console.log('[8] RESUME FINAL:\n');

  const totalConflits = await prisma.conflit.count();
  const conflitsResolusCount = await prisma.conflit.count({ where: { resolu: true } });
  const conflitsNonResolusCount = await prisma.conflit.count({ where: { resolu: false } });
  const conflitsCritiquesCount = await prisma.conflit.count({
    where: { resolu: false, severite: 'CRITIQUE' },
  });
  const conflitsHautsCount = await prisma.conflit.count({
    where: { resolu: false, severite: 'HAUTE' },
  });

  console.log(`Total conflits: ${totalConflits}`);
  console.log(`  - Resolus: ${conflitsResolusCount}`);
  console.log(`  - Non resolus: ${conflitsNonResolusCount}`);
  console.log(`    * Critiques: ${conflitsCritiquesCount}`);
  console.log(`    * Haute severite: ${conflitsHautsCount}`);
  console.log(`    * Autres: ${conflitsNonResolusCount - conflitsCritiquesCount - conflitsHautsCount}`);

  const tauxResolution = totalConflits > 0
    ? ((conflitsResolusCount / totalConflits) * 100).toFixed(1)
    : 0;
  console.log(`\nTaux de resolution: ${tauxResolution}%`);

  console.log('\n============================================================');
  console.log('TEST TERMINE');
  console.log('============================================================\n');
}

testConflicts()
  .catch((e) => {
    console.error('\n[ERROR] Erreur pendant le test:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
