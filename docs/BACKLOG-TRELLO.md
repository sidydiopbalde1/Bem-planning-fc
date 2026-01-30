# Backlog Trello - BEM Planning FC

> **Dernière mise à jour:** 14 Janvier 2026
> **Total Cartes:** 65+

---

## SPRINT 1 - Fondations & Corrections (2 semaines)

### 🔴 P0 - Critique

---

#### BEM-001: Migration Backend vers NestJS - Setup Initial
**Labels:** `backend:nestjs` `feature` `P0 - Critique`

**Description:**
Initialiser le projet NestJS et configurer l'architecture de base pour la migration progressive du backend.

**Critères d'acceptation:**
- [ ] Projet NestJS initialisé avec structure modulaire
- [ ] Configuration Prisma intégrée
- [ ] Module Auth avec JWT configuré
- [ ] Variables d'environnement configurées
- [ ] Docker Compose pour dev environment
- [ ] Tests unitaires setup (Jest)

**Spécifications techniques:**
- **Stack:** NestJS 10+, Prisma, PostgreSQL, JWT
- **Structure:**
  ```
  src/
  ├── auth/
  ├── users/
  ├── programmes/
  ├── modules/
  ├── common/
  └── config/
  ```

**Estimation:** 8 points

---

#### BEM-002: Authentification NestJS - Guards & Strategies
**Labels:** `backend:nestjs` `module:auth` `P0 - Critique`

**Description:**
Implémenter le système d'authentification complet dans NestJS avec JWT et guards par rôle.

**Critères d'acceptation:**
- [ ] Strategy JWT configurée
- [ ] Guard AuthGuard global
- [ ] Guard RolesGuard (ADMIN, COORDINATOR, TEACHER)
- [ ] Decorator @Roles() fonctionnel
- [ ] Refresh token implémenté
- [ ] Endpoints: POST /auth/login, POST /auth/refresh, POST /auth/logout

**Spécifications techniques:**
- **Fichiers:** `src/auth/`, `src/common/guards/`
- **Dependencies:** @nestjs/passport, @nestjs/jwt, passport-jwt

**Estimation:** 5 points

---

### 🟠 P1 - Haute

---

#### BEM-003: API Programmes - CRUD NestJS
**Labels:** `backend:nestjs` `module:programmes` `P1 - Haute`

**Description:**
Migrer l'API des programmes de Next.js API Routes vers NestJS.

**Critères d'acceptation:**
- [ ] GET /programmes - Liste paginée avec filtres
- [ ] GET /programmes/:id - Détail programme
- [ ] POST /programmes - Création
- [ ] PATCH /programmes/:id - Mise à jour
- [ ] DELETE /programmes/:id - Suppression
- [ ] Validation DTO avec class-validator
- [ ] Documentation Swagger

**Spécifications techniques:**
- **Fichiers:** `src/programmes/`
- **DTOs:** CreateProgrammeDto, UpdateProgrammeDto, ProgrammeQueryDto

**Estimation:** 5 points

---

#### BEM-004: API Modules - CRUD NestJS
**Labels:** `backend:nestjs` `module:modules` `P1 - Haute`

**Description:**
Migrer l'API des modules de formation vers NestJS.

**Critères d'acceptation:**
  - [ ] GET /modules - Liste paginée avec filtres (programme, status, intervenant)
  - [ ] GET /modules/:id - Détail avec relations
  - [ ] POST /modules - Création avec validation VHT
  - [ ] PATCH /modules/:id - Mise à jour
  - [ ] DELETE /modules/:id - Suppression (vérifier séances liées)
  - [ ] PATCH /modules/:id/assign - Assigner intervenant

**Spécifications techniques:**
- **Relations:** Programme, Intervenant, Seances
- **Calculs:** VHT = CM + TD + TP + TPE

**Estimation:** 5 points

---

#### BEM-005: API Intervenants - CRUD NestJS
**Labels:** `backend:nestjs` `module:intervenants` `P1 - Haute`

**Description:**
Migrer l'API des intervenants vers NestJS.

