# Changelog - Fonctionnalités Coordinateur

## [1.0.0] - 2025-12-10

### 🎉 Module Coordinateur Complet

Implémentation complète du module de gestion pour les coordinateurs de programmes.

---

### ✨ Fonctionnalités Implémentées

#### 1. Tableau de Bord Coordinateur

**Fichier:** `pages/coordinateur/dashboard.js`
**API:** `pages/api/coordinateur/dashboard.js`
**URL:** `/coordinateur/dashboard`

**Fonctionnalités:**
- ✅ Vue d'ensemble avec 4 cartes statistiques principales
  - Programmes (total, en cours, terminés, progression moyenne)
  - Modules (total, en cours, terminés, VHT total)
  - Séances (total avec répartition CM/TD/TP/TPE)
  - Intervenants (assignés vs non assignés)
- ✅ Cartes avec dégradés de couleur (bleu, vert, violet, orange)
- ✅ Alertes contextuelles:
  - Programmes en retard
  - Modules sans intervenant
  - Actions requises
- ✅ Section "Programmes en retard" avec liens directs
- ✅ Section "Modules sans intervenant" avec accès gestion
- ✅ Section "Modules à venir" (30 prochains jours)
- ✅ Activité récente avec journal des actions
- ✅ Graphique de progression par programme
- ✅ Statistiques VHT détaillées par type

**Statistiques calculées:**
```javascript
{
  programmesStats: { total, enCours, termines, planifies, progressionMoyenne },
  modulesStats: { total, enCours, termines, avecIntervenant, sansIntervenant, totalVHT },
  programmesEnRetard: Array,
  modulesSansIntervenant: Array,
  modulesProchains: Array,
  recentActivity: Array,
  progressionParProgramme: Array,
  vhtParType: { CM, TD, TP, TPE }
}
```

---

#### 2. Gestion des Programmes

**Fichier:** `pages/coordinateur/programmes.js`
**API:** `pages/api/coordinateur/programmes.js`, `pages/api/coordinateur/programmes/[id].js`
**URL:** `/coordinateur/programmes`

**Fonctionnalités:**
- ✅ Liste des programmes avec isolation par coordinateur
- ✅ Vue en grille responsive (1-3 colonnes selon écran)
- ✅ 4 cartes statistiques:
  - Total programmes
  - Progression moyenne
  - En cours
  - En retard
- ✅ Recherche en temps réel par code ou nom
- ✅ Filtre par statut (tous, planifié, en cours, terminé, etc.)
- ✅ Modal de création avec validation:
  - Code (unique, automatiquement en majuscules)
  - Nom, niveau, semestre
  - Dates de début et fin
  - Volume horaire total
  - Description optionnelle
- ✅ Modal d'édition pré-rempli
- ✅ Barres de progression colorées:
  - Vert (≥80%)
  - Bleu (≥50%)
  - Jaune (≥25%)
  - Gris (<25%)
- ✅ Badges de statut colorés
- ✅ Détection automatique des retards
- ✅ Bouton "Voir détails" vers page programme
- ✅ Suppression avec vérification des dépendances

---

#### 3. Page Détails Programme

**Fichier:** `pages/coordinateur/programmes/[id].js`
**URL:** `/coordinateur/programmes/[id]`

**Fonctionnalités:**
- ✅ Header avec navigation (retour, modifier, supprimer)
- ✅ Alertes contextuelles intelligentes:
  - Programme en retard (rouge)
  - Échéance proche (jaune)
  - Progression réelle vs déclarée (jaune)
  - Aucun module (info)
- ✅ Statut et coordinateur
- ✅ Barre de progression visuelle
- ✅ Comparaison progression déclarée vs réelle
- ✅ 3 cartes d'information:
  - Date de début
  - Date de fin
  - Volume horaire total
- ✅ Informations générales (niveau, semestre, description)
- ✅ Statistiques des modules:
  - Total, terminés, en cours, planifiés
  - Répartition CM, TD, TP, TPE, VHT total
- ✅ Table complète des modules:
  - Code, nom, intervenant
  - VHT, nombre de séances
  - Statut, progression
- ✅ Lien "Ajouter un module" avec pré-sélection du programme
- ✅ Modal de confirmation de suppression
- ✅ Calcul automatique de la progression réelle

