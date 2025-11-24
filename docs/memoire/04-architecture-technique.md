# Architecture Technique - BEM Planning FC

## 1. Vue d'Ensemble

### 1.1 Présentation du Système

**BEM Planning FC** est une application web de gestion des plannings de formation continue, construite selon une architecture moderne en trois tiers avec rendu hybride (SSR/CSR).

### 1.2 Schéma d'Architecture Globale

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ARCHITECTURE GLOBALE                                │
│                                BEM Planning FC                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────┐
                                    │ Navigateur  │
                                    │   Client    │
                                    └──────┬──────┘
                                           │
                                           │ HTTPS
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              COUCHE PRÉSENTATION                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        Next.js Application                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │   │
│  │  │    Pages     │  │  Components  │  │   Layouts    │  │   Styles    │  │   │
│  │  │    (SSR)     │  │   (React)    │  │              │  │ (Tailwind)  │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           │ API Routes
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              COUCHE MÉTIER (API)                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                          API Routes Next.js                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │   │
│  │  │  Auth API    │  │ Programmes   │  │  Planning    │  │ Statistics  │  │   │
│  │  │ (NextAuth)   │  │     API      │  │    API       │  │    API      │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           Services Métier                                │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │   │
│  │  │   Planning   │  │   Conflict   │  │  Statistics  │                   │   │
│  │  │   Service    │  │   Service    │  │   Service    │                   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           │ Prisma ORM
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              COUCHE DONNÉES                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           Prisma Client                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │   │
│  │  │    Models    │  │  Migrations  │  │    Schema    │  │    Seed     │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                           │                                     │
│                                           ▼                                     │
│                               ┌──────────────────┐                              │
│                               │   PostgreSQL     │                              │
│                               │    Database      │                              │
│                               └──────────────────┘                              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Stack Technologique

### 2.1 Technologies Utilisées

| Couche | Technologie | Version | Rôle |
|--------|-------------|---------|------|
| **Frontend** | Next.js | 15.5.3 | Framework React avec SSR |
| **Frontend** | React | 19.1.0 | Bibliothèque UI |
| **Frontend** | Tailwind CSS | 4.1.13 | Framework CSS utilitaire |
| **Frontend** | Lucide React | 0.544.0 | Icônes SVG |
| **Backend** | Next.js API Routes | - | Endpoints REST |
| **Backend** | NextAuth.js | 4.24.11 | Authentification |
| **ORM** | Prisma | 6.16.1 | Mapping objet-relationnel |
| **Base de données** | PostgreSQL | 14+ | SGBD relationnel |
| **Sécurité** | bcryptjs | 3.0.2 | Hachage mots de passe |
| **Validation** | Zod | 4.1.8 | Validation de schémas |
| **Dates** | date-fns | 4.1.0 | Manipulation de dates |

### 2.2 Justification des Choix Technologiques

| Technologie | Justification |
|-------------|---------------|
| **Next.js** | SSR pour SEO, API Routes intégrées, excellent DX, performances optimisées |
| **React** | Composants réutilisables, large écosystème, communauté active |
| **Tailwind CSS** | Développement rapide, CSS optimisé, design system cohérent |
| **Prisma** | Type-safety, migrations automatiques, requêtes typées |
| **PostgreSQL** | Robuste, performant, support JSON, contraintes avancées |
| **NextAuth.js** | Solution complète d'auth, support JWT, adaptateurs Prisma |

---

## 3. Architecture Détaillée

### 3.1 Structure des Dossiers