**Critères d'acceptation:**
- [ ] GET /intervenants - Liste paginée
- [ ] GET /intervenants/:id - Détail avec modules et disponibilités
- [ ] POST /intervenants - Création
- [ ] PATCH /intervenants/:id - Mise à jour
- [ ] DELETE /intervenants/:id - Suppression
- [ ] GET /intervenants/:id/disponibilites - Créneaux disponibles
- [ ] POST /intervenants/:id/disponibilites - Ajouter disponibilité

**Estimation:** 5 points

---

#### BEM-006: API Séances - CRUD NestJS
**Labels:** `backend:nestjs` `module:seances` `P1 - Haute`

**Description:**
Migrer l'API des séances vers NestJS avec détection de conflits.

**Critères d'acceptation:**
- [ ] GET /seances - Liste avec filtres (date, module, intervenant, salle)
- [ ] GET /seances/:id - Détail
- [ ] POST /seances - Création avec vérification conflits
- [ ] PATCH /seances/:id - Mise à jour
- [ ] DELETE /seances/:id - Suppression
- [ ] PATCH /seances/:id/status - Changer statut
- [ ] GET /seances/conflicts - Liste des conflits

**Spécifications techniques:**
- **Conflits:** Chevauchement intervenant, salle, surcharge horaire

**Estimation:** 8 points

---

## SPRINT 2 - Frontend Améliorations (2 semaines)

### 🟠 P1 - Haute

---

#### BEM-007: Dashboard Coordinateur - Refonte
**Labels:** `frontend:next` `module:coordinateur` `ui/ux` `P1 - Haute`

**Description:**
Améliorer le dashboard coordinateur avec widgets interactifs et données temps réel.

**Critères d'acceptation:**
- [ ] Widget programmes en cours avec progression
- [ ] Widget alertes (modules sans intervenant, retards)
- [ ] Widget séances de la semaine
- [ ] Graphique évolution progression
- [ ] Raccourcis actions fréquentes
- [ ] Rafraîchissement automatique (polling 30s)

**Maquettes:** [Lien Figma]

**Estimation:** 8 points

---

#### BEM-008: Calendrier Planning - Vue Semaine/Mois
**Labels:** `frontend:next` `module:calendar` `ui/ux` `P1 - Haute`

**Description:**
Améliorer le calendrier de planning avec vues multiples et drag & drop.

**Critères d'acceptation:**
- [ ] Vue jour/semaine/mois switchable
- [ ] Filtres par programme, intervenant, salle
- [ ] Drag & drop pour déplacer séances
- [ ] Code couleur par type (CM, TD, TP)
- [ ] Indicateur conflits visuels
- [ ] Export PDF/iCal

**Spécifications techniques:**
- **Librairie:** react-big-calendar ou fullcalendar
- **Fichiers:** `components/calendar/`

**Estimation:** 13 points

---

#### BEM-009: Formulaire Création Séance - Modal Amélioré
**Labels:** `frontend:next` `module:seances` `ui/ux` `P1 - Haute`

**Description:**
Améliorer le modal de création de séance avec prévisualisation conflits en temps réel.

**Critères d'acceptation:**
- [ ] Sélection module avec autocomplete
- [ ] Sélection intervenant filtré par disponibilité
- [ ] Sélection salle avec capacité affichée
- [ ] Date picker avec jours fériés marqués
- [ ] Détection conflits en temps réel
- [ ] Suggestion créneaux disponibles
- [ ] Création récurrente (hebdo, bi-hebdo)

**Fichiers concernés:** `components/modals/CreateSeanceModal.js`

**Estimation:** 8 points

---

#### BEM-010: Page Intervenants - Profil Détaillé
**Labels:** `frontend:next` `module:intervenants` `enhancement` `P1 - Haute`

**Description:**
Créer une vue profil détaillé pour chaque intervenant.

**Critères d'acceptation:**
- [ ] Informations personnelles éditables
- [ ] Liste modules assignés avec progression
- [ ] Calendrier personnel des séances
- [ ] Statistiques (heures, taux présence)
- [ ] Gestion disponibilités visuelle
- [ ] Historique activités

**Estimation:** 8 points

---

### 🟡 P2 - Moyenne

---

#### BEM-011: Import Excel - Programmes & Modules
**Labels:** `frontend:next` `module:programmes` `feature` `P2 - Moyenne`

**Description:**
Améliorer l'import Excel avec prévisualisation et validation.

