# Gestion de Projet - BEM Planning FC

## Vue d'ensemble

| Aspect | Détail |
|--------|--------|
| **Projet** | BEM Planning FC - Plateforme de gestion de formation continue |
| **Frontend** | Next.js 14 + React + Tailwind CSS |
| **Backend** | NestJS (migration prévue) |
| **Base de données** | PostgreSQL + Prisma ORM |
| **Authentification** | NextAuth.js |
| **Gestion de projet** | Trello |

---

## 1. Organisation Trello

### 1.1 Structure du Tableau Principal

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        BEM Planning FC - Development                             │
├──────────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────┤
│   BACKLOG    │   À FAIRE    │  EN COURS    │   REVIEW     │    TEST      │ DONE │
│              │  (Sprint)    │              │              │              │      │
├──────────────┼──────────────┼──────────────┼──────────────┼──────────────┼──────┤
│ Idées et     │ Tâches       │ Tâches en    │ En attente   │ En phase     │Livré │
│ fonctions    │ planifiées   │ développe-   │ de code      │ de test      │      │
│ futures      │ pour le      │ ment actif   │ review       │ QA           │      │
│              │ sprint       │              │              │              │      │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────┘
```

### 1.2 Système de Labels (Étiquettes)

#### Par Type de Tâche
| Label | Couleur | Description |
|-------|---------|-------------|
| `feature` | 🟢 Vert | Nouvelle fonctionnalité |
| `bug` | 🔴 Rouge | Correction de bug |
| `enhancement` | 🔵 Bleu | Amélioration existante |
| `refactor` | 🟣 Violet | Refactoring code |
| `docs` | 🟡 Jaune | Documentation |
| `test` | 🟠 Orange | Tests unitaires/E2E |
| `ui/ux` | 🩷 Rose | Interface utilisateur |

#### Par Priorité
| Label | Couleur | Description |
|-------|---------|-------------|
| `P0 - Critique` | 🔴 Rouge foncé | Bloquant, à traiter immédiatement |
| `P1 - Haute` | 🟠 Orange | Important, sprint actuel |
| `P2 - Moyenne` | 🟡 Jaune | NorMis à jour 10/01/2026mal, peut attendre |
| `P3 - Basse` | 🟢 Vert clair | Nice-to-have |

#### Par Module/Domaine
| Label | Description |
|-------|-------------|
| `module:programmes` | Gestion des programmes |
| `module:modules` | Gestion des modules de formation |
| `module:intervenants` | Gestion des intervenants |
| `module:seances` | Gestion des séances |
| `module:calendar` | Calendrier et planning |
| `module:evaluations` | Évaluations des enseignements |
| `module:admin` | Administration système |
| `module:auth` | Authentification et sécurité |
| `backend:nestjs` | Tâches backend NestJS |
| `frontend:next` | Tâches frontend Next.js |

### 1.3 Template de Carte Trello

```markdown
## Description
[Description claire et concise de la tâche]

## Critères d'acceptation
- [ ] Critère 1
- [ ] Critère 2
- [ ] Critère 3

## Spécifications techniques
- **Fichiers concernés**: `pages/xxx`, `components/xxx`
- **API endpoints**: `GET /api/xxx`, `POST /api/xxx`
- **Base de données**: Tables concernées

## Maquettes / Références
[Liens vers Figma, screenshots, etc.]

## Notes
[Informations supplémentaires]
```

### 1.4 Workflow Kanban

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   BACKLOG   │───▶│   À FAIRE   │───▶│  EN COURS   │───▶│   REVIEW    │───▶│    DONE     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                         │                   │                  │
                         ▼                   ▼                  ▼
                   Assignation         Dev commence       PR créée et
                   + Estimation        + Branche créée    review demandée
```

#### Règles de transition

| De → Vers | Condition |
|-----------|-----------|
| Backlog → À Faire | Tâche priorisée et estimée |
| À Faire → En Cours | Développeur assigné, branche créée |
| En Cours → Review | Code terminé, PR créée |
| Review → Test | Code review approuvée |
| Test → Done | Tests QA passés, déployé |

### 1.5 Sprints