**Calculs automatiques:**
```javascript
// Progression réelle basée sur modules terminés
progressionReelle = modulesTermines / totalModules * 100

// Détection de retard
enRetard = now > dateFin && progression < 100 && status !== 'TERMINE'
```

---

#### 4. Gestion des Modules

**Fichier:** `pages/coordinateur/modules.js`
**API:** `pages/api/coordinateur/modules.js`, `pages/api/coordinateur/modules/[id].js`
**URL:** `/coordinateur/modules`

**Fonctionnalités:**
- ✅ Liste complète avec isolation par coordinateur
- ✅ 6 cartes statistiques:
  - Total modules
  - VHT total
  - Terminés
  - En cours
  - Avec intervenant
  - Sans intervenant (alerte orange)
- ✅ Filtres multiples:
  - Recherche par code/nom
  - Filtre par programme
  - Filtre par statut
- ✅ Support du paramètre `?programmeId=xxx` (navigation depuis programme)
- ✅ Table détaillée avec toutes les informations:
  - Code, nom, programme
  - Intervenant (avec alerte si manquant)
  - VHT avec détail (CM:X TD:Y TP:Z)
  - Nombre de séances
  - Statut et progression
  - Actions (modifier, supprimer)
- ✅ Modal de création avec:
  - Code et nom
  - Programme (pré-sélectionné si vient de la page programme)
  - Description
  - CM, TD, TP, TPE (calcul auto VHT)
  - Coefficient et crédits ECTS
  - Intervenant (sélection ou "aucun")
  - Dates début/fin
- ✅ Modal d'édition avec champs supplémentaires:
  - Statut (PLANIFIE, EN_COURS, TERMINE, etc.)
  - Progression (slider 0-100%)
- ✅ Calcul automatique VHT: `CM + TD + TP + TPE`
- ✅ Affichage du VHT total pendant saisie
- ✅ Suppression avec vérification des séances
- ✅ Messages de succès/erreur

**Modal de module:**
- Responsive et scrollable
- Validation en temps réel
- Code converti en majuscules automatiquement
- Sélection intervenant avec liste complète
- Visual feedback du VHT calculé

---

#### 5. Système d'Alertes Email

**Fichiers:**
- `lib/email.js` - Configuration et templates
- `pages/api/coordinateur/alerts/check.js` - Vérification manuelle
- `pages/api/coordinateur/alerts/weekly-report.js` - Rapport hebdomadaire
- `pages/api/cron/daily-alerts.js` - Cron quotidien

**Documentation:** `docs/EMAIL_ALERTS.md`

**Types d'alertes:**

##### A. Programme en retard
**Déclencheur:** `dateFin < now && progression < 100% && status !== 'TERMINE'`

**Email contient:**
- Code et nom du programme
- Progression actuelle
- Date de fin dépassée
- Niveau et semestre
- Lien direct vers `/coordinateur/programmes/[id]`

**Template:** Email HTML responsive avec:
- Header rouge avec icône ⚠️
- Bloc d'information mis en évidence
- Bouton d'action vert
- Footer avec disclaimer

##### B. Module sans intervenant
**Déclencheur:** `intervenantId === null && dateDebut < now + 14 jours && status !== 'ANNULE'`

**Email contient:**
- Code et nom du module
- Programme associé
- Volume horaire (VHT, CM, TD, TP, TPE)
- Date de début
- Lien vers `/coordinateur/modules`

**Template:** Email HTML orange

##### C. Module démarrant prochainement
**Déclencheur:** `now < dateDebut < now + 7 jours && status !== 'ANNULE|TERMINE'`

**Email contient:**
- Code et nom du module
- Date de début
- Volume horaire
- Intervenant (ou alerte si manquant)
- Programme associé
- Lien vers gestion modules

**Template:** Email HTML bleu avec alerte si pas d'intervenant

##### D. Rapport hebdomadaire
**Contenu:**
- Statistiques programmes (total, en cours, terminés, progression moyenne)
- Statistiques modules (total, VHT, avec/sans intervenant)
- Alertes actives:
  - Programmes en retard
  - Modules sans intervenant
- Lien vers dashboard

