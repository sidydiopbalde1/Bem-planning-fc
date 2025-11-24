# 🎓 BEM Planning FC - Système de Gestion des Plannings de Formation Continue

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1-blue)](https://reactjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.16-2D3748)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Plateforme web de gestion et d'optimisation des plannings de formation continue avec détection automatique des conflits et suggestion intelligente de créneaux.

---

## 📋 Table des Matières

- [Aperçu](#-aperçu)
- [Fonctionnalités](#-fonctionnalités)
- [Installation Rapide](#-installation-rapide)
- [Documentation](#-documentation)
- [Structure du Projet](#-structure-du-projet)
- [Utilisation](#-utilisation)
- [Commandes](#-commandes)
- [Technologies](#-technologies)

---

## 🎯 Aperçu

**BEM Planning FC** est une solution complète développée dans le cadre d'un mémoire de Licence 3 Informatique. Le système permet de gérer efficacement les plannings de formation continue en automatisant la détection des conflits et en optimisant l'utilisation des ressources.

### Problématique Résolue

✅ Élimination des doubles-bookings d'intervenants et de salles
✅ Optimisation automatique des emplois du temps
✅ Centralisation de toute l'information pédagogique
✅ Traçabilité complète des actions (audit log)
✅ Reporting et statistiques en temps réel

---

## ✨ Fonctionnalités

### 🏠 Tableau de Bord Interactif

- Vue d'ensemble avec statistiques en temps réel
- Cartes de progression des programmes
- Alertes et notifications automatiques
- Actions rapides (création, recherche)

### 📚 Gestion des Ressources

- **Programmes** : Création et suivi des maquettes pédagogiques
- **Modules** : Gestion des UE avec volumes horaires (CM/TD/TP/TPE)
- **Intervenants** : Base de données avec disponibilités et contraintes horaires
- **Salles** : Référentiel des salles et équipements

### 🤖 Planning Intelligent

- **Suggestion automatique** : Algorithme de scoring pour proposer les meilleurs créneaux
- **Génération de planning** : Création automatique d'emploi du temps pour un module
- **Détection de conflits** : Vérification en temps réel des chevauchements
- **Résolution assistée** : Suggestions intelligentes pour résoudre les conflits

### 📊 Statistiques Avancées

- **Vue globale** : Indicateurs clés de performance (KPIs)
- **Analyse intervenants** : Charge de travail, taux de réalisation, surcharges
- **Occupation salles** : Taux d'utilisation des ressources
- **Performance** : Suivi des objectifs mensuels et hebdomadaires

### 🔐 Sécurité

- Authentification NextAuth.js avec JWT
- Gestion des rôles (ADMIN, COORDINATOR, TEACHER)
- Audit log complet (traçabilité des actions)
- Isolation des données par utilisateur

---

## 🚀 Installation Rapide

### Prérequis

- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- npm ou yarn

### Installation

```bash
# 1. Cloner le projet
git clone https://github.com/votre-username/bem-planning-fc.git
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

---

## 📚 Documentation

La documentation technique complète se trouve dans `docs/memoire/` :

| Document | Description |
|----------|-------------|
| [Synthèse du Projet](docs/memoire/00-synthese-projet.md) | Vue d'ensemble, objectifs, résultats |
| [Diagrammes UML](docs/memoire/01-diagrammes-uml.md) | Cas d'utilisation, Classes, Séquence, Activité, États |
| [MCD/MLD](docs/memoire/02-mcd-mld.md) | Modèle Conceptuel et Logique de Données |
| [Dictionnaire de Données](docs/memoire/03-dictionnaire-donnees.md) | Description complète des tables |
| [Architecture Technique](docs/memoire/04-architecture-technique.md) | Stack, sécurité, déploiement |
| [Guide Migration BDD](docs/memoire/05-guide-migration-bdd.md) | Procédure de migration Prisma |

---

## 🏗️ Structure du Projet

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
│   ├── auth/               # Pages authentification
│   ├── dashboard/          # Tableau de bord
│   ├── programmes/         # Gestion programmes
│   ├── intervenants/       # Gestion intervenants
│   ├── calendar/           # Vue calendrier
│   ├── statistics/         # Page statistiques
│   └── settings/           # Paramètres
│
├── prisma/                 # Configuration Prisma
│   ├── schema.prisma       # Schéma de données (basé sur MLD)
│   └── migrations/         # Historique migrations
│
├── lib/                    # Utilitaires
│   ├── prisma.js           # Client Prisma singleton
│   ├── auth.js             # Helpers authentification
│   └── utils.js            # Fonctions utilitaires
│
├── docs/                   # Documentation
│   └── memoire/            # Documentation mémoire L3
│
└── styles/                 # CSS globaux
    └── globals.css         # Tailwind CSS
```

---

## 💻 Utilisation

### Créer un Premier Programme

1. Se connecter à l'application
2. Aller dans **Programmes** → **Nouveau Programme**
3. Remplir les informations (code, nom, semestre, niveau, dates)
4. Ajouter des modules avec les volumes horaires
5. Assigner des intervenants
6. Sauvegarder

### Planifier des Séances

#### Méthode Manuelle
1. Sélectionner un module
2. **Nouvelle Séance** → Choisir date, horaires, type, salle
3. Le système détecte automatiquement les conflits
4. Confirmer ou ajuster

#### Méthode Automatique
1. Sélectionner un module
2. **Générer Planning** → Configurer les préférences
3. Le système propose un planning optimisé avec score
4. Valider le planning généré

### Consulter les Statistiques

1. Menu → **Statistiques**
2. Choisir le type d'analyse :
   - **Vue globale** : Indicateurs généraux
   - **Intervenants** : Charge de travail détaillée
   - **Performance** : KPIs mensuels/hebdomadaires
   - **Planning** : Distribution temporelle
3. Exporter les données (JSON)

---

## 🔧 Commandes

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
npx prisma migrate reset    # Reset complet (DANGER)
```

### Migration vers le Nouveau Schéma

```bash
# Sauvegarder la BDD
pg_dump -U user bem_planning_fc > backup.sql

# Appliquer le nouveau schéma MLD
npx prisma generate
npx prisma migrate dev --name migration_vers_mld_complet

# Voir docs/memoire/05-guide-migration-bdd.md pour détails
```

---

## 🛠️ Technologies

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

## 📊 API Endpoints

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

## 🚢 Déploiement

### Vercel (Recommandé)

```bash
# 1. Installer Vercel CLI
npm i -g vercel

# 2. Se connecter
vercel login

# 3. Déployer
vercel

# 4. Production
vercel --prod
```

**Configuration Vercel :**
- Ajouter les variables d'environnement dans le dashboard
- PostgreSQL : Utiliser Vercel Postgres ou service externe (Supabase, Neon)

### Docker

```bash
# Build
docker build -t bem-planning-fc .

# Run
docker run -p 3000:3000 -e DATABASE_URL="..." bem-planning-fc
```

### VPS Manuel

```bash
# Sur le serveur
git clone <repo>
npm install
npm run build
pm2 start npm --name "bem-planning" -- start
```

---

## 🎓 Contexte Académique

Ce projet a été développé dans le cadre d'un **mémoire de Licence 3 Informatique** avec pour thématique :

> **"Conception et Réalisation d'un Système de Gestion et d'Optimisation des Plannings de Formation Continue"**

### Objectifs du Mémoire

1. Concevoir un système de gestion de planning intelligent
2. Implémenter des algorithmes de détection et résolution de conflits
3. Développer une architecture moderne et scalable
4. Produire une documentation technique complète (UML, MCD/MLD)

### Livrables

- ✅ Application web fonctionnelle
- ✅ Documentation UML complète (7 diagrammes)
- ✅ Modèle Conceptuel et Logique de Données
- ✅ Dictionnaire de données exhaustif
- ✅ Architecture technique documentée
- ✅ Code source commenté et structuré

---

## 📞 Support & Contact

- 📖 **Documentation** : `/docs/memoire/`
- 🐛 **Issues** : [GitHub Issues](https://github.com/votre-username/bem-planning-fc/issues)
- 📧 **Email** : votre-email@example.com

---

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 🙏 Remerciements

- **Encadrant académique** : [Nom]
- **Technologies open source** : Next.js, Prisma, Tailwind CSS
- **Communauté** : Stack Overflow, GitHub

---

<div align="center">

**Développé avec ❤️ pour la gestion intelligente des plannings de formation**

*Année Académique 2024-2025*

</div>
