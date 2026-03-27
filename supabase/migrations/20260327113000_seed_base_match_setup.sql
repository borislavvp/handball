-- Backfill base match + player_stats scaffold so seeded teams have complete initial data.
-- This migration is idempotent and safe to run after existing seed migrations.

BEGIN;

-- Ensure the primary China vs France seeded match exists.
INSERT INTO public."match" (
  opponent,
  teamid,
  score,
  "opponentScore",
  result,
  "timeoutsLeftHome",
  "timeoutsLeftAway",
  createdat
)
SELECT
  'France',
  1,
  29,
  32,
  'LOST',
  1,
  1,
  '2026-01-18 18:00:00+00'::timestamptz
WHERE NOT EXISTS (
  SELECT 1
  FROM public."match" m
  WHERE m.teamid = 1
    AND m.opponent = 'France'
    AND m.createdat = '2026-01-18 18:00:00+00'::timestamptz
);



COMMIT;
