# Documentation - Rapports et Statistiques (Admin)

## Vue d'ensemble

Ce module fournit des outils complets de reporting et d'analyse pour les administrateurs du système BEM Planning FC. Il permet de suivre les performances, d'identifier les problèmes et d'optimiser l'utilisation des ressources.

## Fonctionnalités implémentées

### 1. Tableau de Bord Principal

#### Accès
**Route**: `/admin/rapports`

#### Fonctionnalités
- ✅ Score de santé du système (0-100)
- ✅ KPIs principaux (utilisateurs, programmes, modules, séances)
- ✅ Alertes automatiques
- ✅ Conflits non résolus
- ✅ Top utilisateurs actifs
- ✅ Tendances mensuelles
- ✅ Export Excel du dashboard

#### Score de Santé
Le score est calculé automatiquement selon les critères suivants :
- **100** : Score de base
- **-5 par conflit** non résolu (max -30)
- **-0.5 par % sous 50%** de complétion des modules
- **-0.5 par % sous 50%** de progression moyenne
- **+5** si taux de disponibilité des salles > 80%

**Interprétation** :
- **80-100** : Excellent (vert)
- **60-79** : Bon (jaune)
- **0-59** : Nécessite attention (rouge)

---

### 2. Statistiques d'Occupation des Salles

#### API Endpoint
**GET** `/api/admin/stats/salles`

**Query Parameters**:
- `dateDebut` (date) : Date de début de la période
- `dateFin` (date) : Date de fin de la période

#### Données fournies

##### Statistiques générales
```json
{
  "general": {
    "totalSalles": 25,
    "sallesDisponibles": 20,
    "sallesOccupees": 5,
    "capaciteTotale": 750,
    "capaciteMoyenne": 30
  }
}
```

##### Occupation par salle
```json
{
  "occupation": {
    "tauxGlobal": 65,
    "parSalle": [
      {
        "salle": "A101",
        "batiment": "Bâtiment A",
        "capacite": 30,
        "nombreSeances": 45,
        "heuresUtilisees": 90,
        "heuresDisponibles": 200,
        "tauxOccupation": 45
      }
    ],
    "top10": [...],
    "sousUtilisees": [...]
  }
}
```

##### Tendances par jour de la semaine
```json
{
  "tendances": {
    "parJourSemaine": [
      {
        "jour": "Lundi",
        "nombreSeances": 15,
        "heuresUtilisees": 30
      }
    ]
  }
}
```

#### Métriques calculées
- **Taux d'occupation** = (Heures utilisées / Heures disponibles) × 100
- **Heures disponibles** = Jours ouvrables × 10h/jour
- **Jours ouvrables** = Lundi à Vendredi dans la période

#### Alertes
- Salles sur-utilisées (> 70%)
- Salles sous-utilisées (< 30%)
- Déséquilibre entre bâtiments

---

### 3. Analyse de Charge des Intervenants

#### API Endpoint
**GET** `/api/admin/stats/intervenants`

**Query Parameters**:
- `dateDebut` (date) : Date de début de la période
- `dateFin` (date) : Date de fin de la période

#### Données fournies

##### Statistiques générales
```json
{
  "general": {
    "totalIntervenants": 50,
    "intervenantsActifs": 45,
    "intervenantsInactifs": 5,
    "intervenantsAvecSeances": 42,
    "tauxChargeMoyen": 65
  }
}
```

##### Charge par intervenant
```json
{
  "charge": {
    "parIntervenant": [
      {
        "id": "...",
        "nom": "Jean Dupont",
        "email": "jean@example.com",
        "grade": "Professeur",
        "specialite": "Informatique",
        "nombreModules": 3,
        "nombreSeances": 24,
        "heuresParType": {
          "CM": 20,
          "TD": 15,
          "TP": 10,
          "EXAMEN": 3,
          "RATTRAPAGE": 2
        },
        "totalHeures": 50,
        "heuresMaxJour": 6,
        "heuresMaxSemaine": 20,
        "maxHeuresJour": 5,
        "maxHeuresSemaine": 18,
        "depasseMaxJour": false,
        "depasseMaxSemaine": false,
        "tauxCharge": 62,
        "alertes": {
          "surcharge": false,
          "sousUtilise": false
        }
      }
    ],
    "top10Charges": [...],
    "surcharge": [...],
    "sousUtilises": [...]
  }
}
```

##### Répartition par type
```json
{
  "repartition": {
    "parType": {
      "CM": 450,
      "TD": 350,
      "TP": 200,
      "EXAMEN": 50,
      "RATTRAPAGE": 30
    },
    "parSpecialite": [
      {
        "specialite": "Informatique",
        "nombreIntervenants": 15,
        "totalHeures": 600,
        "moyenneHeures": 40
      }
    ]
  }
}
```

#### Métriques calculées
- **Taux de charge** = (Heures enseignées / Heures max période) × 100
- **Heures max période** = Heures max/semaine × Nombre de semaines
- **Détection surcharge** = Heures/jour > max OU Heures/semaine > max

