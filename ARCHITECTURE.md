# II - ARCHITECTURE DU SYSTÈME

## Architecture fonctionnelle

### Présentation

Le système BEM Planning FC est une plateforme de gestion académique complète conçue pour orchestrer l'ensemble du cycle de vie de la formation. Il intègre plusieurs domaines fonctionnels :

**1. Gestion des Programmes et Modules**
- Planification et suivi des programmes académiques par semestre et niveau
- Gestion des modules avec répartition détaillée des volumes horaires (CM, TD, TP, TPE)
- Calcul automatique de la progression et du volume horaire total (VHT)
- Attribution des coefficients et crédits ECTS

**2. Gestion des Intervenants**
- Référentiel complet des enseignants (grade, spécialité, établissement)
- Gestion avancée des disponibilités (créneaux préférentiels, contraintes horaires)
- Suivi de la charge de travail (heures max/jour, heures max/semaine)
- Évaluation de la qualité d'enseignement

**3. Planification Automatique des Séances**
- Génération automatique des emplois du temps
- Détection et résolution des conflits (double booking, chevauchements, surcharges)
- Gestion multi-critères (disponibilités, salles, contraintes calendaires)
- Système de sévérité des conflits (Basse, Moyenne, Haute, Critique)

**4. Gestion des Ressources**
- Réservation et allocation des salles par bâtiment
- Gestion des équipements et capacités
- Optimisation de l'occupation des espaces

**5. Suivi Académique**
- Gestion des résultats étudiants (notes CC, examens, note finale)
- Calcul automatique des statuts (admis, ajourné) et mentions
- Suivi des présences/absences et taux de présence
- Suivi de la progression par module

**6. Pilotage et Indicateurs**
- Tableaux de bord pour le suivi des programmes
- Indicateurs académiques par période (valeurs cibles vs réelles)
- Statistiques globales du système
- Suivi des activités académiques (examens, soutenances, etc.)

**7. Traçabilité et Audit**
- Journal d'activité détaillé de toutes les opérations
- Historique des modifications avec anciennes/nouvelles valeurs
- Traçabilité des connexions et exports de données

### Schéma de l'architecture fonctionnelle