**Critères d'acceptation:**
- [ ] Upload fichier avec drag & drop
- [ ] Prévisualisation données avant import
- [ ] Validation ligne par ligne avec erreurs
- [ ] Mapping colonnes personnalisable
- [ ] Template téléchargeable
- [ ] Import partiel (ignorer erreurs)

**Estimation:** 8 points

---

#### BEM-012: Export Rapports - PDF Amélioré
**Labels:** `frontend:next` `feature` `P2 - Moyenne`

**Description:**
Générer des rapports PDF professionnels pour programmes et séances.

**Critères d'acceptation:**
- [ ] Rapport programme complet (modules, progression, intervenants)
- [ ] Planning séances par période
- [ ] Rapport intervenant (heures, modules)
- [ ] Mise en page professionnelle avec logo
- [ ] Export batch (plusieurs programmes)

**Spécifications techniques:**
- **Librairie:** jsPDF ou react-pdf

**Estimation:** 5 points

---

#### BEM-013: Notifications Push - Frontend
**Labels:** `frontend:next` `module:notifications` `feature` `P2 - Moyenne`

**Description:**
Implémenter les notifications en temps réel côté frontend.

**Critères d'acceptation:**
- [ ] Badge compteur non-lus dans header
- [ ] Dropdown notifications avec liste
- [ ] Marquer comme lu (individuel/tout)
- [ ] Actions rapides depuis notification
- [ ] Toast notifications pour nouvelles alertes
- [ ] Son optionnel

**Estimation:** 5 points

---

## SPRINT 3 - Fonctionnalités Avancées (2 semaines)

### 🟠 P1 - Haute

---

#### BEM-014: Évaluations - Formulaire Étudiant
**Labels:** `frontend:next` `module:evaluations` `feature` `P1 - Haute`

**Description:**
Créer le formulaire d'évaluation accessible aux étudiants via lien unique.

**Critères d'acceptation:**
- [ ] Page publique avec token unique
- [ ] Questions sur qualité cours, pédagogie, disponibilité
- [ ] Échelle notation 1-5 étoiles
- [ ] Champ commentaire optionnel
- [ ] Soumission anonyme
- [ ] Message confirmation
- [ ] Expiration token après date fin

**Fichiers:** `pages/evaluation/[token].js`

**Estimation:** 5 points

---

#### BEM-015: Évaluations - Dashboard Résultats
**Labels:** `frontend:next` `module:evaluations` `feature` `P1 - Haute`

**Description:**
Dashboard pour visualiser les résultats des campagnes d'évaluation.

**Critères d'acceptation:**
- [ ] Graphiques notes par critère
- [ ] Comparaison entre intervenants
- [ ] Évolution dans le temps
- [ ] Export résultats CSV
- [ ] Commentaires étudiants (anonymisés)
- [ ] Filtres par programme, période

**Estimation:** 8 points

---

#### BEM-016: Rotations Weekend - Calendrier Interactif
**Labels:** `frontend:next` `module:rotations` `enhancement` `P1 - Haute`

**Description:**
Améliorer la gestion des rotations weekend avec vue calendrier.

**Critères d'acceptation:**
- [ ] Vue calendrier mensuel des rotations
- [ ] Drag & drop pour réassigner
- [ ] Indicateur disponibilité responsables
- [ ] Génération automatique équitable
- [ ] Gestion substituts
- [ ] Rappels automatiques

**Estimation:** 8 points

---

#### BEM-017: Statistiques - Module Analytics
**Labels:** `frontend:next` `module:statistics` `feature` `P1 - Haute`

**Description:**
Créer un module de statistiques avancées pour le coordinateur.

**Critères d'acceptation:**
- [ ] Taux progression global
- [ ] Heures dispensées vs planifiées
- [ ] Répartition par type séance
- [ ] Performance intervenants
- [ ] Utilisation salles
- [ ] Tendances sur période
- [ ] Export rapports

**Estimation:** 13 points

---

### 🟡 P2 - Moyenne

---

#### BEM-018: Gestion Conflits - Interface Résolution
**Labels:** `frontend:next` `module:conflits` `feature` `P2 - Moyenne`

**Description:**
Interface dédiée pour visualiser et résoudre les conflits de planning.

