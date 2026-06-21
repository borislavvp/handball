-- Allow a match to be played against another team in your roster (instead of a
-- free-text opponent name). When set, the active-match screen can toggle
-- between both teams' player lists and record stats for either side.
--
-- Nullable so existing "new team" matches (opponent stored only as a string)
-- are unaffected.

ALTER TABLE public.match
  ADD COLUMN IF NOT EXISTS "opponentTeamId" integer REFERENCES public.team(id) ON DELETE SET NULL;
