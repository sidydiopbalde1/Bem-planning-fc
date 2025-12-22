# Guide de Test - Gestion de Progression

Ce guide vous aide à tester complètement le système de gestion de progression des programmes.

## Prérequis

1. **Base de données** configurée et migrations appliquées
2. **Variables d'environnement** configurées dans `.env`
3. **Serveur** en cours d'exécution (`npm run dev`)

## Configuration Initiale

### 1. Variables d'Environnement

Vérifiez que votre fichier `.env` contient :

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/bem_planning"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=votre_secret_nextauth

# Cron Secret Key
CRON_SECRET_KEY=votre_cle_secrete_unique

# Email (optionnel pour les tests, mais nécessaire pour les notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=votre-email@gmail.com
EMAIL_PASSWORD=votre-mot-de-passe-app
EMAIL_FROM=noreply@example.com
```

### 2. Créer des Données de Test

Utilisez Prisma Studio ou créez un script de seed :

```bash
npx prisma studio
```

#### Créer un Compte Intervenant

**Étape 1 : Créer un User avec rôle TEACHER**

```sql
-- Via Prisma Studio ou directement en SQL
INSERT INTO users (id, email, name, role, password, "createdAt", "updatedAt")
VALUES (
  'test-teacher-id',
  'intervenant.test@example.com',
  'Jean Dupont',
  'TEACHER',
  '$2a$10$YourHashedPasswordHere',  -- Voir section "Générer un mot de passe" ci-dessous
  NOW(),
  NOW()
);
```

**Étape 2 : Créer un Intervenant**

```sql
INSERT INTO intervenants (id, civilite, nom, prenom, email, disponible, "createdAt", "updatedAt")
VALUES (
  'test-intervenant-id',
  'M.',
  'Dupont',
  'Jean',
  'intervenant.test@example.com',  -- Même email que le User
  true,
  NOW(),
  NOW()
);
```

**Étape 3 : Créer un Programme de Test**

```sql
INSERT INTO programmes (id, code, name, semestre, niveau, "dateDebut", "dateFin", status, progression, "totalVHT", "userId", "createdAt", "updatedAt")
VALUES (
  'test-programme-id',
  'TEST101',
  'Programme de Test',
  'SEMESTRE_1',
  'L3',
  '2024-01-01',
  '2024-06-30',
  'EN_COURS',
  0,
  120,
  'your-coordinator-user-id',  -- ID d'un User COORDINATOR existant
  NOW(),
  NOW()
);
```

**Étape 4 : Créer un Module**

```sql
INSERT INTO modules (id, code, name, cm, td, tp, tpe, vht, status, progression, "programmeId", "intervenantId", "userId", "createdAt", "updatedAt")
VALUES (
  'test-module-id',
  'INFO101',
  'Introduction à l\'Informatique',
  20,  -- CM
  15,  -- TD
  10,  -- TP
  5,   -- TPE
  50,  -- VHT total
  'EN_COURS',
  0,
  'test-programme-id',
  'test-intervenant-id',
  'your-coordinator-user-id',
  NOW(),
  NOW()
);
```

**Étape 5 : Créer des Séances (passées et futures)**

```sql
-- Séance passée non terminée (pour tester les notifications)
INSERT INTO seances (id, "dateSeance", "heureDebut", "heureFin", duree, "typeSeance", status, "moduleId", "intervenantId", "createdAt", "updatedAt")
VALUES (
  'test-seance-1',
  '2024-12-10',  -- Date passée
  '08:00',
  '10:00',
  2,
  'CM',
  'PLANIFIE',  -- Non terminée
  'test-module-id',
  'test-intervenant-id',
  NOW(),
  NOW()
);

-- Séance passée à compléter aujourd'hui
INSERT INTO seances (id, "dateSeance", "heureDebut", "heureFin", duree, "typeSeance", status, salle, "moduleId", "intervenantId", "createdAt", "updatedAt")
VALUES (
  'test-seance-2',
  CURRENT_DATE - INTERVAL '1 day',  -- Hier
  '10:00',
  '12:00',
  2,
  'TD',
  'PLANIFIE',
  'Salle A101',
  'test-module-id',
  'test-intervenant-id',
  NOW(),
  NOW()
);

