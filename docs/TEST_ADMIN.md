# Guide de Test - Fonctionnalités Administrateur

## 🧪 Suite de Tests Complète

Ce document fournit une série de tests manuels pour valider toutes les fonctionnalités administrateur.

---

## Préparation des Tests

### Prérequis
- [ ] Application démarrée (`npm run dev` ou `npm start`)
- [ ] Base de données accessible
- [ ] Utilisateurs de test créés (via `npm run db:seed`)
- [ ] Navigateur moderne (Chrome, Firefox, Safari)

### Comptes de Test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@bem.sn | password123 |
| Coordinateur | coordinateur@bem.sn | password123 |
| Enseignant | enseignant@bem.sn | password123 |

---

## Groupe 1 : Tests d'Authentification et Autorisation

### Test 1.1 : Accès Admin - Autorisé ✅

**Objectif :** Vérifier qu'un admin peut accéder à la gestion des utilisateurs

**Étapes :**
1. Se connecter avec `admin@bem.sn` / `password123`
2. Aller sur le dashboard `/dashboard`
3. Chercher la section "ADMINISTRATION" dans le menu latéral
4. Cliquer sur "Gestion des Utilisateurs"

**Résultat attendu :**
- ✅ Section "ADMINISTRATION" visible
- ✅ Page `/admin/users` s'affiche
- ✅ Liste des utilisateurs visible
- ✅ Bouton "Nouvel Utilisateur" présent

---

### Test 1.2 : Accès Coordinateur - Refusé ❌

**Objectif :** Vérifier qu'un coordinateur ne peut PAS accéder

**Étapes :**
1. Se déconnecter
2. Se connecter avec `coordinateur@bem.sn` / `password123`
3. Chercher la section "ADMINISTRATION" dans le menu
4. Essayer d'accéder directement à `/admin/users` via l'URL

**Résultat attendu :**
- ✅ Section "ADMINISTRATION" NON visible dans le menu
- ✅ Redirection automatique vers `/dashboard`
- ✅ Pas d'erreur console grave

---

### Test 1.3 : Accès Enseignant - Refusé ❌

**Objectif :** Vérifier qu'un enseignant ne peut PAS accéder

**Étapes :**
1. Se déconnecter
2. Se connecter avec `enseignant@bem.sn` / `password123`
3. Essayer d'accéder à `/admin/users`

**Résultat attendu :**
- ✅ Redirection vers `/dashboard`
- ✅ Aucun accès autorisé

---

### Test 1.4 : Accès Non Authentifié - Refusé ❌

**Objectif :** Vérifier qu'un utilisateur non connecté ne peut pas accéder

**Étapes :**
1. Se déconnecter complètement
2. Essayer d'accéder à `/admin/users`

**Résultat attendu :**
- ✅ Redirection vers `/auth/signin`

---

## Groupe 2 : Tests de Création d'Utilisateur

### Test 2.1 : Création Réussie - Enseignant ✅

**Objectif :** Créer un nouvel enseignant

**Étapes :**
1. Se connecter en tant qu'admin
2. Aller sur `/admin/users`
3. Cliquer sur "Nouvel Utilisateur"
4. Remplir :
   - Email : `test.enseignant@bem.sn`
   - Nom : `Enseignant Test`
   - Rôle : `Enseignant`
   - Mot de passe : `password123`
   - Confirmer : `password123`
5. Cliquer sur "Créer"

**Résultat attendu :**
- ✅ Modal se ferme
- ✅ Message de succès affiché
- ✅ Nouvel utilisateur apparaît dans la liste
- ✅ Badge vert "Enseignant" visible
- ✅ Entrée créée dans `JournalActivite` (vérifier dans Prisma Studio)

---

### Test 2.2 : Création Réussie - Coordinateur ✅

**Objectif :** Créer un nouveau coordinateur

**Étapes :**
1. Cliquer sur "Nouvel Utilisateur"
2. Remplir :
   - Email : `test.coordinateur@bem.sn`
   - Nom : `Coordinateur Test`
   - Rôle : `Coordinateur`
   - Mot de passe : `password123`
   - Confirmer : `password123`
