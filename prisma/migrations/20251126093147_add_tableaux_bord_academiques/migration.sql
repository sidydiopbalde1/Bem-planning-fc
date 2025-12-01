-- CreateTable
CREATE TABLE "public"."activites_academiques" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "datePrevue" TIMESTAMP(3),
    "dateReelle" TIMESTAMP(3),
    "type" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "periodeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activites_academiques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."indicateurs_academiques" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "valeurCible" DOUBLE PRECISION,
    "valeurReelle" DOUBLE PRECISION,
    "periodicite" TEXT NOT NULL,
    "methodeCalcul" TEXT,
    "unite" TEXT NOT NULL DEFAULT '%',
    "type" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "periodeId" TEXT NOT NULL,
    "responsableId" TEXT,
    "dateCollecte" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indicateurs_academiques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."resultats_etudiants" (
    "id" TEXT NOT NULL,
    "numeroEtudiant" TEXT NOT NULL,
    "nomEtudiant" TEXT NOT NULL,
    "prenomEtudiant" TEXT NOT NULL,
    "emailEtudiant" TEXT,
    "moduleId" TEXT NOT NULL,
    "noteCC" DOUBLE PRECISION,
    "noteExamen" DOUBLE PRECISION,
    "noteFinale" DOUBLE PRECISION,
    "statut" TEXT NOT NULL,
    "mention" TEXT,
    "vhDeroule" INTEGER NOT NULL DEFAULT 0,
    "progressionPct" INTEGER NOT NULL DEFAULT 0,
    "presences" INTEGER NOT NULL DEFAULT 0,
    "absences" INTEGER NOT NULL DEFAULT 0,
    "tauxPresence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resultats_etudiants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."evaluations_enseignements" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "intervenantId" TEXT NOT NULL,
    "dateEnvoi" TIMESTAMP(3),
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "lienEvaluation" TEXT,
    "noteQualiteCours" DOUBLE PRECISION,
    "noteQualitePedagogie" DOUBLE PRECISION,
    "noteDisponibilite" DOUBLE PRECISION,
    "noteMoyenne" DOUBLE PRECISION,
    "nombreReponses" INTEGER NOT NULL DEFAULT 0,
    "tauxParticipation" DOUBLE PRECISION,
    "commentaires" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluations_enseignements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activites_academiques_programmeId_idx" ON "public"."activites_academiques"("programmeId");

-- CreateIndex
CREATE INDEX "activites_academiques_periodeId_idx" ON "public"."activites_academiques"("periodeId");

-- CreateIndex
CREATE INDEX "activites_academiques_type_idx" ON "public"."activites_academiques"("type");

-- CreateIndex
CREATE INDEX "indicateurs_academiques_programmeId_idx" ON "public"."indicateurs_academiques"("programmeId");

-- CreateIndex
CREATE INDEX "indicateurs_academiques_periodeId_idx" ON "public"."indicateurs_academiques"("periodeId");

-- CreateIndex
CREATE INDEX "indicateurs_academiques_type_idx" ON "public"."indicateurs_academiques"("type");

-- CreateIndex
CREATE INDEX "indicateurs_academiques_responsableId_idx" ON "public"."indicateurs_academiques"("responsableId");

-- CreateIndex
CREATE INDEX "resultats_etudiants_moduleId_idx" ON "public"."resultats_etudiants"("moduleId");

-- CreateIndex
CREATE INDEX "resultats_etudiants_numeroEtudiant_idx" ON "public"."resultats_etudiants"("numeroEtudiant");

-- CreateIndex
CREATE INDEX "resultats_etudiants_statut_idx" ON "public"."resultats_etudiants"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "resultats_etudiants_numeroEtudiant_moduleId_key" ON "public"."resultats_etudiants"("numeroEtudiant", "moduleId");

-- CreateIndex
CREATE INDEX "evaluations_enseignements_moduleId_idx" ON "public"."evaluations_enseignements"("moduleId");

-- CreateIndex
CREATE INDEX "evaluations_enseignements_intervenantId_idx" ON "public"."evaluations_enseignements"("intervenantId");

-- AddForeignKey
ALTER TABLE "public"."activites_academiques" ADD CONSTRAINT "activites_academiques_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "public"."programmes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activites_academiques" ADD CONSTRAINT "activites_academiques_periodeId_fkey" FOREIGN KEY ("periodeId") REFERENCES "public"."periodes_academiques"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."indicateurs_academiques" ADD CONSTRAINT "indicateurs_academiques_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "public"."programmes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."indicateurs_academiques" ADD CONSTRAINT "indicateurs_academiques_periodeId_fkey" FOREIGN KEY ("periodeId") REFERENCES "public"."periodes_academiques"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."indicateurs_academiques" ADD CONSTRAINT "indicateurs_academiques_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."resultats_etudiants" ADD CONSTRAINT "resultats_etudiants_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "public"."modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."evaluations_enseignements" ADD CONSTRAINT "evaluations_enseignements_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "public"."modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."evaluations_enseignements" ADD CONSTRAINT "evaluations_enseignements_intervenantId_fkey" FOREIGN KEY ("intervenantId") REFERENCES "public"."intervenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