-- Séance future
INSERT INTO seances (id, "dateSeance", "heureDebut", "heureFin", duree, "typeSeance", status, "moduleId", "intervenantId", "createdAt", "updatedAt")
VALUES (
  'test-seance-3',
  CURRENT_DATE + INTERVAL '7 days',  -- Dans 1 semaine
  '14:00',
  '16:00',
  2,
  'TP',
  'PLANIFIE',
  'test-module-id',
  'test-intervenant-id',
  NOW(),
  NOW()
);
```

### Générer un Mot de Passe Hashé

Pour créer un mot de passe hashé avec bcrypt :

```javascript
// Exécuter dans la console Node.js
const bcrypt = require('bcryptjs');
const password = 'Test123!';
const hash = bcrypt.hashSync(password, 10);
console.log(hash);
```

Ou utilisez ce script rapide :

```bash
node -e "console.log(require('bcryptjs').hashSync('Test123!', 10))"
```

## Tests à Effectuer

### Test 1 : Connexion Intervenant

1. **Aller sur** : `http://localhost:3000/auth/signin`
2. **Se connecter avec** :
   - Email : `intervenant.test@example.com`
   - Mot de passe : `Test123!` (ou celui que vous avez défini)
3. **Vérifier** : Vous êtes redirigé vers le dashboard

### Test 2 : Accès à l'Interface Intervenant

1. **Aller sur** : `http://localhost:3000/intervenant/mes-seances`
2. **Vérifier** :
   - ✅ La page s'affiche sans erreur
   - ✅ Les statistiques sont affichées (Total, Terminées, En retard, Heures)
   - ✅ Les séances sont listées
   - ✅ Les séances passées ont un bouton "Marquer comme terminée"
   - ✅ Une alerte orange apparaît s'il y a des séances en retard

### Test 3 : Marquer une Séance comme Terminée

1. **Sur la page** `/intervenant/mes-seances`
2. **Trouver** une séance passée non terminée
3. **Cliquer** sur "Marquer comme terminée"
4. **Confirmer** dans la popup
5. **Vérifier** :
   - ✅ Message de succès avec la progression mise à jour
   - ✅ La séance disparaît de la liste "En retard"
   - ✅ La progression du module est mise à jour
   - ✅ Le compteur de séances terminées augmente
   - ✅ La barre de progression se met à jour

### Test 4 : Vérification dans la Base de Données

Après avoir marqué une séance comme terminée :

```sql
-- Vérifier le statut de la séance
SELECT id, status, duree FROM seances WHERE id = 'test-seance-1';
-- Devrait afficher: status = 'TERMINE'

-- Vérifier la progression du module
SELECT code, progression, status FROM modules WHERE id = 'test-module-id';
-- La progression devrait être : (heures_completées / vht) * 100

-- Vérifier la progression du programme
SELECT code, progression, status FROM programmes WHERE id = 'test-programme-id';
-- La progression devrait être mise à jour

-- Vérifier le journal d'activité
SELECT * FROM journal_activites
WHERE entite = 'Seance' AND "entiteId" = 'test-seance-1'
ORDER BY "createdAt" DESC LIMIT 1;
```

### Test 5 : Filtres et Recherche

1. **Tester les filtres de statut** :
   - Tous les statuts
   - Planifiées
   - Terminées
   - En cours

2. **Tester le filtre par module**

3. **Tester "Séances passées uniquement"**

### Test 6 : Notifications - Cron Job Manuel

**Important** : Assurez-vous d'avoir au moins une séance passée non terminée (datant de plus de 2 heures).

#### Option A : Via curl

```bash
# Remplacez VOTRE_CLE par la valeur de CRON_SECRET_KEY dans .env
curl -X POST "http://localhost:3000/api/cron/check-unfinished-sessions?key=VOTRE_CLE"
```

