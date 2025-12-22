# 🔄 Guide Complet - Système de Rotation Weekend

## 📋 Vue d'Ensemble

Le système de rotation weekend permet de gérer automatiquement l'attribution des responsables de programmes pour la supervision des cours du weekend. Le système assure une répartition équitable et automatise les notifications et remplacements.

---

## 🎯 Fonctionnalités Principales

### ✅ Génération Automatique
- Attribution équitable basée sur le nombre de weekends supervisés
- Respect des disponibilités déclarées
- Calcul automatique du nombre de séances par weekend

### ✅ Gestion des Absences
- Déclaration d'absence avec raison
- Remplacement automatique du responsable
- Historique des absences et statistiques

### ✅ Notifications Intelligentes
- **Email 7 jours avant** - Notification initiale
- **Notification app 48h avant** - Rappel urgent
- **Mise à jour automatique du statut** - EN_COURS le jour J

### ✅ Rapports de Supervision
- Formulaire de clôture avec détails
- Heures d'arrivée/départ
- Incidents et observations
- Note de satisfaction (1-5)

### ✅ Export Calendrier
- Format iCal compatible Google Calendar, Apple Calendar, Outlook
- Alarmes automatiques
- Synchronisation en temps réel

---

## 🚀 Démarrage Rapide

### 1. Génération des Rotations

```bash
# Via l'interface web
1. Aller sur /rotations-weekend
2. Cliquer sur "Générer Rotations"
3. Choisir le nombre de semaines (par défaut: 12)
4. Valider

# Via l'API
POST /api/rotations-weekend
{
  "nbSemaines": 12,
  "dateDebut": "2025-12-16"
}
```

### 2. Consulter Mon Planning

```bash
# Coordinateurs/Admins
- Menu "Rotations Weekend"
- Vue calendrier ou liste
- Filtres par statut

# Responsable assigné
- Notification email reçue 7 jours avant
- Rappel 48h avant
- Lien direct vers les détails
```

### 3. Déclarer une Indisponibilité

```bash
# Via l'interface
1. Aller sur /rotations-weekend
2. Cliquer sur "Déclarer Indisponibilité"
3. Sélectionner les dates
4. Indiquer la raison
5. Valider

# Via l'API
POST /api/rotations-weekend/disponibilites
{
  "dateDebut": "2025-12-20",
  "dateFin": "2025-12-22",
  "raison": "Congés"
}
```

### 4. Déclarer une Absence (Weekend proche)

```bash
# Via l'interface
1. Aller sur /rotations-weekend/[id]
2. Cliquer sur "Déclarer Absence"
3. Indiquer la raison
4. Un remplaçant est automatiquement assigné

# Via l'API
POST /api/rotations-weekend/[id]/absence
{
  "raison": "Urgence familiale"
}
```

### 5. Clôturer avec Rapport

```bash
# Via l'interface
1. Aller sur /rotations-weekend/[id]
2. Cliquer sur "Clôturer avec Rapport"
3. Remplir le formulaire:
   - Heures d'arrivée/départ
   - Nombre de séances visitées
   - Incidents éventuels
   - Observations
   - Note de satisfaction
4. Enregistrer

# Les statistiques sont automatiquement mises à jour
```

### 6. Exporter vers Calendrier

```bash
# Via l'interface
1. Aller sur /rotations-weekend
2. Cliquer sur "Exporter Calendrier"
3. Télécharger le fichier .ics
4. Importer dans Google Calendar, Apple Calendar, etc.

# Via l'API
GET /api/rotations-weekend/calendar?responsableId=[ID]&annee=2025

# URL directe
https://bem-planning-fc.com/api/rotations-weekend/calendar?responsableId=[ID]
```

---

## 📊 Algorithme d'Attribution

### Critères de Sélection

1. **Équité** (prioritaire)
   - Comptage du nombre de weekends déjà supervisés
   - Attribution au responsable avec le moins de weekends

2. **Disponibilité**
   - Vérification des indisponibilités déclarées
   - Exclusion automatique si indisponible

3. **Charge de Travail**
   - Nombre de séances prévues ce weekend
   - Répartition équitable sur l'année

### Algorithme Simplifié

```javascript
Pour chaque weekend à planifier:
  1. Récupérer statistiques de tous les coordinateurs
  2. Trier par nombre de weekends (croissant)
  3. Vérifier disponibilité du premier
  4. Si disponible → Assigner
  5. Sinon → Passer au suivant
  6. Mettre à jour les statistiques
```

### Exemple d'Attribution

