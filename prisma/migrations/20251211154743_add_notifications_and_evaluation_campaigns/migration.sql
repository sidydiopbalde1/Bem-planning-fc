-- CreateEnum
CREATE TYPE "public"."TypeNotification" AS ENUM ('MODIFICATION_PLANNING', 'CONFLIT_DETECTE', 'MODULE_SANS_INTERVENANT', 'PROGRAMME_EN_RETARD', 'MODULE_PROCHAIN', 'EVALUATION_DISPONIBLE', 'SYSTEME');

-- CreateEnum
CREATE TYPE "public"."PrioriteNotification" AS ENUM ('BASSE', 'NORMALE', 'HAUTE', 'URGENTE');

-- CreateEnum
CREATE TYPE "public"."StatutCampagne" AS ENUM ('BROUILLON', 'ENVOYEE', 'EN_COURS', 'TERMINEE', 'ANNULEE');

-- AlterEnum
ALTER TYPE "public"."ActionType" ADD VALUE 'ALERTE';

-- AlterTable
ALTER TABLE "public"."evaluations_enseignements" ADD COLUMN     "nombreInvitations" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "statut" "public"."StatutCampagne" NOT NULL DEFAULT 'BROUILLON';

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "public"."TypeNotification" NOT NULL,
    "priorite" "public"."PrioriteNotification" NOT NULL DEFAULT 'NORMALE',
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "destinataireId" TEXT NOT NULL,
    "entite" TEXT,
    "entiteId" TEXT,
    "lienAction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_destinataireId_idx" ON "public"."notifications"("destinataireId");

-- CreateIndex
CREATE INDEX "notifications_lu_idx" ON "public"."notifications"("lu");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "public"."notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "public"."notifications"("createdAt");

-- CreateIndex
CREATE INDEX "evaluations_enseignements_statut_idx" ON "public"."evaluations_enseignements"("statut");
