# Fonctionnalités Administrateur - BEM Planning FC

## 📋 Vue d'ensemble

Ce document détaille les fonctionnalités administrateur développées pour le système BEM Planning FC. Ces fonctionnalités permettent aux administrateurs de gérer les utilisateurs du système et de contrôler les accès.

---

## ✅ Fonctionnalités Développées

### 1. Middleware d'Autorisation Basé sur les Rôles

**Fichier:** `/lib/middleware/requireRole.js`

#### Fonctionnalités

- **`requireRole(allowedRoles)`** - Middleware générique pour vérifier les rôles
- **`requireAdmin()`** - Middleware simplifié pour admin uniquement
- **`requireCoordinator()`** - Middleware pour admin ou coordinateur
- **`requireAuth()`** - Middleware pour vérifier uniquement l'authentification

#### Sécurité

- Vérification automatique de la session NextAuth
- Réponse HTTP 401 pour utilisateurs non authentifiés
- Réponse HTTP 403 pour utilisateurs sans permissions
- Injection de `req.user` et `req.session` pour utilisation dans les handlers

#### Logging

- **`logActivity()`** - Helper pour enregistrer les actions dans le journal
- **`getClientIp()`** - Extraction de l'adresse IP du client
- Capture automatique du User-Agent

#### Exemple d'utilisation

```javascript
import { requireAdmin } from '../../../../lib/middleware/requireRole';

async function handler(req, res) {
  // Votre logique ici - l'utilisateur est garanti être un admin
}

export default function (req, res) {
  return requireAdmin(req, res, handler);
}
```

---

### 2. API de Gestion des Utilisateurs

#### Endpoint: GET /api/admin/users

**Description:** Récupère la liste de tous les utilisateurs

**Paramètres de requête:**
- `search` (string, optionnel) - Recherche par nom ou email
- `role` (ADMIN|COORDINATOR|TEACHER, optionnel) - Filtre par rôle
- `sortBy` (string, optionnel, défaut: 'createdAt') - Champ de tri
- `order` (asc|desc, optionnel, défaut: 'desc') - Ordre de tri

**Réponse:**
```json
{
  "users": [
    {
      "id": "cuid",
      "email": "admin@bem.sn",
      "name": "Admin BEM",
      "role": "ADMIN",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z",
      "_count": {
        "programmes": 5,
        "modules": 12
      }
    }
  ],
  "stats": {
    "total": 10,
    "byRole": {
      "ADMIN": 2,
      "COORDINATOR": 3,
      "TEACHER": 5
    }
  }
}
```

#### Endpoint: POST /api/admin/users

**Description:** Crée un nouvel utilisateur

**Body:**
```json
{
  "email": "nouveau@bem.sn",
  "name": "Nouveau Utilisateur",
  "password": "motdepasse123",
  "role": "TEACHER"
}
```

**Validations:**
- Email unique
- Mot de passe minimum 8 caractères
- Rôle valide (ADMIN, COORDINATOR, TEACHER)
- Hash bcrypt du mot de passe (12 rounds)

