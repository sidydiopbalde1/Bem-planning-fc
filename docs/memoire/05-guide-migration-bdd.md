# Guide de Migration Base de Données - BEM Planning FC

## 1. Vue d'Ensemble

Ce guide explique comment migrer votre base de données vers le nouveau schéma basé sur le MCD/MLD documenté.

### Nouveautés Principales

| Ajout | Description |
|-------|-------------|
| **DisponibiliteIntervenant** | Gestion fine des créneaux de disponibilité |
| **JournalActivite** | Audit log pour traçabilité complète |
| **Contraintes horaires** | heuresMaxSemaine, heuresMaxJour pour intervenants |
| **Sévérité conflits** | Classification BASSE/MOYENNE/HAUTE/CRITIQUE |
| **Nouveaux types conflits** | SURCHARGE_INTERVENANT, JOUR_NON_OUVRABLE |
| **Champs enrichis** | notes, objectifs pour les séances |
| **Index optimisés** | Amélioration performances requêtes |

---

## 2. Prérequis

### Sauvegarde Obligatoire

```bash
# Sauvegarde PostgreSQL
pg_dump -U username -d bem_planning_fc > backup_$(date +%Y%m%d_%H%M%S).sql

# Ou via Docker
docker exec postgres_container pg_dump -U username bem_planning_fc > backup.sql
```

### Vérification Version Prisma

```bash
npx prisma --version
# Doit être >= 6.0.0
```

---

## 3. Étapes de Migration

### Étape 1: Backup et Préparation

```bash
# 1. Sauvegarder la base de données (voir ci-dessus)

# 2. Vérifier l'état actuel
npx prisma db pull
npx prisma migrate status

# 3. Créer un point de restauration
psql -U username -d bem_planning_fc -c "SELECT pg_create_restore_point('avant_migration_mld');"
```

### Étape 2: Générer la Migration

```bash
# Générer le client Prisma avec le nouveau schéma
npx prisma generate

# Créer la migration
npx prisma migrate dev --name migration_vers_mld_complet

# Si la migration échoue, vous pouvez:
# - La corriger manuellement dans prisma/migrations/
# - Ou utiliser --create-only pour la générer sans l'appliquer
npx prisma migrate dev --create-only --name migration_vers_mld_complet
```

### Étape 3: Appliquer la Migration

```bash
# En développement
npx prisma migrate dev

# En production
npx prisma migrate deploy
```

### Étape 4: Vérification

```bash
# Vérifier le schéma
npx prisma db pull
npx prisma validate

# Vérifier les données
psql -U username -d bem_planning_fc -c "\dt"
psql -U username -d bem_planning_fc -c "SELECT COUNT(*) FROM users;"
```

---

## 4. Script SQL Manuel (si nécessaire)

Si Prisma ne génère pas correctement toutes les modifications, voici le SQL manuel :

