
rm -rf .next && npm run dev

Architecture du projet
planning-fc/
├── README.md
├── package.json
├── next.config.js
├── tailwind.config.js
├── .env.local
├── .gitignore
├── prisma/
│   ├── schema.prisma
│   └── seed.js
├── lib/    
│   ├── prisma.js
│   ├── auth.js
│   └── utils.js
├── components/
│   ├── ui/
│   │   ├── StatCard.js
│   │   ├── Modal.js
│   │   └── Layout.js
│   ├── dashboard/
│   │   ├── ProgrammeTable.js
│   │   ├── ProgressChart.js
│   │   └── AlertsPanel.js
│   ├── programmes/
│   │   ├── ProgrammeForm.js
│   │   ├── ModuleForm.js
│   │   └── ProgrammeDetails.js
│   └── calendar/
│       ├── CalendarView.js
│       └── TimeSlot.js
├── pages/
│   ├── _app.js
│   ├── _document.js
│   ├── index.js
│   ├── dashboard.js
│   ├── programmes/
│   │   ├── index.js
│   │   ├── [id].js
│   │   └── create.js
│   ├── calendar.js
│   ├── intervenants/
│   │   ├── index.js
│   │   └── [id].js
│   └── api/
│       ├── auth/
│       │   └── [...nextauth].js
│       ├── programmes/
│       │   ├── index.js
│       │   └── [id].js
│       ├── modules/
│       │   ├── index.js
│       │   └── [id].js
│       ├── intervenants/
│       │   ├── index.js
│       │   └── [id].js
│       └── planning/
│           ├── conflicts.js
│           └── schedule.js
├── styles/
│   └── globals.css
└── public/
    ├── favicon.ico
    └── images/



    # Développement
npm run dev                 # Serveur de développement
npm run build              # Build de production
npm run start              # Serveur de production

# Base de données
npm run db:studio          # Interface graphique Prisma
npm run db:migrate         # Nouvelles migrations
npm run db:reset           # Reset complet
npm run db:seed            # Données de test

# Qualité code
npm run lint               # ESLint
npm run type-check         # TypeScript (si activé)



# Installation Vercel CLI
npm i -g vercel

# Configuration du projet
vercel

# Déploiement
vercel --prod

🎓 Planning FC - Plateforme de Gestion de Formation Continue
📋 Vue d'ensemble du projet
La plateforme Planning FC est une solution complète développée avec Next.js pour la gestion de programmes de formation continue. Elle permet de :
✅ Fonctionnalités Implémentées
🏠 Tableau de Bord

Vue d'ensemble avec statistiques en temps réel
Cartes de progression des programmes
Alertes et notifications automatiques
Actions rapides (création, modification)

📚 Gestion des Programmes

Création et modification de maquettes pédagogiques
Gestion des modules avec volumes horaires (CM, TD, TP, TPE)
Coefficients et crédits ECTS
Suivi de progression automatique

👨‍🏫 Gestion des Intervenants

Base de données complète des formateurs
Disponibilités et spécialités
Assignation automatique aux modules

📅 Calendrier Interactif

Vues jour/semaine/mois
Planification des séances
Détection automatique des conflits
Gestion des salles et ressources

🚨 Système d'Alertes

Détection de conflits horaires
Alertes d'échéances
Notifications de retards
Suggestions de résolution

🔐 Authentification et Sécurité

NextAuth.js avec support multi-providers
Gestion des rôles (Admin, Coordinateur, Enseignant)
Sessions sécurisées

🏗️ Architecture Technique
Stack Technologique

Frontend: Next.js 14 + React + Tailwind CSS
Backend: Next.js API Routes
Base de données: PostgreSQL + Prisma ORM
Authentification: NextAuth.js
Deployment: Vercel (recommandé)


# Générer le client Prisma
npx prisma generate

# Si vous avez un schéma Prisma, vous pouvez aussi synchroniser la base de données
npx prisma db push
# ou
npx prisma migrate dev