**Réponse attendue** :
```json
{
  "success": true,
  "message": "Notifications sent for unfinished sessions",
  "stats": {
    "total": 2,
    "notified": 2,
    "failed": 0,
    "errors": []
  }
}
```

#### Option B : Via Navigateur/Postman

- **Méthode** : POST
- **URL** : `http://localhost:3000/api/cron/check-unfinished-sessions?key=VOTRE_CLE`

#### Vérifier les Résultats

1. **Vérifier les notifications créées** :
```sql
SELECT * FROM notifications
WHERE type = 'SEANCE_NON_TERMINEE'
ORDER BY "createdAt" DESC;
```

2. **Vérifier les logs du serveur** :
```
[CRON] Starting check for unfinished sessions...
[CRON] Check completed successfully: { total: 2, notified: 2, failed: 0 }
```

3. **Vérifier l'email** (si configuré) :
   - Ouvrir votre boîte email
   - Chercher un email avec le sujet : "⚠️ Séance à compléter - INFO101"

### Test 7 : Vérifier qu'on ne Notifie pas Deux Fois

1. **Exécuter le cron** une première fois
2. **Exécuter le cron** une deuxième fois immédiatement après
3. **Vérifier** :
   - La première exécution crée des notifications
   - La deuxième exécution retourne `notified: 0` (déjà notifié aujourd'hui)

### Test 8 : Progression Automatique

**Scénario** : Compléter toutes les séances d'un module pour atteindre 100%

1. **Créer un module** avec VHT = 10h
2. **Créer 5 séances** de 2h chacune
3. **Marquer progressivement** chaque séance comme terminée
4. **Vérifier après chaque complétion** :
   - Séance 1 : progression = 20%
   - Séance 2 : progression = 40%
   - Séance 3 : progression = 60%
   - Séance 4 : progression = 80%
   - Séance 5 : progression = 100%, status = 'TERMINE'

### Test 9 : Permissions

**Tester que seules les bonnes personnes peuvent compléter une séance** :

1. **Créer 3 comptes** :
   - Admin (role: ADMIN)
   - Coordinateur (role: COORDINATOR)
   - Intervenant A (role: TEACHER, email: intervenant-a@test.com)
   - Intervenant B (role: TEACHER, email: intervenant-b@test.com)

2. **Créer une séance** assignée à Intervenant A

3. **Tester avec chaque compte** :
   - ✅ Admin : Peut compléter
   - ✅ Coordinateur : Peut compléter
   - ✅ Intervenant A : Peut compléter (sa séance)
   - ❌ Intervenant B : Ne peut PAS compléter (pas sa séance)

## Scénarios Avancés

### Scénario 1 : Module Multi-Intervenants

1. Créer un module avec plusieurs séances
2. Assigner différents intervenants à différentes séances
3. Chaque intervenant complète ses séances
4. Vérifier que la progression du module prend en compte toutes les séances

### Scénario 2 : Modification de la Durée Réelle

1. Créer une séance de 2h planifiée
2. La marquer comme terminée avec durée réelle = 3h
3. Vérifier que la progression utilise la durée réelle (3h)

### Scénario 3 : Programme avec Plusieurs Modules

1. Créer un programme avec 3 modules (30h, 40h, 30h)
2. Compléter Module 1 à 100%
3. Vérifier : progression programme = 33%
4. Compléter Module 2 à 100%
5. Vérifier : progression programme = 66%
6. Compléter Module 3 à 100%
7. Vérifier : progression programme = 100%, status = 'TERMINE'

## Automatisation des Tests

### Script de Seed pour Tests

Créez `/prisma/seed-test.js` :

```javascript
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedTestData() {
  console.log('🌱 Seeding test data...');

  // Créer un coordinateur
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

  // Créer un compte intervenant
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

  // Créer l'intervenant
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
      disponible: true
    }
  });

  // Créer un programme
  const programme = await prisma.programme.create({
    data: {
      code: 'TEST-L3',
      name: 'Licence 3 Test',
      semestre: 'SEMESTRE_1',
      niveau: 'L3',
      dateDebut: new Date('2024-09-01'),
      dateFin: new Date('2025-06-30'),
      status: 'EN_COURS',
      totalVHT: 120,
      userId: coordinator.id
    }
  });

  // Créer un module
  const module = await prisma.module.create({
    data: {
      code: 'INFO-TEST',
      name: 'Module Test Informatique',
      cm: 20,
      td: 15,
      tp: 10,
      tpe: 5,
      vht: 50,
      status: 'EN_COURS',
      programmeId: programme.id,
      intervenantId: intervenant.id,
      userId: coordinator.id
    }
  });

  // Créer des séances
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const seances = await Promise.all([
    // Séance passée non terminée
    prisma.seance.create({
      data: {
        dateSeance: yesterday,
        heureDebut: '08:00',
        heureFin: '10:00',
        duree: 2,
        typeSeance: 'CM',
        status: 'PLANIFIE',
        salle: 'A101',
        moduleId: module.id,
        intervenantId: intervenant.id
      }
    }),
    // Séance à venir
    prisma.seance.create({
      data: {
        dateSeance: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        heureDebut: '14:00',
        heureFin: '16:00',
        duree: 2,
        typeSeance: 'TD',
        status: 'PLANIFIE',
        salle: 'B202',
        moduleId: module.id,
        intervenantId: intervenant.id
      }
    })
  ]);

  console.log('✅ Test data created!');
  console.log('📧 Login: prof@test.com / Test123!');
  console.log('🔗 URL: http://localhost:3000/intervenant/mes-seances');
}

seedTestData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Exécuter** :
```bash
node prisma/seed-test.js
```

## Dépannage

### Problème : "Intervenant introuvable"

**Cause** : Pas d'intervenant avec l'email de la session

**Solution** :
```sql
-- Vérifier l'email du user connecté
SELECT email FROM users WHERE role = 'TEACHER';

-- Vérifier l'email de l'intervenant
SELECT email FROM intervenants;

-- Les deux emails doivent correspondre
```

### Problème : "Unauthorized" sur le cron job

**Cause** : Mauvaise clé secrète

**Solution** :
1. Vérifier `.env` : `CRON_SECRET_KEY=votre_cle`
2. Utiliser la même clé dans l'URL : `?key=votre_cle`

### Problème : Emails non envoyés

**Cause** : Configuration email incorrecte

**Solution** :
1. Vérifier les variables EMAIL_* dans `.env`
2. Pour Gmail : utiliser un mot de passe d'application
3. Tester avec un service SMTP de test (Mailtrap, Ethereal)

### Problème : Progression ne se met pas à jour

**Cause** : Calcul incorrect ou séances non terminées

**Debug** :
```sql
-- Vérifier les heures effectuées
SELECT
  m.code,
  m.vht,
  COUNT(s.id) as total_seances,
  SUM(CASE WHEN s.status = 'TERMINE' THEN s.duree ELSE 0 END) as heures_effectuees,
  m.progression
FROM modules m
LEFT JOIN seances s ON s."moduleId" = m.id
WHERE m.id = 'your-module-id'
GROUP BY m.id;
```

## Logs Utiles

Surveiller les logs du serveur pendant les tests :

```bash
# Terminal 1 : Serveur
npm run dev

# Terminal 2 : Logs PostgreSQL (optionnel)
tail -f /var/log/postgresql/postgresql-*.log
```

**Logs attendus lors de la complétion d'une séance** :
```
POST /api/seances/xxx/complete 200 in 245ms
Journal d'activité créé: MODIFICATION - Seance
```

**Logs attendus lors du cron** :
```
[CRON] Starting check for unfinished sessions...
Email sent: xxx
[CRON] Check completed successfully
```

---

**Bon test !** 🚀

Si vous rencontrez des problèmes, consultez :
- `/docs/PROGRESSION_MANAGEMENT.md` pour la documentation complète
- Les logs du serveur pour les erreurs détaillées
- Prisma Studio pour inspecter la base de données