**Critères d'acceptation:**
- [ ] Liste conflits avec filtres (type, sévérité)
- [ ] Détail conflit avec séances concernées
- [ ] Suggestions résolution automatique
- [ ] Résolution manuelle avec justification
- [ ] Historique résolutions
- [ ] Alertes nouvaux conflits

**Estimation:** 8 points

---

#### BEM-019: Résultats Étudiants - Import/Gestion
**Labels:** `frontend:next` `module:resultats` `feature` `P2 - Moyenne`

**Description:**
Module de gestion des résultats étudiants par module.

**Critères d'acceptation:**
- [ ] Import Excel notes
- [ ] Saisie manuelle notes
- [ ] Calcul automatique note finale
- [ ] Attribution mentions
- [ ] Statistiques réussite
- [ ] Export PV délibération

**Estimation:** 8 points

---

#### BEM-020: Périodes Académiques - Gestion Complète
**Labels:** `frontend:next` `module:admin` `feature` `P2 - Moyenne`

**Description:**
Interface admin pour gérer les périodes académiques.

**Critères d'acceptation:**
- [ ] CRUD périodes académiques
- [ ] Définition semestres
- [ ] Configuration vacances
- [ ] Activation/désactivation période
- [ ] Copie période précédente
- [ ] Calendrier visuel

**Estimation:** 5 points

---

## SPRINT 4 - Backend NestJS Suite (2 semaines)

### 🟠 P1 - Haute

---

#### BEM-021: API Salles - CRUD NestJS
**Labels:** `backend:nestjs` `module:admin` `P1 - Haute`

**Description:**
Migrer l'API de gestion des salles vers NestJS.

**Critères d'acceptation:**
- [ ] GET /salles - Liste avec filtres (bâtiment, capacité, disponibilité)
- [ ] GET /salles/:id - Détail salle
- [ ] POST /salles - Création
- [ ] PATCH /salles/:id - Mise à jour
- [ ] DELETE /salles/:id - Suppression
- [ ] GET /salles/:id/disponibilites - Planning salle
- [ ] GET /salles/search - Recherche par critères

**Estimation:** 3 points

---

#### BEM-022: API Évaluations - CRUD NestJS
**Labels:** `backend:nestjs` `module:evaluations` `P1 - Haute`

**Description:**
Migrer l'API des évaluations vers NestJS.

**Critères d'acceptation:**
- [ ] GET /evaluations - Liste campagnes
- [ ] POST /evaluations - Créer campagne
- [ ] POST /evaluations/:id/send - Envoyer invitations
- [ ] GET /evaluations/:id/results - Résultats
- [ ] POST /evaluation/:token - Soumettre réponse (public)
- [ ] PATCH /evaluations/:id/close - Clôturer campagne

**Estimation:** 5 points

---

#### BEM-023: API Rotations Weekend - CRUD NestJS
**Labels:** `backend:nestjs` `module:rotations` `P1 - Haute`

**Description:**
Migrer l'API des rotations weekend vers NestJS.

**Critères d'acceptation:**
- [ ] GET /rotations - Liste avec filtres
- [ ] POST /rotations/generate - Génération automatique
- [ ] PATCH /rotations/:id - Modification
- [ ] POST /rotations/:id/absence - Déclarer absence
- [ ] POST /rotations/:id/rapport - Soumettre rapport
- [ ] GET /rotations/stats - Statistiques

**Estimation:** 5 points

---

#### BEM-024: API Notifications - Service NestJS
**Labels:** `backend:nestjs` `module:notifications` `P1 - Haute`

**Description:**
Implémenter le service de notifications dans NestJS.

**Critères d'acceptation:**
- [ ] GET /notifications - Liste notifications user
- [ ] PATCH /notifications/:id/read - Marquer lu
- [ ] PATCH /notifications/read-all - Tout marquer lu
- [ ] DELETE /notifications/:id - Supprimer
- [ ] WebSocket events pour temps réel
- [ ] Service création notifications automatiques

**Spécifications techniques:**
- **WebSocket:** @nestjs/websockets, socket.io

**Estimation:** 8 points

---

#### BEM-025: Scheduler - Tâches Automatiques
**Labels:** `backend:nestjs` `feature` `P1 - Haute`