```sql
-- ============================================================================
-- MIGRATION VERS SCHEMA MLD COMPLET
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. AJOUT NOUVEAUX ENUMS
-- ---------------------------------------------------------------------------

-- Enum TypeDisponibilite
DO $$ BEGIN
  CREATE TYPE "TypeDisponibilite" AS ENUM ('DISPONIBLE', 'INDISPONIBLE', 'PREFERENCE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum SeveriteConflit
DO $$ BEGIN
  CREATE TYPE "SeveriteConflit" AS ENUM ('BASSE', 'MOYENNE', 'HAUTE', 'CRITIQUE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum ActionType
DO $$ BEGIN
  CREATE TYPE "ActionType" AS ENUM (
    'CREATION', 'MODIFICATION', 'SUPPRESSION',
    'CONNEXION', 'DECONNEXION', 'PLANIFICATION_AUTO',
    'RESOLUTION_CONFLIT', 'EXPORT_DONNEES'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ajouter nouveaux types de conflits
ALTER TYPE "TypeConflit" ADD VALUE IF NOT EXISTS 'SURCHARGE_INTERVENANT';
ALTER TYPE "TypeConflit" ADD VALUE IF NOT EXISTS 'JOUR_NON_OUVRABLE';

-- ---------------------------------------------------------------------------
-- 2. MODIFICATION TABLE INTERVENANTS
-- ---------------------------------------------------------------------------

-- Ajouter contraintes de charge horaire
ALTER TABLE "intervenants"
ADD COLUMN IF NOT EXISTS "heuresMaxSemaine" INTEGER DEFAULT 20 NOT NULL,
ADD COLUMN IF NOT EXISTS "heuresMaxJour" INTEGER DEFAULT 6 NOT NULL,
ADD COLUMN IF NOT EXISTS "joursPreferences" TEXT,
ADD COLUMN IF NOT EXISTS "creneauxPreferences" TEXT;

-- Ajouter index
CREATE INDEX IF NOT EXISTS "intervenants_disponible_idx" ON "intervenants"("disponible");

-- ---------------------------------------------------------------------------
-- 3. CREATION TABLE DISPONIBILITES_INTERVENANTS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "disponibilites_intervenants" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "jourSemaine" INTEGER NOT NULL,
  "heureDebut" TEXT NOT NULL,
  "heureFin" TEXT NOT NULL,
  "type" "TypeDisponibilite" DEFAULT 'DISPONIBLE' NOT NULL,
  "dateDebut" TIMESTAMP(3),
  "dateFin" TIMESTAMP(3),
  "recurrent" BOOLEAN DEFAULT true NOT NULL,
  "intervenantId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "disponibilites_intervenants_intervenantId_fkey"
    FOREIGN KEY ("intervenantId")
    REFERENCES "intervenants"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "disponibilites_intervenants_intervenantId_idx"
  ON "disponibilites_intervenants"("intervenantId");
CREATE INDEX IF NOT EXISTS "disponibilites_intervenants_jourSemaine_idx"
  ON "disponibilites_intervenants"("jourSemaine");

-- ---------------------------------------------------------------------------
-- 4. MODIFICATION TABLE SEANCES
-- ---------------------------------------------------------------------------

-- Ajouter nouveaux champs
ALTER TABLE "seances"
ADD COLUMN IF NOT EXISTS "notes" TEXT,
ADD COLUMN IF NOT EXISTS "objectifs" TEXT;

-- Ajouter index manquants
CREATE INDEX IF NOT EXISTS "seances_status_idx" ON "seances"("status");

-- ---------------------------------------------------------------------------
-- 5. MODIFICATION TABLE CONFLITS
-- ---------------------------------------------------------------------------

-- Ajouter sévérité et résolution enrichie
ALTER TABLE "conflits"
ADD COLUMN IF NOT EXISTS "severite" "SeveriteConflit" DEFAULT 'HAUTE' NOT NULL,
ADD COLUMN IF NOT EXISTS "resoluPar" TEXT,
ADD COLUMN IF NOT EXISTS "resoluLe" TIMESTAMP(3);

-- Ajouter relations FK vers seances (si pas déjà fait)
DO $$ BEGIN
  ALTER TABLE "conflits"
  ADD CONSTRAINT "conflits_seanceId1_fkey"
    FOREIGN KEY ("seanceId1")
    REFERENCES "seances"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "conflits"
  ADD CONSTRAINT "conflits_seanceId2_fkey"
    FOREIGN KEY ("seanceId2")
    REFERENCES "seances"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ajouter index
CREATE INDEX IF NOT EXISTS "conflits_type_idx" ON "conflits"("type");
CREATE INDEX IF NOT EXISTS "conflits_severite_idx" ON "conflits"("severite");

-- ---------------------------------------------------------------------------
-- 6. CREATION TABLE JOURNAL_ACTIVITES
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "journal_activites" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "action" "ActionType" NOT NULL,
  "entite" TEXT NOT NULL,
  "entiteId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "ancienneValeur" TEXT,
  "nouvelleValeur" TEXT,
  "userId" TEXT NOT NULL,
  "userName" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "journal_activites_userId_idx"
  ON "journal_activites"("userId");
CREATE INDEX IF NOT EXISTS "journal_activites_entite_entiteId_idx"
  ON "journal_activites"("entite", "entiteId");
CREATE INDEX IF NOT EXISTS "journal_activites_createdAt_idx"
  ON "journal_activites"("createdAt");
CREATE INDEX IF NOT EXISTS "journal_activites_action_idx"
  ON "journal_activites"("action");

-- ---------------------------------------------------------------------------
-- 7. AJOUT INDEX SUPPLEMENTAIRES (OPTIMISATION)
-- ---------------------------------------------------------------------------

-- Users
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");

-- Programmes
CREATE INDEX IF NOT EXISTS "programmes_status_idx" ON "programmes"("status");
CREATE INDEX IF NOT EXISTS "programmes_code_idx" ON "programmes"("code");

-- Modules
CREATE INDEX IF NOT EXISTS "modules_code_idx" ON "modules"("code");

-- Salles
CREATE INDEX IF NOT EXISTS "salles_nom_idx" ON "salles"("nom");

-- Periodes academiques
CREATE INDEX IF NOT EXISTS "periodes_academiques_active_idx"
  ON "periodes_academiques"("active");
CREATE INDEX IF NOT EXISTS "periodes_academiques_annee_idx"
  ON "periodes_academiques"("annee");

-- ---------------------------------------------------------------------------
-- 8. NETTOYAGE ET VALIDATION
-- ---------------------------------------------------------------------------

-- Supprimer les index dupliqués si nécessaires
-- (à adapter selon votre cas)

-- Mettre à jour les statistiques
ANALYZE;

COMMIT;

-- Vérification finale
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

## 5. Migration des Données Existantes

Si vous avez déjà des données, voici comment les migrer :

```sql
-- Migrer les contraintes intervenants (valeurs par défaut)
UPDATE "intervenants"
SET
  "heuresMaxSemaine" = 20,
  "heuresMaxJour" = 6
