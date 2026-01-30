# BEM PLANNING - Système de Planification Académique

  Pour le CD, ajoutez ces secrets dans Settings > Secrets :
  - STAGING_HOST, STAGING_USER, STAGING_SSH_KEY
  - PRODUCTION_HOST, PRODUCTION_USER, PRODUCTION_SSH_KEY
  - SLACK_WEBHOOK_URL (optionnel)
  
> Gestion automatisée de l'emploi du temps et détection des conflits pour l'enseignement supérieur

---

## Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Acteurs et Fonctionnalités](#acteurs-et-fonctionnalités)
- [Types de Conflits Détectés](#types-de-conflits-détectés)
- [Technologies](#technologies)
- [Installation](#installation)
- [Documentation](#documentation)

---

## Vue d'ensemble

**BEM Planning** est une plateforme web complète de gestion automatisée de la planification académique pour l'établissement BEM (Business Et Management). Le système permet d'optimiser l'allocation des ressources pédagogiques (intervenants, salles, créneaux horaires), de détecter et résoudre automatiquement les conflits de planification.

### Chiffres clés

- **1 200 étudiants** répartis sur 5 niveaux (L1 à M2)
- **15 programmes** de formation (licences et masters)
- **80 intervenants** (enseignants permanents et vacataires)
- **45 modules** d'enseignement par semestre
- **25 salles** de cours
- **2 semestres** académiques par année

### Objectifs principaux

- Réduction de **70%** du temps de planification
- **100%** des conflits détectés automatiquement
- Réduction de **90%** des conflits non détectés en cours de semestre
- Amélioration significative de l'expérience utilisateur pour tous les acteurs

---

## 🎉 Nouvelles Fonctionnalités (Décembre 2025)

### ✅ Gestion Complète des Utilisateurs (Administrateur)

L'interface d'administration a été entièrement développée avec les fonctionnalités suivantes :

- **Interface Web Moderne** - Page `/admin/users` avec design responsive et mode sombre
- **CRUD Complet** - Création, lecture, modification et suppression des utilisateurs
- **Middleware de Sécurité** - Autorisation basée sur les rôles (requireAdmin, requireCoordinator)
- **Recherche et Filtres** - Recherche par nom/email et filtrage par rôle
- **Statistiques en Temps Réel** - Nombre total d'utilisateurs par rôle
- **Journal d'Activités** - Logging automatique de toutes les actions admin
- **Validations Avancées** - Protection contre l'auto-suppression et le dernier admin

**Accès rapide :** Menu latéral > Section "Administration" > "Gestion des Utilisateurs"

📚 **Documentation complète :**
- [Guide de Démarrage Rapide](./docs/ADMIN_QUICKSTART.md) - Configuration en 5 minutes
- [Documentation Technique](./docs/ADMIN_FEATURES.md) - Détails complets de l'implémentation

### ✅ Campagnes d'Évaluation et Notifications (Coordinateur)

Un système complet de gestion des évaluations et notifications a été implémenté :

#### 📊 Campagnes d'Évaluation
- **Interface de Gestion** - Page `/coordinateur/evaluations` avec tableau de bord statistiques
- **Création de Campagnes** - Formulaire de création avec sélection module/intervenant
- **Génération de Liens** - Liens d'évaluation uniques générés automatiquement
- **Gestion du Cycle de Vie** - États: Brouillon → Envoyée → En cours → Terminée
- **Statistiques Détaillées** - Taux de participation, nombre de réponses, notes moyennes
- **Envoi Automatique** - Notification email aux intervenants lors de l'envoi

#### 🔔 Système de Notifications
- **Notifications en Temps Réel** - Badge dans le menu avec compteur de notifications non lues
- **Interface de Consultation** - Page `/coordinateur/notifications` avec filtres (toutes/lues/non lues)
- **Types de Notifications** :
  - Modifications de planning
  - Conflits détectés
  - Modules sans intervenant
  - Programmes en retard
  - Modules démarrant prochainement
  - Évaluations disponibles
- **Actions Groupées** - Marquer comme lu, supprimer plusieurs notifications
- **Rafraîchissement Auto** - Vérification toutes les 30 secondes

#### 📧 Alertes Email Automatiques
- **Templates Professionnels** - Emails HTML responsive avec branding BEM
- **Notifications de Planning** - Alertes lors de modifications de séances
- **Alertes de Conflits** - Détails complets des conflits avec séveritémise en évidence
- **Rappels Automatiques** - Modules démarrant dans les 7 prochains jours
- **Rapports Hebdomadaires** - Résumé automatique des programmes et modules

**Accès rapide :**
- Campagnes : Menu latéral > "Coordination" > "Campagnes d'Évaluation"
- Notifications : Menu latéral > "Coordination" > "Notifications" ou icône cloche en haut à droite

---

## Acteurs et Fonctionnalités

### 1. Administrateur (ADMIN)

**Rôle :** Responsable technique du système et gestionnaire des données de référence.

#### Fonctionnalités principales

##### Gestion des utilisateurs ✅ IMPLÉMENTÉ
- ✅ Création, modification et suppression des comptes utilisateurs via interface web
- ✅ Attribution et modification des rôles (Admin, Coordinateur, Enseignant)
- ✅ Gestion des droits d'accès avec middleware de sécurité
- ✅ Changement de mot de passe pour tout utilisateur
- ✅ Consultation de l'historique dans le journal d'activités

##### Gestion des ressources pédagogiques
- **Salles de cours**
  - Création et configuration des salles (capacité, équipements)
  - Gestion de la disponibilité des salles
  - Classification par bâtiment et type
  - Modification des caractéristiques (capacité, équipements)

- **Périodes académiques**
  - Création des années universitaires
  - Définition des dates importantes (rentrée, examens, vacances)
  - Configuration des périodes de cours et d'examens
  - Gestion des jours fériés et périodes de pause
  - Activation/désactivation des périodes académiques

##### Administration système
- **Journaux d'activités**
  - Consultation de l'historique complet des actions
  - Filtrage par utilisateur, type d'action, entité, date
  - Audit des modifications (anciennes/nouvelles valeurs)
  - Traçabilité complète pour conformité réglementaire
  - Export des logs pour analyse

- **Configuration système**
  - Paramétrage des contraintes de planification
  - Gestion des sauvegardes
  - Surveillance des performances
  - Maintenance de la base de données

##### Rapports et statistiques
- Génération de rapports d'utilisation du système
- Statistiques sur l'occupation des salles
- Analyse de la charge des intervenants
- Tableaux de bord de performance globale
- Export de données vers Excel/PDF

---

### 2. Coordinateur pédagogique (COORDINATOR)

**Rôle :** Responsable de la planification et de la gestion quotidienne des emplois du temps pour un ou plusieurs programmes.

#### Fonctionnalités principales

##### Gestion des programmes
- **Création et configuration des programmes**
  - Définition des maquettes pédagogiques (code, nom, description)
  - Spécification du niveau (L1, L2, L3, M1, M2)
  - Configuration du semestre et volume horaire total (VHT)
  - Définition des dates de début et fin
  - Gestion du statut (Planifié, En cours, Terminé, Suspendu, Annulé)

- **Suivi de progression**
  - Visualisation du pourcentage d'avancement (0-100%)
  - Monitoring du respect des échéances
  - Alertes sur les retards
 
##### Gestion des modules
- **Création et paramétrage des modules**
  - Définition du code, nom et description
  - Répartition des volumes horaires (CM, TD, TP, TPE)
  - Attribution des coefficients et crédits ECTS
  - Affectation des intervenants aux modules
  - Planification des dates de début et fin

- **Suivi pédagogique**
  - Monitoring de la progression des modules
  - Gestion du statut (Planifié, En cours, Terminé, Reporté, Annulé)
  - Contrôle du volume horaire effectué vs planifié

##### Gestion des intervenants
- **Référentiel des intervenants**
  - Création des profils (civilité, nom, prénom, email, téléphone)
  - Saisie des informations professionnelles (grade, spécialité, établissement)
  - Gestion de la disponibilité globale
  - Configuration des contraintes horaires (heures max/semaine, heures max/jour)
  - Définition des préférences (jours préférés, créneaux horaires)

- **Disponibilités détaillées**
  - Création de créneaux de disponibilité récurrents ou ponctuels
  - Gestion des indisponibilités (congés, absences)
  - Définition des préférences horaires
  - Consultation de la charge horaire réelle vs maximale

##### Planification des séances
- **Création manuelle de séances**
  - Sélection du module et de l'intervenant
  - Choix de la date et des horaires (début, fin)
  - Définition du type de séance (CM, TD, TP, Examen, Rattrapage)
  - Attribution de la salle et du bâtiment
  - Saisie des objectifs pédagogiques et notes

- **Planification assistée**
  - Suggestions automatiques de créneaux disponibles
  - Vérification en temps réel des disponibilités
  - Détection immédiate des conflits potentiels
  - Recommandations d'optimisation

- **Planification automatique** (à venir)
  - Génération automatique d'un planning complet
  - Respect de toutes les contraintes
  - Optimisation de l'utilisation des ressources
  - Réplication de plannings d'un semestre à l'autre

##### Gestion des conflits
- **Détection automatique**
  - Double booking d'intervenants (CRITIQUE)
  - Double booking de salles (HAUTE)
  - Chevauchements horaires (MOYENNE)
  - Surcharge horaire des intervenants (MOYENNE)
  - Contraintes calendaires non respectées (BASSE)
  - Incompatibilité avec disponibilités déclarées (HAUTE)
  - Cours planifiés sur jours non ouvrables (MOYENNE)

- **Résolution de conflits**
  - Consultation détaillée des conflits détectés
  - Visualisation des séances en conflit
  - Suggestions de résolution automatique
  - Modification des séances problématiques
  - Marquage des conflits comme résolus
  - Traçabilité des résolutions (qui, quand, comment)

##### Tableaux de bord académiques
- **Suivi des activités académiques**
  - Planification des échéances (démarrage cours, examens, délibérations)
  - Suivi des dates prévues vs réelles
  - Gestion des bulletins et rattrapages

- **Indicateurs de performance**
  - Taux de réussite par programme/module
  - Taux d'abandon
  - Respect des échéances
  - Délai de traitement des vacations
  - Comparaison objectifs vs réalisations

##### Gestion des évaluations
- **Résultats étudiants**
  - Saisie des notes (CC, examen, finale)
  - Calcul automatique des moyennes
  - Gestion des statuts (Validé, Invalidé, Abandonné)
  - Suivi de l'assiduité (présences, absences)
  - Calcul du taux de présence

- **Évaluation des enseignements** ✅ IMPLÉMENTÉ
  - ✅ Création de campagnes d'évaluation via interface web
  - ✅ Génération automatique de liens d'évaluation uniques
  - ✅ Définition des périodes d'évaluation avec dates de début et fin
  - ✅ Gestion du statut des campagnes (Brouillon, Envoyée, En cours, Terminée)
  - ✅ Envoi automatique des notifications aux intervenants
  - ✅ Consultation des résultats (qualité cours, pédagogie, disponibilité)
  - ✅ Analyse du taux de participation (nombre de réponses/invitations)
  - ✅ Statistiques globales des campagnes d'évaluation

##### Consultation et exports
- **Visualisation des plannings**
  - Vue calendrier (jour, semaine, mois)
  - Filtrage par programme, module, intervenant, salle
  - Recherche de séances
  - Légende des types de séances et statuts

- **Exports**
  - Export PDF des emplois du temps
  - Export Excel pour traitement externe
  - Export iCal pour synchronisation avec agendas
  - Génération de plannings imprimables

##### Communication ✅ IMPLÉMENTÉ
- ✅ **Système de notifications en temps réel**
  - Notifications des modifications de planning
  - Alertes en cas de conflit détecté
  - Notifications pour modules sans intervenant
  - Alertes pour programmes en retard
  - Badge de notifications non lues dans le menu
  - Interface de gestion des notifications
  - Marquage des notifications comme lues
  - Suppression de notifications

- ✅ **Alertes email automatiques**
  - Email de notification pour modifications de planning
  - Email d'alerte pour conflits détectés avec détails des séances
  - Email pour modules sans intervenant assigné
  - Email pour programmes en retard
  - Email pour modules démarrant prochainement
  - Email de disponibilité des campagnes d'évaluation
  - Rapports hebdomadaires automatisés

- Communication avec les intervenants via le système
- Diffusion des emplois du temps aux étudiants

---

### 3. Enseignant / Intervenant (TEACHER)

**Rôle :** Consulte son emploi du temps et gère ses disponibilités.

#### Fonctionnalités principales

##### Gestion du profil
- Consultation et mise à jour de ses informations personnelles
- Modification de ses coordonnées (email, téléphone)
- Consultation de ses informations professionnelles

##### Gestion des disponibilités
- **Déclaration des disponibilités**
  - Création de créneaux de disponibilité hebdomadaires récurrents
  - Indication des indisponibilités ponctuelles
  - Définition des jours et horaires préférés
  - Création de plages horaires spécifiques

- **Contraintes horaires**
  - Définition du nombre d'heures maximum par semaine
  - Définition du nombre d'heures maximum par jour
  - Préférences de créneaux (matin, après-midi)

##### Consultation de l'emploi du temps
- **Visualisation des séances**
  - Vue personnalisée de toutes ses séances
  - Calendrier avec ses interventions
  - Détails des séances (module, type, horaires, salle, étudiants)
  - Filtrage par date, module, type de séance

- **Informations pédagogiques**
  - Consultation des objectifs pédagogiques de chaque séance
  - Accès aux notes et consignes
  - Visualisation des programmes et modules assignés

##### Suivi de charge
- Consultation de sa charge horaire totale
- Visualisation du volume horaire par semaine
- Comparaison avec les limites maximales définies
- Historique des interventions

##### Notifications
- Alertes en cas de nouvelle séance planifiée
- Notifications de modifications d'emploi du temps
- Rappels de séances à venir
- Alertes en cas de conflit détecté

##### Exports personnels
- Export de son emploi du temps personnel (PDF, iCal)
- Synchronisation avec agenda personnel (Google Calendar, Outlook)
- Impression de planning personnel

##### Feedback
- Signalement de problèmes de planning
- Demandes de modification de créneaux
- Communication avec les coordinateurs

---

### 4. Étudiant (consultation publique)

**Rôle :** Consulte les emplois du temps de son programme.

#### Fonctionnalités principales

##### Consultation de l'emploi du temps
- **Vue par programme**
  - Accès à l'emploi du temps de son niveau (L1, L2, M1, etc.)
  - Visualisation calendaire (semaine, mois)
  - Liste des séances avec tous les détails

- **Informations des séances**
  - Date et horaires
  - Type de séance (CM, TD, TP, Examen)
  - Module concerné
  - Intervenant
  - Salle et bâtiment
  - Statut (Planifié, Confirmé, Reporté, Annulé)

##### Recherche et filtres
- Recherche de séances par module
- Filtrage par type de séance
- Filtrage par intervenant
- Recherche par date

##### Notifications
- Alertes de modifications de planning
- Notifications d'annulation de cours
- Rappels de séances importantes (examens)

##### Exports
- Téléchargement de l'emploi du temps (PDF)
- Export iCal pour synchronisation avec smartphone
- Impression du planning

##### Signalement
- Signalement d'erreurs ou problèmes dans le planning
- Remontée de conflits constatés

---

## Types de Conflits Détectés

### 1. Conflits CRITIQUES
- **Double booking d'intervenant** : Un intervenant planifié simultanément dans deux salles
- Blocage total de la planification
- Résolution immédiate requise

### 2. Conflits de sévérité HAUTE
- **Double booking de salle** : Une salle réservée pour deux groupes au même moment
- **Incompatibilité avec disponibilités** : Séance planifiée pendant une indisponibilité déclarée
- Résolution urgente recommandée

### 3. Conflits de sévérité MOYENNE
- **Chevauchement horaire** : Séances qui se terminent après le début de la suivante
- **Surcharge intervenant** : Dépassement des heures maximales hebdomadaires ou quotidiennes
- **Jour non ouvrable** : Cours planifié un samedi/dimanche non autorisé
- À corriger dans un délai raisonnable

### 4. Conflits de sévérité BASSE
- **Contrainte calendaire** : Cours pendant vacances ou jours fériés
- **Préférences non respectées** : Planification sur créneau non préféré
- Avertissement, correction souhaitable mais non bloquante

---

## Technologies

### Stack Principale

| Technologie | Version | Usage |
|-------------|---------|-------|
| Next.js | 15.5 | Framework React SSR/SSG |
| React | 19.1 | Bibliothèque UI |
| Prisma | 6.16 | ORM type-safe |
| PostgreSQL | 14+ | Base de données relationnelle |
| NextAuth.js | 4.24 | Authentification complète |
| Tailwind CSS | 4.1 | Framework CSS utilitaire |
| Lucide React | 0.544 | Icônes SVG |

### Bibliothèques Utilitaires

- **bcryptjs** : Hachage mots de passe
- **zod** : Validation de schémas
- **date-fns** : Manipulation de dates
- **clsx** : Gestion classes CSS conditionnelles

---

## Installation

### Prérequis

- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- npm ou yarn

### Étapes d'installation

```bash
# 1. Cloner le projet
git clone https://github.com/votre-org/bem-planning-fc.git
cd bem-planning-fc

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# 4. Créer la base de données
createdb bem_planning_fc

# 5. Initialiser la base de données
npx prisma generate
npx prisma migrate dev

# 6. (Optionnel) Charger des données de test
npx prisma db seed

# 7. Démarrer l'application
npm run dev
```

L'application sera accessible sur **http://localhost:3000**

### Configuration Minimale (.env)

```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/bem_planning_fc"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generer-un-secret-avec-openssl-rand-base64-32"

# Environnement
NODE_ENV="development"
```

### Comptes par défaut (après seed)

- **Administrateur** : admin@bem.sn / admin123
- **Coordinateur** : coordinateur@bem.sn / coord123
- **Enseignant** : enseignant@bem.sn / teacher123

---

## Documentation

### Documentation du projet

- [Document de projet complet](docs/memoire/DOCUMENT_PROJET.md) - Contexte, problématique, objectifs
- [Guide des tableaux de bord](docs/GUIDE_TABLEAUX_BORD.md) - Indicateurs et activités académiques

### Structure de la base de données

#### Entités principales

- **User** : Utilisateurs du système avec authentification et rôles
- **Programme** : Maquettes pédagogiques de formation
- **Module** : Unités d'enseignement (UE) avec volumes horaires
- **Intervenant** : Enseignants et formateurs avec disponibilités
- **Seance** : Occurrences planifiées des enseignements
- **Salle** : Salles de cours avec équipements
- **Conflit** : Conflits de planification détectés et résolus
- **PeriodeAcademique** : Années universitaires avec dates importantes

#### Tableaux de bord académiques

- **ActiviteAcademique** : Suivi des activités et échéances (démarrage cours, examens, délibérations)
- **IndicateurAcademique** : Indicateurs de performance (taux de réussite, abandon, respect échéances)
- **ResultatEtudiant** : Résultats académiques par module et assiduité
- **EvaluationEnseignement** : Évaluations des enseignements par les étudiants

### Architecture

```
bem-planning-fc/
├── components/              # Composants React réutilisables
│   ├── ui/                 # Composants UI génériques
│   ├── modals/             # Modales (création, édition)
│   ├── statistics/         # Composants statistiques
│   └── layout.js           # Layout principal avec navigation
│
├── pages/                  # Pages et routes Next.js
│   ├── api/                # API Routes (backend)
│   │   ├── auth/           # Authentification
│   │   ├── programmes/     # CRUD programmes
│   │   ├── modules/        # CRUD modules
│   │   ├── intervenants/   # CRUD intervenants
│   │   ├── seances/        # CRUD séances
│   │   ├── planning/       # Suggestion & génération auto
│   │   └── statistics/     # Statistiques avancées
│   ├── dashboard/          # Tableau de bord
│   ├── programmes/         # Gestion programmes
│   ├── intervenants/       # Gestion intervenants
│   └── statistics/         # Page statistiques
│
├── prisma/                 # Configuration Prisma
│   ├── schema.prisma       # Schéma de données (15+ tables)
│   └── migrations/         # Historique migrations
│
└── docs/                   # Documentation
    └── memoire/            # Documentation projet
```

---

## API Endpoints

### Authentification

```http
POST /api/auth/signup      # Inscription
POST /api/auth/signin      # Connexion (via NextAuth)
```

### Programmes

```http
GET    /api/programmes          # Liste (paginée, filtrable)
POST   /api/programmes          # Créer
GET    /api/programmes/:id      # Détail
PUT    /api/programmes/:id      # Modifier
DELETE /api/programmes/:id      # Supprimer
```

### Planning

```http
# Suggérer des créneaux disponibles
GET /api/planning/schedule?moduleId=xxx&intervenantId=yyy&duree=120

# Générer un planning automatique
POST /api/planning/schedule
{
  "moduleId": "...",
  "intervenantId": "...",
  "startDate": "2024-01-01",
  "preferences": {}
}

# Gestion des conflits
GET    /api/planning/conflict    # Liste conflits
PUT    /api/planning/conflict    # Résoudre conflit
DELETE /api/planning/conflict    # Supprimer conflit
```

### Statistiques

```http
GET /api/statistics?type=global        # Stats globales
GET /api/statistics?type=intervenants  # Stats intervenants
GET /api/statistics?type=performance   # KPIs
GET /api/statistics?type=planning      # Analyse planning
```

---

## Commandes

### Développement

```bash
npm run dev                 # Serveur de développement (port 3000)
npm run build              # Build de production
npm run start              # Serveur de production
npm run lint               # Linter ESLint
```

### Base de Données

```bash
npx prisma generate         # Générer le client Prisma
npx prisma migrate dev      # Créer/appliquer migrations
npx prisma db push          # Synchroniser schéma (dev)
npx prisma db seed          # Charger données de test
npx prisma studio           # Interface graphique
```

---

## Fonctionnalités clés

### Planification intelligente
- Création manuelle ou automatique de séances
- Suggestions de créneaux optimaux
- Respect automatique des contraintes

### Détection de conflits en temps réel
- Vérification instantanée lors de la planification
- Classification par sévérité (Basse, Moyenne, Haute, Critique)
- Suggestions de résolution

### Traçabilité complète
- Journal d'activités exhaustif (JournalActivite)
- Historique de toutes les modifications
- Audit complet pour conformité réglementaire

### Tableaux de bord analytiques
- Suivi des activités académiques et échéances
- Indicateurs de performance (taux de réussite, abandon)
- Résultats et évaluations des enseignements

### Exports multiformats
- PDF pour impression
- Excel pour analyse
- iCal pour synchronisation agenda

---

## Contexte Académique

Ce projet a été développé dans le cadre d'un **mémoire de formation** pour l'établissement BEM avec pour thématique :

> **"Système de Planification Académique - Gestion automatisée de l'emploi du temps et détection des conflits"**

### Objectifs du projet

1. Concevoir un système de gestion de planning intelligent
2. Implémenter des algorithmes de détection et résolution de conflits
3. Développer une architecture moderne et scalable
4. Produire une documentation technique complète

### Livrables

- Application web fonctionnelle
- Documentation complète du projet
- Modèle de données exhaustif (15+ tables)
- Code source structuré et commenté

---

## Support & Contact

- Documentation : `/docs/memoire/`
- Email : support@bem.sn

---

## Licence

© 2025 BEM (Business Et Management) - Tous droits réservés

---

**Développé avec soin pour améliorer l'expérience académique à BEM**

*Année Académique 2024-2025*