**Description:**
Implémenter un scheduler pour les tâches automatiques.

**Critères d'acceptation:**
- [ ] Rappels séances J-1
- [ ] Alertes modules sans intervenant
- [ ] Rappels rotation weekend
- [ ] Nettoyage notifications anciennes
- [ ] Calcul statistiques quotidien
- [ ] Détection conflits automatique

**Spécifications techniques:**
- **Module:** @nestjs/schedule
- **Cron expressions**

**Estimation:** 5 points

---

## SPRINT 5 - Tests & Documentation (2 semaines)

### 🟠 P1 - Haute

---

#### BEM-026: Tests Unitaires - Services NestJS
**Labels:** `backend:nestjs` `test` `P1 - Haute`

**Description:**
Écrire les tests unitaires pour tous les services NestJS.

**Critères d'acceptation:**
- [ ] Tests ProgrammesService (min 80% coverage)
- [ ] Tests ModulesService
- [ ] Tests IntervenantsService
- [ ] Tests SeancesService
- [ ] Tests AuthService
- [ ] Mocks Prisma configurés

**Estimation:** 8 points

---

#### BEM-027: Tests E2E - API Endpoints
**Labels:** `backend:nestjs` `test` `P1 - Haute`

**Description:**
Écrire les tests E2E pour les endpoints API.

**Critères d'acceptation:**
- [ ] Tests auth flow complet
- [ ] Tests CRUD programmes
- [ ] Tests CRUD modules
- [ ] Tests création séances avec conflits
- [ ] Tests permissions par rôle
- [ ] Database test isolée

**Estimation:** 8 points

---

#### BEM-028: Tests Frontend - Composants
**Labels:** `frontend:next` `test` `P1 - Haute`

**Description:**
Écrire les tests pour les composants React principaux.

**Critères d'acceptation:**
- [ ] Tests composants UI (Pagination, Modal, Table)
- [ ] Tests formulaires création
- [ ] Tests pages principales
- [ ] Mock API calls
- [ ] Snapshot tests

**Spécifications techniques:**
- **Outils:** Jest, React Testing Library

**Estimation:** 8 points

---

#### BEM-029: Documentation API - Swagger
**Labels:** `backend:nestjs` `docs` `P1 - Haute`

**Description:**
Documenter tous les endpoints API avec Swagger.

**Critères d'acceptation:**
- [ ] Swagger UI accessible /api/docs
- [ ] Tous endpoints documentés
- [ ] Schémas DTOs
- [ ] Exemples requêtes/réponses
- [ ] Tags par module
- [ ] Authentification Swagger

**Estimation:** 5 points

---

#### BEM-030: Documentation Technique - README
**Labels:** `docs` `P1 - Haute`

**Description:**
Mettre à jour la documentation technique du projet.

**Critères d'acceptation:**
- [ ] README installation complète
- [ ] Architecture documentation
- [ ] Guide contribution
- [ ] Variables environnement
- [ ] Commandes disponibles
- [ ] Troubleshooting

**Estimation:** 3 points

---

## BACKLOG - Futures Features

### 🟢 P3 - Basse (Nice-to-have)

---

#### BEM-031: Dark Mode - Amélioration
**Labels:** `frontend:next` `ui/ux` `P3 - Basse`

**Description:**
Améliorer le support du dark mode sur toutes les pages.

**Critères d'acceptation:**
- [ ] Toggle dark mode persistant
- [ ] Toutes pages compatibles
- [ ] Graphiques/calendrier adaptés
- [ ] PDF export adapté

**Estimation:** 5 points

---

#### BEM-032: PWA - Application Mobile
**Labels:** `frontend:next` `feature` `P3 - Basse`

**Description:**
Transformer l'application en PWA pour accès mobile.

**Critères d'acceptation:**
- [ ] Service Worker
- [ ] Manifest.json
- [ ] Offline support basique
- [ ] Push notifications
- [ ] Installation prompt

**Estimation:** 8 points

---

#### BEM-033: Multi-langue - i18n
**Labels:** `frontend:next` `feature` `P3 - Basse`

**Description:**
Ajouter le support multilingue (FR/EN).

