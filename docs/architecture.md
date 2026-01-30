# Architecture Applicative - BEM Planning FC

## Diagramme d'Architecture Globale

```mermaid
flowchart TB
    subgraph CLIENT["🖥️ CLIENT (Browser)"]
        UI["React 19 + Next.js 15<br/>Pages & Components"]
        HOOKS["Custom Hooks<br/>(useApi, useApiQuery)"]
        CTX["Contexts<br/>(Language, Auth)"]
        UI --> HOOKS
        UI --> CTX
    end

    subgraph FRONTEND["📱 FRONTEND - Next.js"]
        direction TB
        PAGES["Pages Router<br/>/pages/*"]
        COMP["Components<br/>/components/*"]
        LIB["Lib<br/>(api-client.js)"]
        PAGES --> COMP
        PAGES --> LIB
    end

    subgraph API_ROUTES["🔌 API ROUTES - Next.js (Actuel)"]
        direction TB
        AUTH_API["Auth API<br/>/api/auth/*<br/>NextAuth.js"]
        ADMIN_API["Admin API<br/>/api/admin/*"]
        COORD_API["Coordinateur API<br/>/api/coordinateur/*"]
        RES_API["Resources API<br/>/api/programmes<br/>/api/modules<br/>/api/seances<br/>/api/intervenants"]
        MW["Middleware<br/>withApiHandler<br/>- Auth Check<br/>- Role Check<br/>- Activity Log"]

        AUTH_API --> MW
        ADMIN_API --> MW
        COORD_API --> MW
        RES_API --> MW
    end

    subgraph NESTJS["🚀 BACKEND - NestJS (Migration)"]
        direction TB
        NEST_CTRL["Controllers<br/>REST Endpoints"]
        NEST_SVC["Services<br/>Business Logic"]
        NEST_GUARD["Guards<br/>JWT + RBAC"]
        NEST_MOD["Modules<br/>- Auth<br/>- Users<br/>- Programmes<br/>- Modules<br/>- Seances<br/>- Intervenants"]

        NEST_CTRL --> NEST_GUARD
        NEST_CTRL --> NEST_SVC
        NEST_SVC --> NEST_MOD
    end

    subgraph DATA["💾 DATA LAYER"]
        direction TB
        PRISMA["Prisma ORM<br/>Schema + Client"]
        PG[("PostgreSQL<br/>Database")]
        PRISMA --> PG
    end

    subgraph INFRA["🐳 INFRASTRUCTURE"]
        direction LR
        DOCKER["Docker<br/>Containers"]
        NGINX["Nginx<br/>Reverse Proxy"]
        GHACTIONS["GitHub Actions<br/>CI/CD"]
    end

    CLIENT <-->|HTTP/JSON| FRONTEND
    FRONTEND <-->|REST API| API_ROUTES
    API_ROUTES <-->|Prisma Client| DATA

    FRONTEND <-.->|"Migration<br/>(futur)"| NESTJS
    NESTJS <-->|Prisma Client| DATA

    INFRA --> FRONTEND
    INFRA --> NESTJS
    INFRA --> DATA

    style CLIENT fill:#e1f5fe
    style FRONTEND fill:#fff3e0
    style API_ROUTES fill:#f3e5f5
    style NESTJS fill:#e8f5e9
    style DATA fill:#fce4ec
    style INFRA fill:#f5f5f5
```

## Architecture Détaillée par Couche

```mermaid
flowchart LR
    subgraph PRESENTATION["PRESENTATION LAYER"]
        direction TB
        P1["Pages<br/>━━━━━━━━━━━━<br/>• /auth/signin<br/>• /dashboard<br/>• /programmes/*<br/>• /modules/*<br/>• /intervenants/*<br/>• /calendar<br/>• /coordinateur/*<br/>• /admin/*"]
        P2["Components<br/>━━━━━━━━━━━━<br/>• Layout<br/>• Modals<br/>• Tables<br/>• Calendar<br/>• Statistics<br/>• UI Elements"]
    end

    subgraph BUSINESS["BUSINESS LAYER"]
        direction TB
        B1["API Client<br/>━━━━━━━━━━━━<br/>• auth<br/>• programmes<br/>• modules<br/>• seances<br/>• intervenants<br/>• evaluations<br/>• notifications"]
        B2["Services (NestJS)<br/>━━━━━━━━━━━━<br/>• AuthService<br/>• UsersService<br/>• ProgrammesService<br/>• ModulesService<br/>• SeancesService<br/>• ConflitService"]
    end

    subgraph DATA_ACCESS["DATA ACCESS LAYER"]
        direction TB
        D1["Prisma Schema<br/>━━━━━━━━━━━━<br/>• users<br/>• programmes<br/>• modules<br/>• seances<br/>• intervenants<br/>• conflits<br/>• notifications<br/>• journal_activites"]
    end

    PRESENTATION --> BUSINESS
    BUSINESS --> DATA_ACCESS

    style PRESENTATION fill:#bbdefb
    style BUSINESS fill:#c8e6c9
    style DATA_ACCESS fill:#ffccbc
```

## Modèle de Données Simplifié

