-- Seed default teams and players required by demo match migrations.
-- This migration intentionally pins IDs so later seed migrations can reference stable players.

BEGIN;

INSERT INTO public.team (id, name)
VALUES
  (1, 'China'),
  (3, 'France')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name;

INSERT INTO public.player (id, teamid, name, number, position)
VALUES
  -- China (team 1)
  (1, 1, 'China Player 1', 1, 'LW'),
  (2, 1, 'China Player 2', 2, 'LB'),
  (3, 1, 'China Player 3', 3, 'CB'),
  (4, 1, 'China Player 4', 4, 'CB'),
  (5, 1, 'China Player 5', 5, 'RB'),
  (6, 1, 'China Player 6', 6, 'RW'),
  (7, 1, 'China Player 7', 7, 'PV'),
  (8, 1, 'China Player 8', 8, 'CB'),
  (9, 1, 'China Player 9', 9, 'RB'),
  (10, 1, 'China Player 10', 10, 'CB'),
  (11, 1, 'China Goalkeeper 11', 11, 'GK'),
  (12, 1, 'China Player 12', 12, 'LB'),
  (13, 1, 'China Player 13', 13, 'RB'),
  (14, 1, 'China Player 14', 14, 'RW'),
  (15, 1, 'China Player 15', 15, 'RW'),
  (16, 1, 'China Player 16', 16, 'LW'),
  (17, 1, 'China Player 17', 17, 'CB'),
  (18, 1, 'China Player 18', 18, 'PV'),
  (19, 1, 'China Player 19', 19, 'RB'),

  -- France (team 3)
  (101, 3, 'France Player 1', 1, 'LW'),
  (102, 3, 'France Player 2', 2, 'LB'),
  (103, 3, 'France Player 3', 3, 'CB'),
  (104, 3, 'France Player 4', 4, 'CB'),
  (105, 3, 'France Player 5', 5, 'RB'),
  (106, 3, 'France Player 6', 6, 'RW'),
  (107, 3, 'France Player 7', 7, 'PV'),
  (108, 3, 'France Player 8', 8, 'CB'),
  (109, 3, 'France Player 9', 9, 'RB'),
  (110, 3, 'France Player 10', 10, 'CB'),
  (111, 3, 'France Goalkeeper 11', 11, 'GK'),
  (112, 3, 'France Player 12', 12, 'LB'),
  (113, 3, 'France Player 13', 13, 'RB'),
  (114, 3, 'France Player 14', 14, 'RW'),
  (115, 3, 'France Player 15', 15, 'RW'),
  (116, 3, 'France Player 16', 16, 'LW'),
  (117, 3, 'France Player 17', 17, 'CB'),
  (118, 3, 'France Player 18', 18, 'PV'),
  (119, 3, 'France Player 19', 19, 'RB')
ON CONFLICT (id) DO UPDATE
SET
  teamid = EXCLUDED.teamid,
  name = EXCLUDED.name,
  number = EXCLUDED.number,
  position = EXCLUDED.position;

SELECT setval(pg_get_serial_sequence('public.team', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.team), 1), true);
SELECT setval(pg_get_serial_sequence('public.player', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.player), 1), true);

COMMIT;
