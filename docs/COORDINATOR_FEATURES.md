# Fonctionnalités Coordinateur - BEM Planning FC

## Vue d'ensemble

Le module coordinateur permet aux coordinateurs de programmes de gérer leurs programmes, modules et de suivre leur progression en toute autonomie.

## Fonctionnalités implémentées

### 1. Tableau de Bord Coordinateur

**URL:** `/coordinateur/dashboard`

**Fonctionnalités:**
- Vue d'ensemble des statistiques clés (programmes, modules, séances, intervenants)
- Cartes statistiques interactives avec gradient de couleur
- Alertes et actions requises en temps réel
- Liste des programmes en retard
- Liste des modules sans intervenant
- Modules à venir (30 prochains jours)
- Activité récente avec journal des actions
- Graphique de progression par programme
- Statistiques VHT par type (CM, TD, TP, TPE)

**API:** `/api/coordinateur/dashboard`

### 2. Gestion des Programmes

**URL:** `/coordinateur/programmes`

**Fonctionnalités:**
- Liste des programmes du coordinateur (isolation des données)
- Vue en grille responsive (1-3 colonnes)
- Statistiques globales:
  - Total programmes
  - Progression moyenne
  - Programmes en cours
  - Programmes en retard
- Recherche par code ou nom
- Filtrage par statut
- Création de nouveau programme
- Modification de programme
- Suppression (avec vérification des dépendances)
- Barres de progression colorées
- Badges de statut

**API:**
- `/api/coordinateur/programmes` (GET, POST)
- `/api/coordinateur/programmes/[id]` (GET, PUT, DELETE)

### 3. Page Détails Programme

**URL:** `/coordinateur/programmes/[id]`

**Fonctionnalités:**
- Informations complètes du programme
- Statut et coordinateur
- Progression avec barre visuelle
- Comparaison progression déclarée vs réelle
- Alertes contextuelles:
  - Programme en retard
  - Échéance proche
  - Écart de progression
  - Aucun module associé
- Statistiques des modules:
  - Total modules (planifiés, en cours, terminés)
  - Répartition CM/TD/TP/TPE/VHT
- Liste complète des modules avec:
  - Code, nom, intervenant
  - VHT, nombre de séances
  - Statut et progression
- Boutons d'action (modifier, supprimer)
- Lien vers ajout de module

### 4. Gestion des Modules

**URL:** `/coordinateur/modules`

**Fonctionnalités:**
- Liste complète des modules
- Statistiques en temps réel:
  - Total modules
  - VHT total
  - Modules terminés/en cours
  - Avec/sans intervenant
- Filtres multiples:
  - Recherche par code/nom
  - Filtre par programme
  - Filtre par statut
- Table détaillée avec:
  - Toutes les informations du module
  - Progression visuelle
  - Nombre de séances
  - Statut intervenant
- Modal de création/édition avec:
  - Calcul automatique VHT
  - Sélection programme
  - Sélection intervenant
  - Dates début/fin
  - Coefficient et crédits
  - Statut et progression (édition)
- Suppression avec vérification
- Support des liens inter-pages (retour depuis programme)

**API:**
- `/api/coordinateur/modules` (GET, POST)
- `/api/coordinateur/modules/[id]` (PUT, DELETE)

### 5. Système d'Alertes Email

**Configuration:** Voir `/docs/EMAIL_ALERTS.md`

**Types d'alertes:**

1. **Programme en retard**
   - Déclencheur: Date de fin dépassée + progression < 100%
   - Email avec détails et lien direct

2. **Module sans intervenant**
   - Déclencheur: Aucun intervenant + démarrage dans 14 jours
   - Email avec urgence et lien vers gestion modules

3. **Module démarrant prochainement**
   - Déclencheur: Démarrage dans 7 jours
   - Email de rappel avec vérification intervenant

4. **Rapport hebdomadaire**
   - Statistiques complètes
   - Alertes actives
   - Lien vers dashboard

**APIs:**
- `/api/coordinateur/alerts/check` - Vérification manuelle
- `/api/coordinateur/alerts/weekly-report` - Rapport hebdomadaire
- `/api/cron/daily-alerts` - Cron quotidien automatique

## Architecture technique

### Isolation des données

Les coordinateurs ne voient que leurs propres données:

```javascript
// Dans les APIs
const where = {};
if (session.user.role === 'COORDINATOR') {
  where.userId = session.user.id;
}
```

### Journalisation automatique