3. Cliquer sur "Créer"

**Résultat attendu :**
- ✅ Utilisateur créé avec badge bleu "Coordinateur"
- ✅ Statistiques mises à jour (+1 coordinateur)

---

### Test 2.3 : Création Réussie - Admin ✅

**Objectif :** Créer un nouvel admin

**Étapes :**
1. Créer un utilisateur avec rôle "Administrateur"
2. Email : `test.admin@bem.sn`

**Résultat attendu :**
- ✅ Badge violet "Administrateur"
- ✅ Icône bouclier visible

---

### Test 2.4 : Échec - Email Déjà Utilisé ❌

**Objectif :** Vérifier la validation d'unicité

**Étapes :**
1. Essayer de créer un utilisateur avec email : `admin@bem.sn`

**Résultat attendu :**
- ✅ Message d'erreur : "Un utilisateur avec cet email existe déjà"
- ✅ Modal reste ouverte
- ✅ Aucun utilisateur créé

---

### Test 2.5 : Échec - Mot de Passe Trop Court ❌

**Objectif :** Vérifier la validation de mot de passe

**Étapes :**
1. Essayer de créer avec mot de passe : `pass` (4 caractères)

**Résultat attendu :**
- ✅ Message d'erreur : "Le mot de passe doit contenir au moins 8 caractères"
- ✅ Validation HTML native (minLength=8)

---

### Test 2.6 : Échec - Mots de Passe Non Correspondants ❌

**Objectif :** Vérifier la confirmation de mot de passe

**Étapes :**
1. Remplir :
   - Mot de passe : `password123`
   - Confirmer : `differentpass`

**Résultat attendu :**
- ✅ Message d'erreur : "Les mots de passe ne correspondent pas"

---

## Groupe 3 : Tests de Recherche et Filtrage

### Test 3.1 : Recherche par Email ✅

**Objectif :** Rechercher "admin"

**Étapes :**
1. Dans la barre de recherche, taper : `admin`

**Résultat attendu :**
- ✅ Seuls les utilisateurs avec "admin" dans l'email ou nom s'affichent
- ✅ Mise à jour en temps réel (debounce)

---

### Test 3.2 : Recherche par Nom ✅

**Objectif :** Rechercher par nom

**Étapes :**
1. Taper un nom d'utilisateur dans la recherche

**Résultat attendu :**
- ✅ Filtrage fonctionne
- ✅ Case-insensitive

---

### Test 3.3 : Filtre par Rôle - Admin ✅

**Objectif :** Afficher uniquement les admins

**Étapes :**
1. Dans le filtre, sélectionner "Administrateurs"

**Résultat attendu :**
- ✅ Seuls les utilisateurs avec rôle ADMIN s'affichent
- ✅ Badge violet uniquement

---

### Test 3.4 : Filtre par Rôle - Enseignant ✅

**Étapes :**
1. Sélectionner "Enseignants"

**Résultat attendu :**
- ✅ Badges verts uniquement

---

### Test 3.5 : Combinaison Recherche + Filtre ✅

**Étapes :**
1. Filtre : "Coordinateurs"
2. Recherche : "test"

**Résultat attendu :**
- ✅ Seuls les coordinateurs avec "test" dans nom/email

---

### Test 3.6 : Réinitialisation ✅

**Étapes :**
1. Vider la recherche
2. Remettre "Tous les rôles"

**Résultat attendu :**
- ✅ Tous les utilisateurs réapparaissent

---

## Groupe 4 : Tests de Modification

### Test 4.1 : Modification Nom ✅

**Objectif :** Changer le nom d'un utilisateur

**Étapes :**
1. Cliquer sur ✏️ (Edit) pour un utilisateur test
2. Changer le nom : `Nouveau Nom Test`
3. Cliquer sur "Mettre à jour"

**Résultat attendu :**
- ✅ Nom mis à jour dans la liste
- ✅ Message de succès avec liste des changements
- ✅ Log dans `JournalActivite` avec ancienne/nouvelle valeur