```
bem-planning-fc/
├── 📁 pages/                    # Routes et pages Next.js
│   ├── 📁 api/                  # API Routes (Backend)
│   │   ├── 📁 auth/             # Authentification
│   │   │   ├── [...nextauth].js # Configuration NextAuth
│   │   │   └── signup.js        # Inscription
│   │   ├── 📁 programmes/       # CRUD Programmes
│   │   ├── 📁 modules/          # CRUD Modules
│   │   ├── 📁 intervenants/     # CRUD Intervenants
│   │   ├── 📁 seances/          # CRUD Séances
│   │   ├── 📁 planning/         # Services Planning
│   │   │   ├── schedule.js      # Génération auto
│   │   │   └── conflict.js      # Gestion conflits
│   │   ├── 📁 statistics/       # API Statistiques
│   │   └── 📁 user/             # Profil utilisateur
│   ├── 📁 auth/                 # Pages authentification
│   ├── 📁 dashboard/            # Tableau de bord
│   ├── 📁 programmes/           # Pages programmes
│   ├── 📁 intervenants/         # Pages intervenants
│   ├── 📁 calendar/             # Vue calendrier
│   ├── 📁 settings/             # Paramètres
│   ├── _app.js                  # App wrapper
│   └── index.js                 # Page d'accueil
│
├── 📁 components/               # Composants React
│   ├── 📁 ui/                   # Composants UI génériques
│   │   ├── StatCard.js          # Cartes statistiques
│   │   └── Toast.js             # Notifications
│   ├── 📁 modals/               # Modales
│   ├── 📁 dashbord/             # Composants dashboard
│   ├── 📁 calendar/             # Composants calendrier
│   ├── 📁 programmes/           # Composants programmes
│   ├── 📁 settings/             # Composants paramètres
│   └── layout.js                # Layout principal
│
├── 📁 lib/                      # Utilitaires
│   ├── prisma.js                # Client Prisma singleton
│   ├── auth.js                  # Helpers authentification
│   └── utils.js                 # Fonctions utilitaires
│
├── 📁 prisma/                   # Configuration Prisma
│   ├── schema.prisma            # Schéma de données
│   ├── migrations/              # Historique migrations
│   └── seed.js                  # Données initiales
│
├── 📁 styles/                   # Styles globaux
│   └── globals.css              # CSS Tailwind
│
├── 📁 docs/                     # Documentation
│   └── 📁 memoire/              # Documents mémoire
│
├── 📁 public/                   # Fichiers statiques
│
└── 📄 Configuration
    ├── next.config.ts           # Config Next.js
    ├── tailwind.config.js       # Config Tailwind
    ├── tsconfig.json            # Config TypeScript
    ├── package.json             # Dépendances
    └── .env                     # Variables d'environnement
```

### 3.2 Flux de Données

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FLUX DE DONNÉES                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

1. REQUÊTE UTILISATEUR
   ┌──────────┐    Action    ┌──────────────┐    Fetch    ┌──────────────┐
   │  Client  │ ───────────► │  Component   │ ──────────► │  API Route   │
   │(Browser) │              │   (React)    │             │  (Next.js)   │
   └──────────┘              └──────────────┘             └──────────────┘
                                                                 │
                                                                 ▼
2. TRAITEMENT API                                        ┌──────────────┐
   ┌──────────────┐                                      │   Service    │
   │   Middleware │◄─────────────────────────────────────│   Métier     │
   │   (Auth)     │                                      └──────────────┘
   └──────────────┘                                             │
                                                                ▼
3. ACCÈS DONNÉES                                         ┌──────────────┐
   ┌──────────────┐    Query    ┌──────────────┐        │    Prisma    │
   │  PostgreSQL  │◄────────────│    Prisma    │◄───────│    Client    │
   │   Database   │             │     ORM      │        └──────────────┘
   └──────────────┘             └──────────────┘

4. RÉPONSE
   ┌──────────────┐    JSON     ┌──────────────┐   State   ┌──────────┐
   │  API Route   │ ──────────► │  Component   │ ────────► │  Client  │
   └──────────────┘             │   (React)    │   Update  │(Browser) │
                                └──────────────┘           └──────────┘
