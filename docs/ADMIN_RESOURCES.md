# Documentation - Gestion des Ressources Pédagogiques (Admin)

## Vue d'ensemble

Ce document décrit les fonctionnalités de gestion des ressources pédagogiques pour les administrateurs du système BEM Planning FC.

## Modules implémentés

### 1. Gestion des Salles de Cours

#### Fonctionnalités
- ✅ Création de salles avec capacité et équipements
- ✅ Modification des caractéristiques des salles
- ✅ Suppression de salles (avec vérification d'utilisation)
- ✅ Recherche et filtrage par bâtiment et disponibilité
- ✅ Statistiques en temps réel (total, disponibles, occupées)
- ✅ Classification par bâtiment et type

#### Fichiers
- **API**: `/pages/api/admin/salles.js` et `/pages/api/admin/salles/[id].js`
- **Interface**: `/pages/admin/salles.js`
- **Route**: `/admin/salles`

#### Modèle de données (Prisma)
```prisma
model Salle {
  id          String   @id @default(cuid())
  nom         String   @unique
  batiment    String
  capacite    Int
  equipements String?
  disponible  Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### API Endpoints

##### GET /api/admin/salles
Récupère la liste des salles avec filtres optionnels.

**Query params:**
- `search` (string): Recherche par nom ou bâtiment
- `batiment` (string): Filtrer par bâtiment
- `disponible` (boolean): Filtrer par disponibilité

**Response:**
```json
{
  "salles": [...],
  "stats": {
    "total": 25,
    "disponibles": 20,
    "occupees": 5,
    "batiments": [...]
  }
}
```

##### POST /api/admin/salles
Crée une nouvelle salle.

**Body:**
```json
{
  "nom": "A101",
  "batiment": "Bâtiment A",
  "capacite": 30,
  "equipements": "Vidéoprojecteur, Tableau blanc",
  "disponible": true
}
```

##### PUT /api/admin/salles/[id]
Met à jour une salle existante.

##### DELETE /api/admin/salles/[id]
Supprime une salle (vérifie qu'elle n'est pas utilisée dans des séances).

---

### 2. Gestion des Périodes Académiques

#### Fonctionnalités
- ✅ Création d'années universitaires
- ✅ Définition des dates importantes (rentrée, examens, vacances)
- ✅ Configuration des périodes de cours et d'examens
- ✅ Gestion des jours fériés et périodes de pause
- ✅ Activation/désactivation des périodes académiques
- ✅ Une seule période peut être active à la fois

#### Fichiers
- **API**: `/pages/api/admin/periodes.js` et `/pages/api/admin/periodes/[id].js`
- **Interface**: `/pages/admin/periodes.js`
- **Route**: `/admin/periodes`

#### Modèle de données (Prisma)
```prisma
model PeriodeAcademique {
  id                  String   @id @default(cuid())
  nom                 String
  annee               String
  debutS1             DateTime
  finS1               DateTime
  debutS2             DateTime
  finS2               DateTime
  vacancesNoel        DateTime
  finVacancesNoel     DateTime
  vacancesPaques      DateTime?
  finVacancesPaques   DateTime?
  active              Boolean  @default(false)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

#### API Endpoints

##### GET /api/admin/periodes
Récupère la liste des périodes académiques.

**Query params:**
- `search` (string): Recherche par nom ou année
- `active` (boolean): Filtrer par statut actif/inactif
- `annee` (string): Filtrer par année

**Response:**
```json
{
  "periodes": [...],
  "stats": {
    "total": 5,
    "active": 1,
    "inactive": 4
  }
}
```

##### POST /api/admin/periodes
Crée une nouvelle période académique.

**Body:**
```json
{
  "nom": "Année Universitaire",
  "annee": "2024-2025",
  "debutS1": "2024-09-01",
  "finS1": "2025-01-31",
  "debutS2": "2025-02-01",
  "finS2": "2025-06-30",
  "vacancesNoel": "2024-12-20",
  "finVacancesNoel": "2025-01-05",
  "vacancesPaques": "2025-04-10",
  "finVacancesPaques": "2025-04-20",
  "active": true
}
```

##### PUT /api/admin/periodes/[id]
Met à jour une période académique.

**Note**: Si `active: true` est passé, toutes les autres périodes seront automatiquement désactivées.

##### DELETE /api/admin/periodes/[id]
Supprime une période (vérifie qu'elle n'est pas utilisée).

---

### 3. Journaux d'Activités (Audit)

#### Fonctionnalités
- ✅ Consultation de l'historique complet des actions
- ✅ Filtrage par utilisateur, type d'action, entité, date
- ✅ Audit des modifications (anciennes/nouvelles valeurs)
- ✅ Traçabilité complète pour conformité réglementaire
- ✅ Pagination des résultats
- ✅ Vue détaillée de chaque action
- ✅ Statistiques d'activité

#### Fichiers
- **API**: `/pages/api/admin/logs.js`
- **Interface**: `/pages/admin/logs.js`
- **Route**: `/admin/logs`

#### Modèle de données (Prisma)
```prisma
model JournalActivite {
  id             String     @id @default(cuid())
  action         ActionType
  entite         String
  entiteId       String
  description    String
  ancienneValeur String?
  nouvelleValeur String?
  userId         String
  userName       String?
  ipAddress      String?
  userAgent      String?
  createdAt      DateTime   @default(now())
}

enum ActionType {
  CREATION
  MODIFICATION
  SUPPRESSION
  CONNEXION
  DECONNEXION
  PLANIFICATION_AUTO
  RESOLUTION_CONFLIT
  EXPORT_DONNEES
}
```

#### API Endpoints

##### GET /api/admin/logs
Récupère les journaux d'activités avec filtres et pagination.

**Query params:**
- `search` (string): Recherche textuelle
- `userId` (string): Filtrer par utilisateur
- `action` (ActionType): Filtrer par type d'action
- `entite` (string): Filtrer par entité
- `dateDebut` (date): Date de début
- `dateFin` (date): Date de fin
- `page` (number): Numéro de page (défaut: 1)
- `limit` (number): Nombre de résultats par page (défaut: 50)

**Response:**
```json
{
  "logs": [...],
  "stats": {
    "total": 1250,
    "byAction": [...],
    "byEntite": [...],
    "uniqueUsers": 15,
    "last24h": 45
  },
  "pagination": {
    "total": 1250,
    "page": 1,
    "limit": 50,
    "totalPages": 25
  }
}
```

---

## Journalisation automatique

Toutes les actions effectuées via les APIs de gestion des ressources sont automatiquement enregistrées dans le journal d'activités avec les informations suivantes :

- **Action**: Type d'opération (CREATION, MODIFICATION, SUPPRESSION)
- **Entité**: Type de ressource modifié (Salle, PeriodeAcademique, etc.)
- **Description**: Description de l'action
- **Valeurs**: Anciennes et nouvelles valeurs (en JSON)
- **Utilisateur**: ID et nom de l'utilisateur
- **Contexte**: Adresse IP et User-Agent

### Exemple d'enregistrement
```javascript
await prisma.journalActivite.create({
  data: {
    action: 'CREATION',
    entite: 'Salle',
    entiteId: salle.id,
    description: `Création de la salle ${salle.nom}`,
    nouvelleValeur: JSON.stringify(salle),
    userId: session.user.id,
    userName: session.user.name,
    ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent: req.headers['user-agent']
  }
});
```

---

## Navigation

Les nouvelles fonctionnalités sont accessibles via le menu de navigation dans la section **"Ressources Pédagogiques"** (visible uniquement pour les administrateurs) :

- 🏠 **Salles de Cours** → `/admin/salles`
- 📅 **Périodes Académiques** → `/admin/periodes`
- 📋 **Journaux d'Activités** → `/admin/logs`

### Mise à jour du Layout

Le fichier `/components/layout.js` a été modifié pour ajouter une nouvelle section de navigation :

```javascript
const ressourcesNavigation = session?.user?.role === 'ADMIN' ? [
  { name: 'Salles de Cours', href: '/admin/salles', icon: Home },
  { name: 'Périodes Académiques', href: '/admin/periodes', icon: Calendar },
  { name: 'Journaux d\'Activités', href: '/admin/logs', icon: FileText },
] : [];
```

---

## Sécurité et Permissions

### Protection des routes
Toutes les pages admin vérifient systématiquement :
1. Que l'utilisateur est authentifié
2. Que l'utilisateur a le rôle `ADMIN`

```javascript
useEffect(() => {
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
  } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
    router.push('/dashboard');
  }
}, [status, session, router]);
```

### Protection des APIs
Toutes les APIs vérifient la session et le rôle :

```javascript
const session = await getServerSession(req, res, authOptions);

if (!session || session.user.role !== 'ADMIN') {
  return res.status(403).json({ error: 'Accès non autorisé' });
}
```

---

## Fonctionnalités UX

### Debounce sur la recherche
Pour éviter les requêtes excessives, toutes les recherches utilisent un système de debounce (500ms) :

```javascript
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearchTerm(searchTerm);
  }, 500);
  return () => clearTimeout(timer);
}, [searchTerm]);
```

### Protection des clics sur les modals
Les modals utilisent `stopPropagation` pour éviter la fermeture accidentelle :

```javascript
<div onClick={(e) => e.stopPropagation()}>
  {/* Contenu du modal */}
</div>
```

### Animations
Toutes les pages utilisent les composants `PageTransition`, `AnimatedCard` et `SlideIn` pour des transitions fluides.

---

## Tests recommandés

### Tests fonctionnels à effectuer

1. **Salles**
   - [ ] Créer une salle
   - [ ] Modifier une salle
   - [ ] Tenter de supprimer une salle utilisée
   - [ ] Supprimer une salle non utilisée
   - [ ] Rechercher par nom
   - [ ] Filtrer par bâtiment
   - [ ] Filtrer par disponibilité

2. **Périodes Académiques**
   - [ ] Créer une période
   - [ ] Activer une période (vérifier que les autres sont désactivées)
   - [ ] Modifier les dates
   - [ ] Tenter de supprimer une période utilisée
   - [ ] Rechercher par année

3. **Journaux**
   - [ ] Vérifier la création de logs après chaque action
   - [ ] Filtrer par action
   - [ ] Filtrer par entité
   - [ ] Filtrer par date
   - [ ] Voir les détails d'un log
   - [ ] Vérifier la pagination

---

## Améliorations futures possibles

1. **Export des données**
   - Export CSV/Excel des salles
   - Export PDF des périodes académiques
   - Export des logs pour audit externe

2. **Statistiques avancées**
   - Taux d'occupation des salles
   - Graphiques d'utilisation
   - Rapports d'activité mensuel/annuel

3. **Notifications**
   - Alertes pour conflits de salles
   - Rappels de fin de période
   - Notifications d'actions critiques

4. **Import en masse**
   - Import CSV de salles
   - Import de calendriers académiques

5. **Gestion des équipements**
   - Catalogue d'équipements
   - Historique de maintenance
   - Réservation d'équipements

---

## Support

Pour toute question ou problème :
- Documentation technique : `/docs/ADMIN_FEATURES.md`
- Guide de démarrage : `/docs/ADMIN_QUICKSTART.md`
- Tests : `/docs/TEST_ADMIN.md`
