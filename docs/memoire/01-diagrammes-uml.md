# Diagrammes UML - BEM Planning FC

## 1. Diagramme de Cas d'Utilisation

```plantuml
@startuml diagramme_cas_utilisation

left to right direction
skinparam actorStyle awesome
skinparam packageStyle rectangle

title Diagramme de Cas d'Utilisation - Système de Gestion des Plannings de Formation

actor "Administrateur" as Admin
actor "Coordinateur" as Coord
actor "Enseignant" as Teacher
actor "Système" as System <<system>>

rectangle "Système BEM Planning FC" {

  package "Gestion des Utilisateurs" {
    usecase "S'authentifier" as UC_Auth
    usecase "Gérer son profil" as UC_Profil
    usecase "Créer un compte" as UC_Signup
  }

  package "Gestion des Programmes" {
    usecase "Créer un programme" as UC_CreateProg
    usecase "Modifier un programme" as UC_EditProg
    usecase "Supprimer un programme" as UC_DeleteProg
    usecase "Consulter les programmes" as UC_ViewProg
    usecase "Suivre la progression" as UC_Progress
  }

  package "Gestion des Modules" {
    usecase "Créer un module" as UC_CreateMod
    usecase "Modifier un module" as UC_EditMod
    usecase "Assigner un intervenant" as UC_AssignInt
    usecase "Définir les volumes horaires" as UC_DefineVH
  }

  package "Gestion des Intervenants" {
    usecase "Ajouter un intervenant" as UC_AddInt
    usecase "Modifier disponibilité" as UC_ModifDispo
    usecase "Consulter les intervenants" as UC_ViewInt
    usecase "Voir charge horaire" as UC_ViewCharge
  }

  package "Gestion du Planning" {
    usecase "Créer une séance" as UC_CreateSeance
    usecase "Modifier une séance" as UC_EditSeance
    usecase "Annuler une séance" as UC_CancelSeance
    usecase "Consulter le calendrier" as UC_ViewCal
    usecase "Suggérer des créneaux" as UC_SuggestSlot
    usecase "Générer planning auto" as UC_AutoPlan
  }

  package "Gestion des Conflits" {
    usecase "Détecter les conflits" as UC_DetectConf
    usecase "Résoudre un conflit" as UC_ResolveConf
    usecase "Notifier les conflits" as UC_NotifyConf
  }

  package "Statistiques et Rapports" {
    usecase "Consulter statistiques" as UC_ViewStats
    usecase "Générer rapports" as UC_GenReport
    usecase "Exporter données" as UC_Export
  }
}

' Relations Administrateur
Admin --> UC_Auth
Admin --> UC_CreateProg
Admin --> UC_EditProg
Admin --> UC_DeleteProg
Admin --> UC_ViewProg
Admin --> UC_CreateMod
Admin --> UC_AddInt
Admin --> UC_CreateSeance
Admin --> UC_AutoPlan
Admin --> UC_ViewStats
Admin --> UC_GenReport

' Relations Coordinateur
Coord --> UC_Auth
Coord --> UC_Profil
Coord --> UC_ViewProg
Coord --> UC_CreateMod
Coord --> UC_EditMod
Coord --> UC_AssignInt
Coord --> UC_CreateSeance
Coord --> UC_EditSeance
Coord --> UC_ViewCal
Coord --> UC_SuggestSlot
Coord --> UC_ResolveConf
Coord --> UC_ViewStats

' Relations Enseignant
Teacher --> UC_Auth
Teacher --> UC_Profil
Teacher --> UC_ViewProg
Teacher --> UC_ModifDispo
Teacher --> UC_ViewCal
Teacher --> UC_ViewCharge

' Relations Système
System --> UC_DetectConf
System --> UC_NotifyConf
System --> UC_SuggestSlot

' Extensions et inclusions
UC_CreateSeance ..> UC_DetectConf : <<include>>
UC_CreateSeance ..> UC_SuggestSlot : <<extend>>
UC_AutoPlan ..> UC_DetectConf : <<include>>
UC_DetectConf ..> UC_NotifyConf : <<include>>
UC_EditSeance ..> UC_DetectConf : <<include>>

' Héritage des acteurs
Admin --|> Coord
Coord --|> Teacher

@enduml
```

---

## 2. Diagramme de Classes

