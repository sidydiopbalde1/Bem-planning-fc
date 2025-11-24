# Modèle Conceptuel et Logique de Données - BEM Planning FC

## 1. Modèle Conceptuel de Données (MCD)

### 1.1 Représentation Textuelle

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         MODÈLE CONCEPTUEL DE DONNÉES                            │
│                              BEM Planning FC                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐          possède           ┌──────────────┐
│              │         (1,n)              │              │
│  UTILISATEUR ├────────────────────────────┤  PROGRAMME   │
│              │         (1,1)              │              │
└──────┬───────┘                            └──────┬───────┘
       │                                           │
       │ crée                                      │ contient
       │ (1,n)                                     │ (1,n)
       │                                           │
       │         (1,1)                             │
       └──────────────────────┐                    │
                              │                    │
                              ▼                    ▼
                        ┌──────────────┐    ┌──────────────┐
                        │              │    │              │
                        │    MODULE    │◄───┤   MODULE     │
                        │              │    │              │
                        └──────┬───────┘    └──────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              │ est assigné    │ comprend       │
              │ (0,1)          │ (1,n)          │
              │                │                │
              ▼                ▼                │
       ┌──────────────┐ ┌──────────────┐       │
       │              │ │              │       │
       │ INTERVENANT  │ │   SEANCE     │◄──────┘
       │              │ │              │
       └──────┬───────┘ └──────┬───────┘
              │                │
              │ anime          │ se déroule dans
              │ (0,n)          │ (0,1)
              │                │
              └────────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │              │
                │    SALLE     │
                │              │
                └──────────────┘


       ┌──────────────┐         concerne         ┌──────────────┐
       │              │         (1,1)            │              │
       │   CONFLIT    ├──────────────────────────┤   SEANCE     │
       │              │         (0,n)            │              │
       └──────────────┘                          └──────────────┘


       ┌──────────────────────┐
       │                      │
       │  PERIODE_ACADEMIQUE  │
       │                      │
       └──────────────────────┘
```

### 1.2 Description des Entités

| Entité | Description | Identifiant |
|--------|-------------|-------------|
| **UTILISATEUR** | Personne utilisant le système (admin, coordinateur, enseignant) | id |
| **PROGRAMME** | Maquette pédagogique de formation | id, code |
| **MODULE** | Unité d'enseignement appartenant à un programme | id, code |
| **INTERVENANT** | Enseignant ou formateur dispensant les cours | id, email |
| **SEANCE** | Occurrence planifiée d'un enseignement | id |
| **SALLE** | Lieu physique où se déroulent les séances | id, nom |
| **CONFLIT** | Problème de planification détecté | id |
| **PERIODE_ACADEMIQUE** | Année universitaire avec ses dates clés | id |

### 1.3 Description des Associations

| Association | Entités | Cardinalités | Description |
|-------------|---------|--------------|-------------|
| **Possède** | UTILISATEUR - PROGRAMME | (1,1) - (1,n) | Un utilisateur possède plusieurs programmes |
| **Crée** | UTILISATEUR - MODULE | (1,1) - (1,n) | Un utilisateur crée plusieurs modules |
| **Contient** | PROGRAMME - MODULE | (1,1) - (1,n) | Un programme contient plusieurs modules |
| **Est assigné** | MODULE - INTERVENANT | (0,1) - (0,n) | Un module peut être assigné à un intervenant |
| **Comprend** | MODULE - SEANCE | (1,1) - (1,n) | Un module comprend plusieurs séances |
| **Anime** | INTERVENANT - SEANCE | (1,1) - (0,n) | Un intervenant anime plusieurs séances |
| **Se déroule dans** | SEANCE - SALLE | (0,1) - (0,n) | Une séance peut se dérouler dans une salle |
| **Concerne** | CONFLIT - SEANCE | (1,1) - (0,n) | Un conflit concerne au moins une séance |

---

## 2. Modèle Logique de Données (MLD)

### 2.1 Schéma Relationnel

```sql
-- ============================================
-- MODÈLE LOGIQUE DE DONNÉES - BEM Planning FC
-- ============================================

-- Table USERS (Utilisateurs)
users (
    id              VARCHAR(25)     PRIMARY KEY,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    name            VARCHAR(100),
    password        VARCHAR(255)    NOT NULL,
    role            ENUM('ADMIN', 'COORDINATOR', 'TEACHER') DEFAULT 'ADMIN',
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)

