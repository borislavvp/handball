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

-- Ensure every roster player has a player_stats row for seeded matches.
INSERT INTO public.player_stats (
  matchid,
  playerid,
  goal,
  goal_empty,
  gkmiss_empty,
  assistprimary,
  assistsecondary,
  "1on1win",
  "1on1lost",
  provokePenalty,
  provokeTwoMin,
  provokeCard,
  miss,
  block,
  norebound,
  lostball,
  steal,
  defense,
  defensex2,
  penaltymade,
  twominutes,
  yellowcard,
  redcard,
  bluecard,
  gksave,
  gkmiss,
  value
)
SELECT
  m.id,
  p.id,
  0, 0, 0,
  0, 0,
  0, 0,
  0, 0, 0,
  0, 0, 0, 0,
  0, 0, 0,
  0, 0, 0,
  0, 0,
  0, 0,
  0
FROM public."match" m
JOIN public.player p
  ON p.teamid = m.teamid
WHERE m.teamid IN (1, 3)
  AND NOT EXISTS (
    SELECT 1
    FROM public.player_stats ps
    WHERE ps.matchid = m.id
      AND ps.playerid = p.id
  );

-- Re-sync stats from logged match events so backfilled rows stay consistent.
WITH aggregated AS (
  SELECT
    e.matchid,
    e.playerid,
    COUNT(*) FILTER (WHERE e.event = 'goal')::int AS goal,
    COUNT(*) FILTER (WHERE e.event = 'goal_empty')::int AS goal_empty,
    COUNT(*) FILTER (WHERE e.event = 'gkmiss_empty')::int AS gkmiss_empty,
    COUNT(*) FILTER (WHERE e.event = 'assistprimary')::int AS assistprimary,
    COUNT(*) FILTER (WHERE e.event = 'assistsecondary')::int AS assistsecondary,
    COUNT(*) FILTER (WHERE e.event = '1on1win')::int AS "1on1win",
    COUNT(*) FILTER (WHERE e.event = '1on1lost')::int AS "1on1lost",
    COUNT(*) FILTER (WHERE e.event = 'provokePenalty')::int AS provokePenalty,
    COUNT(*) FILTER (WHERE e.event = 'provokeTwoMin')::int AS provokeTwoMin,
    COUNT(*) FILTER (WHERE e.event = 'provokeCard')::int AS provokeCard,
    COUNT(*) FILTER (WHERE e.event = 'miss')::int AS miss,
    COUNT(*) FILTER (WHERE e.event = 'block')::int AS block,
    COUNT(*) FILTER (WHERE e.event = 'norebound')::int AS norebound,
    COUNT(*) FILTER (WHERE e.event = 'lostball')::int AS lostball,
    COUNT(*) FILTER (WHERE e.event = 'steal')::int AS steal,
    COUNT(*) FILTER (WHERE e.event = 'defense')::int AS defense,
    COUNT(*) FILTER (WHERE e.event = 'defensex2')::int AS defensex2,
    COUNT(*) FILTER (WHERE e.event = 'penaltymade')::int AS penaltymade,
    COUNT(*) FILTER (WHERE e.event = 'twominutes')::int AS twominutes,
    COUNT(*) FILTER (WHERE e.event = 'yellowcard')::int AS yellowcard,
    COUNT(*) FILTER (WHERE e.event = 'redcard')::int AS redcard,
    COUNT(*) FILTER (WHERE e.event = 'bluecard')::int AS bluecard,
    COUNT(*) FILTER (WHERE e.event = 'gksave')::int AS gksave,
    COUNT(*) FILTER (WHERE e.event = 'gkmiss')::int AS gkmiss
  FROM public.match_event e
  WHERE e.playerid IS NOT NULL
    AND e.matchid IN (
      SELECT id
      FROM public."match"
      WHERE teamid IN (1, 3)
    )
  GROUP BY e.matchid, e.playerid
)
UPDATE public.player_stats ps
SET
  goal = a.goal,
  goal_empty = a.goal_empty,
  gkmiss_empty = a.gkmiss_empty,
  assistprimary = a.assistprimary,
  assistsecondary = a.assistsecondary,
  "1on1win" = a."1on1win",
  "1on1lost" = a."1on1lost",
  provokePenalty = a.provokePenalty,
  provokeTwoMin = a.provokeTwoMin,
  provokeCard = a.provokeCard,
  miss = a.miss,
  block = a.block,
  norebound = a.norebound,
  lostball = a.lostball,
  steal = a.steal,
  defense = a.defense,
  defensex2 = a.defensex2,
  penaltymade = a.penaltymade,
  twominutes = a.twominutes,
  yellowcard = a.yellowcard,
  redcard = a.redcard,
  bluecard = a.bluecard,
  gksave = a.gksave,
  gkmiss = a.gkmiss,
  value = (
    (a.goal - a.miss)
    + ((a.assistprimary + a.assistsecondary + a.provokeCard + a.provokePenalty + a.provokeTwoMin + a."1on1win") - a.lostball)
    + ((a.steal + a.block + a.defense + a.defensex2) - a."1on1lost" - a.penaltymade - a.norebound - a.twominutes - a.redcard - a.bluecard)
  )
FROM aggregated a
WHERE ps.matchid = a.matchid
  AND ps.playerid = a.playerid;

COMMIT;