| Paramètre | Valeur |
|-----------|--------|
| **Durée** | 2 semaines |
| **Planning** | Lundi matin (1h) |
| **Daily Standup** | Quotidien 9h30 (15min) |
| **Review** | Vendredi fin de sprint (1h) |
| **Rétrospective** | Vendredi fin de sprint (30min) |

---

## 2. Documentation Équipe

### 2.1 Rôles et Responsabilités

#### Product Owner (PO)
| Responsabilité | Description |
|----------------|-------------|
| Vision produit | Définir la roadmap et les priorités |
| Backlog | Maintenir et prioriser le backlog |
| Validation | Valider les fonctionnalités livrées |
| Stakeholders | Communiquer avec les parties prenantes |

#### Tech Lead
| Responsabilité | Description |
|----------------|-------------|
| Architecture | Décisions techniques et architecture |
| Code Review | Reviewer principal des PRs |
| Standards | Définir et maintenir les standards de code |
| Mentoring | Accompagner l'équipe technique |

#### Développeur Frontend
| Responsabilité | Description |
|----------------|-------------|
| UI/UX | Implémenter les interfaces utilisateur |
| Components | Créer des composants React réutilisables |
| Intégration | Intégrer les APIs backend |
| Tests | Écrire les tests frontend |

#### Développeur Backend
| Responsabilité | Description |
|----------------|-------------|
| APIs | Développer les endpoints REST |
| Database | Gérer le schéma et les migrations |
| Sécurité | Implémenter l'authentification/autorisation |
| Performance | Optimiser les requêtes et le cache |

#### QA / Testeur
| Responsabilité | Description |
|----------------|-------------|
| Tests | Exécuter les tests fonctionnels |
| Bugs | Documenter et suivre les bugs |
| Validation | Valider avant mise en production |
| Documentation | Maintenir les cas de test |

### 2.2 Processus de Développement

#### 2.2.1 Création de Branche

```bash
# Convention de nommage
feature/[ticket-id]-description-courte
bugfix/[ticket-id]-description-courte
hotfix/[ticket-id]-description-courte
refactor/[ticket-id]-description-courte

# Exemples
feature/BEM-42-ajout-pagination-modules
bugfix/BEM-56-fix-modal-creation
hotfix/BEM-99-correction-auth-critique
```

#### 2.2.2 Convention de Commits

```bash
# Format
type(scope): description courte

# Types
feat:     Nouvelle fonctionnalité
fix:      Correction de bug
docs:     Documentation
style:    Formatage (pas de changement de code)
refactor: Refactoring
test:     Ajout de tests
chore:    Maintenance

# Exemples
feat(modules): ajouter pagination sur la liste
fix(auth): corriger redirection après login
docs(readme): mettre à jour instructions installation
refactor(api): simplifier middleware authentification
```

#### 2.2.3 Processus de Pull Request

```
1. CRÉATION PR
   ├── Titre descriptif avec numéro ticket
   ├── Description complète
   ├── Lien vers la carte Trello
   └── Screenshots si UI

2. REVIEW
   ├── Au moins 1 approbation requise
   ├── Tous les checks CI passés
   ├── Pas de conflits
   └── Code coverage maintenu

3. MERGE
   ├── Squash and merge (préféré)
   ├── Supprimer la branche après merge
   └── Déplacer la carte Trello → Test
```

#### Template PR

```markdown
## Description
[Résumé des changements]

## Type de changement
- [ ] Nouvelle fonctionnalité
- [ ] Correction de bug
- [ ] Refactoring
- [ ] Documentation

## Carte Trello
[Lien vers la carte]

## Comment tester
1. Étape 1
2. Étape 2
3. Étape 3

## Captures d'écran
[Si applicable]

## Checklist
- [ ] Mon code suit les conventions du projet
- [ ] J'ai testé localement
- [ ] J'ai ajouté des tests si nécessaire
- [ ] La documentation est à jour
```

### 2.3 Communication

#### Canaux de Communication

| Canal | Usage |
|-------|-------|
| **Slack/Discord #general** | Annonces générales |
| **Slack/Discord #dev** | Discussions techniques |
| **Slack/Discord #bugs** | Signalement de bugs |
| **Trello** | Suivi des tâches |
| **GitHub** | Code reviews et PRs |
| **Meet/Zoom** | Réunions synchrones |