```

---

## 4. Sécurité

### 4.1 Authentification et Autorisation

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         ARCHITECTURE D'AUTHENTIFICATION                          │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│   Credentials   │         │     Google      │         │   (Extensible)  │
│    Provider     │         │    Provider     │         │                 │
│                 │         │                 │         │                 │
└────────┬────────┘         └────────┬────────┘         └────────┬────────┘
         │                           │                           │
         └───────────────────────────┼───────────────────────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │                     │
                          │    NextAuth.js      │
                          │    Core Engine      │
                          │                     │
                          └──────────┬──────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
           ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
           │ JWT Strategy  │ │ Session Mgmt  │ │ Prisma        │
           │               │ │               │ │ Adapter       │
           └───────────────┘ └───────────────┘ └───────────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │   PostgreSQL DB     │
                          │   (users table)     │
                          └─────────────────────┘
```

### 4.2 Mesures de Sécurité

| Mesure | Implémentation | Description |
|--------|----------------|-------------|
| **Hachage MDP** | bcryptjs (10 rounds) | Mots de passe jamais stockés en clair |
| **Sessions JWT** | NextAuth.js | Tokens signés, expiration configurable |
| **CSRF Protection** | NextAuth.js built-in | Tokens CSRF automatiques |
| **Isolation données** | Filtrage userId | Chaque utilisateur voit uniquement ses données |
| **Validation entrées** | Zod schemas | Validation côté serveur de toutes les entrées |
| **Requêtes préparées** | Prisma ORM | Protection contre injections SQL |
| **HTTPS** | Configuration serveur | Chiffrement des communications |

### 4.3 Contrôle d'Accès par Rôle (RBAC)

```javascript
// Matrice des permissions
const PERMISSIONS = {
  ADMIN: ['*'],  // Accès total
  COORDINATOR: [
    'programmes:read', 'programmes:write',
    'modules:read', 'modules:write',
    'seances:read', 'seances:write',
    'intervenants:read',
    'statistics:read'
  ],
  TEACHER: [
    'programmes:read',
    'modules:read',
    'seances:read',
    'calendar:read',
    'profile:write'
  ]
};
```

---

## 5. API REST

### 5.1 Conventions

| Aspect | Convention |
|--------|------------|
| **Format** | JSON |
| **Méthodes** | GET, POST, PUT, PATCH, DELETE |
| **Codes HTTP** | 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 404 (Not Found), 409 (Conflict), 500 (Server Error) |
| **Pagination** | `?page=1&limit=10` |
| **Filtrage** | `?status=EN_COURS&search=algo` |
| **Tri** | `?sortBy=createdAt&order=desc` |

### 5.2 Endpoints Principaux

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ENDPOINTS API                                       │
└─────────────────────────────────────────────────────────────────────────────────┘

AUTHENTIFICATION
├── POST   /api/auth/signup          # Inscription
├── POST   /api/auth/signin          # Connexion
└── POST   /api/auth/signout         # Déconnexion

PROGRAMMES
├── GET    /api/programmes           # Liste (paginée, filtrable)
├── POST   /api/programmes           # Créer
├── GET    /api/programmes/:id       # Détail
├── PUT    /api/programmes/:id       # Modifier
└── DELETE /api/programmes/:id       # Supprimer

MODULES
├── GET    /api/modules/:id          # Détail module
├── PUT    /api/modules/:id          # Modifier
└── DELETE /api/modules/:id          # Supprimer

INTERVENANTS
├── GET    /api/intervenants         # Liste
├── POST   /api/intervenants         # Créer
├── GET    /api/intervenants/:id     # Détail
├── DELETE /api/intervenants/:id     # Supprimer
└── PATCH  /api/intervenants/:id/disponibilite  # Maj disponibilité

SÉANCES
├── GET    /api/seances              # Liste (filtrable par date, programme)
├── POST   /api/seances              # Créer (avec détection conflits)
├── PATCH  /api/seances/:id          # Modifier
└── DELETE /api/seances/:id          # Annuler

PLANNING
├── GET    /api/planning/schedule    # Suggérer créneaux
├── POST   /api/planning/schedule    # Génération automatique
├── GET    /api/planning/conflict    # Liste conflits
├── PUT    /api/planning/conflict    # Résoudre conflit
└── DELETE /api/planning/conflict    # Supprimer conflit

