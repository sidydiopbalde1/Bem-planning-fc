# Guide de Démarrage Rapide - Administration

## 🚀 Démarrage en 5 Minutes

Ce guide vous permettra de configurer et utiliser rapidement les fonctionnalités administrateur.

---

## Étape 1 : Vérification des Prérequis

### 1.1 Vérifier la base de données

```bash
# Vérifier que Prisma est à jour
npx prisma generate
```

### 1.2 Vérifier qu'un administrateur existe

```bash
# Se connecter à la base de données et vérifier
npx prisma studio
```

Ouvrez la table `User` et vérifiez qu'au moins un utilisateur a le rôle `ADMIN`.

**Si aucun admin n'existe**, utilisez le seed :

```bash
npm run db:seed
```

Cela créera :
- Admin : `admin@bem.sn` / `password123`
- Coordinateur : `coordinateur@bem.sn` / `password123`
- Enseignant : `enseignant@bem.sn` / `password123`

---

## Étape 2 : Démarrer l'Application

```bash
# En mode développement
npm run dev

# Ou en mode production
npm run build
npm start
```

L'application sera accessible sur `http://localhost:3000`

---

## Étape 3 : Se Connecter en Tant qu'Admin

1. Ouvrez votre navigateur : `http://localhost:3000`
2. Si vous n'êtes pas connecté, allez sur `/auth/signin`
3. Connectez-vous avec :
   - **Email:** `admin@bem.sn`
   - **Mot de passe:** `password123`

---

## Étape 4 : Accéder à la Gestion des Utilisateurs

1. Dans le menu latéral, cherchez la section **"ADMINISTRATION"**
2. Cliquez sur **"Gestion des Utilisateurs"** (icône bouclier)
3. Vous accédez à `/admin/users`

**Vous devriez voir :**
- 4 cartes de statistiques (Total, Admins, Coordinateurs, Enseignants)
- Une barre de recherche et un filtre par rôle
- La liste de tous les utilisateurs

---

## Étape 5 : Opérations de Base

### Créer un Utilisateur

1. Cliquer sur le bouton **"Nouvel Utilisateur"** en haut à droite
2. Remplir le formulaire :
   ```
   Email: nouveau@bem.sn
   Nom: Nouveau Enseignant
   Rôle: Enseignant
   Mot de passe: monmotdepasse123
   Confirmer: monmotdepasse123
   ```
3. Cliquer sur **"Créer"**
4. L'utilisateur apparaît dans la liste

### Modifier un Utilisateur

1. Trouver l'utilisateur dans la liste
2. Cliquer sur l'icône **crayon (✏️)** à droite
3. Modifier les informations
4. Optionnel : changer le mot de passe
5. Cliquer sur **"Mettre à jour"**

### Rechercher un Utilisateur

1. Dans la barre de recherche, taper un nom ou email
2. Les résultats se filtrent automatiquement

### Filtrer par Rôle

1. Dans le menu déroulant "Filtre", sélectionner :
   - **Tous les rôles** (par défaut)
   - **Administrateurs**
   - **Coordinateurs**
   - **Enseignants**

### Supprimer un Utilisateur

1. Trouver l'utilisateur dans la liste
2. Cliquer sur l'icône **corbeille (🗑️)** à droite
3. Confirmer la suppression dans la popup
4. Si l'utilisateur a des données (programmes/modules), confirmer à nouveau

⚠️ **Limitations de suppression :**
- Vous ne pouvez pas vous supprimer vous-même
- Vous ne pouvez pas supprimer le dernier administrateur

---

## 🔍 Vérifications Rapides

### Test 1 : Vérifier les permissions

**Objectif :** S'assurer que seuls les admins peuvent accéder

```bash
# 1. Se connecter en tant qu'enseignant
# Email: enseignant@bem.sn
# Mot de passe: password123

# 2. Essayer d'accéder à /admin/users
# ✅ Vous devriez être redirigé vers /dashboard
```

### Test 2 : Vérifier le logging

```bash
# Ouvrir Prisma Studio
npx prisma studio

# Aller dans la table JournalActivite
# ✅ Vous devriez voir les logs de création/modification/suppression
```

### Test 3 : Vérifier la recherche

```bash
# 1. Aller sur /admin/users
# 2. Taper "admin" dans la recherche
# ✅ Seuls les utilisateurs avec "admin" dans nom/email s'affichent
```

---

## 📊 Comprendre l'Interface

### Statistiques (en haut)

```
┌─────────────┬──────────────┬───────────────────┬──────────────┐
│   Total     │    Admins    │  Coordinateurs    │  Enseignants │
│     10      │      2       │        3          │      5       │
└─────────────┴──────────────┴───────────────────┴──────────────┘
```

### Tableau Utilisateurs

| Colonne | Description |
|---------|-------------|
| **Utilisateur** | Avatar + Nom + Email |
| **Rôle** | Badge coloré (Violet=Admin, Bleu=Coord., Vert=Enseignant) |
| **Ressources** | Nombre de programmes et modules |
| **Créé le** | Date de création du compte |
| **Actions** | Boutons Modifier (✏️) et Supprimer (🗑️) |

### Badges de Rôle

| Rôle | Couleur | Icône |
|------|---------|-------|
| Administrateur | 🟣 Violet | 🛡️ ShieldCheck |
| Coordinateur | 🔵 Bleu | 📚 BookOpen |
| Enseignant | 🟢 Vert | 👤 User |

---

## 🛠️ Résolution de Problèmes

### Problème 1 : Le menu "Administration" n'apparaît pas

**Cause :** Vous n'êtes pas connecté en tant qu'admin