#### Rituels d'Équipe

| Rituel | Fréquence | Durée | Participants | Objectif |
|--------|-----------|-------|--------------|----------|
| Daily Standup | Quotidien | 15 min | Tous | Sync rapide |
| Sprint Planning | Bi-hebdo | 1h | Tous | Planifier le sprint |
| Sprint Review | Bi-hebdo | 1h | Tous + PO | Démo des livrables |
| Rétrospective | Bi-hebdo | 30 min | Équipe dev | Amélioration continue |
| Tech Review | Hebdo | 1h | Tech team | Architecture et dette |

#### Format Daily Standup

```
1. Qu'ai-je fait hier ?
2. Que vais-je faire aujourd'hui ?
3. Y a-t-il des bloquants ?
```

### 2.4 Environnements

| Environnement | URL | Usage | Déploiement |
|---------------|-----|-------|-------------|
| **Local** | localhost:3000 | Développement | Manuel |
| **Development** | dev.bem-planning.com | Tests internes | Auto (push main) |
| **Staging** | staging.bem-planning.com | Validation PO | Manuel |
| **Production** | bem-planning.com | Utilisateurs finaux | Manuel + Approval |

### 2.5 Accès et Permissions

| Rôle | GitHub | Trello | Serveurs | BDD |
|------|--------|--------|----------|-----|
| Tech Lead | Admin | Admin | Tous | Tous |
| Dev Senior | Write | Write | Dev/Staging | Dev/Staging |
| Dev Junior | Write | Write | Dev | Dev (lecture) |
| QA | Read | Write | Staging | Staging (lecture) |
| PO | Read | Admin | - | - |

---

## 3. Standards de Code

### 3.1 Structure du Projet

```
bem-planning-fc/
├── components/          # Composants React réutilisables
│   ├── ui/             # Composants UI de base
│   ├── modals/         # Modals
│   ├── forms/          # Formulaires
│   └── layout.js       # Layout principal
├── pages/              # Routes Next.js
│   ├── api/            # API Routes
│   ├── admin/          # Pages admin
│   ├── coordinateur/   # Pages coordinateur
│   └── ...
├── lib/                # Utilitaires et configurations
├── hooks/              # Custom React hooks
├── contexts/           # React contexts
├── prisma/             # Schéma et migrations
├── public/             # Assets statiques
└── docs/               # Documentation
```

### 3.2 Conventions de Nommage

| Élément | Convention | Exemple |
|---------|------------|---------|
| Composants | PascalCase | `UserCard.js` |
| Hooks | camelCase + use | `useAuth.js` |
| Pages | kebab-case | `user-profile.js` |
| API Routes | kebab-case | `get-users.js` |
| Variables | camelCase | `userName` |
| Constantes | UPPER_SNAKE | `MAX_ITEMS` |
| CSS Classes | kebab-case | `user-card` |

### 3.3 Règles ESLint Principales

```javascript
// .eslintrc.js (règles clés)
{
  "rules": {
    "no-console": "warn",           // Éviter console.log
    "no-unused-vars": "error",      // Pas de variables inutilisées
    "react/prop-types": "off",      // Pas de PropTypes (TypeScript prévu)
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

---

## 4. Checklist de Livraison

### Avant de passer en Review

- [ ] Code fonctionnel et testé localement
- [ ] Pas d'erreurs ESLint
- [ ] Pas de `console.log` oubliés
- [ ] Responsive vérifié (mobile/desktop)
- [ ] Dark mode vérifié (si applicable)
- [ ] API errors gérées
- [ ] Loading states implémentés

### Avant mise en production

- [ ] Tests QA passés
- [ ] Performance vérifiée
- [ ] Sécurité vérifiée
- [ ] Documentation mise à jour
- [ ] Migrations DB exécutées
- [ ] Variables d'environnement configurées
- [ ] Backup effectué

---

## 5. Contacts

| Rôle | Nom | Contact |
|------|-----|---------|
| Product Owner | [À définir] | [email] |
| Tech Lead | [À définir] | [email] |
| Dev Frontend | [À définir] | [email] |
| Dev Backend | [À définir] | [email] |

---

*Dernière mise à jour : Janvier 2026*