**Critères d'acceptation:**
- [ ] Setup next-i18next
- [ ] Traduction pages principales
- [ ] Sélecteur langue
- [ ] Persistance préférence

**Estimation:** 8 points

---

#### BEM-034: Audit Trail - Historique Actions
**Labels:** `feature` `P3 - Basse`

**Description:**
Interface pour consulter l'historique des actions (JournalActivite).

**Critères d'acceptation:**
- [ ] Page admin historique
- [ ] Filtres par entité, action, user
- [ ] Détail changements
- [ ] Export CSV

**Estimation:** 5 points

---

#### BEM-035: Backup Automatique - Configuration
**Labels:** `backend:nestjs` `feature` `P3 - Basse`

**Description:**
Configurer les backups automatiques de la base de données.

**Critères d'acceptation:**
- [ ] Script backup quotidien
- [ ] Rotation backups (garder 7 jours)
- [ ] Stockage cloud (S3)
- [ ] Alerte échec backup

**Estimation:** 3 points

---

## BUGS CONNUS

---

#### BEM-BUG-001: Modal z-index sur certaines pages
**Labels:** `bug` `frontend:next` `P2 - Moyenne`

**Description:**
Les modals peuvent parfois apparaître derrière d'autres éléments sur certaines pages.

**Étapes reproduction:**
1. Aller sur /coordinateur/programmes
2. Ouvrir modal création
3. Le dropdown peut passer au-dessus

**Solution proposée:**
Standardiser les z-index dans tout le projet.

**Estimation:** 2 points

---

#### BEM-BUG-002: Pagination reset après action
**Labels:** `bug` `frontend:next` `P2 - Moyenne`

**Description:**
Après une action (création, suppression), la pagination revient à la page 1.

**Étapes reproduction:**
1. Aller page 3 d'une liste
2. Supprimer un élément
3. Revient page 1

**Estimation:** 2 points

---

#### BEM-BUG-003: Filtre status ne persiste pas
**Labels:** `bug` `frontend:next` `P3 - Basse`

**Description:**
Les filtres sélectionnés ne sont pas conservés lors de la navigation.

**Solution proposée:**
Utiliser URL params ou localStorage.

**Estimation:** 3 points

---

## AMÉLIORATIONS TECHNIQUES

---

#### BEM-TECH-001: Optimisation requêtes Prisma
**Labels:** `refactor` `backend:nestjs` `P2 - Moyenne`

**Description:**
Optimiser les requêtes Prisma avec select et include ciblés.

**Estimation:** 5 points

---

#### BEM-TECH-002: Cache Redis
**Labels:** `feature` `backend:nestjs` `P2 - Moyenne`

**Description:**
Implémenter du caching Redis pour les données fréquemment accédées.

**Estimation:** 5 points

---

#### BEM-TECH-003: Rate Limiting API
**Labels:** `feature` `backend:nestjs` `P2 - Moyenne`

**Description:**
Ajouter rate limiting sur les endpoints API sensibles.

**Estimation:** 3 points

---

#### BEM-TECH-004: Logging Centralisé
**Labels:** `feature` `backend:nestjs` `P2 - Moyenne`

**Description:**
Implémenter un système de logging centralisé.

**Estimation:** 3 points

---

## RÉCAPITULATIF PAR SPRINT

| Sprint | Cartes | Points | Focus |
|--------|--------|--------|-------|
| Sprint 1 | 6 | 36 | Backend NestJS - Setup & Auth |
| Sprint 2 | 7 | 55 | Frontend - Améliorations UI |
| Sprint 3 | 7 | 55 | Features Avancées |
| Sprint 4 | 5 | 26 | Backend NestJS - Suite |
| Sprint 5 | 5 | 32 | Tests & Documentation |
| Backlog | 10+ | ~50 | Features futures |

---

## COMMENT UTILISER CE BACKLOG

1. **Copier dans Trello:** Créer une carte pour chaque item BEM-XXX
2. **Ajouter les labels:** Selon le système défini dans GESTION-PROJET.md
3. **Assigner:** Attribuer les cartes aux membres de l'équipe
4. **Estimer:** Utiliser le planning poker si nécessaire
5. **Prioriser:** Ajuster selon les besoins business

---

*Généré le 14 Janvier 2026*