```plantuml
@startuml diagramme_classes

skinparam classAttributeIconSize 0
skinparam class {
  BackgroundColor White
  BorderColor Black
  ArrowColor Black
}

title Diagramme de Classes - BEM Planning FC

' Énumérations
enum Role {
  ADMIN
  COORDINATOR
  TEACHER
}

enum Semestre {
  SEMESTRE_1
  SEMESTRE_2
  SEMESTRE_3
  SEMESTRE_4
  SEMESTRE_5
  SEMESTRE_6
}

enum StatusProgramme {
  PLANIFIE
  EN_COURS
  TERMINE
  SUSPENDU
  ANNULE
}

enum StatusModule {
  PLANIFIE
  EN_COURS
  TERMINE
  REPORTE
  ANNULE
}

enum StatusSeance {
  PLANIFIE
  CONFIRME
  EN_COURS
  TERMINE
  REPORTE
  ANNULE
}

enum TypeSeance {
  CM
  TD
  TP
  EXAMEN
  RATTRAPAGE
}

enum TypeConflit {
  INTERVENANT_DOUBLE_BOOKING
  SALLE_DOUBLE_BOOKING
  CHEVAUCHEMENT_HORAIRE
  CONTRAINTE_CALENDAIRE
}

' Classes principales
class User {
  -id: String
  -email: String
  -name: String
  -password: String
  -role: Role
  -createdAt: DateTime
  -updatedAt: DateTime
  +authenticate(email, password): Boolean
  +hasPermission(action): Boolean
  +getProgrammes(): Programme[]
  +getModules(): Module[]
}

class Programme {
  -id: String
  -code: String
  -name: String
  -description: String
  -semestre: Semestre
  -niveau: String
  -dateDebut: DateTime
  -dateFin: DateTime
  -status: StatusProgramme
  -progression: Int
  -totalVHT: Int
  -userId: String
  -createdAt: DateTime
  -updatedAt: DateTime
  +calculerProgression(): Int
  +getModules(): Module[]
  +getTotalHeures(): Int
  +isEnRetard(): Boolean
  +updateStatus(status): void
}

class Module {
  -id: String
  -code: String
  -name: String
  -description: String
  -cm: Int
  -td: Int
  -tp: Int
  -tpe: Int
  -vht: Int
  -coefficient: Int
  -credits: Int
  -status: StatusModule
  -progression: Int
  -dateDebut: DateTime
  -dateFin: DateTime
  -programmeId: String
  -intervenantId: String
  -userId: String
  +calculerVHT(): Int
  +getSeances(): Seance[]
  +assignIntervenant(intervenant): void
  +calculerProgression(): Int
}

class Intervenant {
  -id: String
  -civilite: String
  -nom: String
  -prenom: String
  -email: String
  -telephone: String
  -grade: String
  -specialite: String
  -etablissement: String
  -disponible: Boolean
  -createdAt: DateTime
  +getNomComplet(): String
  +getModulesAssignes(): Module[]
  +getSeances(): Seance[]
  +getChargeHoraire(periode): Int
  +setDisponibilite(dispo): void
  +hasConflict(date, heureDebut, heureFin): Boolean
}

class Seance {
  -id: String
  -dateSeance: DateTime
  -heureDebut: String
  -heureFin: String
  -duree: Int
  -typeSeance: TypeSeance
  -salle: String
  -batiment: String
  -status: StatusSeance
  -moduleId: String
  -intervenantId: String
  -createdAt: DateTime
  +calculerDuree(): Int
  +hasConflictWith(autreSeance): Boolean
  +reporter(nouvelleDate): void
  +annuler(): void
  +confirmer(): void
}

class Salle {
  -id: String
  -nom: String
  -batiment: String
  -capacite: Int
  -equipements: String
  -disponible: Boolean
  +isDisponible(date, heureDebut, heureFin): Boolean
  +getSeances(periode): Seance[]
  +getTauxOccupation(periode): Float
}

class Conflit {
  -id: String
  -type: TypeConflit
  -description: String
  -seanceId1: String
  -seanceId2: String
  -ressourceType: String
  -ressourceId: String
  -resolu: Boolean
  -resolution: String
  -createdAt: DateTime
  +resoudre(resolution, action): void
  +getSuggestions(): Resolution[]
}

class PeriodeAcademique {
  -id: String
  -nom: String
  -annee: String
  -debutS1: DateTime
  -finS1: DateTime
  -debutS2: DateTime
  -finS2: DateTime
  -vacancesNoel: DateTime
  -finVacancesNoel: DateTime
  -vacancesPaques: DateTime
  -finVacancesPaques: DateTime
  -active: Boolean
  +isVacances(date): Boolean
  +getSemestreCourant(): String
  +getJoursOuvrables(debut, fin): Int
}

' Classes de service (logique métier)
class PlanningService <<service>> {
  +suggestSlots(module, intervenant, periode): Slot[]
  +generateAutoPlanning(module, preferences): Planning
  +detectConflicts(seance): Conflit[]
  +calculateSlotScore(slot, context): Int
}

class StatisticsService <<service>> {
  +getGlobalStats(userId): Statistics
  +getIntervenantStats(intervenantId): Statistics
  +getSalleStats(salleId): Statistics
  +getProgrammeStats(programmeId): Statistics
  +getKPIs(userId): KPIs
}

class ConflictService <<service>> {
  +detectAllConflicts(): Conflit[]
  +resolveConflict(conflit, action): Boolean
  +generateSuggestions(conflit): Suggestion[]
  +notifyConflict(conflit): void
}

' Relations
User "1" -- "*" Programme : possède >
User "1" -- "*" Module : crée >
Programme "1" -- "*" Module : contient >
Module "*" -- "0..1" Intervenant : est assigné à >
Module "1" -- "*" Seance : comprend >
Intervenant "1" -- "*" Seance : anime >
Seance "*" -- "0..1" Salle : se déroule dans >
Conflit "*" -- "1" Seance : concerne >
Conflit "*" -- "0..1" Seance : implique >

' Dépendances services
PlanningService ..> Seance : utilise
PlanningService ..> Intervenant : utilise
PlanningService ..> Conflit : crée
StatisticsService ..> Programme : analyse
StatisticsService ..> Seance : analyse
StatisticsService ..> Intervenant : analyse
ConflictService ..> Conflit : gère
ConflictService ..> Seance : vérifie

@enduml
```