**Réponse:**
```json
{
  "message": "Utilisateur créé avec succès",
  "user": {
    "id": "cuid",
    "email": "nouveau@bem.sn",
    "name": "Nouveau Utilisateur",
    "role": "TEACHER",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

#### Endpoint: GET /api/admin/users/[id]

**Description:** Récupère les détails d'un utilisateur

**Réponse:**
```json
{
  "user": {
    "id": "cuid",
    "email": "user@bem.sn",
    "name": "Utilisateur",
    "role": "COORDINATOR",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z",
    "_count": {
      "programmes": 3,
      "modules": 7
    },
    "programmes": [...],
    "modules": [...]
  }
}
```

#### Endpoint: PUT /api/admin/users/[id]

**Description:** Met à jour un utilisateur

**Body:**
```json
{
  "email": "newemail@bem.sn",
  "name": "Nom Modifié",
  "role": "COORDINATOR",
  "password": "nouveaumotdepasse" // optionnel
}
```

**Protections:**
- Un admin ne peut pas modifier son propre rôle
- Validation de l'unicité de l'email
- Mot de passe optionnel (conservé si non fourni)

**Réponse:**
```json
{
  "message": "Utilisateur mis à jour avec succès",
  "user": {...},
  "changes": [
    "nom: Ancien Nom → Nom Modifié",
    "rôle: TEACHER → COORDINATOR"
  ]
}
```

#### Endpoint: DELETE /api/admin/users/[id]

**Description:** Supprime un utilisateur

**Paramètres de requête:**
- `force=true` (optionnel) - Force la suppression même si l'utilisateur a des données

**Protections:**
- Un admin ne peut pas se supprimer lui-même
- Impossible de supprimer le dernier administrateur
- Confirmation requise si l'utilisateur a des données associées

**Réponse:**
```json
{
  "message": "Utilisateur supprimé avec succès",
  "deletedUser": {
    "id": "cuid",
    "email": "deleted@bem.sn",
    "name": "Utilisateur Supprimé"
  }
}
```

---

### 3. Interface Web de Gestion des Utilisateurs

**Route:** `/admin/users`

**Fichier:** `/pages/admin/users.js`

#### Fonctionnalités

##### Vue d'ensemble
- **Statistiques en temps réel** - Total, admins, coordinateurs, enseignants
- **Liste des utilisateurs** - Tableau avec pagination et tri
- **Recherche** - Par nom ou email
- **Filtres** - Par rôle (tous, admin, coordinateur, enseignant)

##### Actions disponibles

1. **Créer un utilisateur**
   - Modal avec formulaire complet
   - Validation côté client
   - Confirmation du mot de passe
   - Sélection du rôle

2. **Modifier un utilisateur**
   - Modal pré-rempli
   - Modification de l'email, nom, rôle
   - Changement de mot de passe optionnel
   - Validation en temps réel

3. **Supprimer un utilisateur**
   - Confirmation avant suppression
   - Avertissement si données associées
   - Protection contre l'auto-suppression

##### Affichage des utilisateurs

- **Avatar** - Initiale sur fond dégradé
- **Informations** - Nom, email
- **Badge de rôle** - Coloré selon le rôle (violet pour admin, bleu pour coordinateur, vert pour enseignant)
- **Ressources** - Nombre de programmes et modules
- **Date de création** - Format français
- **Actions** - Boutons modifier et supprimer

##### Sécurité

- Accessible uniquement aux administrateurs (vérification côté client et serveur)
- Redirection automatique si non-admin
- Désactivation des boutons pendant les opérations
- Gestion des erreurs avec messages explicites

---

### 4. Navigation Administrateur

**Fichier modifié:** `/components/layout.js`

#### Changements

- Ajout de l'import `ShieldCheck` pour l'icône admin
- Section "Administration" dans le menu latéral
- Visible uniquement pour les utilisateurs avec rôle ADMIN
- Style distinct (fond violet) pour différencier des autres sections
- Lien vers "Gestion des Utilisateurs"

#### Comportement

```javascript
const adminNavigation = session?.user?.role === 'ADMIN' ? [
  { name: 'Gestion des Utilisateurs', href: '/admin/users', icon: ShieldCheck },
] : [];
```

---

## 🔒 Sécurité Implémentée

### 1. Authentification et Autorisation

- ✅ Middleware de vérification des rôles sur tous les endpoints admin
- ✅ Vérification de session NextAuth
- ✅ Protection contre l'élévation de privilèges
- ✅ Isolation des données par userId

### 2. Validation des Données

- ✅ Validation des emails (unicité, format)
- ✅ Validation des mots de passe (longueur minimale 8 caractères)
- ✅ Validation des rôles (enum strict)
- ✅ Sanitization des entrées utilisateur

### 3. Hachage des Mots de Passe

- ✅ Bcrypt avec 12 rounds de salage
- ✅ Jamais de stockage en clair
- ✅ Vérification sécurisée avec bcrypt.compare()

### 4. Logging et Audit

- ✅ Enregistrement de toutes les actions dans `JournalActivite`
- ✅ Capture de l'adresse IP
- ✅ Capture du User-Agent
- ✅ Traçabilité complète (qui a fait quoi, quand)

### 5. Protections Métier

- ✅ Impossible de supprimer le dernier admin
- ✅ Impossible de modifier son propre rôle
- ✅ Impossible de se supprimer soi-même
- ✅ Confirmation requise pour suppression avec données

---

## 🎨 Interface Utilisateur

### Design

- **Framework:** Tailwind CSS avec mode sombre
- **Icônes:** Lucide React
- **Animations:** PageTransition avec AnimatedCard et SlideIn
- **Responsive:** Mobile-first design

### Composants

1. **StatCard** - Cartes de statistiques animées
2. **CreateUserModal** - Modal de création d'utilisateur
3. **EditUserModal** - Modal d'édition d'utilisateur
4. **Tableau utilisateurs** - Liste avec actions

### UX

- Loading states pendant les opérations
- Messages d'erreur explicites
- Confirmations pour actions destructives
- Feedback visuel immédiat
- Recherche et filtres en temps réel

---

## 📊 Journal d'Activités

### Actions Enregistrées

Toutes les opérations admin sont enregistrées dans la table `JournalActivite` :

| Action | Type | Données capturées |
|--------|------|-------------------|
| Création utilisateur | CREATION | Email, nom, rôle |
| Modification utilisateur | MODIFICATION | Ancienne valeur → Nouvelle valeur |
| Suppression utilisateur | SUPPRESSION | Email, nom, rôle |
| Connexion | CONNEXION | IP, User-Agent |

### Structure de log

```javascript
{
  action: 'CREATION',
  entite: 'User',
  entiteId: 'cuid',
  description: 'Création de l\'utilisateur admin@bem.sn avec le rôle ADMIN',
  ancienneValeur: null,
  nouvelleValeur: JSON.stringify({...}),
  userId: 'admin-id',
  userName: 'Admin Principal',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  createdAt: '2025-01-01T00:00:00Z'
}
```

---

## 🚀 Utilisation

### Prérequis

1. Base de données Prisma avec modèle User et JournalActivite
2. NextAuth configuré avec session JWT
3. Rôle ADMIN attribué à au moins un utilisateur

### Accès

1. Se connecter avec un compte administrateur
2. Naviguer vers "Gestion des Utilisateurs" dans le menu latéral
3. La page `/admin/users` s'affiche avec la liste complète

### Opérations

#### Créer un utilisateur

1. Cliquer sur "Nouvel Utilisateur"
2. Remplir le formulaire (email, nom, rôle, mot de passe)
3. Confirmer le mot de passe
4. Cliquer sur "Créer"

#### Modifier un utilisateur

1. Cliquer sur l'icône ✏️ (Edit2)
2. Modifier les champs souhaités
3. Optionnel : changer le mot de passe
4. Cliquer sur "Mettre à jour"

#### Supprimer un utilisateur

1. Cliquer sur l'icône 🗑️ (Trash2)
2. Confirmer la suppression
3. Si l'utilisateur a des données, confirmer une seconde fois avec `force=true`

---

## 📁 Structure des Fichiers

```
/lib/middleware/
  └── requireRole.js          # Middleware d'autorisation