WHERE "heuresMaxSemaine" IS NULL OR "heuresMaxJour" IS NULL;

-- Ajouter sévérité par défaut aux conflits existants
UPDATE "conflits"
SET "severite" = CASE
  WHEN "type" IN ('INTERVENANT_DOUBLE_BOOKING', 'SALLE_DOUBLE_BOOKING') THEN 'CRITIQUE'
  WHEN "type" = 'CHEVAUCHEMENT_HORAIRE' THEN 'HAUTE'
  WHEN "type" = 'CONTRAINTE_CALENDAIRE' THEN 'MOYENNE'
  ELSE 'HAUTE'
END
WHERE "severite" IS NULL;
```

---

## 6. Rollback (en cas de problème)

### Option 1: Rollback Prisma

```bash
# Revenir à la migration précédente
npx prisma migrate resolve --rolled-back <migration_name>

# Réappliquer l'ancien schéma
git checkout HEAD~1 prisma/schema.prisma
npx prisma migrate dev
```

### Option 2: Restauration depuis Backup

```bash
# Supprimer la base actuelle
dropdb bem_planning_fc

# Créer une nouvelle base
createdb bem_planning_fc

# Restaurer depuis backup
psql -U username -d bem_planning_fc < backup_20241124.sql
```

---

## 7. Post-Migration

### Vérifications

```bash
# 1. Vérifier les tables
npx prisma studio

# 2. Tester les API
npm run dev
# Tester manuellement les endpoints

# 3. Vérifier les logs
tail -f logs/application.log
```

### Régénération Client

```bash
# Après toute modification du schéma
npx prisma generate
npm run build
```

---

## 8. Troubleshooting

### Erreur: "Type already exists"

```sql
-- Supprimer l'ancien type et recréer
DROP TYPE IF EXISTS "TypeDisponibilite" CASCADE;
CREATE TYPE "TypeDisponibilite" AS ENUM ('DISPONIBLE', 'INDISPONIBLE', 'PREFERENCE');
```

### Erreur: "Foreign key constraint"

```bash
# Désactiver temporairement les contraintes (ATTENTION: développement uniquement)
psql -U username -d bem_planning_fc -c "SET CONSTRAINTS ALL DEFERRED;"
```

### Erreur: "Column already exists"

Utiliser `ADD COLUMN IF NOT EXISTS` dans le SQL manuel.

---

## 9. Checklist de Migration

- [ ] Backup base de données créé
- [ ] Version Prisma vérifiée (>= 6.0.0)
- [ ] Variables d'environnement configurées
- [ ] Migration générée avec `prisma migrate dev`
- [ ] Migration testée en développement
- [ ] Données migrées et vérifiées
- [ ] Index créés et statistiques à jour
- [ ] Client Prisma régénéré
- [ ] Tests passent
- [ ] Application fonctionne correctement
- [ ] Documentation mise à jour

---

## 10. Commandes Utiles

```bash
# État des migrations
npx prisma migrate status

# Voir le SQL d'une migration
cat prisma/migrations/<timestamp>_<name>/migration.sql

# Synchroniser le schéma sans migration
npx prisma db push

# Réinitialiser complètement (DANGER)
npx prisma migrate reset

# Seed la base
npx prisma db seed
```

---

## Contact et Support

En cas de problème lors de la migration, consulter :
- Documentation Prisma : https://www.prisma.io/docs
- MCD/MLD du projet : `docs/memoire/02-mcd-mld.md`
- Schéma Prisma : `prisma/schema.prisma`
