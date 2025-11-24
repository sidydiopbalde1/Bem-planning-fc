-- CreateEnum
CREATE TYPE "public"."SeveriteConflit" AS ENUM ('BASSE', 'MOYENNE', 'HAUTE', 'CRITIQUE');

-- CreateEnum
CREATE TYPE "public"."TypeDisponibilite" AS ENUM ('DISPONIBLE', 'INDISPONIBLE', 'PREFERENCE');

-- CreateEnum
CREATE TYPE "public"."ActionType" AS ENUM ('CREATION', 'MODIFICATION', 'SUPPRESSION', 'CONNEXION', 'DECONNEXION', 'PLANIFICATION_AUTO', 'RESOLUTION_CONFLIT', 'EXPORT_DONNEES');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."TypeConflit" ADD VALUE 'SURCHARGE_INTERVENANT';
ALTER TYPE "public"."TypeConflit" ADD VALUE 'JOUR_NON_OUVRABLE';

-- AlterTable
ALTER TABLE "public"."conflits" ADD COLUMN     "resoluLe" TIMESTAMP(3),
ADD COLUMN     "resoluPar" TEXT,
ADD COLUMN     "severite" "public"."SeveriteConflit" NOT NULL DEFAULT 'HAUTE';

-- AlterTable
ALTER TABLE "public"."intervenants" ADD COLUMN     "creneauxPreferences" TEXT,
ADD COLUMN     "heuresMaxJour" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN     "heuresMaxSemaine" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "joursPreferences" TEXT;

-- AlterTable
ALTER TABLE "public"."seances" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "objectifs" TEXT;

-- CreateTable
CREATE TABLE "public"."disponibilites_intervenants" (
    "id" TEXT NOT NULL,
    "jourSemaine" INTEGER NOT NULL,
    "heureDebut" TEXT NOT NULL,
    "heureFin" TEXT NOT NULL,
    "type" "public"."TypeDisponibilite" NOT NULL DEFAULT 'DISPONIBLE',
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "recurrent" BOOLEAN NOT NULL DEFAULT true,
    "intervenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disponibilites_intervenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."journal_activites" (
    "id" TEXT NOT NULL,
    "action" "public"."ActionType" NOT NULL,
    "entite" TEXT NOT NULL,
    "entiteId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ancienneValeur" TEXT,
    "nouvelleValeur" TEXT,
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_activites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "disponibilites_intervenants_intervenantId_idx" ON "public"."disponibilites_intervenants"("intervenantId");

-- CreateIndex
CREATE INDEX "disponibilites_intervenants_jourSemaine_idx" ON "public"."disponibilites_intervenants"("jourSemaine");

-- CreateIndex
CREATE INDEX "journal_activites_userId_idx" ON "public"."journal_activites"("userId");

-- CreateIndex
CREATE INDEX "journal_activites_entite_entiteId_idx" ON "public"."journal_activites"("entite", "entiteId");

-- CreateIndex
CREATE INDEX "journal_activites_createdAt_idx" ON "public"."journal_activites"("createdAt");

-- CreateIndex
CREATE INDEX "journal_activites_action_idx" ON "public"."journal_activites"("action");

-- CreateIndex
CREATE INDEX "conflits_seanceId1_idx" ON "public"."conflits"("seanceId1");

-- CreateIndex
CREATE INDEX "conflits_seanceId2_idx" ON "public"."conflits"("seanceId2");

-- CreateIndex
CREATE INDEX "conflits_resolu_idx" ON "public"."conflits"("resolu");

-- CreateIndex
CREATE INDEX "conflits_type_idx" ON "public"."conflits"("type");

-- CreateIndex
CREATE INDEX "conflits_severite_idx" ON "public"."conflits"("severite");

-- CreateIndex
CREATE INDEX "intervenants_email_idx" ON "public"."intervenants"("email");

-- CreateIndex
CREATE INDEX "intervenants_disponible_idx" ON "public"."intervenants"("disponible");

-- CreateIndex
CREATE INDEX "modules_programmeId_idx" ON "public"."modules"("programmeId");

-- CreateIndex
CREATE INDEX "modules_intervenantId_idx" ON "public"."modules"("intervenantId");

-- CreateIndex
CREATE INDEX "modules_userId_idx" ON "public"."modules"("userId");

-- CreateIndex
CREATE INDEX "modules_code_idx" ON "public"."modules"("code");

-- CreateIndex
CREATE INDEX "periodes_academiques_active_idx" ON "public"."periodes_academiques"("active");

-- CreateIndex
CREATE INDEX "periodes_academiques_annee_idx" ON "public"."periodes_academiques"("annee");

-- CreateIndex
CREATE INDEX "programmes_userId_idx" ON "public"."programmes"("userId");

-- CreateIndex
CREATE INDEX "programmes_status_idx" ON "public"."programmes"("status");

-- CreateIndex
CREATE INDEX "programmes_code_idx" ON "public"."programmes"("code");

-- CreateIndex
CREATE INDEX "salles_nom_idx" ON "public"."salles"("nom");

-- CreateIndex
CREATE INDEX "salles_disponible_idx" ON "public"."salles"("disponible");

-- CreateIndex
CREATE INDEX "seances_dateSeance_idx" ON "public"."seances"("dateSeance");

-- CreateIndex
CREATE INDEX "seances_intervenantId_dateSeance_idx" ON "public"."seances"("intervenantId", "dateSeance");

-- CreateIndex
CREATE INDEX "seances_salle_dateSeance_idx" ON "public"."seances"("salle", "dateSeance");

-- CreateIndex
CREATE INDEX "seances_moduleId_idx" ON "public"."seances"("moduleId");

-- CreateIndex
CREATE INDEX "seances_status_idx" ON "public"."seances"("status");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- AddForeignKey
ALTER TABLE "public"."disponibilites_intervenants" ADD CONSTRAINT "disponibilites_intervenants_intervenantId_fkey" FOREIGN KEY ("intervenantId") REFERENCES "public"."intervenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conflits" ADD CONSTRAINT "conflits_seanceId1_fkey" FOREIGN KEY ("seanceId1") REFERENCES "public"."seances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conflits" ADD CONSTRAINT "conflits_seanceId2_fkey" FOREIGN KEY ("seanceId2") REFERENCES "public"."seances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