---

### Test 4.2 : Modification Email ✅

**Étapes :**
1. Modifier l'email : `nouveau.email@bem.sn`

**Résultat attendu :**
- ✅ Email mis à jour
- ✅ Validation d'unicité appliquée

---

### Test 4.3 : Changement de Rôle ✅

**Étapes :**
1. Changer TEACHER → COORDINATOR

**Résultat attendu :**
- ✅ Badge change de couleur (vert → bleu)
- ✅ Icône change

---

### Test 4.4 : Changement de Mot de Passe ✅

**Étapes :**
1. Modifier un utilisateur
2. Remplir nouveau mot de passe : `nouveaumotdepasse123`
3. Confirmer : `nouveaumotdepasse123`

**Résultat attendu :**
- ✅ Mot de passe changé (tester la connexion)
- ✅ Log indique "mot de passe modifié" (pas la valeur)

---

### Test 4.5 : Échec - Admin Change Son Propre Rôle ❌

**Étapes :**
1. Se connecter en tant qu'admin
2. Modifier son propre compte
3. Essayer de changer son rôle vers TEACHER

**Résultat attendu :**
- ✅ Erreur : "Vous ne pouvez pas modifier votre propre rôle"

---

### Test 4.6 : Modification Sans Changement ❌

**Étapes :**
1. Modifier un utilisateur
2. Ne rien changer
3. Cliquer sur "Mettre à jour"

**Résultat attendu :**
- ✅ Message : "Aucune modification"

---

## Groupe 5 : Tests de Suppression

### Test 5.1 : Suppression Simple ✅

**Objectif :** Supprimer un utilisateur sans données

**Étapes :**
1. Créer un utilisateur test
2. Cliquer sur 🗑️ (Trash)
3. Confirmer la popup

**Résultat attendu :**
- ✅ Utilisateur supprimé de la liste
- ✅ Message de succès
- ✅ Statistiques mises à jour
- ✅ Log dans `JournalActivite`

---

### Test 5.2 : Suppression avec Données - Sans Force ❌

**Objectif :** Tenter de supprimer un utilisateur avec programmes/modules

**Étapes :**
1. Essayer de supprimer un utilisateur qui a créé des programmes
2. Ne pas confirmer avec `force=true`

**Résultat attendu :**
- ✅ Message d'avertissement avec nombre de ressources
- ✅ Demande de confirmation avec `force=true`
- ✅ Utilisateur NON supprimé

---

### Test 5.3 : Suppression avec Données - Avec Force ✅

**Étapes :**
1. Même utilisateur
2. Confirmer la seconde popup (force=true)

**Résultat attendu :**
- ✅ Utilisateur supprimé
- ✅ Données cascade (selon config Prisma)

---

### Test 5.4 : Échec - Auto-Suppression ❌

**Étapes :**
1. Essayer de supprimer son propre compte admin

**Résultat attendu :**
- ✅ Bouton 🗑️ désactivé ou absent
- ✅ Ou message : "Vous ne pouvez pas supprimer votre propre compte"

---

### Test 5.5 : Échec - Dernier Admin ❌

**Objectif :** Protection du dernier admin

**Étapes :**
1. S'assurer qu'il n'y a qu'un seul admin
2. Essayer de supprimer cet admin

**Résultat attendu :**
- ✅ Message : "Impossible de supprimer le dernier administrateur"

---

## Groupe 6 : Tests de Journal d'Activités

### Test 6.1 : Log Création ✅

**Étapes :**
1. Créer un utilisateur
2. Ouvrir Prisma Studio
3. Consulter `JournalActivite`

**Résultat attendu :**
- ✅ Nouvelle entrée avec action=CREATION
- ✅ `nouvelleValeur` contient les infos de l'utilisateur
- ✅ `userId` = ID de l'admin connecté
- ✅ `ipAddress` et `userAgent` capturés

---

### Test 6.2 : Log Modification ✅

**Étapes :**
1. Modifier un utilisateur
2. Vérifier le log