```mermaid
erDiagram
    USERS ||--o{ PROGRAMMES : "coordonne"
    USERS ||--o{ NOTIFICATIONS : "recoit"
    USERS ||--o{ JOURNAL_ACTIVITES : "genere"

    PROGRAMMES ||--o{ MODULES : "contient"
    PROGRAMMES ||--o{ ACTIVITES_ACADEMIQUES : "planifie"

    MODULES ||--o{ SEANCES : "planifie"
    MODULES ||--o{ RESULTATS_ETUDIANTS : "evalue"

    INTERVENANTS ||--o{ MODULES : "enseigne"
    INTERVENANTS ||--o{ SEANCES : "anime"
    INTERVENANTS ||--o{ DISPONIBILITES : "declare"
    INTERVENANTS ||--o{ EVALUATIONS_ENSEIGNEMENTS : "recoit"

    SEANCES ||--o{ CONFLITS : "detecte"

    SALLES ||--o{ SEANCES : "accueille"

    PERIODES_ACADEMIQUES ||--o{ PROGRAMMES : "cadre"

    USERS {
        string id PK
        string email
        string name
        string password
        enum role
    }

    PROGRAMMES {
        string id PK
        string code
        string name
        enum semester
        enum status
        int totalVHT
    }

    MODULES {
        string id PK
        string code
        string name
        int cm
        int td
        int tp
        int vht
    }

    SEANCES {
        string id PK
        datetime dateSeance
        time heureDebut
        time heureFin
        enum typeSeance
        enum status
    }

    INTERVENANTS {
        string id PK
        string nom
        string prenom
        string email
        string grade
    }
```

## Flux d'Authentification

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API Routes
    participant N as NextAuth
    participant P as Prisma
    participant DB as PostgreSQL

    U->>F: Login (email, password)
    F->>A: POST /api/auth/signin
    A->>N: authorize()
    N->>P: findUnique(email)
    P->>DB: SELECT * FROM users
    DB-->>P: User record
    P-->>N: User data
    N->>N: bcrypt.compare(password)
    N-->>A: JWT Token + Session
    A-->>F: Session cookie
    F-->>U: Redirect to Dashboard
```

## Flux de Création de Séance avec Détection de Conflits

```mermaid
sequenceDiagram
    participant C as Coordinateur
    participant F as Frontend
    participant A as API
    participant CS as Conflict Service
    participant DB as Database

    C->>F: Créer Séance
    F->>A: POST /api/seances
    A->>CS: checkConflicts(seance)
    CS->>DB: Query existing seances

    alt Conflits détectés
        CS-->>A: Conflicts[]
        A-->>F: 409 Conflict
        F-->>C: Afficher conflits
    else Pas de conflits
        CS-->>A: []
        A->>DB: INSERT seance
        DB-->>A: Created
        A-->>F: 201 Success
        F-->>C: Confirmation
    end
```

## Architecture de Déploiement

```mermaid
flowchart TB
    subgraph GITHUB["GitHub"]
        REPO["Repository<br/>bem-planning-fc"]
        ACTIONS["GitHub Actions<br/>CI/CD Pipeline"]
    end

    subgraph DOCKER_HUB["Registry"]
        IMG["Docker Images"]
    end

    subgraph SERVER["Production Server"]
        subgraph DOCKER_NET["Docker Network (bem-network)"]
            NGINX_C["Nginx Container<br/>:80/:443"]
            NEXT_C["Next.js Container<br/>:3000"]
            NEST_C["NestJS Container<br/>:3001"]
            PG_C["PostgreSQL Container<br/>:5432"]
        end
    end

    REPO -->|Push| ACTIONS
    ACTIONS -->|Build & Push| IMG
    IMG -->|Pull| DOCKER_NET

    NGINX_C --> NEXT_C
    NGINX_C --> NEST_C
    NEXT_C --> PG_C
    NEST_C --> PG_C

    style GITHUB fill:#24292e,color:#fff
    style DOCKER_HUB fill:#0db7ed,color:#fff
    style SERVER fill:#f0f0f0
```

## Stack Technologique

| Couche | Technologie | Version |
|--------|-------------|---------|
| **Frontend** | Next.js | 15.5.3 |
| | React | 19.1.0 |
| | Tailwind CSS | 4.1.13 |
| | Recharts | 3.5.1 |
| **Backend (Actuel)** | Next.js API Routes | 15.5.3 |
| | NextAuth.js | 4.24.11 |
| **Backend (Migration)** | NestJS | 10.x |
| | Passport | JWT Strategy |
| **ORM** | Prisma | 6.16.1 |
| **Database** | PostgreSQL | 15+ |
| **Infra** | Docker | Multi-stage |
| | GitHub Actions | CI/CD |

## Rôles et Permissions

```mermaid
flowchart LR
    subgraph ROLES["Rôles Système"]
        ADMIN["🔑 ADMIN<br/>━━━━━━━━━━<br/>• Gestion users<br/>• Config système<br/>• Logs & rapports<br/>• Toutes permissions"]

        COORD["📋 COORDINATOR<br/>━━━━━━━━━━<br/>• Programmes<br/>• Modules<br/>• Séances<br/>• Évaluations<br/>• Planning"]

        TEACHER["👨‍🏫 TEACHER<br/>━━━━━━━━━━<br/>• Mes séances<br/>• Mon profil<br/>• Disponibilités<br/>• Consultation"]
    end

    style ADMIN fill:#ef5350,color:#fff
    style COORD fill:#42a5f5,color:#fff
    style TEACHER fill:#66bb6a,color:#fff
```

---

*Diagramme généré pour BEM Planning FC - Architecture Next.js + NestJS*
