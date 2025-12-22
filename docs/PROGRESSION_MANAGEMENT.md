# Gestion de la Progression des Programmes

Ce document explique comment fonctionne le système de gestion automatique de la progression des programmes et modules basé sur les séances terminées.

## Vue d'ensemble

Le système permet :
- ✅ De marquer les séances comme terminées par les intervenants
- 📊 De calculer automatiquement la progression des modules
- 📈 De mettre à jour la progression des programmes
- 🔔 De notifier les intervenants pour les séances non terminées

## Architecture

### 1. Calcul de la Progression

#### Progression d'un Module
La progression d'un module est calculée automatiquement selon la formule :

```
Progression (%) = (Heures Effectuées / VHT Total) × 100
```

- **Heures Effectuées** : Somme des durées de toutes les séances terminées pour ce module
- **VHT Total** : Volume Horaire Total du module (CM + TD + TP + TPE)

#### Progression d'un Programme
La progression d'un programme est la moyenne des progressions de tous ses modules :

```
Progression Programme (%) = Moyenne(Progression de tous les modules)
```

### 2. Statuts

#### Statuts des Séances
- `PLANIFIE` : Séance planifiée mais non confirmée
- `CONFIRME` : Séance confirmée
- `EN_COURS` : Séance en cours
- `TERMINE` : Séance terminée (comptabilisée dans la progression)
- `REPORTE` : Séance reportée
- `ANNULE` : Séance annulée

#### Statuts des Modules
- `PLANIFIE` : Module non démarré (progression = 0%)
- `EN_COURS` : Module démarré (0% < progression < 100%)
- `TERMINE` : Module complété (progression = 100%)

#### Statuts des Programmes
- `PLANIFIE` : Programme non démarré
- `EN_COURS` : Programme en cours d'exécution
- `TERMINE` : Tous les modules terminés
- `SUSPENDU` : Programme suspendu temporairement
- `ANNULE` : Programme annulé

## Fonctionnalités

### 1. Interface Intervenant

**Page** : `/intervenant/mes-seances`

Les intervenants peuvent :
- Voir toutes leurs séances (passées et à venir)
- Filtrer par statut, module ou date
- Marquer une séance comme terminée
- Voir les statistiques de leurs interventions
- Suivre la progression de chaque module

**Statistiques affichées** :
- Total de séances
- Séances terminées
- Séances en retard (passées mais non terminées)
- Heures effectuées / heures totales
- Taux de complétion

### 2. API pour Marquer une Séance comme Terminée

**Endpoint** : `POST /api/seances/[id]/complete`

**Corps de la requête** :
```json
{
  "notes": "Notes optionnelles sur la séance",
  "realDuration": 2
}
```

**Réponse** :
```json
{
  "message": "Séance marquée comme terminée avec succès",
  "seance": { ... },
  "module": {
    "id": "...",
    "code": "INFO101",
    "progression": 45,
    "status": "EN_COURS",
    "heuresEffectuees": 18,
    "heuresTotal": 40
  },
  "programme": {
    "progression": 32,
    "status": "EN_COURS"
  }
}
```

**Effets** :
1. ✅ Marque la séance comme `TERMINE`
2. 📊 Recalcule la progression du module
3. 🔄 Met à jour le statut du module si nécessaire
4. 📈 Recalcule la progression du programme
5. 🔄 Met à jour le statut du programme si nécessaire
6. 📝 Enregistre l'action dans le journal d'activité

### 3. API pour Récupérer les Séances d'un Intervenant

**Endpoint** : `GET /api/intervenants/mes-seances`

**Paramètres de requête** :
- `status` : Filtrer par statut (PLANIFIE, TERMINE, etc.)
- `startDate` : Date de début (YYYY-MM-DD)
- `endDate` : Date de fin (YYYY-MM-DD)
- `moduleId` : Filtrer par module
- `includeStats` : Inclure les statistiques (true/false)

