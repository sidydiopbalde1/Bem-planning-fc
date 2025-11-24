# Dictionnaire de Données - BEM Planning FC

## 1. Vue d'Ensemble

Ce dictionnaire de données décrit l'ensemble des entités, attributs et relations du système BEM Planning FC, une plateforme de gestion des plannings de formation continue.

**Version** : 1.0
**Date** : Novembre 2024
**Auteur** : [Votre nom]

---

## 2. Tables et Attributs

### 2.1 Table `users` (Utilisateurs)

**Description** : Stocke les informations des utilisateurs du système avec leurs rôles et authentification.

| Attribut | Type | Taille | Obligatoire | Unique | Valeur par défaut | Description |
|----------|------|--------|-------------|--------|-------------------|-------------|
| `id` | VARCHAR | 25 | Oui | Oui | cuid() | Identifiant unique de l'utilisateur (clé primaire) |
| `email` | VARCHAR | 255 | Oui | Oui | - | Adresse email de l'utilisateur (identifiant de connexion) |
| `name` | VARCHAR | 100 | Non | Non | NULL | Nom complet de l'utilisateur |
| `password` | VARCHAR | 255 | Oui | Non | - | Mot de passe hashé (bcrypt) |
| `role` | ENUM | - | Oui | Non | 'ADMIN' | Rôle de l'utilisateur (ADMIN, COORDINATOR, TEACHER) |
| `created_at` | TIMESTAMP | - | Oui | Non | now() | Date et heure de création du compte |
| `updated_at` | TIMESTAMP | - | Oui | Non | now() | Date et heure de dernière modification |

**Valeurs possibles pour `role`** :
| Valeur | Description |
|--------|-------------|
| ADMIN | Administrateur avec accès complet au système |
| COORDINATOR | Coordinateur pédagogique gérant les plannings |
| TEACHER | Enseignant avec accès limité à ses propres données |

---

### 2.2 Table `programmes` (Programmes de Formation)

**Description** : Contient les maquettes pédagogiques et programmes de formation.

| Attribut | Type | Taille | Obligatoire | Unique | Valeur par défaut | Description |
|----------|------|--------|-------------|--------|-------------------|-------------|
| `id` | VARCHAR | 25 | Oui | Oui | cuid() | Identifiant unique du programme (clé primaire) |
| `code` | VARCHAR | 20 | Oui | Oui | - | Code unique du programme (ex: "L3-INFO-2024") |
| `name` | VARCHAR | 200 | Oui | Non | - | Nom complet du programme |
| `description` | TEXT | - | Non | Non | NULL | Description détaillée du programme |
| `semestre` | ENUM | - | Oui | Non | - | Semestre concerné |
| `niveau` | VARCHAR | 10 | Oui | Non | - | Niveau d'études (L1, L2, L3, M1, M2) |
| `date_debut` | DATE | - | Oui | Non | - | Date de début du programme |
| `date_fin` | DATE | - | Oui | Non | - | Date de fin prévue du programme |
| `status` | ENUM | - | Oui | Non | 'PLANIFIE' | État actuel du programme |
| `progression` | INT | - | Oui | Non | 0 | Pourcentage de progression (0-100) |
| `total_vht` | INT | - | Oui | Non | - | Volume horaire total en heures |
| `user_id` | VARCHAR | 25 | Oui | Non | - | Clé étrangère vers users.id (propriétaire) |
| `created_at` | TIMESTAMP | - | Oui | Non | now() | Date de création |
| `updated_at` | TIMESTAMP | - | Oui | Non | now() | Date de dernière modification |

**Valeurs possibles pour `semestre`** :
| Valeur | Description |
|--------|-------------|
| SEMESTRE_1 | Premier semestre |
| SEMESTRE_2 | Deuxième semestre |
| SEMESTRE_3 | Troisième semestre |
| SEMESTRE_4 | Quatrième semestre |
| SEMESTRE_5 | Cinquième semestre |
| SEMESTRE_6 | Sixième semestre |

**Valeurs possibles pour `status`** :
| Valeur | Description |
|--------|-------------|
| PLANIFIE | Programme planifié, pas encore démarré |
| EN_COURS | Programme actuellement en cours d'exécution |
| TERMINE | Programme terminé avec succès |
| SUSPENDU | Programme temporairement suspendu |
| ANNULE | Programme définitivement annulé |

---

### 2.3 Table `modules` (Modules/UE)

**Description** : Unités d'enseignement composant les programmes de formation.

