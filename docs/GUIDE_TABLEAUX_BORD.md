# Guide d'utilisation des Tableaux de Bord Académiques

## Vue d'ensemble

Ce guide décrit les 3 nouveaux tableaux de bord intégrés dans l'application BEM Planning FC pour le suivi académique et pédagogique.

## 📊 Tableaux de bord disponibles

### 1. Tableau de suivi des échéances académiques
**URL**: `/tableaux-bord/echeances-academiques`

Ce tableau permet de suivre :
- **Activités académiques** : Démarrage des cours, examens, délibérations, remise des bulletins, sessions de rattrapage
- **Indicateurs de réussite** : Taux de réussite, taux d'abandon, respect des échéances

**Fonctionnalités** :
- Filtrage par programme et période académique
- Ajout/modification/suppression d'activités
- Suivi des dates prévues vs dates réelles
- Gestion des indicateurs avec valeurs cibles et réelles

### 2. Maquette pédagogique détaillée
**URL**: `/tableaux-bord/maquette-pedagogique`

Ce tableau affiche la structure complète d'un programme avec :
- Liste des modules avec volumes horaires (CM, TD, TP, TPE, VHT)
- Coefficients et crédits ECTS
- Intervenants assignés
- **Résultats étudiants** par module (notes, progression, présences)
- **Évaluations des enseignements** par les étudiants

**Fonctionnalités** :
- Vue d'ensemble des statistiques (nombre de modules, crédits, VHT total)
- Gestion des résultats étudiants (ajout, modification)
- Gestion des évaluations de cours
- Calcul automatique du taux de réussite et de progression
- Export des données (à venir)

### 3. Tableau de bord qualité (à créer)
**URL**: `/tableaux-bord/qualite` (planifié)

Ce tableau permettra de :
- Suivre les indicateurs de qualité académique
- Gérer les objectifs et valeurs cibles
- Collecter les résultats des indicateurs
- Visualiser les performances

## 🗄️ Structure de la base de données

### Nouveaux modèles créés

#### ActiviteAcademique
Stocke les activités académiques planifiées et réalisées.
```prisma
- nom: String
- description: String?
- datePrevue: DateTime?
- dateReelle: DateTime?
- type: String (DEMARRAGE_COURS, ARRET_COURS, EXAMEN, etc.)
- programmeId: String
- periodeId: String
```

#### IndicateurAcademique
Stocke les indicateurs de performance académique.
```prisma
- nom: String
- valeurCible: Float?
- valeurReelle: Float?
- periodicite: String (SEMESTRIELLE, ANNUELLE, etc.)
- methodeCalcul: String?
- unite: String (%, jours, nombre)
- type: String
- programmeId: String
- periodeId: String
- responsableId: String?
```

#### ResultatEtudiant
Stocke les résultats académiques des étudiants par module.
```prisma
- numeroEtudiant: String
- nomEtudiant: String
- prenomEtudiant: String
- moduleId: String
- noteCC: Float?
- noteExamen: Float?
- noteFinale: Float?
- statut: String (VALIDE, INVALIDE, ABANDONNE, EN_COURS)
- mention: String?
- vhDeroule: Int
- progressionPct: Int
- presences: Int
- absences: Int
- tauxPresence: Float?
```

#### EvaluationEnseignement
Stocke les évaluations des enseignements par les étudiants.
```prisma
- moduleId: String
- intervenantId: String
- dateEnvoi: DateTime?
- dateDebut: DateTime?
- dateFin: DateTime?
- lienEvaluation: String?
- noteQualiteCours: Float?
- noteQualitePedagogie: Float?
- noteDisponibilite: Float?
- noteMoyenne: Float?
- nombreReponses: Int
- tauxParticipation: Float?
```

## 🔌 APIs disponibles

### Activités académiques
- `GET /api/activites-academiques` - Récupérer toutes les activités
- `POST /api/activites-academiques` - Créer une activité
- `GET /api/activites-academiques/[id]` - Récupérer une activité
- `PUT /api/activites-academiques/[id]` - Modifier une activité
- `DELETE /api/activites-academiques/[id]` - Supprimer une activité

### Indicateurs académiques
- `GET /api/indicateurs-academiques` - Récupérer tous les indicateurs
- `POST /api/indicateurs-academiques` - Créer un indicateur
- `GET /api/indicateurs-academiques/[id]` - Récupérer un indicateur
- `PUT /api/indicateurs-academiques/[id]` - Modifier un indicateur
- `DELETE /api/indicateurs-academiques/[id]` - Supprimer un indicateur

