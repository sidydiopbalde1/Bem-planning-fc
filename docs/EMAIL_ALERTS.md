# Système d'Alertes Email - BEM Planning FC

## Vue d'ensemble

Le système d'alertes email permet aux coordinateurs de recevoir automatiquement des notifications par email concernant:
- Programmes en retard
- Modules sans intervenant
- Modules démarrant prochainement
- Rapports hebdomadaires

## Configuration

### Variables d'environnement

Ajouter les variables suivantes dans le fichier `.env`:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=BEM Planning FC <noreply@bem-planning.com>

# Cron Job Secret (pour sécuriser les endpoints automatiques)
CRON_SECRET=your-random-secret-key-here

# Application URL (pour les liens dans les emails)
NEXTAUTH_URL=http://localhost:3000
```

### Configuration Gmail

Si vous utilisez Gmail:

1. Activer l'authentification à deux facteurs sur votre compte Google
2. Générer un mot de passe d'application:
   - Aller dans Compte Google > Sécurité > Mots de passe d'application
   - Créer un nouveau mot de passe d'application
   - Utiliser ce mot de passe dans `EMAIL_PASSWORD`

### Configuration SMTP personnalisé

Pour un serveur SMTP personnalisé:

```env
EMAIL_HOST=smtp.your-domain.com
EMAIL_PORT=587  # ou 465 pour SSL
EMAIL_SECURE=false  # true pour port 465
EMAIL_USER=your-smtp-username
EMAIL_PASSWORD=your-smtp-password
EMAIL_FROM=Your Name <noreply@your-domain.com>
```

## Types d'alertes

### 1. Programme en retard

**Déclencheur:** Programme dont la date de fin est dépassée et progression < 100%

**Contenu:**
- Code et nom du programme
- Progression actuelle
- Date de fin
- Niveau et semestre
- Lien vers la page du programme

**Fréquence:** Quotidienne (via cron job)

### 2. Module sans intervenant

**Déclencheur:** Module sans intervenant assigné et démarrant dans les 14 prochains jours

**Contenu:**
- Code et nom du module
- Programme associé
- Volume horaire (CM, TD, TP, TPE)
- Date de début
- Lien vers la gestion des modules

**Fréquence:** Quotidienne (via cron job)

### 3. Module démarrant prochainement

**Déclencheur:** Module démarrant dans les 7 prochains jours

**Contenu:**
- Code et nom du module
- Programme associé
- Date de début
- Volume horaire
- Intervenant assigné (ou alerte si non assigné)
- Lien vers la gestion des modules

**Fréquence:** Quotidienne (via cron job)

### 4. Rapport hebdomadaire

**Contenu:**
- Statistiques des programmes (total, en cours, terminés, progression moyenne)
- Statistiques des modules (total, VHT, avec/sans intervenant)
- Alertes actives (programmes en retard, modules sans intervenant)
- Lien vers le tableau de bord

**Fréquence:** Hebdomadaire (à configurer)

## Endpoints API

### 1. Vérification manuelle des alertes

```http
POST /api/coordinateur/alerts/check
Authorization: Bearer <session-token>
Content-Type: application/json

{
  "type": "all" | "delays" | "missing_instructors" | "upcoming"
}
```

**Réponse:**
```json
{
  "message": "Vérification des alertes terminée",
  "alerts": {
    "programmesEnRetard": [...],
    "modulesSansIntervenant": [...],
    "modulesProchains": [...],
    "emailsSent": 5,
    "errors": []
  },
  "summary": {
    "programmesEnRetard": 2,
    "modulesSansIntervenant": 3,
    "modulesProchains": 1,
    "emailsSent": 5,
    "errorsCount": 0
  }
}
```

### 2. Envoi de rapport hebdomadaire

```http
POST /api/coordinateur/alerts/weekly-report
Authorization: Bearer <session-token>
Content-Type: application/json

{
  "coordinatorId": "optional-coordinator-id"  // Admin only
}
```

**Réponse:**
```json
{
  "message": "Envoi des rapports hebdomadaires terminé",
  "results": {
    "coordinatorsCount": 5,
    "sent": 5,
    "failed": 0,
    "errors": []
  }
}
```

### 3. Alertes quotidiennes automatiques (Cron)

```http
POST /api/cron/daily-alerts
Authorization: Bearer <CRON_SECRET>
```

**Réponse:**
```json
{
  "success": true,
  "message": "Alertes quotidiennes traitées",
  "timestamp": "2025-12-10T10:00:00.000Z",
  "results": {
    "programmesEnRetard": {
      "count": 2,
      "emailsSent": 2
    },
    "modulesSansIntervenant": {
      "count": 3,
      "emailsSent": 3
    },
    "modulesProchains": {
      "count": 1,
      "emailsSent": 1
    },
    "totalEmailsSent": 6,
    "errorsCount": 0,
    "errors": []
  }
}
```

## Configuration du Cron Job

### Utilisation de cron (Linux/Mac)

1. Ouvrir crontab:
```bash
crontab -e
```

2. Ajouter les tâches suivantes:

```cron
# Alertes quotidiennes à 8h00
0 8 * * * curl -X POST http://localhost:3000/api/cron/daily-alerts -H "Authorization: Bearer YOUR_CRON_SECRET"