| Attribut | Type | Taille | Obligatoire | Unique | Valeur par défaut | Description |
|----------|------|--------|-------------|--------|-------------------|-------------|
| `id` | VARCHAR | 25 | Oui | Oui | cuid() | Identifiant unique du module (clé primaire) |
| `code` | VARCHAR | 20 | Oui | Oui | - | Code unique du module (ex: "INF301") |
| `name` | VARCHAR | 200 | Oui | Non | - | Intitulé du module |
| `description` | TEXT | - | Non | Non | NULL | Description du contenu pédagogique |
| `cm` | INT | - | Oui | Non | 0 | Heures de Cours Magistraux |
| `td` | INT | - | Oui | Non | 0 | Heures de Travaux Dirigés |
| `tp` | INT | - | Oui | Non | 0 | Heures de Travaux Pratiques |
| `tpe` | INT | - | Oui | Non | 0 | Heures de Travail Personnel Étudiant |
| `vht` | INT | - | Oui | Non | - | Volume Horaire Total (CM+TD+TP) |
| `coefficient` | INT | - | Oui | Non | 1 | Coefficient pour le calcul de la moyenne |
| `credits` | INT | - | Oui | Non | 1 | Crédits ECTS attribués |
| `status` | ENUM | - | Oui | Non | 'PLANIFIE' | État actuel du module |
| `progression` | INT | - | Oui | Non | 0 | Pourcentage de progression |
| `date_debut` | DATE | - | Non | Non | NULL | Date de début planifiée |
| `date_fin` | DATE | - | Non | Non | NULL | Date de fin planifiée |
| `programme_id` | VARCHAR | 25 | Oui | Non | - | FK vers programmes.id |
| `intervenant_id` | VARCHAR | 25 | Non | Non | NULL | FK vers intervenants.id |
| `user_id` | VARCHAR | 25 | Oui | Non | - | FK vers users.id (créateur) |
| `created_at` | TIMESTAMP | - | Oui | Non | now() | Date de création |
| `updated_at` | TIMESTAMP | - | Oui | Non | now() | Date de dernière modification |

**Valeurs possibles pour `status`** :
| Valeur | Description |
|--------|-------------|
| PLANIFIE | Module planifié, enseignement pas encore commencé |
| EN_COURS | Enseignement du module en cours |
| TERMINE | Module terminé |
| REPORTE | Module reporté à une date ultérieure |
| ANNULE | Module annulé |

---

### 2.4 Table `intervenants` (Intervenants/Enseignants)

**Description** : Référentiel des enseignants et formateurs pouvant dispenser les cours.

| Attribut | Type | Taille | Obligatoire | Unique | Valeur par défaut | Description |
|----------|------|--------|-------------|--------|-------------------|-------------|
| `id` | VARCHAR | 25 | Oui | Oui | cuid() | Identifiant unique (clé primaire) |
| `civilite` | VARCHAR | 10 | Oui | Non | - | Civilité (M., Mme, Dr, Pr) |
| `nom` | VARCHAR | 100 | Oui | Non | - | Nom de famille |
| `prenom` | VARCHAR | 100 | Oui | Non | - | Prénom |
| `email` | VARCHAR | 255 | Oui | Oui | - | Adresse email professionnelle |
| `telephone` | VARCHAR | 20 | Non | Non | NULL | Numéro de téléphone |
| `grade` | VARCHAR | 100 | Non | Non | NULL | Grade académique |
| `specialite` | VARCHAR | 200 | Non | Non | NULL | Domaine de spécialité |
| `etablissement` | VARCHAR | 200 | Non | Non | NULL | Établissement de rattachement |
| `disponible` | BOOLEAN | - | Oui | Non | true | Disponibilité pour les cours |
| `created_at` | TIMESTAMP | - | Oui | Non | now() | Date de création |
| `updated_at` | TIMESTAMP | - | Oui | Non | now() | Date de dernière modification |

**Valeurs courantes pour `civilite`** :
| Valeur | Description |
|--------|-------------|
| M. | Monsieur |
| Mme | Madame |
| Dr | Docteur |
| Pr | Professeur |

**Valeurs courantes pour `grade`** :
| Valeur | Description |
|--------|-------------|
| Professeur | Professeur des universités |
| Maître de conférences | MCF |
| ATER | Attaché temporaire d'enseignement et de recherche |
| Doctorant | Doctorant contractuel |
| Vacataire | Intervenant vacataire |

---

### 2.5 Table `seances` (Séances Planifiées)

**Description** : Occurrences planifiées des enseignements dans le calendrier.