---

## 3. Diagramme de Séquence - Création d'une Séance avec Détection de Conflits

```plantuml
@startuml diagramme_sequence_creation_seance

title Diagramme de Séquence - Création d'une Séance avec Détection de Conflits

actor Coordinateur as user
participant "Interface Web\n(React/Next.js)" as ui
participant "API /seances" as api
participant "PlanningService" as planning
participant "ConflictService" as conflict
database "Base de Données\n(PostgreSQL)" as db

user -> ui : Demande création séance
activate ui

ui -> ui : Afficher formulaire

user -> ui : Saisir informations\n(module, intervenant, date, horaires, salle)
ui -> api : POST /api/seances\n{moduleId, intervenantId, date, heures, salle}
activate api

' Vérification authentification
api -> api : Vérifier session utilisateur

' Vérification module
api -> db : Vérifier propriété module
activate db
db --> api : Module trouvé
deactivate db

' Calcul durée
api -> api : Calculer durée (heureFin - heureDebut)

' Détection des conflits
api -> conflict : Détecter conflits potentiels
activate conflict

conflict -> db : Rechercher séances intervenant\n(même date, horaires chevauchants)
activate db
db --> conflict : Liste séances intervenant
deactivate db

conflict -> db : Rechercher séances salle\n(même date, horaires chevauchants)
activate db
db --> conflict : Liste séances salle
deactivate db

conflict -> conflict : Analyser chevauchements horaires

alt Conflits détectés
  conflict --> api : Liste des conflits
  api --> ui : Erreur 409 - Conflits détectés\n{conflits: [...]}
  ui -> ui : Afficher alertes conflits
  ui --> user : Demander résolution

  user -> ui : Modifier horaires / Choisir autre créneau
  ui -> api : POST /api/planning/schedule\n(suggérer créneaux)
  activate api
  api -> planning : Suggérer créneaux disponibles
  activate planning
  planning -> db : Récupérer séances période
  db --> planning : Séances existantes
  planning -> planning : Générer créneaux libres
  planning -> planning : Calculer scores créneaux
  planning --> api : Créneaux suggérés avec scores
  deactivate planning
  api --> ui : Suggestions de créneaux
  deactivate api
  ui --> user : Afficher créneaux disponibles

else Aucun conflit
  conflict --> api : Aucun conflit
  deactivate conflict

  ' Création de la séance
  api -> db : INSERT séance
  activate db
  db --> api : Séance créée
  deactivate db

  api --> ui : 201 Created\n{seance: {...}}
  deactivate api

  ui -> ui : Mettre à jour calendrier
  ui --> user : Confirmation création
  deactivate ui
end

@enduml
```

---

## 4. Diagramme de Séquence - Génération Automatique de Planning