# Rapport hebdomadaire tous les lundis à 9h00
0 9 * * 1 curl -X POST http://localhost:3000/api/coordinateur/alerts/weekly-report -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Utilisation de Vercel Cron Jobs

Si déployé sur Vercel, créer `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-alerts",
      "schedule": "0 8 * * *"
    }
  ]
}
```

### Utilisation de services tiers

**Cron-job.org:**
1. Créer un compte sur https://cron-job.org
2. Créer un nouveau cron job
3. URL: `https://your-domain.com/api/cron/daily-alerts`
4. Headers: `Authorization: Bearer YOUR_CRON_SECRET`
5. Schedule: `0 8 * * *` (tous les jours à 8h00)

**EasyCron:**
1. Compte sur https://www.easycron.com
2. Similaire à cron-job.org

## Templates d'emails

Les templates sont définis dans `/lib/email.js`:

### Personnalisation

Modifier les templates dans `emailTemplates`:

```javascript
export const emailTemplates = {
  programmeEnRetard: (programme, coordinateur) => ({
    subject: `⚠️ Alerte: Programme en retard - ${programme.code}`,
    html: `...`,
    text: `...`
  }),
  // ...
};
```

### Styles CSS inline

Les emails utilisent du CSS inline pour une meilleure compatibilité:

```html
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <h2 style="color: #dc2626;">⚠️ Titre</h2>
  <!-- Contenu -->
</div>
```

## Journalisation

Toutes les alertes envoyées sont enregistrées dans `JournalActivite`:

```javascript
{
  action: 'ALERTE_AUTO',
  entite: 'Programme' | 'Module',
  entiteId: '...',
  description: 'Alerte automatique: ...',
  userId: coordinatorId,
  userName: 'Système'
}
```

Consultable via `/admin/logs`

## Tests

### Test manuel des emails

1. Configurer les variables d'environnement
2. Utiliser Postman ou curl:

```bash
# Tester la vérification des alertes
curl -X POST http://localhost:3000/api/coordinateur/alerts/check \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{"type":"all"}'

# Tester le rapport hebdomadaire
curl -X POST http://localhost:3000/api/coordinateur/alerts/weekly-report \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION"
```

### Test du cron job

```bash
curl -X POST http://localhost:3000/api/cron/daily-alerts \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Vérifier les emails sans les envoyer

Pendant le développement, consulter les logs:

```javascript
console.log('Email skipped (not configured):', { to, subject });
```

## Sécurité

### Protection du endpoint cron

Le endpoint `/api/cron/daily-alerts` est protégé par:
- Un secret dans l'en-tête `Authorization`
- Validation du format `Bearer <secret>`

### RGPD et confidentialité

- Les emails contiennent uniquement les informations professionnelles
- Les coordinateurs reçoivent uniquement les alertes concernant leurs programmes
- Les adresses email sont stockées de manière sécurisée dans la base de données

## Dépannage

### Les emails ne sont pas envoyés

1. Vérifier les variables d'environnement:
```bash
echo $EMAIL_HOST
echo $EMAIL_USER
```

2. Vérifier les logs serveur:
```bash
npm run dev
# Chercher "Email sent:" ou "Error sending email:"
```

3. Tester la connexion SMTP:
```javascript
// Test dans node
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({...});
transporter.verify((error, success) => {
  console.log(error ? error : 'Server is ready');
});
```

### Les emails arrivent dans les spams

1. Configurer SPF, DKIM, DMARC pour votre domaine
2. Utiliser un service d'envoi professionnel (SendGrid, AWS SES, etc.)
3. Éviter les mots déclencheurs de spam dans les sujets

### Erreur "Authentication failed"

- Vérifier `EMAIL_USER` et `EMAIL_PASSWORD`
- Pour Gmail, utiliser un mot de passe d'application
- Vérifier que "Accès moins sécurisé" n'est pas requis

## Services d'envoi recommandés

Pour la production, utiliser des services professionnels:

### SendGrid

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=YOUR_SENDGRID_API_KEY
```

### AWS SES

```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=YOUR_SMTP_USERNAME
EMAIL_PASSWORD=YOUR_SMTP_PASSWORD
```

### Mailgun

```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@your-domain.mailgun.org
EMAIL_PASSWORD=YOUR_MAILGUN_PASSWORD
```

## Améliorations futures

- [ ] Interface de gestion des préférences d'alertes
- [ ] Choix de la fréquence des alertes (quotidien, hebdomadaire, mensuel)
- [ ] Templates personnalisables par coordinateur
- [ ] Notifications push en plus des emails
- [ ] Alertes SMS pour les urgences
- [ ] Dashboard des alertes envoyées
- [ ] A/B testing des templates
- [ ] Résumé mensuel des activités