#### Alertes
- Intervenants en surcharge (> heures max)
- Intervenants sous-utilisés (< 30% charge)
- Déséquilibre entre spécialités

---

### 4. Export de Données

#### API Endpoint
**GET** `/api/admin/export/excel`

**Query Parameters**:
- `type` (required) : Type d'export
  - `salles` : Liste des salles
  - `intervenants` : Liste des intervenants
  - `periodes` : Périodes académiques
  - `logs` : Journaux d'activités
  - `stats-salles` : Statistiques d'occupation
  - `stats-intervenants` : Statistiques de charge
- `dateDebut` (optional) : Pour les exports avec période
- `dateFin` (optional) : Pour les exports avec période

#### Format de fichier
- **Type** : Excel (.xlsx)
- **Encodage** : UTF-8
- **Feuilles** : Une par type de données
- **Nom du fichier** : `{type}_{timestamp}.xlsx`

#### Exemple d'utilisation
```javascript
// Export des salles
window.open('/api/admin/export/excel?type=salles', '_blank');

// Export des stats avec période
const params = new URLSearchParams({
  type: 'stats-salles',
  dateDebut: '2024-01-01',
  dateFin: '2024-12-31'
});
window.open(`/api/admin/export/excel?${params}`, '_blank');
```

#### Structure des exports

##### Export Salles
| Nom | Bâtiment | Capacité | Équipements | Disponible | Créé le |
|-----|----------|----------|-------------|------------|---------|

##### Export Intervenants
| Civilité | Nom | Prénom | Email | Téléphone | Grade | Spécialité | Heures max/jour | Heures max/semaine | Modules | Séances |
|----------|-----|--------|-------|-----------|-------|------------|-----------------|-------------------|---------|---------|

##### Export Stats Salles
| Salle | Bâtiment | Capacité | Séances | Heures utilisées | Disponible |
|-------|----------|----------|---------|-----------------|------------|

##### Export Stats Intervenants
| Intervenant | Email | Spécialité | Séances | Heures CM | Heures TD | Heures TP | Total heures | Heures max/semaine |
|-------------|-------|------------|---------|-----------|-----------|-----------|--------------|-------------------|

---

## Interface Utilisateur

### Page Rapports (`/admin/rapports`)

#### Onglets

1. **Dashboard**
   - Vue d'ensemble du système
   - Score de santé
   - KPIs principaux
   - Alertes
   - Top utilisateurs

2. **Salles**
   - Sélection de période
   - Taux d'occupation global
   - Top 10 salles utilisées
   - Salles sous-utilisées
   - Export Excel

3. **Intervenants**
   - Sélection de période
   - Taux de charge moyen
   - Top 10 intervenants chargés
   - Alertes de surcharge
   - Export Excel

#### Boutons d'action
- **Actualiser** : Recharge les données avec la période sélectionnée
- **Exporter** : Télécharge un fichier Excel
- **Icône Download** : Export rapide

---

## Utilisation

### Consultation du Dashboard

1. Accéder à `/admin/rapports`
2. Consulter le score de santé
3. Examiner les KPIs
4. Vérifier les alertes
5. Exporter si nécessaire

### Analyse d'occupation des salles

1. Cliquer sur l'onglet "Salles"
2. Sélectionner une période (date début/fin)
3. Cliquer sur "Actualiser"
4. Analyser les résultats :
   - Taux d'occupation global
   - Salles les plus utilisées
   - Salles sous-utilisées
5. Exporter en Excel pour analyse approfondie

### Analyse de charge des intervenants

1. Cliquer sur l'onglet "Intervenants"
2. Sélectionner une période
3. Cliquer sur "Actualiser"
4. Analyser les résultats :
   - Taux de charge moyen
   - Intervenants en surcharge (rouge)
   - Répartition CM/TD/TP
5. Prendre des mesures si nécessaire :
   - Redistribuer les charges
   - Recruter si surcharge généralisée

---

## Calculs et Algorithmes

### Calcul du taux d'occupation d'une salle

```javascript
// 1. Calculer les heures disponibles
const joursOuvrables = calculateWorkingDays(dateDebut, dateFin);
const heuresDisponibles = joursOuvrables * 10; // 10h/jour

// 2. Calculer les heures utilisées
const heuresUtilisees = seances.reduce((sum, s) => sum + s.duree, 0);

// 3. Calculer le taux
const tauxOccupation = (heuresUtilisees / heuresDisponibles) * 100;
```

### Calcul du taux de charge d'un intervenant

```javascript
// 1. Grouper les séances par semaine
const seancesParSemaine = groupByWeek(seances);

// 2. Trouver la semaine la plus chargée
const maxHeuresSemaine = Math.max(
  ...Object.values(seancesParSemaine).map(s =>
    s.reduce((sum, seance) => sum + seance.duree, 0)
  )
);

// 3. Calculer le taux de charge
const nbSemaines = calculateWeeks(dateDebut, dateFin);
const heuresMaxPeriode = heuresMaxSemaine * nbSemaines;
const totalHeures = seances.reduce((sum, s) => sum + s.duree, 0);
const tauxCharge = (totalHeures / heuresMaxPeriode) * 100;
```