**Résultat attendu :**
- ✅ action=MODIFICATION
- ✅ `ancienneValeur` et `nouvelleValeur` présents
- ✅ Description détaillée des changements

---

### Test 6.3 : Log Suppression ✅

**Étapes :**
1. Supprimer un utilisateur
2. Vérifier le log

**Résultat attendu :**
- ✅ action=SUPPRESSION
- ✅ `ancienneValeur` contient les infos de l'utilisateur supprimé

---

## Groupe 7 : Tests d'Interface Utilisateur

### Test 7.1 : Statistiques ✅

**Étapes :**
1. Noter le nombre total d'utilisateurs
2. Créer un utilisateur
3. Vérifier les cartes de stats

**Résultat attendu :**
- ✅ Total +1
- ✅ Stat du rôle correspondant +1
- ✅ Mise à jour immédiate

---

### Test 7.2 : Badges de Rôle ✅

**Vérifier :**
- ✅ Admin : fond violet, icône bouclier
- ✅ Coordinateur : fond bleu, icône livre
- ✅ Enseignant : fond vert, icône personne

---

### Test 7.3 : Compteurs de Ressources ✅

**Étapes :**
1. Vérifier la colonne "Ressources"

**Résultat attendu :**
- ✅ Icône livre + nombre de programmes
- ✅ Icône personne + nombre de modules

---

### Test 7.4 : Responsive Mobile ✅

**Étapes :**
1. Réduire la fenêtre du navigateur
2. Tester sur mobile (ou mode responsive)

**Résultat attendu :**
- ✅ Tableau s'adapte (horizontal scroll si besoin)
- ✅ Cartes stats empilées verticalement
- ✅ Modals responsive

---

### Test 7.5 : Mode Sombre ✅

**Étapes :**
1. Activer le mode sombre (si disponible)

**Résultat attendu :**
- ✅ Fond sombre
- ✅ Texte lisible
- ✅ Badges contrastés

---

## Groupe 8 : Tests de Sécurité API

### Test 8.1 : Protection Endpoint GET ✅

**Étapes :**
1. Se déconnecter
2. Faire un fetch vers `/api/admin/users`

**Résultat attendu :**
- ✅ HTTP 401 Unauthorized

---

### Test 8.2 : Protection Endpoint POST ✅

**Étapes :**
1. Se connecter en tant qu'enseignant
2. Tenter de POST sur `/api/admin/users`

**Résultat attendu :**
- ✅ HTTP 403 Forbidden

---

### Test 8.3 : Validation Côté Serveur ✅

**Étapes :**
1. POST avec email invalide (via Postman/curl)

**Résultat attendu :**
- ✅ HTTP 400 Bad Request
- ✅ Message d'erreur explicite

---

## Groupe 9 : Tests de Performance

### Test 9.1 : Chargement Initial ✅

**Étapes :**
1. Ouvrir `/admin/users`
2. Noter le temps de chargement

**Résultat attendu :**
- ✅ Page charge en < 2 secondes
- ✅ Liste s'affiche rapidement

---

### Test 9.2 : Recherche en Temps Réel ✅

**Étapes :**
1. Taper dans la barre de recherche

**Résultat attendu :**
- ✅ Filtrage instantané (debounce)
- ✅ Pas de lag

---

## Rapport de Tests

### Template de Rapport

```
Date : ___________
Testeur : ___________
Version : ___________

Tests Passés : ___ / 50
Tests Échoués : ___

Bugs Identifiés :
1. __________________
2. __________________

Remarques :
_____________________
```

---

## Checklist Finale

Avant de considérer la fonctionnalité validée :

- [ ] Tous les tests d'authentification passent
- [ ] CRUD complet fonctionne
- [ ] Validations côté client et serveur OK
- [ ] Protections de sécurité en place
- [ ] Logs correctement enregistrés
- [ ] Interface responsive
- [ ] Performance acceptable
- [ ] Documentation à jour

---

## Bugs Connus

_Liste des bugs identifiés lors des tests :_

1. _(aucun pour le moment)_

---

**Dernière mise à jour :** 8 Décembre 2025
**Version :** 1.0
