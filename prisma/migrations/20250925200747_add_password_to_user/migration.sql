-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'COORDINATOR', 'TEACHER');

-- CreateEnum
CREATE TYPE "public"."Semestre" AS ENUM ('SEMESTRE_1', 'SEMESTRE_2', 'SEMESTRE_3', 'SEMESTRE_4', 'SEMESTRE_5', 'SEMESTRE_6');

-- CreateEnum
CREATE TYPE "public"."StatusProgramme" AS ENUM ('PLANIFIE', 'EN_COURS', 'TERMINE', 'SUSPENDU', 'ANNULE');

-- CreateEnum
CREATE TYPE "public"."StatusModule" AS ENUM ('PLANIFIE', 'EN_COURS', 'TERMINE', 'REPORTE', 'ANNULE');

-- CreateEnum
CREATE TYPE "public"."TypeSeance" AS ENUM ('CM', 'TD', 'TP', 'EXAMEN', 'RATTRAPAGE');

-- CreateEnum
CREATE TYPE "public"."StatusSeance" AS ENUM ('PLANIFIE', 'CONFIRME', 'EN_COURS', 'TERMINE', 'REPORTE', 'ANNULE');

-- CreateEnum
CREATE TYPE "public"."TypeConflit" AS ENUM ('INTERVENANT_DOUBLE_BOOKING', 'SALLE_DOUBLE_BOOKING', 'CHEVAUCHEMENT_HORAIRE', 'CONTRAINTE_CALENDAIRE');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "public"."Role" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."programmes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "semestre" "public"."Semestre" NOT NULL,
    "niveau" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "status" "public"."StatusProgramme" NOT NULL DEFAULT 'PLANIFIE',
    "progression" INTEGER NOT NULL DEFAULT 0,
    "totalVHT" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programmes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."modules" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cm" INTEGER NOT NULL DEFAULT 0,
    "td" INTEGER NOT NULL DEFAULT 0,
    "tp" INTEGER NOT NULL DEFAULT 0,
    "tpe" INTEGER NOT NULL DEFAULT 0,
    "vht" INTEGER NOT NULL,
    "coefficient" INTEGER NOT NULL DEFAULT 1,
    "credits" INTEGER NOT NULL DEFAULT 1,
    "status" "public"."StatusModule" NOT NULL DEFAULT 'PLANIFIE',
    "progression" INTEGER NOT NULL DEFAULT 0,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "programmeId" TEXT NOT NULL,
    "intervenantId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."intervenants" (
    "id" TEXT NOT NULL,
    "civilite" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "grade" TEXT,
    "specialite" TEXT,
    "etablissement" TEXT,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intervenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."seances" (
    "id" TEXT NOT NULL,
    "dateSeance" TIMESTAMP(3) NOT NULL,
    "heureDebut" TEXT NOT NULL,
    "heureFin" TEXT NOT NULL,
    "duree" INTEGER NOT NULL,
    "typeSeance" "public"."TypeSeance" NOT NULL,
    "salle" TEXT,
    "batiment" TEXT,
    "status" "public"."StatusSeance" NOT NULL DEFAULT 'PLANIFIE',
    "moduleId" TEXT NOT NULL,
    "intervenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."salles" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "batiment" TEXT NOT NULL,
    "capacite" INTEGER NOT NULL,
    "equipements" TEXT,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."conflits" (
    "id" TEXT NOT NULL,
    "type" "public"."TypeConflit" NOT NULL,
    "description" TEXT NOT NULL,
    "seanceId1" TEXT NOT NULL,
    "seanceId2" TEXT,
    "ressourceType" TEXT NOT NULL,
    "ressourceId" TEXT NOT NULL,
    "resolu" BOOLEAN NOT NULL DEFAULT false,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conflits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."periodes_academiques" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "annee" TEXT NOT NULL,
    "debutS1" TIMESTAMP(3) NOT NULL,
    "finS1" TIMESTAMP(3) NOT NULL,
    "debutS2" TIMESTAMP(3) NOT NULL,
    "finS2" TIMESTAMP(3) NOT NULL,
    "vacancesNoel" TIMESTAMP(3) NOT NULL,
    "finVacancesNoel" TIMESTAMP(3) NOT NULL,
    "vacancesPaques" TIMESTAMP(3),
    "finVacancesPaques" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "periodes_academiques_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "programmes_code_key" ON "public"."programmes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "modules_code_key" ON "public"."modules"("code");

-- CreateIndex
CREATE UNIQUE INDEX "intervenants_email_key" ON "public"."intervenants"("email");

-- CreateIndex
CREATE UNIQUE INDEX "salles_nom_key" ON "public"."salles"("nom");

-- AddForeignKey
ALTER TABLE "public"."programmes" ADD CONSTRAINT "programmes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."modules" ADD CONSTRAINT "modules_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "public"."programmes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."modules" ADD CONSTRAINT "modules_intervenantId_fkey" FOREIGN KEY ("intervenantId") REFERENCES "public"."intervenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."modules" ADD CONSTRAINT "modules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."seances" ADD CONSTRAINT "seances_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "public"."modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."seances" ADD CONSTRAINT "seances_intervenantId_fkey" FOREIGN KEY ("intervenantId") REFERENCES "public"."intervenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