| Attribut | Type | Taille | Obligatoire | Unique | Valeur par défaut | Description |
|----------|------|--------|-------------|--------|-------------------|-------------|
| `id` | VARCHAR | 25 | Oui | Oui | cuid() | Identifiant unique (clé primaire) |
| `date_seance` | DATE | - | Oui | Non | - | Date de la séance |
| `heure_debut` | VARCHAR | 5 | Oui | Non | - | Heure de début (format HH:MM) |
| `heure_fin` | VARCHAR | 5 | Oui | Non | - | Heure de fin (format HH:MM) |
| `duree` | INT | - | Oui | Non | - | Durée en minutes |
| `type_seance` | ENUM | - | Oui | Non | - | Type de séance |
| `salle` | VARCHAR | 50 | Non | Non | NULL | Nom de la salle |
| `batiment` | VARCHAR | 100 | Non | Non | NULL | Bâtiment |
| `status` | ENUM | - | Oui | Non | 'PLANIFIE' | État de la séance |
| `module_id` | VARCHAR | 25 | Oui | Non | - | FK vers modules.id |
| `intervenant_id` | VARCHAR | 25 | Oui | Non | - | FK vers intervenants.id |
| `created_at` | TIMESTAMP | - | Oui | Non | now() | Date de création |
| `updated_at` | TIMESTAMP | - | Oui | Non | now() | Date de dernière modification |

**Valeurs possibles pour `type_seance`** :
| Valeur | Description |
|--------|-------------|
| CM | Cours Magistral |
| TD | Travaux Dirigés |
| TP | Travaux Pratiques |
| EXAMEN | Session d'examen |
| RATTRAPAGE | Session de rattrapage |

**Valeurs possibles pour `status`** :
| Valeur | Description |
|--------|-------------|
| PLANIFIE | Séance planifiée |
| CONFIRME | Séance confirmée |
| EN_COURS | Séance en cours |
| TERMINE | Séance terminée |
| REPORTE | Séance reportée |
| ANNULE | Séance annulée |

---

### 2.6 Table `salles` (Salles de Cours)

**Description** : Référentiel des salles disponibles pour les cours.

| Attribut | Type | Taille | Obligatoire | Unique | Valeur par défaut | Description |
|----------|------|--------|-------------|--------|-------------------|-------------|
| `id` | VARCHAR | 25 | Oui | Oui | cuid() | Identifiant unique (clé primaire) |
| `nom` | VARCHAR | 50 | Oui | Oui | - | Nom ou numéro de la salle |
| `batiment` | VARCHAR | 100 | Oui | Non | - | Bâtiment de localisation |
| `capacite` | INT | - | Oui | Non | - | Capacité en nombre de places |
| `equipements` | TEXT | - | Non | Non | NULL | Liste des équipements (JSON ou texte) |
| `disponible` | BOOLEAN | - | Oui | Non | true | Disponibilité de la salle |
| `created_at` | TIMESTAMP | - | Oui | Non | now() | Date de création |
| `updated_at` | TIMESTAMP | - | Oui | Non | now() | Date de dernière modification |

---

### 2.7 Table `conflits` (Conflits de Planification)

**Description** : Enregistre les conflits détectés dans le planning.

| Attribut | Type | Taille | Obligatoire | Unique | Valeur par défaut | Description |
|----------|------|--------|-------------|--------|-------------------|-------------|
| `id` | VARCHAR | 25 | Oui | Oui | cuid() | Identifiant unique (clé primaire) |
| `type` | ENUM | - | Oui | Non | - | Type de conflit |
| `description` | TEXT | - | Oui | Non | - | Description détaillée du conflit |
| `seance_id_1` | VARCHAR | 25 | Oui | Non | - | FK vers seances.id (première séance) |
| `seance_id_2` | VARCHAR | 25 | Non | Non | NULL | FK vers seances.id (seconde séance) |
| `ressource_type` | VARCHAR | 20 | Oui | Non | - | Type de ressource en conflit |
| `ressource_id` | VARCHAR | 25 | Oui | Non | - | ID de la ressource en conflit |
| `resolu` | BOOLEAN | - | Oui | Non | false | Conflit résolu ou non |
| `resolution` | TEXT | - | Non | Non | NULL | Description de la résolution |
| `created_at` | TIMESTAMP | - | Oui | Non | now() | Date de détection |
| `updated_at` | TIMESTAMP | - | Oui | Non | now() | Date de dernière modification |

**Valeurs possibles pour `type`** :
| Valeur | Description |
|--------|-------------|
| INTERVENANT_DOUBLE_BOOKING | Intervenant programmé sur deux séances simultanées |
| SALLE_DOUBLE_BOOKING | Salle utilisée pour deux séances simultanées |
| CHEVAUCHEMENT_HORAIRE | Chevauchement d'horaires |
| CONTRAINTE_CALENDAIRE | Séance programmée sur jour non ouvrable/vacances |