**Template:** Email HTML avec tableaux de statistiques

---

### 🔧 APIs Créées

#### Dashboard
```
GET /api/coordinateur/dashboard
→ Statistiques complètes pour le coordinateur connecté
```

#### Programmes
```
GET /api/coordinateur/programmes?search=&status=
→ Liste des programmes du coordinateur

POST /api/coordinateur/programmes
→ Création d'un nouveau programme

GET /api/coordinateur/programmes/[id]
→ Détails d'un programme avec modules et statistiques

PUT /api/coordinateur/programmes/[id]
→ Modification d'un programme

DELETE /api/coordinateur/programmes/[id]
→ Suppression d'un programme (vérification dépendances)
```

#### Modules
```
GET /api/coordinateur/modules?search=&status=&programmeId=
→ Liste des modules du coordinateur

POST /api/coordinateur/modules
→ Création d'un nouveau module (VHT calculé automatiquement)

PUT /api/coordinateur/modules/[id]
→ Modification d'un module

DELETE /api/coordinateur/modules/[id]
→ Suppression d'un module (vérification séances)
```

#### Alertes
```
POST /api/coordinateur/alerts/check
Body: { type: 'all'|'delays'|'missing_instructors'|'upcoming' }
→ Vérification manuelle et envoi d'alertes

POST /api/coordinateur/alerts/weekly-report
Body: { coordinatorId?: string }  // Admin only
→ Envoi de rapports hebdomadaires

POST /api/cron/daily-alerts
Header: Authorization: Bearer CRON_SECRET
→ Exécution automatique quotidienne
```

---

### 🗂️ Fichiers Créés

| Fichier | Type | Lignes | Description |
|---------|------|--------|-------------|
| `pages/coordinateur/dashboard.js` | Frontend | ~500 | Dashboard coordinateur |
| `pages/coordinateur/programmes.js` | Frontend | ~600 | Gestion programmes |
| `pages/coordinateur/programmes/[id].js` | Frontend | ~550 | Détails programme |
| `pages/coordinateur/modules.js` | Frontend | ~800 | Gestion modules |
| `pages/api/coordinateur/dashboard.js` | API | ~175 | Stats dashboard |
| `pages/api/coordinateur/programmes.js` | API | ~180 | CRUD programmes |
| `pages/api/coordinateur/programmes/[id].js` | API | ~245 | CRUD programme individuel |
| `pages/api/coordinateur/modules.js` | API | ~181 | CRUD modules |
| `pages/api/coordinateur/modules/[id].js` | API | ~62 | CRUD module individuel |
| `pages/api/coordinateur/alerts/check.js` | API | ~235 | Vérification alertes |
| `pages/api/coordinateur/alerts/weekly-report.js` | API | ~145 | Rapport hebdomadaire |
| `pages/api/cron/daily-alerts.js` | API | ~285 | Cron quotidien |
| `lib/email.js` | Lib | ~280 | Email config + templates |
| `docs/EMAIL_ALERTS.md` | Doc | ~450 | Doc système alertes |
| `docs/COORDINATOR_FEATURES.md` | Doc | ~400 | Doc fonctionnalités |
| `CHANGELOG_COORDINATOR.md` | Doc | Ce fichier | Changelog |

**Total:** 16 fichiers, ~4500 lignes de code

---

### 🔄 Fichiers Modifiés

#### `components/layout.js`
- ✅ Ajout import icône `Layers`
- ✅ Ajout section "Coordination" (visible pour COORDINATOR et ADMIN)
- ✅ 3 liens de navigation:
  - Tableau de Bord (`/coordinateur/dashboard`)
  - Mes Programmes (`/coordinateur/programmes`)
  - Gestion des Modules (`/coordinateur/modules`)
- ✅ Couleur verte distinctive (`bg-green-50`, `text-green-700`)

---

### 🔐 Sécurité

#### Contrôle d'accès
```javascript
// Vérification du rôle
if (!['COORDINATOR', 'ADMIN'].includes(session.user.role)) {
  return res.status(403).json({ error: 'Accès non autorisé' });
}

// Isolation des données (coordinateurs)
if (session.user.role === 'COORDINATOR') {
  where.userId = session.user.id;
}

// Vérification de propriété
if (session.user.role === 'COORDINATOR' && programme.userId !== session.user.id) {
  return res.status(403).json({ error: 'Accès non autorisé' });
}
```