```
Coordinateurs (stats 2025):
- Alice: 2 weekends
- Bob: 3 weekends
- Carol: 2 weekends
- David: 4 weekends

Attribution weekend du 20/12:
1. Candidats: Alice (2) et Carol (2) - Ex aequo
2. Vérifier disponibilités
3. Alice indisponible → Carol assignée
4. Stats mises à jour: Carol passe à 3
```

---

## 🔔 Système de Notifications

### Types de Notifications

#### 1. Notification Initiale (J-7)

**Déclenchement:** 7 jours avant le weekend
**Canal:** Email + Notification app
**Contenu:**
- Date et horaires de la rotation
- Nombre de séances prévues
- Lien vers les détails
- Rappel de déclarer indisponibilité si besoin

**Email Template:**
```
Sujet: 📅 Rotation Weekend dans 7 jours - [DATE]

Bonjour [NOM],

Vous avez été assigné à la supervision des cours du weekend dans 7 jours.

Détails:
- Date: [SAMEDI] - [DIMANCHE]
- Séances: [NOMBRE]
- Statut: PLANIFIE

[BOUTON: Voir les Détails]

Note: Vous recevrez un rappel 48h avant.
```

#### 2. Rappel Urgent (J-2)

**Déclenchement:** 48 heures avant le weekend
**Canal:** Email + Notification app (priorité HAUTE)
**Contenu:**
- ⚠️ Rappel important
- Confirmation de présence requise
- Liste des actions à faire

**Email Template:**
```
Sujet: ⚠️ Rappel: Supervision Weekend - [DATE]

Rappel important: Votre rotation est prévue ce weekend !

À faire avant le weekend:
✓ Confirmer votre présence
✓ Consulter le planning des séances
✓ En cas d'empêchement, déclarer votre absence

[BOUTON: Confirmer ma Présence]
```

#### 3. Notification Remplacement

**Déclenchement:** Lors d'une déclaration d'absence
**Destinataires:**
- Responsable initial (confirmation)
- Remplaçant (nouvelle assignation)
- Admins (information)

### Configuration Cron

Le système vérifie quotidiennement à 9h00 (Vercel Cron):

```json
{
  "crons": [
    {
      "path": "/api/cron/check-rotations-weekend?key=$CRON_SECRET_KEY",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### Test Manuel

```bash
# Test du cron en local
curl -X POST "http://localhost:3000/api/cron/check-rotations-weekend?key=YOUR_SECRET"

# Test en production
curl -X POST "https://bem-planning-fc.vercel.app/api/cron/check-rotations-weekend?key=$CRON_SECRET_KEY"
```

---

## 📈 Statistiques & Rapports

### Indicateurs Calculés

**Par Responsable:**
- Nombre de weekends total
- Nombre de weekends réalisés
- Nombre d'absences
- Taux de présence (%)
- Nombre de séances supervisées
- Moyenne de satisfaction

**Globaux:**
- Total weekends planifiés
- Taux de complétion (%)
- Taux d'absence (%)
- Nombre de séances totales
- Satisfaction moyenne

### Consultation des Stats

```bash
# Via l'API
GET /api/rotations-weekend?includeStats=true&annee=2025

# Via l'interface
- Tableau de bord des rotations
- Cartes statistiques en haut de page
- Export Excel disponible
```

---

## 🗓️ Export Calendrier

### Formats Supportés

- **iCalendar (.ics)** - Standard universel
- Compatible:
  - Google Calendar
  - Apple Calendar (iOS/macOS)
  - Microsoft Outlook
  - Thunderbird
  - Tout client supportant iCal

### Fonctionnalités du Calendrier

✅ **Événements détaillés**
- Titre: "🔄 Supervision Weekend - Semaine X"
- Date/heure: Samedi 00:00 → Dimanche 23:59
- Description complète avec détails
- Lien vers l'application

✅ **Alarmes automatiques**
- Rappel 2 jours avant (J-2)
- Notification système du calendrier

✅ **Couleurs par statut**
- PLANIFIE: Bleu
- CONFIRME: Vert
- EN_COURS: Jaune
- TERMINE: Gris
- ABSENT: Rouge

✅ **Synchronisation**
- Mise à jour automatique si lien permanent
- Actualisation des changements

### Import dans Google Calendar

```bash
1. Télécharger le fichier .ics
2. Aller sur Google Calendar (calendar.google.com)
3. Cliquer sur "+" à côté de "Autres agendas"
4. Sélectionner "Importer"
5. Choisir le fichier .ics
6. Sélectionner le calendrier de destination
7. Cliquer "Importer"