**Exemple** :
```
GET /api/intervenants/mes-seances?includeStats=true&status=PLANIFIE
```

**Réponse** :
```json
{
  "seances": [ ... ],
  "stats": {
    "total": 25,
    "terminees": 18,
    "enCours": 2,
    "planifiees": 4,
    "enRetard": 1,
    "totalHeures": 50,
    "heuresEffectuees": 36,
    "tauxCompletion": 72
  },
  "modules": [ ... ],
  "intervenant": { ... }
}
```

### 4. Système de Notifications

#### Notification Automatique

**Cron Job** : `/api/cron/check-unfinished-sessions`

**Fréquence** : Tous les jours à 18h00

**Fonctionnement** :
1. Détecte toutes les séances passées (depuis plus de 2h) non marquées comme terminées
2. Vérifie qu'aucune notification n'a déjà été envoyée aujourd'hui
3. Crée une notification dans l'application
4. Envoie un email à l'intervenant

**Email envoyé** :
- Sujet : "⚠️ Séance à compléter - [CODE MODULE]"
- Contenu : Détails de la séance et lien vers la page de gestion
- Appel à l'action : Bouton pour marquer la séance comme terminée

#### Configuration du Cron

##### Option 1 : Déploiement sur Vercel

Le fichier `vercel.json` est déjà configuré :
```json
{
  "crons": [
    {
      "path": "/api/cron/check-unfinished-sessions?key=$CRON_SECRET_KEY",
      "schedule": "0 18 * * *"
    }
  ]
}
```

##### Option 2 : Serveur Linux (crontab)

Ajouter à votre crontab :
```bash
# Tous les jours à 18h00
0 18 * * * curl -X POST "https://votredomaine.com/api/cron/check-unfinished-sessions?key=VOTRE_CLE_SECRETE"
```

##### Option 3 : Service externe (cron-job.org, EasyCron, etc.)

Configurer un appel POST vers :
```
https://votredomaine.com/api/cron/check-unfinished-sessions?key=VOTRE_CLE_SECRETE
```

**Variables d'environnement requises** :
```env
CRON_SECRET_KEY=votre_cle_secrete_unique_et_complexe
```

## Configuration

### 1. Variables d'Environnement

Ajouter au fichier `.env` :

```env
# Base URL
NEXTAUTH_URL=http://localhost:3000

# Cron Secret Key (générer une clé aléatoire)
CRON_SECRET_KEY=votre_cle_secrete_tres_complexe_ici

# Email Configuration (pour les notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=votre-email@example.com
EMAIL_PASSWORD=votre-mot-de-passe
EMAIL_FROM=noreply@votredomaine.com
```

### 2. Générer une Clé Secrète

Pour générer une clé secrète sécurisée :

