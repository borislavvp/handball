-- Add no-recovery tracking columns to the shots table for the
-- "goalkeeper save no rebound" feature.
--
-- Mirrors the mistakePlayer pattern from
-- 20250328100000_init_schema.sql:70. The new fields are:
--
--   "noRecovery"      -- true if the defending team did not recover
--                        possession after a goalkeeper save
--   "noRecoveryPlayer" -- the player who failed to secure the rebound
--                        (optional, mirrors mistakePlayer)
--
-- Both default to false / null so existing rows are unaffected and the
-- new fields are UI-gated to gksave shots.

ALTER TABLE public.shots
  ADD COLUMN IF NOT EXISTS "noRecovery" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "noRecoveryPlayer" integer REFERENCES public.player(id) ON DELETE SET NULL;