```plantuml
@startuml diagramme_sequence_auto_planning

title Diagramme de Séquence - Génération Automatique de Planning

actor Coordinateur as user
participant "Interface Web" as ui
participant "API /planning/schedule" as api
participant "PlanningService" as planning
participant "ConflictService" as conflict
database "PostgreSQL" as db

user -> ui : Demande génération auto\npour un module
activate ui

ui -> ui : Afficher options\n(période, préférences)

user -> ui : Configurer et lancer
ui -> api : POST /api/planning/schedule\n{moduleId, intervenantId, startDate, preferences}
activate api

api -> db : Récupérer module et heures à planifier
activate db
db --> api : Module (cm, td, tp)
deactivate db

api -> planning : Générer planning module
activate planning

loop Pour chaque type (CM, TD, TP)
  loop Tant que heures restantes > 0
    planning -> db : Récupérer séances existantes (jour)
    db --> planning : Séances du jour

    planning -> planning : Trouver créneau libre

    alt Créneau trouvé
      planning -> conflict : Vérifier conflit créneau
      activate conflict
      conflict --> planning : OK / Conflit
      deactivate conflict

      alt Pas de conflit
        planning -> planning : Ajouter séance au planning
        planning -> planning : heuresRestantes -= durée
      else Conflit
        planning -> planning : conflitsEvites++
        planning -> planning : Passer au jour suivant
      end
    else Pas de créneau
      planning -> planning : Passer au jour suivant
    end
  end
end

planning --> api : Planning généré\n{seances[], stats}
deactivate planning

api --> ui : 200 OK\n{planning, statistiques}
deactivate api

ui -> ui : Afficher aperçu planning
ui --> user : Demander validation

user -> ui : Valider planning

ui -> api : POST /api/seances/batch\n{seances[]}
activate api

loop Pour chaque séance
  api -> db : INSERT séance
end

api --> ui : Séances créées
deactivate api

ui --> user : Planning enregistré
deactivate ui

@enduml
```

---

## 5. Diagramme d'Activité - Processus de Planification

```plantuml
@startuml diagramme_activite_planification

title Diagramme d'Activité - Processus de Planification d'une Formation

start

:Créer un Programme;
note right: Définir nom, code, niveau,\nsemestre, dates

:Définir les Modules;
note right: CM, TD, TP, crédits ECTS

fork
  :Ajouter les Intervenants;
fork again
  :Configurer les Salles;
end fork

:Assigner Intervenants aux Modules;

if (Planification automatique ?) then (Oui)
  :Lancer génération auto;
  :Analyser contraintes;

  while (Heures à planifier ?) is (Oui)
    :Sélectionner prochain créneau;

    if (Créneau disponible ?) then (Oui)
      if (Conflit détecté ?) then (Oui)
        :Enregistrer conflit évité;
        :Chercher alternative;
      else (Non)
        :Créer séance;
      endif
    else (Non)
      :Passer au jour suivant;
    endif
  endwhile (Non)

  :Présenter planning généré;

else (Non)
  :Planification manuelle;

  repeat
    :Sélectionner créneau;
    :Vérifier disponibilités;

    if (Conflit ?) then (Oui)
      :Afficher alerte;
      :Proposer alternatives;
    else (Non)
      :Créer séance;
    endif

  repeat while (Autres séances ?) is (Oui)
  ->Non;

endif

:Valider le Planning;

if (Conflits non résolus ?) then (Oui)
  :Lister conflits;

  repeat
    :Sélectionner conflit;
    :Choisir résolution;
    :Appliquer modification;
  repeat while (Conflits restants ?) is (Oui)

endif

:Planning finalisé;

fork
  :Notifier intervenants;
fork again
  :Mettre à jour progression;
fork again
  :Générer rapports;
end fork

stop

@enduml
```

---

## 6. Diagramme d'États - Cycle de Vie d'une Séance