**Solution :**
1. Vérifier votre rôle : regarder dans Prisma Studio table `User`
2. Si votre rôle n'est pas `ADMIN`, le changer :
   ```sql
   UPDATE User SET role = 'ADMIN' WHERE email = 'votre@email.com';
   ```
3. Se déconnecter et se reconnecter

### Problème 2 : Erreur 403 "Accès refusé"

**Cause :** Votre session n'a pas le bon rôle

**Solution :**
1. Vider le cache du navigateur
2. Se déconnecter complètement
3. Se reconnecter avec un compte admin

### Problème 3 : "Email déjà utilisé"

**Cause :** L'email existe déjà dans la base

**Solution :**
1. Utiliser un email différent
2. Ou supprimer l'ancien utilisateur avec cet email

### Problème 4 : "Mot de passe trop court"

**Cause :** Le mot de passe doit contenir au moins 8 caractères

**Solution :**
1. Utiliser un mot de passe de 8+ caractères
2. Exemple : `motdepasse123`

### Problème 5 : La page ne charge pas

**Cause :** Erreur dans le code ou la base de données

**Solution :**
1. Vérifier la console du navigateur (F12)
2. Vérifier les logs du serveur (terminal)
3. Vérifier que la base de données est accessible

---

## 🔐 Sécurité - Bonnes Pratiques

### ✅ À FAIRE

- ✅ Changer les mots de passe par défaut immédiatement
- ✅ Utiliser des mots de passe forts (12+ caractères, avec symboles)
- ✅ Créer un compte admin personnel (ne pas utiliser `admin@bem.sn`)
- ✅ Limiter le nombre d'administrateurs
- ✅ Vérifier régulièrement le journal d'activités
- ✅ Supprimer les comptes inutilisés

### ❌ À NE PAS FAIRE

- ❌ Partager les identifiants admin
- ❌ Utiliser des mots de passe simples
- ❌ Donner le rôle admin à tout le monde
- ❌ Supprimer le dernier admin (impossible de toute façon)
- ❌ Oublier de vérifier les logs d'activité

---

## 📝 Checklist de Configuration Initiale

Utilisez cette checklist lors de la première installation :

- [ ] Base de données créée et migrée (`npx prisma migrate deploy`)
- [ ] Seed exécuté pour créer les utilisateurs de test (`npm run db:seed`)
- [ ] Application démarrée (`npm run dev` ou `npm start`)
- [ ] Connexion avec admin@bem.sn réussie
- [ ] Menu "Administration" visible dans la sidebar
- [ ] Page `/admin/users` accessible
- [ ] Test de création d'utilisateur réussi
- [ ] Test de modification d'utilisateur réussi
- [ ] Test de suppression d'utilisateur réussi
- [ ] Vérification des logs dans `JournalActivite`
- [ ] Changement des mots de passe par défaut
- [ ] Création d'un compte admin personnel

---

## 🎯 Scénarios d'Utilisation Courants

### Scénario 1 : Nouvelle Rentrée Académique

**Objectif :** Créer les comptes pour tous les nouveaux enseignants

1. Préparer la liste des nouveaux enseignants (Excel/CSV)
2. Pour chaque enseignant :
   - Cliquer sur "Nouvel Utilisateur"
   - Renseigner : email, nom, rôle=TEACHER
   - Générer un mot de passe temporaire
   - Noter le mot de passe pour l'envoyer à l'enseignant
3. Envoyer les identifiants par email sécurisé
4. Demander aux enseignants de changer leur mot de passe

### Scénario 2 : Promotion d'un Coordinateur

**Objectif :** Donner les droits de coordinateur à un enseignant

1. Trouver l'enseignant dans la liste
2. Cliquer sur l'icône ✏️
3. Changer le rôle de TEACHER à COORDINATOR
4. Cliquer sur "Mettre à jour"
5. Informer l'utilisateur de ses nouveaux droits

### Scénario 3 : Départ d'un Intervenant

**Objectif :** Désactiver/supprimer le compte d'un intervenant qui quitte

**Option 1 - Suppression définitive :**
1. Trouver l'utilisateur
2. Cliquer sur 🗑️
3. Confirmer la suppression
4. Si données associées, décider si on force ou non

**Option 2 - Désactivation (à implémenter) :**
_Actuellement non disponible - à développer_

### Scénario 4 : Audit de Sécurité

**Objectif :** Vérifier qui a fait quoi

1. Ouvrir Prisma Studio : `npx prisma studio`
2. Aller dans la table `JournalActivite`
3. Filtrer par :
   - `action` : CREATION, MODIFICATION, SUPPRESSION
   - `userId` : ID de l'utilisateur suspect
   - `createdAt` : Période à auditer
4. Analyser les actions effectuées

---

## 🚦 Prochaines Étapes

Maintenant que la gestion des utilisateurs fonctionne, vous pouvez :

1. **Personnaliser les rôles** - Ajouter des rôles spécifiques
2. **Implémenter les permissions granulaires** - Contrôle d'accès par fonctionnalité
3. **Créer l'interface du journal d'activités** - Consulter les logs depuis l'UI
4. **Ajouter la gestion des ressources** - Salles, périodes académiques
5. **Développer un tableau de bord admin** - Vue d'ensemble du système

---

## 📚 Documentation Complète

Pour plus de détails, consultez :
- [`ADMIN_FEATURES.md`](./ADMIN_FEATURES.md) - Documentation technique complète
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) - Architecture du système
- [`README.md`](../README.md) - Guide général du projet

---

## 💬 Support

En cas de problème :
1. Vérifier les logs du serveur (terminal)
2. Vérifier la console du navigateur (F12)
3. Consulter le `JournalActivite` dans Prisma Studio
4. Consulter la documentation technique

---

**Dernière mise à jour :** 8 Décembre 2025
**Version :** 1.0