STATISTIQUES
├── GET    /api/statistics?type=global       # Stats globales
├── GET    /api/statistics?type=intervenants # Stats intervenants
├── GET    /api/statistics?type=salles       # Stats salles
├── GET    /api/statistics?type=programmes   # Stats programmes
└── GET    /api/statistics?type=performance  # KPIs
```

---

## 6. Algorithmes Clés

### 6.1 Algorithme de Détection de Conflits

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ALGORITHME DE DÉTECTION DE CONFLITS                           │
└─────────────────────────────────────────────────────────────────────────────────┘

ENTRÉE: nouvelle_seance {date, heureDebut, heureFin, intervenantId, salle}

1. RECHERCHER séances_existantes WHERE
   - date = nouvelle_seance.date
   - status != 'ANNULE'
   - (intervenantId = nouvelle_seance.intervenantId
      OR salle = nouvelle_seance.salle)

2. POUR CHAQUE seance_existante DANS séances_existantes:

   SI chevauchement_horaire(seance_existante, nouvelle_seance) ALORS

      SI seance_existante.intervenantId = nouvelle_seance.intervenantId ALORS
         AJOUTER conflit {
           type: 'INTERVENANT_DOUBLE_BOOKING',
           seance1: nouvelle_seance,
           seance2: seance_existante
         }
      FIN SI

      SI seance_existante.salle = nouvelle_seance.salle ALORS
         AJOUTER conflit {
           type: 'SALLE_DOUBLE_BOOKING',
           seance1: nouvelle_seance,
           seance2: seance_existante
         }
      FIN SI

   FIN SI

3. RETOURNER liste_conflits

─────────────────────────────────────────────────────────────────────────────────

FONCTION chevauchement_horaire(s1, s2):
   RETOURNER (s1.heureDebut < s2.heureFin) ET (s1.heureFin > s2.heureDebut)

─────────────────────────────────────────────────────────────────────────────────

Cas de chevauchement détectés:

    s1: |████████|
    s2:      |████████|     ✓ Chevauchement partiel début

    s1:      |████████|
    s2: |████████|          ✓ Chevauchement partiel fin

    s1: |████████████████|
    s2:      |████████|     ✓ s2 inclus dans s1

    s1:      |████████|
    s2: |████████████████|  ✓ s1 inclus dans s2

    s1: |████████|
    s2:          |████████| ✗ Pas de chevauchement (contigu)
```

### 6.2 Algorithme de Suggestion de Créneaux

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                   ALGORITHME DE SUGGESTION DE CRÉNEAUX                           │
└─────────────────────────────────────────────────────────────────────────────────┘

ENTRÉE: module, intervenant, période{debut, fin}, durée_souhaitée

CONFIGURATION:
  CRENEAUX_JOUR = [
    {debut: '08:00', fin: '10:00'},
    {debut: '10:15', fin: '12:00'},
    {debut: '14:00', fin: '16:00'},
    {debut: '16:15', fin: '18:00'}
  ]
  JOURS_OUVRABLES = [Lundi, Mardi, Mercredi, Jeudi, Vendredi]

1. INITIALISER suggestions = []

2. date_courante = période.debut

3. TANT QUE date_courante <= période.fin ET |suggestions| < limite:

   SI jour_semaine(date_courante) DANS JOURS_OUVRABLES ALORS
   SI NON est_vacances(date_courante) ALORS

      seances_jour = RECHERCHER séances WHERE
        - date = date_courante
        - intervenantId = intervenant.id
        - status != 'ANNULE'

      POUR CHAQUE creneau DANS CRENEAUX_JOUR:

        SI durée(creneau) >= durée_souhaitée ALORS

          conflit = FAUX
          POUR CHAQUE seance DANS seances_jour:
            SI chevauchement_horaire(creneau, seance) ALORS
              conflit = VRAI
              SORTIR
            FIN SI
          FIN POUR

          SI NON conflit ALORS
            score = calculer_score(creneau, module, intervenant, seances_jour)
            AJOUTER suggestions {
              date: date_courante,
              heureDebut: creneau.debut,
              heureFin: ajuster_fin(creneau.debut, durée_souhaitée),
              score: score,
              recommandation: generer_recommandation(score)
            }
          FIN SI

        FIN SI
      FIN POUR

   FIN SI
   FIN SI

   date_courante = date_courante + 1 jour