# OU utiliser un lien permanent
1. Copier l'URL: https://bem-planning-fc.com/api/rotations-weekend/calendar?responsableId=[ID]
2. Google Calendar → Paramètres → Ajouter un agenda
3. "Depuis une URL" → Coller l'URL
4. L'agenda se synchronise automatiquement
```

---

## 🔧 Administration

### Génération Manuelle de Rotations

```bash
# Générer pour les 12 prochaines semaines
POST /api/rotations-weekend
{
  "nbSemaines": 12
}

# Générer à partir d'une date spécifique
POST /api/rotations-weekend
{
  "nbSemaines": 8,
  "dateDebut": "2026-01-01"
}

# Réponse
{
  "message": "12 rotations générées avec succès",
  "rotations": [...],
  "stats": {
    "total": 12,
    "responsables": [
      { "id": "...", "name": "Alice", "nbWeekends": 3 },
      { "id": "...", "name": "Bob", "nbWeekends": 3 },
      ...
    ]
  }
}
```

### Modification Manuelle d'une Rotation

```bash
# Changer le responsable
PUT /api/rotations-weekend/[id]
{
  "responsableId": "NEW_USER_ID"
}

# Changer le statut
PUT /api/rotations-weekend/[id]
{
  "status": "CONFIRME"
}

# Ajouter un substitut
PUT /api/rotations-weekend/[id]
{
  "substitutId": "SUBSTITUTE_USER_ID"
}
```

### Suppression d'une Rotation

```bash
DELETE /api/rotations-weekend/[id]

# Restrictions:
- Impossible si status = EN_COURS, TERMINE, TERMINE_SANS_RAPPORT
- Seules les rotations PLANIFIE, CONFIRME, ANNULE peuvent être supprimées
```

---

## ❓ FAQ

### Q: Combien de weekends par personne?

**R:** Le système assure une répartition équitable. Si vous avez 4 coordinateurs et générez 12 weekends, chacun aura 3 weekends.

### Q: Que se passe-t-il si personne n'est disponible?

**R:** L'algorithme cherche parmi tous les coordinateurs. Si vraiment personne n'est disponible:
- Un warning est loggé
- Le weekend n'est pas assigné
- Un admin reçoit une notification

### Q: Puis-je échanger mon weekend avec un collègue?

**R:** Oui, deux méthodes:
1. Déclarer absence → Remplacement automatique
2. Demander à un admin de modifier manuellement via l'API

### Q: Les notifications sont-elles fiables?

**R:** Oui, le système utilise:
- Vercel Cron (production) - Fiabilité 99.9%
- Double canal (email + app)
- Flag pour éviter les doublons

### Q: Puis-je voir l'historique des rotations?

**R:** Oui:
- Interface web: Filtrer par année/mois/statut
- API: `GET /api/rotations-weekend?annee=2024`
- Statistiques annuelles disponibles

### Q: Comment annuler une rotation?

**R:** Via l'API:
```bash
PUT /api/rotations-weekend/[id]
{
  "status": "ANNULE",
  "commentaire": "Weekend reporté"
}
```

---

## 🐛 Troubleshooting

### Problème: Pas de notifications reçues

**Solutions:**
1. Vérifier configuration email dans `.env`
2. Vérifier que `CRON_SECRET_KEY` est défini
3. Tester le cron manuellement
4. Vérifier les logs Vercel

### Problème: Remplacement ne fonctionne pas

**Solutions:**
1. Vérifier qu'il y a d'autres coordinateurs disponibles
2. Vérifier les disponibilités déclarées
3. Consulter les logs d'erreur
4. Réessayer ou assigner manuellement

### Problème: Export calendrier ne fonctionne pas

**Solutions:**
1. Vérifier que le fichier .ics se télécharge
2. Essayer un autre client calendrier
3. Vérifier la syntaxe iCal (validator en ligne)
4. Re-générer le fichier

### Problème: Statistiques incorrectes

**Solutions:**
```bash
# Recalculer manuellement
Pour chaque responsable:
  - Compter les rotations de l'année
  - Mettre à jour via l'API
  - Ou utiliser la fonction mettreAJourStatistiques()
```

---

## 📞 Support

Pour toute question ou problème:

1. **Documentation**: `/docs/ROTATIONS_WEEKEND_GUIDE.md` (ce fichier)
2. **Logs système**: Vercel Dashboard → Logs
3. **Contact admin**: admin@bem-planning-fc.com
4. **GitHub Issues**: https://github.com/bem/planning/issues

---

**Dernière mise à jour:** 16 décembre 2025
**Version:** 1.0.0
**Auteur:** Système BEM Planning FC