```
┌─────────────────────────────────────────────────────────────────────┐
│                          UTILISATEURS                                │
│         (Admin, Coordinateur Pédagogique, Enseignant)               │
└────────────────────────┬────────────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────────────┐
│                   COUCHE PRÉSENTATION                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Dashboard   │  │  Calendrier  │  │  Statistiques│              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Programmes  │  │ Intervenants │  │   Résultats  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└────────────────────────┬────────────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────────────┐
│                    COUCHE MÉTIER                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Module Planification                                         │  │
│  │  • Génération auto emploi du temps                            │  │
│  │  • Détection conflits (6 types)                               │  │
│  │  • Résolution contraintes                                     │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Module Gestion Académique                                    │  │
│  │  • Programmes/Modules • Périodes académiques                  │  │
│  │  • Activités académiques • Indicateurs                        │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Module Ressources Humaines                                   │  │
│  │  • Intervenants • Disponibilités • Évaluations                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Module Suivi Étudiant                                        │  │
│  │  • Résultats • Présences • Progression                        │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Module Audit & Traçabilité                                   │  │
│  │  • Journal activité • Historique • Exports                    │  │
│  └───────────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────────────┐
│                  COUCHE DONNÉES                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Base de Données PostgreSQL                      │  │
│  │  • 16 Tables relationnelles                                  │  │
│  │  • Prisma ORM                                                │  │
│  │  • Contraintes d'intégrité référentielle                     │  │
│  │  • Index optimisés pour les requêtes fréquentes              │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Architecture applicative

### Présentation

Le système est construit selon une architecture moderne **full-stack JavaScript** basée sur le framework **Next.js 15** avec les caractéristiques suivantes :

**Stack Technologique**

1. **Frontend**
   - Framework : Next.js 15.5.3 (avec Turbopack pour les performances)
   - Bibliothèque UI : React 19.1.0
   - Gestion d'état : React Hooks et Context API
   - Styling : Tailwind CSS 4.1.13
   - Icônes : Lucide React 0.544.0
   - Utilitaires : clsx pour les classes CSS conditionnelles

2. **Backend**
   - Runtime : Node.js
   - Framework : Next.js API Routes (approche serverless)
   - Authentification : NextAuth.js 4.24.11 avec adaptateur Prisma
   - Validation : Zod 4.1.8 pour la validation des schémas
   - Cryptage : bcryptjs 3.0.2 pour les mots de passe

3. **Base de Données**
   - SGBD : PostgreSQL
   - ORM : Prisma 6.16.1
   - Migrations : Prisma Migrate
   - Seeding : Scripts de données de test

4. **Sécurité**
   - Authentification JWT via NextAuth
   - Gestion des rôles (ADMIN, COORDINATOR, TEACHER)
   - Hashage sécurisé des mots de passe
   - Protection CSRF native Next.js

**Architecture en Couches**

Le système suit le pattern **MVC adapté** avec séparation claire :
- **Pages** : Routes et composants de page (Next.js routing)
- **Components** : Composants réutilisables (modals, UI, layout)
- **API Routes** : Endpoints RESTful pour les opérations CRUD
- **Prisma Client** : Couche d'accès aux données
- **Database** : Schéma relationnel PostgreSQL

**Modules Fonctionnels**

1. **Module Authentification** (`/api/auth/`)
   - Inscription, connexion, gestion de session
   - Profil utilisateur et préférences

2. **Module Programmes** (`/api/programmes/`)
   - CRUD programmes académiques
   - Suivi progression et statuts

3. **Module Modules** (`/api/modules/`)
   - Gestion modules d'enseignement
   - Répartition volumes horaires

4. **Module Intervenants** (`/api/intervenants/`)
   - CRUD intervenants
   - Gestion disponibilités et préférences

5. **Module Séances** (`/api/seances/`)
   - Création et gestion des séances
   - Types de séances (CM, TD, TP, Examen)

6. **Module Planification** (`/api/planning/`)
   - Algorithme de génération automatique
   - Détection et résolution de conflits

7. **Module Calendrier** (`/api/calendar/`)
   - Visualisation emploi du temps
   - Export et partage

8. **Module Résultats Étudiants** (`/api/resultats-etudiants/`)
   - Saisie et calcul des notes
   - Statistiques de réussite

9. **Module Évaluations** (`/api/evaluations-enseignements/`)
   - Enquêtes qualité enseignement
   - Analyses et rapports

10. **Module Indicateurs** (`/api/indicateurs-academiques/`)
    - Définition et suivi des KPI
    - Tableaux de bord décisionnels

11. **Module Activités Académiques** (`/api/activites-academiques/`)
    - Événements académiques
    - Calendrier institutionnel

12. **Module Périodes** (`/api/periodes-academiques/`)
    - Configuration années académiques
    - Gestion vacances et semestres

### Schéma applicatif

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT SIDE (Browser)                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    React Components                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │   │
│  │  │  Pages   │  │Components│  │  Modals  │  │    UI    │   │   │
│  │  │ (Routes) │  │ (Layout) │  │          │  │  (Toast) │   │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │   │
│  │       │             │             │             │          │   │
│  │  ┌────┴─────────────┴─────────────┴─────────────┴────┐    │   │
│  │  │           Next.js Client Runtime                  │    │   │
│  │  │  • Client-side routing                            │    │   │
│  │  │  • State management (React Hooks)                 │    │   │
│  │  │  • Form handling & validation                     │    │   │
│  │  └───────────────────────┬───────────────────────────┘    │   │
│  └────────────────────────────┼────────────────────────────────┘   │
└─────────────────────────────┼─────────────────────────────────────┘
                              │ HTTPS/JSON
                              │ (fetch/axios)
┌─────────────────────────────┼─────────────────────────────────────┐
│                         SERVER SIDE (Next.js)                       │
│  ┌───────────────────────────┴───────────────────────────────────┐ │
│  │                  Next.js API Routes Layer                     │ │
│  │  ┌────────────────────────────────────────────────────────┐  │ │
│  │  │  /api/auth/*        Authentication & Authorization     │  │ │
│  │  │  [...nextauth].js   NextAuth.js + JWT                  │  │ │
│  │  ├────────────────────────────────────────────────────────┤  │ │
│  │  │  /api/programmes/*  Programme Management               │  │ │
│  │  │  /api/modules/*     Module Management                  │  │ │
│  │  │  /api/intervenants/* Teacher Management               │  │ │
│  │  │  /api/seances/*     Session Management                 │  │ │
│  │  ├────────────────────────────────────────────────────────┤  │ │
│  │  │  /api/planning/*    Automatic Scheduling Engine        │  │ │
│  │  │  • schedule.js      Algorithm implementation           │  │ │
│  │  │  • conflict.js      Conflict detection                 │  │ │
│  │  ├────────────────────────────────────────────────────────┤  │ │
│  │  │  /api/resultats-etudiants/*  Student Results           │  │ │
│  │  │  /api/evaluations-enseignements/*  Quality Surveys     │  │ │
│  │  │  /api/indicateurs-academiques/*  KPIs                  │  │ │
│  │  │  /api/periodes-academiques/*  Academic Periods         │  │ │
│  │  │  /api/statistics/*  Global Statistics                  │  │ │
│  │  └────────────────────┬───────────────────────────────────┘  │ │
│  └───────────────────────┼───────────────────────────────────────┘ │
│                          │                                          │
│  ┌───────────────────────┴───────────────────────────────────────┐ │
│  │              Business Logic & Validation Layer                │ │
│  │  • Zod Schema Validation                                      │ │
│  │  • Business Rules Enforcement                                 │ │
│  │  • Conflict Detection Algorithms                              │ │
│  │  • Scheduling Optimization                                    │ │
│  │  • Access Control & Authorization                             │ │
│  └───────────────────────┬───────────────────────────────────────┘ │
└─────────────────────────┼─────────────────────────────────────────┘
                          │
┌─────────────────────────┼─────────────────────────────────────────┐
│                  DATA ACCESS LAYER (Prisma ORM)                     │
│  ┌───────────────────────┴───────────────────────────────────────┐ │
│  │                    Prisma Client                              │ │
│  │  • Type-safe database queries                                 │ │
│  │  • Relationship loading (include, select)                     │ │
│  │  • Transaction management                                     │ │
│  │  • Query optimization                                         │ │
│  └───────────────────────┬───────────────────────────────────────┘ │
└─────────────────────────┼─────────────────────────────────────────┘
                          │ SQL Queries
┌─────────────────────────┼─────────────────────────────────────────┐
│                     PostgreSQL Database                             │
│  ┌───────────────────────┴───────────────────────────────────────┐ │
│  │  Tables (16):                                                 │ │
│  │  • users                  • programmes                        │ │
│  │  • intervenants           • disponibilites_intervenants       │ │
│  │  • modules                • seances                           │ │
│  │  • salles                 • conflits                          │ │
│  │  • resultats_etudiants    • evaluations_enseignements         │ │
│  │  • periodes_academiques   • activites_academiques             │ │
│  │  • indicateurs_academiques                                    │ │
│  │  • journal_activites                                          │ │
│  │                                                               │ │
│  │  Indexes: 40+ optimized indexes for performance              │ │
│  │  Constraints: Foreign keys, unique, check constraints         │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                               │
│  • Email Service (notifications)                                    │
│  • File Storage (exports, documents)                                │
│  • Authentication Provider (NextAuth)                               │
└─────────────────────────────────────────────────────────────────────┘
```

**Flux de Données Typique**

1. **Requête utilisateur** → Page Next.js (SSR/CSR)
2. **Action utilisateur** → Appel API (fetch)
3. **API Route** → Validation Zod
4. **Business Logic** → Vérification permissions + règles métier
5. **Prisma Client** → Requête SQL optimisée
6. **PostgreSQL** → Exécution + retour données
7. **Prisma** → Mapping objet TypeScript
8. **API Response** → JSON formaté
9. **React Component** → Mise à jour UI

**Patterns de Conception Utilisés**

- **Repository Pattern** : Prisma comme abstraction de la base de données
- **API Gateway** : Next.js API Routes comme point d'entrée unifié
- **Middleware Pattern** : NextAuth pour l'authentification
- **Observer Pattern** : React hooks (useState, useEffect)
- **Factory Pattern** : Prisma Client generation
- **Singleton Pattern** : Instance unique de PrismaClient