### Détection de surcharge

```javascript
// Surcharge détectée si :
const surcharge =
  maxHeuresJour > intervenant.heuresMaxJour ||
  maxHeuresSemaine > intervenant.heuresMaxSemaine;
```

---

## Optimisations

### Performance

1. **Pagination** : Limitée à 10000 enregistrements pour les exports
2. **Caching** : Aucun cache actuellement (à implémenter si nécessaire)
3. **Agrégation** : Utilisation de `groupBy` de Prisma pour performances
4. **Calculs côté serveur** : Tous les calculs complexes en backend

### Recommandations

1. **Période maximale** : Limiter à 1 an pour les statistiques
2. **Exports volumineux** : Ajouter un système de file d'attente
3. **Rafraîchissement** : Pas de refresh automatique (requiert action utilisateur)

---

## Exemples de Cas d'Usage

### Cas 1 : Optimiser l'utilisation des salles

**Objectif** : Identifier les salles sous-utilisées

**Étapes** :
1. Aller dans "Salles"
2. Sélectionner le semestre en cours
3. Trier par taux d'occupation croissant
4. Identifier les salles < 30%
5. Analyser pourquoi (capacité inadaptée, équipements manquants)
6. Prendre des mesures :
   - Réaffecter des cours
   - Améliorer les équipements
   - Ajuster les plannings

### Cas 2 : Détecter la surcharge d'un intervenant

**Objectif** : Éviter le burnout des enseignants

**Étapes** :
1. Aller dans "Intervenants"
2. Sélectionner le mois en cours
3. Consulter la section "Intervenants en surcharge"
4. Vérifier les détails (heures/jour, heures/semaine)
5. Actions :
   - Redistribuer certains cours
   - Reporter des séances
   - Recruter un remplaçant temporaire

### Cas 3 : Rapport mensuel pour la direction

**Objectif** : Présenter un rapport d'activité

**Étapes** :
1. Accéder au Dashboard
2. Noter le score de santé
3. Exporter le dashboard en Excel
4. Aller dans "Salles" → Exporter
5. Aller dans "Intervenants" → Exporter
6. Compiler dans un rapport PowerPoint/PDF
7. Présenter les KPIs et recommandations

---

## Sécurité

### Authentification
- Réservé aux utilisateurs avec rôle `ADMIN`
- Vérification de session sur chaque requête
- Journalisation de tous les exports

### Données sensibles
- Les statistiques sont anonymisées quand possible
- Les exports contiennent uniquement les données nécessaires
- Pas d'accès aux mots de passe ou tokens

### Journal d'activités
Tous les exports sont enregistrés :
```javascript
{
  action: 'EXPORT_DONNEES',
  entite: type,
  description: `Export Excel de ${type}`,
  userId: session.user.id,
  userName: session.user.name,
  ipAddress: '...',
  userAgent: '...'
}
```

---

## Améliorations Futures

### Court terme
- [ ] Export PDF des rapports
- [ ] Graphiques interactifs (avec Recharts)
- [ ] Filtres avancés (par département, par niveau)
- [ ] Envoi automatique de rapports par email

### Moyen terme
- [ ] Prédiction des tendances (ML)
- [ ] Recommandations automatiques d'optimisation
- [ ] Alertes proactives (email/SMS)
- [ ] Dashboard temps réel (WebSocket)

### Long terme
- [ ] Analyse comparative entre périodes
- [ ] Benchmarking avec d'autres établissements
- [ ] IA pour optimisation automatique des plannings
- [ ] Application mobile dédiée

---

## Dépendances

### Packages NPM
```json
{
  "xlsx": "^0.18.5",       // Export Excel
  "recharts": "^2.x",      // Graphiques (installé, à utiliser)
  "jspdf": "^2.x",         // Export PDF (installé, à utiliser)
  "jspdf-autotable": "^3.x" // Tableaux PDF (installé, à utiliser)
}
```

### APIs utilisées
- `/api/admin/stats/dashboard` : KPIs et dashboard
- `/api/admin/stats/salles` : Statistiques salles
- `/api/admin/stats/intervenants` : Statistiques intervenants
- `/api/admin/export/excel` : Export Excel

---

## Support

Pour toute question :
- Documentation générale : `/docs/ADMIN_FEATURES.md`
- Ressources pédagogiques : `/docs/ADMIN_RESOURCES.md`
- Guide de démarrage : `/docs/ADMIN_QUICKSTART.md`

---

## Changelog

### Version 1.0.0 (2025-01-XX)
- ✅ Dashboard principal avec score de santé
- ✅ Statistiques d'occupation des salles
- ✅ Analyse de charge des intervenants
- ✅ Export Excel multi-formats
- ✅ Interface responsive avec onglets
- ✅ Journalisation de tous les exports
