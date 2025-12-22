-- CreateEnum
CREATE TYPE "public"."StatutRotation" AS ENUM ('PLANIFIE', 'CONFIRME', 'EN_COURS', 'TERMINE', 'TERMINE_SANS_RAPPORT', 'ABSENT', 'ANNULE');

-- CreateTable
CREATE TABLE "public"."rotations_weekend" (
    "id" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "semaineNumero" INTEGER NOT NULL,
    "annee" INTEGER NOT NULL,
    "responsableId" TEXT NOT NULL,
    "substitutId" TEXT,
    "status" "public"."StatutRotation" NOT NULL DEFAULT 'PLANIFIE',
    "nbSeancesTotal" INTEGER NOT NULL DEFAULT 0,
    "nbSeancesRealisees" INTEGER NOT NULL DEFAULT 0,
    "commentaire" TEXT,
    "estAbsence" BOOLEAN NOT NULL DEFAULT false,
    "notificationEnvoyee" BOOLEAN NOT NULL DEFAULT false,
    "rappelEnvoye" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "rotations_weekend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."disponibilites_responsables" (
    "id" TEXT NOT NULL,
    "responsableId" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "raison" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disponibilites_responsables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rapports_supervision" (
    "id" TEXT NOT NULL,
    "rotationId" TEXT NOT NULL,
    "heureArrivee" TEXT,
    "heureDepart" TEXT,
    "nbSeancesVisitees" INTEGER NOT NULL DEFAULT 0,
    "incidents" TEXT,
    "observations" TEXT,
    "recommandations" TEXT,
    "satisfaction" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rapports_supervision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."statistiques_rotation" (
    "id" TEXT NOT NULL,
    "responsableId" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "mois" INTEGER,
    "nbWeekendTotal" INTEGER NOT NULL DEFAULT 0,
    "nbWeekendRealises" INTEGER NOT NULL DEFAULT 0,
    "nbWeekendAbsences" INTEGER NOT NULL DEFAULT 0,
    "nbWeekendSubstitut" INTEGER NOT NULL DEFAULT 0,
    "tauxPresence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nbSeancesTotal" INTEGER NOT NULL DEFAULT 0,
    "moyenneSatisfaction" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "statistiques_rotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rotations_weekend_responsableId_idx" ON "public"."rotations_weekend"("responsableId");

-- CreateIndex
CREATE INDEX "rotations_weekend_dateDebut_idx" ON "public"."rotations_weekend"("dateDebut");

-- CreateIndex
CREATE INDEX "rotations_weekend_status_idx" ON "public"."rotations_weekend"("status");

-- CreateIndex
CREATE INDEX "rotations_weekend_semaineNumero_annee_idx" ON "public"."rotations_weekend"("semaineNumero", "annee");

-- CreateIndex
CREATE UNIQUE INDEX "rotations_weekend_dateDebut_responsableId_key" ON "public"."rotations_weekend"("dateDebut", "responsableId");

-- CreateIndex
CREATE INDEX "disponibilites_responsables_responsableId_idx" ON "public"."disponibilites_responsables"("responsableId");

-- CreateIndex
CREATE INDEX "disponibilites_responsables_dateDebut_idx" ON "public"."disponibilites_responsables"("dateDebut");

-- CreateIndex
CREATE UNIQUE INDEX "rapports_supervision_rotationId_key" ON "public"."rapports_supervision"("rotationId");

-- CreateIndex
CREATE INDEX "rapports_supervision_rotationId_idx" ON "public"."rapports_supervision"("rotationId");

-- CreateIndex
CREATE INDEX "statistiques_rotation_responsableId_idx" ON "public"."statistiques_rotation"("responsableId");

-- CreateIndex
CREATE INDEX "statistiques_rotation_annee_idx" ON "public"."statistiques_rotation"("annee");

-- CreateIndex
CREATE UNIQUE INDEX "statistiques_rotation_responsableId_annee_mois_key" ON "public"."statistiques_rotation"("responsableId", "annee", "mois");

-- AddForeignKey
ALTER TABLE "public"."rotations_weekend" ADD CONSTRAINT "rotations_weekend_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rotations_weekend" ADD CONSTRAINT "rotations_weekend_substitutId_fkey" FOREIGN KEY ("substitutId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."disponibilites_responsables" ADD CONSTRAINT "disponibilites_responsables_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rapports_supervision" ADD CONSTRAINT "rapports_supervision_rotationId_fkey" FOREIGN KEY ("rotationId") REFERENCES "public"."rotations_weekend"("id") ON DELETE CASCADE ON UPDATE CASCADE;