-- Table PROGRAMMES
programmes (
    id              VARCHAR(25)     PRIMARY KEY,
    code            VARCHAR(20)     NOT NULL UNIQUE,
    name            VARCHAR(200)    NOT NULL,
    description     TEXT,
    semestre        ENUM('SEMESTRE_1', 'SEMESTRE_2', 'SEMESTRE_3',
                         'SEMESTRE_4', 'SEMESTRE_5', 'SEMESTRE_6') NOT NULL,
    niveau          VARCHAR(10)     NOT NULL,
    date_debut      DATE            NOT NULL,
    date_fin        DATE            NOT NULL,
    status          ENUM('PLANIFIE', 'EN_COURS', 'TERMINE',
                         'SUSPENDU', 'ANNULE') DEFAULT 'PLANIFIE',
    progression     INT             DEFAULT 0 CHECK (progression >= 0 AND progression <= 100),
    total_vht       INT             NOT NULL,
    user_id         VARCHAR(25)     NOT NULL REFERENCES users(id),
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)

-- Table INTERVENANTS
intervenants (
    id              VARCHAR(25)     PRIMARY KEY,
    civilite        VARCHAR(10)     NOT NULL,
    nom             VARCHAR(100)    NOT NULL,
    prenom          VARCHAR(100)    NOT NULL,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    telephone       VARCHAR(20),
    grade           VARCHAR(100),
    specialite      VARCHAR(200),
    etablissement   VARCHAR(200),
    disponible      BOOLEAN         DEFAULT TRUE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)

-- Table MODULES
modules (
    id              VARCHAR(25)     PRIMARY KEY,
    code            VARCHAR(20)     NOT NULL UNIQUE,
    name            VARCHAR(200)    NOT NULL,
    description     TEXT,
    cm              INT             DEFAULT 0,
    td              INT             DEFAULT 0,
    tp              INT             DEFAULT 0,
    tpe             INT             DEFAULT 0,
    vht             INT             NOT NULL,
    coefficient     INT             DEFAULT 1,
    credits         INT             DEFAULT 1,
    status          ENUM('PLANIFIE', 'EN_COURS', 'TERMINE',
                         'REPORTE', 'ANNULE') DEFAULT 'PLANIFIE',
    progression     INT             DEFAULT 0,
    date_debut      DATE,
    date_fin        DATE,
    programme_id    VARCHAR(25)     NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
    intervenant_id  VARCHAR(25)     REFERENCES intervenants(id),
    user_id         VARCHAR(25)     NOT NULL REFERENCES users(id),
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)

-- Table SALLES
salles (
    id              VARCHAR(25)     PRIMARY KEY,
    nom             VARCHAR(50)     NOT NULL UNIQUE,
    batiment        VARCHAR(100)    NOT NULL,
    capacite        INT             NOT NULL,
    equipements     TEXT,
    disponible      BOOLEAN         DEFAULT TRUE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)

-- Table SEANCES
seances (
    id              VARCHAR(25)     PRIMARY KEY,
    date_seance     DATE            NOT NULL,
    heure_debut     TIME            NOT NULL,
    heure_fin       TIME            NOT NULL,
    duree           INT             NOT NULL,
    type_seance     ENUM('CM', 'TD', 'TP', 'EXAMEN', 'RATTRAPAGE') NOT NULL,
    salle           VARCHAR(50),
    batiment        VARCHAR(100),
    status          ENUM('PLANIFIE', 'CONFIRME', 'EN_COURS',
                         'TERMINE', 'REPORTE', 'ANNULE') DEFAULT 'PLANIFIE',
    module_id       VARCHAR(25)     NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    intervenant_id  VARCHAR(25)     NOT NULL REFERENCES intervenants(id),
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Contrainte : heure_fin > heure_debut
    CHECK (heure_fin > heure_debut)
)

-- Table CONFLITS
conflits (
    id              VARCHAR(25)     PRIMARY KEY,
    type            ENUM('INTERVENANT_DOUBLE_BOOKING', 'SALLE_DOUBLE_BOOKING',
                         'CHEVAUCHEMENT_HORAIRE', 'CONTRAINTE_CALENDAIRE') NOT NULL,
    description     TEXT            NOT NULL,
    seance_id_1     VARCHAR(25)     NOT NULL REFERENCES seances(id),
    seance_id_2     VARCHAR(25)     REFERENCES seances(id),
    ressource_type  VARCHAR(20)     NOT NULL,
    ressource_id    VARCHAR(25)     NOT NULL,
    resolu          BOOLEAN         DEFAULT FALSE,
    resolution      TEXT,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)