```bash
# Linux/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Configuration Email

Pour utiliser Gmail :
1. Activer l'authentification à deux facteurs
2. Générer un mot de passe d'application
3. Utiliser ce mot de passe dans `EMAIL_PASSWORD`

Pour d'autres fournisseurs SMTP, consulter leur documentation.

## Workflow Complet

### Scénario : Un intervenant termine une séance

1. **Avant la séance** :
   - Séance avec statut `PLANIFIE` ou `CONFIRME`
   - Module avec progression X%

2. **Pendant/Après la séance** :
   - L'intervenant se connecte sur `/intervenant/mes-seances`
   - Clique sur "Marquer comme terminée"
   - Optionnel : Ajoute des notes

3. **Traitement automatique** :
   ```
   POST /api/seances/[id]/complete
   ├── Marque la séance comme TERMINE
   ├── Calcule heures effectuées du module
   ├── Met à jour progression du module
   ├── Met à jour statut du module
   ├── Calcule progression du programme
   ├── Met à jour statut du programme
   └── Enregistre dans le journal d'activité
   ```

4. **Résultat** :
   - ✅ Séance marquée comme terminée
   - 📊 Progression du module mise à jour
   - 📈 Progression du programme mise à jour
   - 📝 Historique enregistré

### Scénario : Notification pour séance non terminée

1. **Déclenchement** (tous les jours à 18h) :
   ```
   Cron Job → POST /api/cron/check-unfinished-sessions
   ```

2. **Traitement** :
   ```
   ├── Recherche des séances passées (> 2h) non terminées
   ├── Pour chaque séance :
   │   ├── Vérifie si déjà notifié aujourd'hui
   │   ├── Sinon, crée une notification
   │   └── Envoie un email à l'intervenant
   └── Retourne statistiques
   ```

3. **Email reçu par l'intervenant** :
   - ⚠️ Alerte visuelle
   - 📋 Détails de la séance
   - 🔗 Lien direct vers la page de gestion
   - 💡 Explication de l'importance

4. **Action de l'intervenant** :
   - Clique sur le lien dans l'email
   - Arrive sur `/intervenant/mes-seances`
   - Voit les séances en retard en surbrillance
   - Marque la séance comme terminée

## Tests Manuels

### Tester la complétion d'une séance

```bash
# 1. Créer une séance de test dans le passé avec status PLANIFIE

# 2. Marquer comme terminée
curl -X POST http://localhost:3000/api/seances/[ID_SEANCE]/complete \
  -H "Content-Type: application/json" \
  -d '{"notes": "Test de complétion"}' \
  --cookie "next-auth.session-token=VOTRE_TOKEN"

# 3. Vérifier la réponse
# La progression du module et du programme doivent être mises à jour
```

### Tester les notifications

```bash
# Appeler manuellement le cron job
curl -X POST "http://localhost:3000/api/cron/check-unfinished-sessions?key=VOTRE_CLE_SECRETE"

# Vérifier les logs
# Vérifier les emails envoyés
# Vérifier les notifications créées dans la base de données
```

### Tester l'interface intervenant

1. Se connecter avec un compte intervenant
2. Aller sur `/intervenant/mes-seances`
3. Vérifier l'affichage des séances
4. Tester les filtres
5. Marquer une séance comme terminée
6. Vérifier la mise à jour en temps réel

## Permissions

### Qui peut marquer une séance comme terminée ?

1. ✅ L'intervenant assigné à la séance
2. ✅ Les coordinateurs (role: COORDINATOR)
3. ✅ Les administrateurs (role: ADMIN)

### Vérifications effectuées

- La séance existe
- L'utilisateur a les permissions
- La séance n'est pas déjà terminée
- La séance n'est pas annulée

## Améliorations Futures

- [ ] Dashboard de progression pour les coordinateurs
- [ ] Export des statistiques de progression
- [ ] Rappels avant la fin d'un module
- [ ] Alertes pour les modules en retard
- [ ] Historique des progressions
- [ ] Graphiques de progression temporelle
- [ ] Notifications push (web push)
- [ ] Récapitulatif mensuel par email

## Dépannage

### Les notifications ne sont pas envoyées

1. Vérifier la configuration email dans `.env`
2. Vérifier les logs serveur
3. Tester manuellement le cron job
4. Vérifier que `CRON_SECRET_KEY` est défini

### La progression ne se met pas à jour

1. Vérifier que la séance est bien marquée comme TERMINE
2. Vérifier le VHT du module
3. Vérifier les logs de l'API `/api/seances/[id]/complete`
4. Vérifier la base de données

### Le cron job ne s'exécute pas

1. Vérifier la configuration Vercel ou crontab
2. Vérifier les logs du serveur
3. Tester manuellement l'endpoint
4. Vérifier la clé secrète

## Support

Pour toute question ou problème, consulter :
- Documentation principale : `/docs/`
- Journal d'activité : Table `journal_activites`
- Logs serveur : Console Next.js

---

**Dernière mise à jour** : 2025-12-14