#### Validation des données
- ✅ Code module unique et en majuscules
- ✅ Dates cohérentes (fin > début)
- ✅ VHT > 0
- ✅ Progression 0-100%
- ✅ Coefficient et crédits ≥ 1
- ✅ Email valide pour alertes

#### Protection suppressions
- ✅ Vérification modules avant suppression programme
- ✅ Vérification séances avant suppression module
- ✅ Messages d'erreur explicites avec compteurs

---

### 📊 Journalisation

Toutes les actions sont enregistrées dans `JournalActivite`:

```javascript
{
  action: 'CREATION' | 'MODIFICATION' | 'SUPPRESSION' | 'ALERTE' | 'ALERTE_AUTO' | 'RAPPORT',
  entite: 'Programme' | 'Module' | 'Coordinateur',
  entiteId: string,
  description: string,  // Ex: "Création du module INF101 - Algorithmique"
  ancienneValeur: JSON | null,
  nouvelleValeur: JSON,
  userId: string,
  userName: string,  // "Système" pour actions automatiques
  ipAddress: string,
  userAgent: string,
  createdAt: DateTime
}
```

Consultable via `/admin/logs` par les administrateurs.

---

### 📧 Configuration Email

#### Variables d'environnement requises

```env
# SMTP Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=BEM Planning FC <noreply@bem-planning.com>

# Cron Security
CRON_SECRET=your-random-secret-here

# App URL (for links in emails)
NEXTAUTH_URL=http://localhost:3000
```