-- Table PERIODES_ACADEMIQUES
periodes_academiques (
    id                  VARCHAR(25)     PRIMARY KEY,
    nom                 VARCHAR(100)    NOT NULL,
    annee               VARCHAR(20)     NOT NULL,
    debut_s1            DATE            NOT NULL,
    fin_s1              DATE            NOT NULL,
    debut_s2            DATE            NOT NULL,
    fin_s2              DATE            NOT NULL,
    vacances_noel       DATE            NOT NULL,
    fin_vacances_noel   DATE            NOT NULL,
    vacances_paques     DATE,
    fin_vacances_paques DATE,
    active              BOOLEAN         DEFAULT FALSE,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

### 2.2 Diagramme du MLD

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         MODÈLE LOGIQUE DE DONNÉES                               │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐
│         USERS           │
├─────────────────────────┤
│ # id          VARCHAR   │
│   email       VARCHAR   │──────────────────────────┐
│   name        VARCHAR   │                          │
│   password    VARCHAR   │                          │
│   role        ENUM      │                          │
│   created_at  TIMESTAMP │                          │
│   updated_at  TIMESTAMP │                          │
└─────────────────────────┘                          │
         │                                           │
         │ 1,n                                       │ 1,n
         ▼                                           │
┌─────────────────────────┐                          │
│      PROGRAMMES         │                          │
├─────────────────────────┤                          │
│ # id          VARCHAR   │                          │
│   code        VARCHAR   │                          │
│   name        VARCHAR   │                          │
│   description TEXT      │                          │
│   semestre    ENUM      │                          │
│   niveau      VARCHAR   │                          │
│   date_debut  DATE      │                          │
│   date_fin    DATE      │                          │
│   status      ENUM      │                          │
│   progression INT       │                          │
│   total_vht   INT       │                          │
│ * user_id     VARCHAR   │◄─────────────────────────┘
│   created_at  TIMESTAMP │
│   updated_at  TIMESTAMP │
└─────────────────────────┘
         │
         │ 1,n
         ▼
┌─────────────────────────┐         ┌─────────────────────────┐
│        MODULES          │         │     INTERVENANTS        │
├─────────────────────────┤         ├─────────────────────────┤
│ # id          VARCHAR   │         │ # id          VARCHAR   │
│   code        VARCHAR   │         │   civilite    VARCHAR   │
│   name        VARCHAR   │   0,1   │   nom         VARCHAR   │
│   description TEXT      │◄────────│   prenom      VARCHAR   │
│   cm          INT       │         │   email       VARCHAR   │
│   td          INT       │         │   telephone   VARCHAR   │
│   tp          INT       │         │   grade       VARCHAR   │
│   tpe         INT       │         │   specialite  VARCHAR   │
│   vht         INT       │         │   etablissement VARCHAR │
│   coefficient INT       │         │   disponible  BOOLEAN   │
│   credits     INT       │         │   created_at  TIMESTAMP │
│   status      ENUM      │         │   updated_at  TIMESTAMP │
│   progression INT       │         └─────────────────────────┘
│   date_debut  DATE      │                    │
│   date_fin    DATE      │                    │
│ * programme_id VARCHAR  │                    │ 1,1
│ * intervenant_id VARCHAR│                    │
│ * user_id     VARCHAR   │                    │
│   created_at  TIMESTAMP │                    │
│   updated_at  TIMESTAMP │                    │
└─────────────────────────┘                    │
         │                                     │
         │ 1,n                                 │
         ▼                                     ▼
┌─────────────────────────┐         ┌─────────────────────────┐
│        SEANCES          │         │        SALLES           │
├─────────────────────────┤         ├─────────────────────────┤
│ # id          VARCHAR   │   0,1   │ # id          VARCHAR   │
│   date_seance DATE      │◄────────│   nom         VARCHAR   │
│   heure_debut TIME      │         │   batiment    VARCHAR   │
│   heure_fin   TIME      │         │   capacite    INT       │
│   duree       INT       │         │   equipements TEXT      │
│   type_seance ENUM      │         │   disponible  BOOLEAN   │
│   salle       VARCHAR   │         │   created_at  TIMESTAMP │
│   batiment    VARCHAR   │         │   updated_at  TIMESTAMP │
│   status      ENUM      │         └─────────────────────────┘
│ * module_id   VARCHAR   │
│ * intervenant_id VARCHAR│
│   created_at  TIMESTAMP │
│   updated_at  TIMESTAMP │
└─────────────────────────┘
         │
         │ 0,n
         ▼
┌─────────────────────────┐         ┌─────────────────────────┐
│       CONFLITS          │         │  PERIODES_ACADEMIQUES   │
├─────────────────────────┤         ├─────────────────────────┤
│ # id          VARCHAR   │         │ # id          VARCHAR   │
│   type        ENUM      │         │   nom         VARCHAR   │
│   description TEXT      │         │   annee       VARCHAR   │
│ * seance_id_1 VARCHAR   │         │   debut_s1    DATE      │
│ * seance_id_2 VARCHAR   │         │   fin_s1      DATE      │
│   ressource_type VARCHAR│         │   debut_s2    DATE      │
│   ressource_id VARCHAR  │         │   fin_s2      DATE      │
│   resolu      BOOLEAN   │         │   vacances_noel DATE    │
│   resolution  TEXT      │         │   fin_vacances_noel DATE│
│   created_at  TIMESTAMP │         │   vacances_paques DATE  │
│   updated_at  TIMESTAMP │         │   fin_vacances_paques   │
└─────────────────────────┘         │   active      BOOLEAN   │
                                    │   created_at  TIMESTAMP │
                                    │   updated_at  TIMESTAMP │
                                    └─────────────────────────┘

Légende:
  # : Clé primaire
  * : Clé étrangère
  ──► : Relation (cardinalité indiquée)
```

---

## 3. Règles de Gestion

### 3.1 Règles Fonctionnelles

| ID | Règle | Table(s) concernée(s) |
|----|-------|----------------------|
| RG01 | Un utilisateur doit avoir un email unique | users |
| RG02 | Un programme appartient à un seul utilisateur | programmes |
| RG03 | Un module appartient à un seul programme | modules |
| RG04 | La date de fin d'un programme doit être postérieure à sa date de début | programmes |
| RG05 | Un module peut optionnellement être assigné à un intervenant | modules |
| RG06 | Une séance doit obligatoirement avoir un intervenant | seances |
| RG07 | L'heure de fin d'une séance doit être postérieure à l'heure de début | seances |
| RG08 | Un intervenant ne peut pas avoir deux séances au même moment | seances, conflits |
| RG09 | Une salle ne peut pas accueillir deux séances au même moment | seances, conflits |
| RG10 | La progression d'un programme est comprise entre 0 et 100 | programmes |
| RG11 | Le VHT d'un module = CM + TD + TP | modules |
| RG12 | Un conflit concerne au moins une séance | conflits |

### 3.2 Contraintes d'Intégrité

```sql
-- Contrainte de date programme
ALTER TABLE programmes
ADD CONSTRAINT chk_dates_programme
CHECK (date_fin > date_debut);

-- Contrainte de progression
ALTER TABLE programmes
ADD CONSTRAINT chk_progression_programme
CHECK (progression >= 0 AND progression <= 100);

-- Contrainte de VHT module
ALTER TABLE modules
ADD CONSTRAINT chk_vht_module
CHECK (vht = cm + td + tp);

-- Contrainte horaire séance
ALTER TABLE seances
ADD CONSTRAINT chk_horaires_seance
CHECK (heure_fin > heure_debut);

-- Index pour optimisation des requêtes de conflits
CREATE INDEX idx_seances_date ON seances(date_seance);
CREATE INDEX idx_seances_intervenant_date ON seances(intervenant_id, date_seance);
CREATE INDEX idx_seances_salle_date ON seances(salle, date_seance);
CREATE INDEX idx_modules_programme ON modules(programme_id);
CREATE INDEX idx_programmes_user ON programmes(user_id);
```

---

## 4. Normalisation

### 4.1 Vérification des Formes Normales

**1ère Forme Normale (1NF)** ✅
- Toutes les tables ont une clé primaire
- Tous les attributs sont atomiques (pas de valeurs multiples)
- Pas de groupes répétitifs

**2ème Forme Normale (2NF)** ✅
- Toutes les tables sont en 1NF
- Tous les attributs non-clés dépendent de la totalité de la clé primaire
- (Toutes les clés primaires sont simples)

**3ème Forme Normale (3NF)** ✅
- Toutes les tables sont en 2NF
- Aucune dépendance transitive entre attributs non-clés
- Exemple : `salle` et `batiment` dans `seances` sont des attributs indépendants (pas de FK vers `salles` pour flexibilité)

### 4.2 Justification des Choix de Conception

| Choix | Justification |
|-------|---------------|
| `salle` comme VARCHAR dans `seances` | Flexibilité pour les salles non répertoriées |
| `user_id` dans `modules` | Permet l'audit et la sécurité au niveau module |
| Cascade delete sur `modules` | Suppression automatique des modules si programme supprimé |
| Pas de cascade sur `intervenants` | Protection des données intervenants (réutilisables) |
| `seance_id_2` nullable dans `conflits` | Certains conflits ne concernent qu'une séance (ex: contrainte calendaire) |