Toutes les actions sont journalisées:

```javascript
await prisma.journalActivite.create({
  data: {
    action: 'CREATION' | 'MODIFICATION' | 'SUPPRESSION' | 'ALERTE',
    entite: 'Programme' | 'Module',
    entiteId: id,
    description: '...',
    userId: session.user.id,
    userName: session.user.name,
    ipAddress: req.headers['x-forwarded-for'],
    userAgent: req.headers['user-agent']
  }
});
```

### Calculs automatiques

**Progression réelle:**
```javascript
const modulesTermines = programme.modules.filter(m => m.status === 'TERMINE').length;
const progressionReelle = Math.round((modulesTermines / programme.modules.length) * 100);
```

**VHT:**
```javascript
const vht = parseInt(cm || 0) + parseInt(td || 0) + parseInt(tp || 0) + parseInt(tpe || 0);
```

**Détection de retard:**
```javascript
const enRetard = now > fin && programme.progression < 100 && programme.status !== 'TERMINE';
```

### Codes de couleur

**Progression:**
- 80-100%: Vert (excellent)
- 50-79%: Bleu (bon)
- 25-49%: Jaune (attention)
- 0-24%: Gris (critique)

**Statuts:**
- PLANIFIE: Bleu
- EN_COURS: Vert
- TERMINE: Gris
- SUSPENDU: Jaune
- ANNULE: Rouge

## Navigation

Menu "Coordination" visible pour COORDINATOR et ADMIN:

1. **Tableau de Bord** - Vue d'ensemble
2. **Mes Programmes** - Liste programmes
3. **Gestion des Modules** - Liste modules

Couleur verte distinctive pour la section Coordination.

## Sécurité et permissions

### Contrôle d'accès

```javascript
// Vérification du rôle
if (!['COORDINATOR', 'ADMIN'].includes(session.user.role)) {
  return res.status(403).json({ error: 'Accès non autorisé' });
}

// Vérification propriété (coordinateurs)
if (session.user.role === 'COORDINATOR' && programme.userId !== session.user.id) {
  return res.status(403).json({ error: 'Accès non autorisé' });
}
```

### Validation des données

- Code module unique (uppercase automatique)
- Dates cohérentes (fin > début)
- VHT > 0
- Progression 0-100%
- Coefficient et crédits ≥ 1

### Protection contre suppressions

- Vérification des dépendances
- Messages d'erreur explicites
- Compteurs de relations

## Responsive Design

Toutes les interfaces sont responsive:

- Mobile: 1 colonne
- Tablet: 2 colonnes
- Desktop: 3+ colonnes
- Tables scrollables horizontalement
- Modals adaptés aux petits écrans

## Performance

### Optimisations

1. **Requêtes Prisma optimisées:**
   - Include sélectifs
   - Compteurs avec `_count`
   - Tri au niveau DB

2. **Calculs côté serveur:**
   - Statistiques pré-calculées
   - Agrégations en base

3. **Chargement conditionnel:**
   - Données chargées uniquement si nécessaire
   - États de loading appropriés

## Intégration

### Avec le système existant

- Utilise les mêmes modèles Prisma
- Réutilise les composants Layout
- Partage les icônes Lucide React
- Cohérence avec le style Tailwind

### APIs intervenants

Le module coordinateur utilise l'API intervenants existante:
```javascript
const response = await fetch('/api/intervenants');
```

## Tests recommandés

### Test coordinateur

1. Créer un utilisateur avec rôle COORDINATOR
2. Se connecter
3. Vérifier isolation des données
4. Créer programme
5. Ajouter modules
6. Tester alertes
7. Vérifier journalisation

### Test admin

1. Se connecter en tant qu'ADMIN
2. Vérifier accès à tous les programmes
3. Vérifier permissions étendues

### Test emails

1. Configurer EMAIL_* dans .env
2. Créer programme en retard
3. Créer module sans intervenant
4. Appeler `/api/coordinateur/alerts/check`
5. Vérifier réception emails

## Améliorations futures

Voir les tâches "Moyen terme" dans le plan initial:

- [ ] Planification de séances depuis modules
- [ ] Affectation automatique d'intervenants
- [ ] Export PDF/Excel des programmes
- [ ] Rapports de progression

## Support

Pour toute question ou problème:
- Consulter `/docs/EMAIL_ALERTS.md` pour les alertes
- Vérifier les logs dans `/admin/logs`
- Consulter le journal d'activités