```plantuml
@startuml diagramme_etats_seance

title Diagramme d'États - Cycle de Vie d'une Séance

[*] --> PLANIFIE : Création

state PLANIFIE {
  [*] --> EnAttente
  EnAttente : En attente de confirmation
  EnAttente --> Modifiable : édition possible
  Modifiable --> EnAttente : sauvegarde
}

PLANIFIE --> CONFIRME : Confirmer
PLANIFIE --> REPORTE : Reporter
PLANIFIE --> ANNULE : Annuler

state CONFIRME {
  [*] --> Validee
  Validee : Séance validée
  Validee : Intervenants notifiés
}

CONFIRME --> EN_COURS : Début séance\n[date/heure atteinte]
CONFIRME --> REPORTE : Reporter
CONFIRME --> ANNULE : Annuler

state EN_COURS {
  [*] --> EnExecution
  EnExecution : Séance en cours
  EnExecution : Présence enregistrée
}

EN_COURS --> TERMINE : Fin séance\n[heure fin atteinte]

state REPORTE {
  [*] --> EnAttente
  EnAttente : Nouvelle date à définir
}

REPORTE --> PLANIFIE : Reprogrammer\n[nouvelle date]
REPORTE --> ANNULE : Annuler définitivement

state TERMINE {
  [*] --> Complete
  Complete : Séance terminée
  Complete : Heures comptabilisées
}

state ANNULE {
  [*] --> Inactive
  Inactive : Séance annulée
  Inactive : Non comptabilisée
}

TERMINE --> [*]
ANNULE --> [*]

note right of PLANIFIE : État initial\naprès création
note right of CONFIRME : Validation par\nle coordinateur
note right of EN_COURS : Exécution\nen temps réel
note right of TERMINE : État final\nnormal
note right of ANNULE : État final\nexceptionnel

@enduml
```

---

## 7. Diagramme de Composants - Architecture Technique

```plantuml
@startuml diagramme_composants

title Diagramme de Composants - Architecture BEM Planning FC

skinparam component {
  BackgroundColor White
  BorderColor Black
}

package "Client (Navigateur)" {
  [Application React/Next.js] as ReactApp
  [Composants UI] as UIComponents
  [État Local (useState)] as LocalState
  [Gestion Session] as SessionMgr
}

package "Serveur Next.js" {
  package "Pages (SSR/SSG)" {
    [Pages Authentification] as AuthPages
    [Pages Dashboard] as DashPages
    [Pages Programmes] as ProgPages
    [Pages Planning] as PlanPages
    [Pages Intervenants] as IntPages
  }

  package "API Routes" {
    [Auth API] as AuthAPI
    [Programmes API] as ProgAPI
    [Modules API] as ModAPI
    [Séances API] as SeancesAPI
    [Planning API] as PlanAPI
    [Statistics API] as StatsAPI
    [Intervenants API] as IntAPI
  }

  package "Services Métier" {
    [Planning Service] as PlanSvc
    [Conflict Service] as ConflictSvc
    [Statistics Service] as StatsSvc
    [Auth Service] as AuthSvc
  }

  package "Couche Données" {
    [Prisma ORM] as Prisma
    [Modèles Prisma] as PrismaModels
  }
}

package "Externe" {
  database "PostgreSQL" as DB
  [NextAuth.js] as NextAuth
}

' Relations Client
ReactApp --> UIComponents
ReactApp --> LocalState
ReactApp --> SessionMgr
SessionMgr --> NextAuth

' Relations Pages -> API
AuthPages --> AuthAPI
DashPages --> StatsAPI
DashPages --> ProgAPI
ProgPages --> ProgAPI
ProgPages --> ModAPI
PlanPages --> PlanAPI
PlanPages --> SeancesAPI
IntPages --> IntAPI

' Relations API -> Services
AuthAPI --> AuthSvc
ProgAPI --> Prisma
ModAPI --> Prisma
SeancesAPI --> PlanSvc
SeancesAPI --> ConflictSvc
PlanAPI --> PlanSvc
StatsAPI --> StatsSvc
IntAPI --> Prisma

' Relations Services -> Prisma
PlanSvc --> Prisma
ConflictSvc --> Prisma
StatsSvc --> Prisma
AuthSvc --> NextAuth
AuthSvc --> Prisma

' Relations Prisma -> DB
Prisma --> PrismaModels
Prisma --> DB

' Notes
note right of ReactApp : SPA avec\nrendu hybride
note right of PlanSvc : Génération auto\nde planning
note right of ConflictSvc : Détection et\nrésolution conflits
note bottom of DB : Base de données\nrelationnelle

@enduml
```

---

## Instructions pour Générer les Images

### Option 1 : PlantUML en ligne
1. Aller sur https://www.plantuml.com/plantuml/uml
2. Copier le code entre `@startuml` et `@enduml`
3. Télécharger l'image générée

### Option 2 : Extension VS Code
1. Installer l'extension "PlantUML"
2. Ouvrir ce fichier
3. `Alt+D` pour prévisualiser
4. Exporter en PNG/SVG

### Option 3 : Ligne de commande
```bash
# Installer PlantUML
sudo apt install plantuml

# Générer les images
plantuml 01-diagrammes-uml.md -o ./images
```