/pages/api/admin/
  └── users/
      ├── index.js            # GET /api/admin/users (liste)
      │                       # POST /api/admin/users (création)
      └── [id].js             # GET /api/admin/users/:id (détails)
                              # PUT /api/admin/users/:id (modification)
                              # DELETE /api/admin/users/:id (suppression)

/pages/admin/
  └── users.js                # Interface web de gestion

/components/
  └── layout.js               # Navigation avec menu admin

/docs/
  └── ADMIN_FEATURES.md       # Ce document
```

---

## 🔄 Prochaines Étapes Possibles

### Fonctionnalités à développer (non incluses)

1. **Journal d'activités UI** - Interface pour consulter les logs
2. **Gestion des ressources** - Interface pour salles et périodes académiques
3. **Tableau de bord admin** - Vue d'ensemble du système
4. **Permissions granulaires** - Contrôle d'accès par fonctionnalité
5. **Réinitialisation de mot de passe** - Envoi d'email de réinitialisation
6. **Export de données** - Export CSV/Excel des utilisateurs
7. **Statistiques d'utilisation** - Métriques d'activité par utilisateur

---

## 🐛 Tests

### Scenarios à tester

#### Test 1 : Authentification admin
- [ ] Un utilisateur non-admin ne peut pas accéder à `/admin/users`
- [ ] Un utilisateur non authentifié est redirigé vers `/auth/signin`
- [ ] Un admin peut accéder à la page

#### Test 2 : Création d'utilisateur
- [ ] Email unique validé
- [ ] Mot de passe minimum 8 caractères
- [ ] Rôle correctement attribué
- [ ] Log créé dans JournalActivite

#### Test 3 : Modification d'utilisateur
- [ ] Changement d'email validé
- [ ] Mot de passe optionnel fonctionne
- [ ] Admin ne peut pas changer son propre rôle
- [ ] Log créé avec ancienne et nouvelle valeur

#### Test 4 : Suppression d'utilisateur
- [ ] Admin ne peut pas se supprimer
- [ ] Dernier admin ne peut pas être supprimé
- [ ] Confirmation requise si données associées
- [ ] Log créé

#### Test 5 : Recherche et filtres
- [ ] Recherche par email fonctionne
- [ ] Recherche par nom fonctionne
- [ ] Filtre par rôle fonctionne
- [ ] Résultats triés correctement

---

## 📝 Notes Techniques

### Performance

- Requêtes optimisées avec select Prisma
- Counts agrégés pour les statistiques
- Pas de N+1 queries

### Compatibilité

- Next.js 13+ (App Router ou Pages Router)
- React 18+
- NextAuth v4
- Prisma 5+
- Tailwind CSS 3+

### Limitations Connues

- Pas de pagination côté serveur (tous les utilisateurs chargés)
- Recherche case-insensitive simple (pas de recherche floue)
- Pas de gestion de sessions multiples
- Pas de 2FA implémenté

---

## 👥 Rôles et Permissions

| Rôle | Accès Admin UI | Créer Utilisateurs | Modifier Utilisateurs | Supprimer Utilisateurs |
|------|----------------|--------------------|-----------------------|------------------------|
| **ADMIN** | ✅ Oui | ✅ Oui | ✅ Oui | ✅ Oui (sauf soi-même) |
| **COORDINATOR** | ❌ Non | ❌ Non | ❌ Non | ❌ Non |
| **TEACHER** | ❌ Non | ❌ Non | ❌ Non | ❌ Non |

---

## 📧 Contact et Support

Pour toute question ou problème :
- Consulter la documentation : `/docs/`
- Vérifier les logs : Table `JournalActivite`
- Contacter l'équipe de développement

---

**Version:** 1.0
**Date:** 8 Décembre 2025
**Auteur:** Claude Code Assistant
