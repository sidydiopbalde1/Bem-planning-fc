# 🚀 Démarrage Rapide - Test du Système de Progression

Ce guide vous permet de tester rapidement le système de gestion de progression.

## ⚡ Installation en 3 Étapes

### 1️⃣ Configuration de l'Environnement

Créez ou mettez à jour votre fichier `.env` :

```bash
# Copier l'exemple
cp .env.example .env

# Éditer avec vos valeurs
nano .env
```

**Variables minimales requises** :

```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/bem_planning"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=votre_secret_long_et_complexe

# Clé secrète pour le cron (générez-en une avec: openssl rand -base64 32)
CRON_SECRET_KEY=votre_cle_secrete_pour_cron

# Email (optionnel pour les tests)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre-email@gmail.com
EMAIL_PASSWORD=votre-mot-de-passe-app
```

### 2️⃣ Créer les Données de Test

```bash
# Installer les dépendances si ce n'est pas déjà fait
npm install

# Appliquer les migrations
npx prisma migrate dev

# Créer les données de test (choisissez l'une des deux options)
npm run db:seed
# OU
node prisma/seed-test.js
```

**Résultat attendu** :
```
✨ Données de test créées avec succès!

📋 INFORMATIONS DE CONNEXION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 Compte Intervenant:
   Email    : prof@test.com
   Mot de passe: Test123!
   URL      : http://localhost:3000/intervenant/mes-seances
```

### 3️⃣ Démarrer et Tester

```bash
# Démarrer le serveur
npm run dev

# Le serveur démarre sur http://localhost:3000
```

## 🧪 Tests Rapides

### Test 1 : Interface Intervenant (2 min)

1. **Ouvrir** : http://localhost:3000/auth/signin
2. **Se connecter** :
   - Email : `prof@test.com`
   - Mot de passe : `Test123!`
3. **Aller sur** : http://localhost:3000/intervenant/mes-seances
4. **Vérifier** :
   - ✅ Statistiques affichées
   - ✅ Liste des séances
   - ✅ Alerte "Séances en attente" (2 séances)

### Test 2 : Marquer une Séance (1 min)

1. **Trouver** une séance passée avec le bouton orange "Marquer comme terminée"
2. **Cliquer** sur le bouton
3. **Confirmer** dans la popup
4. **Vérifier** :
   - ✅ Message de succès
   - ✅ Progression mise à jour
   - ✅ Séance disparaît de "En retard"

### Test 3 : Notification Cron (30 sec)

**Option rapide - Via navigateur** :

1. Ouvrir : http://localhost:3000/api/cron/check-unfinished-sessions?key=VOTRE_CLE_SECRETE
   - Remplacer `VOTRE_CLE_SECRETE` par la valeur de `CRON_SECRET_KEY` dans `.env`

2. **Voir la réponse** :
```json
{
  "success": true,
  "stats": {
    "total": 1,
    "notified": 1,
    "failed": 0
  }
}
```

**Option curl** :

```bash
curl -X POST "http://localhost:3000/api/cron/check-unfinished-sessions?key=VOTRE_CLE"
```

## 📊 Vérifier les Résultats

### Via Prisma Studio

```bash
npx prisma studio
```

Ouvrir : http://localhost:5555

**Vérifications** :
1. **Table `seances`** : Vérifier le statut des séances
2. **Table `modules`** : Vérifier la progression
3. **Table `programmes`** : Vérifier la progression globale
4. **Table `notifications`** : Voir les notifications créées

### Via SQL Direct

```bash
# Se connecter à PostgreSQL
psql -U votre_user -d bem_planning

# Vérifier la progression
SELECT code, progression, status FROM modules;

# Vérifier les séances terminées
SELECT
  m.code as module,
  s.status,
  s."dateSeance",
  s.duree
FROM seances s
JOIN modules m ON m.id = s."moduleId"
ORDER BY s."dateSeance" DESC;

# Vérifier les notifications
SELECT * FROM notifications ORDER BY "createdAt" DESC LIMIT 5;
```

## 🎯 Scénarios de Test Complets

### Scénario A : Progression d'un Module

**Objectif** : Atteindre 100% de progression

```
Module TEST-101 : VHT = 50h
├─ Séance 1 : 2h (TERMINEE) → Progression = 4%
├─ Séance 2 : 2h → À compléter → Progression = 8%
├─ Séance 3 : 2h → À compléter → Progression = 12%
└─ ... continuer jusqu'à 50h → Progression = 100% ✅
```

**Actions** :
1. Marquer chaque séance comme terminée
2. Vérifier que la progression augmente
3. Vérifier le changement de statut à 100%

### Scénario B : Notifications Multiples

**Objectif** : Tester la déduplication des notifications

**Actions** :
1. Exécuter le cron : `curl -X POST ".../check-unfinished-sessions?key=..."`
2. **Vérifier** : 1-2 notifications créées
3. Exécuter le cron **une 2ème fois immédiatement**
4. **Vérifier** : `notified: 0` (déjà notifié aujourd'hui)

### Scénario C : Permissions

**Objectif** : Vérifier que seul l'intervenant assigné peut compléter

**Actions** :
1. Créer un 2ème intervenant : `prof2@test.com`
2. Se connecter avec `prof2@test.com`
3. Essayer de compléter une séance de `prof@test.com`
4. **Vérifier** : Erreur 403 "Non autorisé"

## 🐛 Dépannage Rapide

### "Intervenant introuvable"

```bash
# Vérifier que l'email correspond
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findMany({ where: { role: 'TEACHER' } }).then(console.log);
prisma.intervenant.findMany().then(console.log);
"
```

### "Unauthorized" sur le cron

Vérifier que la clé dans l'URL correspond à `.env` :
```bash
echo $CRON_SECRET_KEY  # Dans le terminal
# Comparer avec la valeur dans .env
```

### Progression ne se met pas à jour

```bash
# Vérifier manuellement
npx prisma studio
# → Aller dans "seances" → Vérifier le statut
# → Aller dans "modules" → Vérifier la progression
```

### Emails non reçus

Configuration Gmail :
1. Activer l'authentification à 2 facteurs
2. Générer un "mot de passe d'application"
3. Utiliser ce mot de passe dans `EMAIL_PASSWORD`

**Alternative** : Utiliser Mailtrap pour les tests
```env
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=votre_username_mailtrap
EMAIL_PASSWORD=votre_password_mailtrap
```

## 📚 Documentation Complète

Pour plus de détails :
- **Guide de test complet** : `/docs/TESTING_GUIDE.md`
- **Documentation système** : `/docs/PROGRESSION_MANAGEMENT.md`

## 🆘 Support

**Problèmes courants** :
- Erreur de connexion DB → Vérifier `DATABASE_URL`
- Page blanche → Vérifier les logs : `npm run dev`
- 404 sur une route → Redémarrer le serveur

**Logs utiles** :
```bash
# Logs du serveur Next.js
# Déjà affichés dans le terminal où vous avez lancé npm run dev

# Logs de la base de données (si besoin)
tail -f /var/log/postgresql/postgresql-*.log
```

---

**Prêt à tester !** 🎉

Si tout fonctionne, vous devriez pouvoir :
- ✅ Se connecter comme intervenant
- ✅ Voir vos séances
- ✅ Marquer des séances comme terminées
- ✅ Voir la progression se mettre à jour
- ✅ Recevoir des notifications pour séances non terminées