### Résultats étudiants
- `GET /api/resultats-etudiants` - Récupérer tous les résultats
- `POST /api/resultats-etudiants` - Créer un résultat
- `GET /api/resultats-etudiants/[id]` - Récupérer un résultat
- `PUT /api/resultats-etudiants/[id]` - Modifier un résultat
- `DELETE /api/resultats-etudiants/[id]` - Supprimer un résultat

### Évaluations d'enseignements
- `GET /api/evaluations-enseignements` - Récupérer toutes les évaluations
- `POST /api/evaluations-enseignements` - Créer une évaluation
- `GET /api/evaluations-enseignements/[id]` - Récupérer une évaluation
- `PUT /api/evaluations-enseignements/[id]` - Modifier une évaluation
- `DELETE /api/evaluations-enseignements/[id]` - Supprimer une évaluation

### Périodes académiques
- `GET /api/periodes-academiques` - Récupérer toutes les périodes
- `POST /api/periodes-academiques` - Créer une période
- `GET /api/periodes-academiques/[id]` - Récupérer une période
- `PUT /api/periodes-academiques/[id]` - Modifier une période
- `DELETE /api/periodes-academiques/[id]` - Supprimer une période

## 📝 Utilisation pas à pas

### Configuration initiale

1. **Créer une période académique**
   - Vous devez d'abord créer une période académique via l'API ou créer un formulaire dédié
   - Exemple : "Année 2024-2025" avec les dates des semestres

2. **Créer ou sélectionner un programme**
   - Utilisez le tableau de bord principal pour créer un programme
   - Notez l'ID du programme

### Utiliser le tableau des échéances

1. Accédez à `/tableaux-bord/echeances-academiques`
2. Sélectionnez un programme et une période
3. Cliquez sur "Ajouter une activité" pour créer une échéance
4. Cliquez sur "Ajouter un indicateur" pour suivre un KPI

### Utiliser la maquette pédagogique

1. Accédez à `/tableaux-bord/maquette-pedagogique`
2. Sélectionnez un programme
3. Cliquez sur l'icône "Utilisateurs" pour gérer les résultats étudiants
4. Cliquez sur l'icône "Graphique" pour gérer l'évaluation du cours

## 🚀 Prochaines étapes

### Fonctionnalités à développer

1. **Tableau de bord qualité** - Créer la page complète
2. **Export de données** - Implémenter l'export en CSV/Excel
3. **Calculs automatiques** - Automatiser le calcul des indicateurs
4. **Notifications** - Alertes pour les échéances à venir
5. **Rapports** - Génération de rapports PDF
6. **Importation en masse** - Import CSV pour les résultats étudiants

### Améliorations suggérées

1. **Graphiques** - Ajouter des visualisations (charts.js, recharts)
2. **Filtres avancés** - Plus d'options de filtrage
3. **Recherche** - Fonction de recherche dans les tableaux
4. **Historique** - Traçabilité des modifications
5. **Permissions** - Rôles différenciés (admin, coordinateur, enseignant)

## 🔧 Maintenance

### Base de données

La migration a créé les tables suivantes :
- `activites_academiques`
- `indicateurs_academiques`
- `resultats_etudiants`
- `evaluations_enseignements`

Pour réinitialiser :
```bash
npx prisma migrate reset
npx prisma migrate dev
npm run db:seed
```

### Seed data

Pour ajouter des données de test, modifiez le fichier `prisma/seed.js` pour inclure :
- Des périodes académiques
- Des activités académiques
- Des résultats étudiants de test

## 📞 Support

Pour toute question ou problème :
1. Consultez la documentation Prisma
2. Vérifiez les logs du serveur
3. Utilisez les outils de développement du navigateur

## 🎯 Checklist de déploiement

- [ ] Vérifier la migration de la base de données
- [ ] Tester toutes les APIs
- [ ] Vérifier les permissions d'accès
- [ ] Ajouter des liens de navigation
- [ ] Former les utilisateurs
- [ ] Créer des données de démonstration
- [ ] Documenter les processus métier
- [ ] Mettre en place une sauvegarde automatique

---

**Date de création** : 26 Novembre 2025
**Version** : 1.0
**Auteur** : BEM Planning FC Development Team