4. TRIER suggestions PAR score DESC

5. RETOURNER suggestions
```

---

## 7. Déploiement

### 7.1 Environnements

| Environnement | URL | Base de données | Description |
|---------------|-----|-----------------|-------------|
| **Development** | localhost:3000 | bem_planning_dev | Développement local |
| **Staging** | staging.app.com | bem_planning_staging | Tests pré-production |
| **Production** | app.com | bem_planning_prod | Environnement live |

### 7.2 Variables d'Environnement

```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/bem_planning_fc"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-securise-genere-aleatoirement"
GOOGLE_CLIENT_ID="votre-google-client-id"
GOOGLE_CLIENT_SECRET="votre-google-client-secret"
NODE_ENV="development"
```

### 7.3 Diagramme de Déploiement

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ARCHITECTURE DE DÉPLOIEMENT                            │
└─────────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │    Internet     │
                              └────────┬────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │   CDN / Proxy   │
                              │    (Vercel)     │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
           ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
           │   Instance    │  │   Instance    │  │   Instance    │
           │   Next.js     │  │   Next.js     │  │   Next.js     │
           │   (Edge)      │  │   (Edge)      │  │   (Edge)      │
           └───────┬───────┘  └───────┬───────┘  └───────┬───────┘
                   │                  │                  │
                   └──────────────────┼──────────────────┘
                                      │
                                      ▼
                              ┌───────────────┐
                              │  Connection   │
                              │    Pooler     │
                              │   (PgBouncer) │
                              └───────┬───────┘
                                      │
                                      ▼
                              ┌───────────────┐
                              │  PostgreSQL   │
                              │   Database    │
                              │   (Managed)   │
                              └───────────────┘
```

### 7.4 Scripts de Déploiement

```bash
# Installation des dépendances
npm install

# Génération du client Prisma
npx prisma generate

# Application des migrations
npx prisma migrate deploy

# Build de l'application
npm run build

# Démarrage en production
npm start
```

---

## 8. Performance et Optimisation

### 8.1 Stratégies d'Optimisation

| Aspect | Stratégie | Implémentation |
|--------|-----------|----------------|
| **Rendu** | SSR + Hydratation | Next.js automatic |
| **Images** | Optimisation auto | next/image |
| **CSS** | Purge unused | Tailwind CSS |
| **Bundle** | Code splitting | Next.js automatic |
| **Cache** | Static Generation | getStaticProps |
| **DB Queries** | Connexion pooling | Prisma singleton |
| **Indexes** | B-tree sur FK | Prisma schema |

### 8.2 Métriques Cibles

| Métrique | Cible | Mesure |
|----------|-------|--------|
| **LCP** (Largest Contentful Paint) | < 2.5s | Core Web Vitals |
| **FID** (First Input Delay) | < 100ms | Core Web Vitals |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Core Web Vitals |
| **TTFB** (Time to First Byte) | < 600ms | Server response |
| **API Response** | < 200ms | p95 latency |

---

## 9. Conclusion

Cette architecture technique permet de construire une application performante, sécurisée et maintenable pour la gestion des plannings de formation continue. Les choix technologiques (Next.js, Prisma, PostgreSQL) offrent un excellent compromis entre productivité de développement et performances en production.

**Points forts de l'architecture :**
- Rendu hybride (SSR/CSR) pour une UX optimale
- API REST standardisée et documentée
- Sécurité multicouche (auth, validation, isolation)
- Algorithmes de planification efficaces
- Scalabilité horizontale possible