#### Services supportés
- ✅ Gmail (avec mot de passe d'application)
- ✅ SMTP personnalisé
- ✅ SendGrid
- ✅ AWS SES
- ✅ Mailgun

#### Mode développement
Si les variables EMAIL_* ne sont pas configurées, les emails sont skippés avec log:
```
Email skipped (not configured): { to, subject }
```

---

### ⏰ Automatisation (Cron Jobs)

#### Configuration recommandée

**Crontab (Linux/Mac):**
```cron
# Alertes quotidiennes à 8h00
0 8 * * * curl -X POST http://localhost:3000/api/cron/daily-alerts \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Rapports hebdomadaires (lundis à 9h00)
0 9 * * 1 curl -X POST http://localhost:3000/api/coordinateur/alerts/weekly-report \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

**Vercel Cron:**
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-alerts",
      "schedule": "0 8 * * *"
    }
  ]
}
```

**Cron-job.org:**
- URL: `https://your-domain.com/api/cron/daily-alerts`
- Schedule: `0 8 * * *`
- Header: `Authorization: Bearer CRON_SECRET`

---

### 🎨 Design et UX

#### Responsive Design
- Mobile: 1 colonne
- Tablet: 2 colonnes
- Desktop: 3-4 colonnes
- Tables avec scroll horizontal
- Modals adaptés aux petits écrans

#### Couleurs
**Programmes:**
- Bleu: Cartes programmes
- Vert: Actions positives
- Rouge: Alertes retard
- Jaune: Avertissements
- Gris: Terminé

**Modules:**
- Vert: Cartes modules
- Orange: Sans intervenant
- Violet: VHT/Séances

**Progression:**
- Vert (≥80%): Excellent
- Bleu (≥50%): Bon
- Jaune (≥25%): Attention
- Gris (<25%): Critique

#### Icônes (Lucide React)
- `BookOpen`: Programmes
- `Layers`: Modules
- `BarChart3`: Dashboard, statistiques
- `Calendar`: Dates, échéances
- `Clock`: Temps, VHT
- `User`: Intervenants
- `AlertTriangle`: Alertes
- `CheckCircle`: Succès
- `Edit2`, `Trash2`: Actions
- `Plus`: Création

---

### ⚡ Performance

#### Optimisations backend
- Requêtes Prisma optimisées avec `include` sélectifs
- Utilisation de `_count` pour compteurs
- Tri au niveau base de données
- Calculs côté serveur (stats)

#### Optimisations frontend
- Loading states appropriés
- Debouncing sur recherche (si nécessaire futur)
- Pagination visuelle
- Lazy loading des modals

---

### 🧪 Tests Recommandés

#### Test Coordinateur
1. ✅ Créer utilisateur COORDINATOR
2. ✅ Se connecter
3. ✅ Vérifier isolation (ne voit que ses données)
4. ✅ Créer programme
5. ✅ Ajouter modules
6. ✅ Tester progression
7. ✅ Tester alertes
8. ✅ Vérifier journal

#### Test Admin
1. ✅ Se connecter en ADMIN
2. ✅ Accéder au module coordinateur
3. ✅ Vérifier accès à tous les programmes
4. ✅ Tester permissions étendues

#### Test Emails
1. ✅ Configurer variables EMAIL_*
2. ✅ Créer programme en retard (dateFin passée, prog < 100%)
3. ✅ Créer module sans intervenant
4. ✅ Appeler `/api/coordinateur/alerts/check`
5. ✅ Vérifier réception emails

#### Test Cron
1. ✅ Configurer CRON_SECRET
2. ✅ Appeler `/api/cron/daily-alerts`
3. ✅ Vérifier logs et emails
4. ✅ Vérifier journal d'activités

---

### 📦 Dépendances

#### Nouvelles dépendances
```json
{
  "nodemailer": "^6.9.0"
}
```

#### Dépendances existantes utilisées
- next: ^15.5.3
- react: ^19.0.0
- next-auth: ^4.24.11
- @prisma/client: ^6.2.0
- bcrypt: ^5.1.1
- lucide-react: ^0.468.0

---

### 🐛 Bugs Connus

_Aucun bug connu à ce jour_

---

### ✅ Tâches Court Terme (Complétées)

- [x] Page détails programme (`/coordinateur/programmes/[id]`)
- [x] Interface gestion modules (`/coordinateur/modules`)
- [x] Dashboard coordinateur (`/coordinateur/dashboard`)
- [x] Système d'alertes automatiques (emails)

---

### 📋 Tâches Moyen Terme (En attente)

- [ ] Planification de séances depuis modules
- [ ] Affectation automatique d'intervenants
- [ ] Export PDF/Excel des programmes
- [ ] Rapports de progression

---

### 🎯 Statistiques

| Métrique | Valeur |
|----------|--------|
| Fichiers créés | 16 |
| Fichiers modifiés | 1 |
| Lignes de code | ~4500 |
| Endpoints API | 12 |
| Pages frontend | 4 |
| Types d'alertes | 4 |
| Templates email | 4 |
| Documentation | ~850 lignes |

---

### 🚀 Utilisation

#### Accès Coordinateur

1. Se connecter avec un compte COORDINATOR
2. Menu "Coordination" apparaît (fond vert)
3. Accéder au Dashboard pour vue d'ensemble
4. Gérer programmes via "Mes Programmes"
5. Gérer modules via "Gestion des Modules"
6. Recevoir alertes par email automatiquement

#### Flux de travail typique

1. **Créer un programme**
   - Aller sur "Mes Programmes"
   - Cliquer "Nouveau programme"
   - Remplir informations
   - Sauvegarder

2. **Ajouter des modules**
   - Depuis page détails programme: "Ajouter un module"
   - Ou depuis "Gestion des Modules": "Nouveau module"
   - Sélectionner programme
   - Remplir CM, TD, TP, TPE (VHT calculé auto)
   - Assigner intervenant (optionnel)
   - Sauvegarder

3. **Suivre progression**
   - Dashboard: vue d'ensemble
   - Page programme: détails et modules
   - Mettre à jour progression manuellement

4. **Gérer alertes**
   - Alertes automatiques par email
   - Dashboard affiche alertes actives
   - Agir sur modules sans intervenant
   - Agir sur programmes en retard

---

### 📚 Documentation Complète

- `/docs/COORDINATOR_FEATURES.md` - Fonctionnalités détaillées
- `/docs/EMAIL_ALERTS.md` - Configuration et utilisation alertes
- `CHANGELOG_COORDINATOR.md` - Ce fichier

---

### 🙏 Remerciements

Développé avec ❤️ pour BEM Planning FC

---

**Version:** 1.0.0
**Date:** 10 Décembre 2025
**Auteur:** Claude Code Assistant