**Valeurs possibles pour `ressource_type`** :
| Valeur | Description |
|--------|-------------|
| INTERVENANT | Conflit lié à un intervenant |
| SALLE | Conflit lié à une salle |

---

### 2.8 Table `periodes_academiques` (Périodes Académiques)

**Description** : Définit les périodes académiques et dates importantes.

| Attribut | Type | Taille | Obligatoire | Unique | Valeur par défaut | Description |
|----------|------|--------|-------------|--------|-------------------|-------------|
| `id` | VARCHAR | 25 | Oui | Oui | cuid() | Identifiant unique (clé primaire) |
| `nom` | VARCHAR | 100 | Oui | Non | - | Nom de la période (ex: "Année 2024-2025") |
| `annee` | VARCHAR | 20 | Oui | Non | - | Année académique (ex: "2024-2025") |
| `debut_s1` | DATE | - | Oui | Non | - | Date début semestre 1 |
| `fin_s1` | DATE | - | Oui | Non | - | Date fin semestre 1 |
| `debut_s2` | DATE | - | Oui | Non | - | Date début semestre 2 |
| `fin_s2` | DATE | - | Oui | Non | - | Date fin semestre 2 |
| `vacances_noel` | DATE | - | Oui | Non | - | Début vacances de Noël |
| `fin_vacances_noel` | DATE | - | Oui | Non | - | Fin vacances de Noël |
| `vacances_paques` | DATE | - | Non | Non | NULL | Début vacances de Pâques |
| `fin_vacances_paques` | DATE | - | Non | Non | NULL | Fin vacances de Pâques |
| `active` | BOOLEAN | - | Oui | Non | false | Période actuellement active |
| `created_at` | TIMESTAMP | - | Oui | Non | now() | Date de création |
| `updated_at` | TIMESTAMP | - | Oui | Non | now() | Date de dernière modification |

---

## 3. Relations entre Tables

### 3.1 Schéma des Relations

| Table Source | Attribut FK | Table Cible | Cardinalité | Règle de suppression |
|--------------|-------------|-------------|-------------|---------------------|
| programmes | user_id | users | N:1 | RESTRICT |
| modules | programme_id | programmes | N:1 | CASCADE |
| modules | intervenant_id | intervenants | N:1 | SET NULL |
| modules | user_id | users | N:1 | RESTRICT |
| seances | module_id | modules | N:1 | CASCADE |
| seances | intervenant_id | intervenants | N:1 | RESTRICT |
| conflits | seance_id_1 | seances | N:1 | CASCADE |
| conflits | seance_id_2 | seances | N:1 | CASCADE |

### 3.2 Diagramme Simplifié

```
users (1) ──────────< (N) programmes (1) ──────────< (N) modules
                                                         │
                                                         │ (N)
                                                         ▼
intervenants (1) ──────────< (N) seances >──────────(N) modules
                                    │
                                    │ (N)
                                    ▼
                              conflits
```

---

## 4. Index et Performances

### 4.1 Index Principaux

| Table | Index | Colonnes | Type | Justification |
|-------|-------|----------|------|---------------|
| users | PRIMARY | id | UNIQUE | Clé primaire |
| users | idx_users_email | email | UNIQUE | Recherche par email (auth) |
| programmes | PRIMARY | id | UNIQUE | Clé primaire |
| programmes | idx_prog_code | code | UNIQUE | Recherche par code |
| programmes | idx_prog_user | user_id | BTREE | Filtrage par utilisateur |
| modules | PRIMARY | id | UNIQUE | Clé primaire |
| modules | idx_mod_code | code | UNIQUE | Recherche par code |
| modules | idx_mod_prog | programme_id | BTREE | Jointure programmes |
| seances | PRIMARY | id | UNIQUE | Clé primaire |
| seances | idx_seances_date | date_seance | BTREE | Filtrage par date |
| seances | idx_seances_int_date | intervenant_id, date_seance | BTREE | Détection conflits |
| seances | idx_seances_salle_date | salle, date_seance | BTREE | Détection conflits |

---

## 5. Glossaire

| Terme | Définition |
|-------|------------|
| **CM** | Cours Magistral - enseignement en amphithéâtre |
| **TD** | Travaux Dirigés - exercices en groupe restreint |
| **TP** | Travaux Pratiques - manipulations en laboratoire |
| **TPE** | Travail Personnel Étudiant |
| **VHT** | Volume Horaire Total |
| **ECTS** | European Credit Transfer System |
| **UE** | Unité d'Enseignement (synonyme de Module) |
| **Maquette** | Plan pédagogique d'une formation (Programme) |
| **Intervenant** | Enseignant ou formateur |
| **Séance** | Instance planifiée d'un cours |
| **Conflit** | Incompatibilité dans le planning |
