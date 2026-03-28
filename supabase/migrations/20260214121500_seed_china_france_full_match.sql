-- Seed one full realistic China (team 1) vs France (team 3) match with consistent event logging.
-- Every player stat increment is represented by one row in public.match_event.

DO $$
DECLARE
  v_match_id integer;
BEGIN
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
  VALUES (
    'France',
    1,
    29,
    32,
    'LOST',
    1,
    1,
    '2026-01-18 18:00:00+00'
  )
  RETURNING id INTO v_match_id;

  -- Core match state timeline (strictly chronological)
  INSERT INTO public.match_event (matchid, event, time, playerid, metadata)
  VALUES
    (v_match_id, 'playing', '00:00', NULL, 'true'),
    (v_match_id, 'defense_change', '00:00', NULL, '6:0'),
    (v_match_id, 'opponent_defense_change', '00:00', NULL, '6:0'),
    (v_match_id, 'timeout_home', '18:40', NULL, 'china timeout #1'),
    (v_match_id, 'timeout_away', '22:11', NULL, 'france timeout #1'),
    (v_match_id, 'empty_goal_home', '24:18', NULL, 'True'),
    (v_match_id, 'empty_goal_home', '26:02', NULL, 'False'),
    (v_match_id, 'defense_change', '31:10', NULL, '5:1'),
    (v_match_id, 'opponent_defense_change', '33:24', NULL, '5:1'),
    (v_match_id, 'empty_goal_away', '41:20', NULL, 'True'),
    (v_match_id, 'empty_goal_away', '42:05', NULL, 'False'),
    (v_match_id, 'timeout_home', '47:52', NULL, 'china timeout #2'),
    (v_match_id, 'timeout_away', '54:10', NULL, 'france timeout #2'),
    (v_match_id, 'playing', '60:00', NULL, 'false');

  -- Full shot-by-shot log for both teams.
  -- Use a temp table because we need to fan out the same inserted shot rows
  -- into multiple match_event inserts in separate SQL statements.
  DROP TABLE IF EXISTS inserted_shots;

  CREATE TEMP TABLE inserted_shots ON COMMIT DROP AS
  WITH china_shots_data AS (
    SELECT *
    FROM (VALUES
      ('00:48', 2,  'LB9', 2,  'goal',   8,  NULL, FALSE, FALSE, NULL::integer),
      ('01:31', 5,  'RB9', 9,  'goal',   8,  2,    FALSE, FALSE, NULL::integer),
      ('02:44', 7,  'CB6', 7,  'goal',   4,  NULL, FALSE, TRUE,  NULL::integer),
      ('04:12', 1,  'LW',  1,  'goal',   8,  NULL, TRUE,  FALSE, NULL::integer),
      ('05:06', 9,  'RB9', 3,  'gksave', 4,  NULL, FALSE, FALSE, NULL::integer),
      ('06:33', 12, 'LB9', 1,  'goal',   8,  NULL, FALSE, FALSE, NULL::integer),
      ('07:25', 6,  'RW',  9,  'goal',   5,  NULL, TRUE,  FALSE, NULL::integer),
      ('08:52', 8,  'CB9', 2,  'goal',   2,  NULL, FALSE, FALSE, NULL::integer),
      ('10:18', 4,  'CB9', 3,  'miss',   NULL, NULL, FALSE, FALSE, 9),
      ('11:02', 13, 'RB6', 7,  'goal',   8,  2,    FALSE, TRUE,  NULL::integer),
      ('12:07', 2,  '7M',  5,  'goal',   NULL,  NULL, FALSE, FALSE, NULL::integer),
      ('13:30', 10, 'CB6', 5,  'block',  4,  NULL, FALSE, TRUE,  10),
      ('14:22', 16, 'LW',  7,  'goal',   8,  NULL, TRUE,  FALSE, NULL::integer),
      ('15:37', 5,  'RB9', 1,  'goal',   8,  2,    FALSE, FALSE, NULL::integer),
      ('16:50', 8,  'CB9', 6,  'goal',   4,  NULL, FALSE, FALSE, NULL::integer),
      ('17:56', 14, 'RW',  3,  'goal',   5,  NULL, TRUE,  FALSE, NULL::integer),
      ('19:10', 7,  'CB6', 8,  'goal',   4,  NULL, FALSE, TRUE,  NULL::integer),
      ('20:35', 2,  'LB9', 2,  'goal',   8,  NULL, FALSE, FALSE, NULL::integer),
      ('21:48', 9,  'RB9', 10, 'miss',   8,  NULL, FALSE, FALSE, 9),
      ('23:04', 1,  'LW',  7,  'goal',   8,  NULL, TRUE,  FALSE, NULL::integer),
      ('25:03', 8,  '7M',  8,  'goal',   NULL,  NULL, FALSE, FALSE, NULL::integer),
      ('25:20', 12, 'LB9', 11, 'miss',   8,  NULL, FALSE, FALSE, 12),
      ('27:08', 5,  'RB9', 3,  'goal',   8,  2,    FALSE, FALSE, NULL::integer),
      ('29:10', 7,  'CB6', 4,  'goal',   4,  NULL, FALSE, TRUE,  NULL::integer),
      ('31:45', 2,  'LB9', 1,  'goal',   8,  NULL, FALSE, FALSE, NULL::integer),
      ('33:12', 13, 'RB9', 6,  'goal',   8,  NULL, FALSE, FALSE, NULL::integer),
      ('34:40', 6,  'RW',  8,  'goal',   5,  NULL, TRUE,  FALSE, NULL::integer),
      ('36:05', 4,  'CB9', 5,  'goal',   8,  2,    FALSE, FALSE, NULL::integer),
      ('37:22', 8,  'CB6', 9,  'goal',   4,  NULL, FALSE, TRUE,  NULL::integer),
      ('39:14', 9,  'RB6', 3,  'block',  8,  NULL, FALSE, TRUE,  13),
      ('41:42', 17, 'CB9', 2,  'goal',   8,  NULL, FALSE, FALSE, NULL::integer),
      ('43:27', 18, 'CB6', 7,  'goal',   4,  NULL, FALSE, TRUE,  NULL::integer),
      ('45:41', 5,  'RB9', 1,  'gksave', 8,  NULL, FALSE, FALSE, 12),
      ('48:30', 15, 'RW',  9,  'goal',   8,  NULL, TRUE,  FALSE, NULL::integer),
      ('52:06', 19, '7M',  2,  'goal',   NULL,  NULL, FALSE, FALSE, NULL::integer),
      ('56:02', 2,  'LB9', 2,  'goal',   8,  NULL, FALSE, FALSE, NULL::integer)
    ) AS t(time, playerid, "from", "to", result, "assistPrimary", "assistSecondary", fastbreak, breakthrough, "mistakePlayer")
  ),
  france_shots_data AS (
    SELECT *
    FROM (VALUES
      ('01:10', 11, 'CB9', 2, 'gksave',      NULL::integer, NULL::integer, FALSE, FALSE, NULL::integer),
      ('02:05', 11, 'LB9', 9, 'gkmiss',      NULL::integer, NULL::integer, FALSE, FALSE, NULL::integer),
      ('03:11', 11, 'RW',  7, 'gkmiss',      NULL::integer, NULL::integer, TRUE,  FALSE, NULL::integer),
      ('04:34', 11, 'CB6', 4, 'gksave',      NULL::integer, NULL::integer, FALSE, TRUE,  NULL::integer),
      ('05:48', 11, 'RB9', 1, 'gkmiss',      NULL::integer, NULL::integer, FALSE, FALSE, NULL::integer),
      ('06:50', 11, 'LW',  8, 'gkmiss',      NULL::integer, NULL::integer, TRUE,  FALSE, NULL::integer),
      ('08:08', 11, 'CB9', 5, 'gkmiss',      NULL::integer, NULL::integer, FALSE, FALSE, NULL::integer),
      ('09:40', 11, 'RB6', 3, 'gksave',      NULL::integer, NULL::integer, FALSE, TRUE,  NULL::integer),
      ('10:44', 11, 'LB6', 2, 'gkmiss',      NULL::integer, NULL::integer, FALSE, TRUE,  9),
      ('12:05', 11, '7M',  6, 'gkmiss',      NULL::integer, NULL::integer, FALSE, FALSE, NULL::integer),
      ('13:09', 11, 'RW',  9, 'gkmiss',      NULL::integer, NULL::integer, TRUE,  FALSE, NULL::integer),
      ('14:31', 11, 'LB9', 1, 'gksave',      NULL::integer, NULL::integer, FALSE, FALSE, NULL::integer),
      ('15:54', 11, 'CB6', 4, 'gkmiss',      NULL::integer, NULL::integer, FALSE, TRUE,  NULL::integer),
      ('17:02', 11, 'RB9', 3, 'gkmiss',      NULL::integer, NULL::integer, FALSE, FALSE, NULL::integer),
      ('18:27', 11, 'LW',  2, 'gksave',      NULL::integer, NULL::integer, FALSE, FALSE, NULL::integer),
      ('19:49', 11, 'CB9', 8, 'gkmiss',      NULL::integer, NULL::integer, FALSE, FALSE, NULL::integer),
      ('21:06', 11, 'RB6', 6, 'gksave',      NULL::integer, NULL::integer, FALSE, TRUE,  NULL::integer),
      ('22:36', 11, 'LB9', 5, 'gkmiss',      NULL::integer, NULL::integer, FALSE, FALSE, NULL::integer),
      ('25:01', 11, '7M',  2, 'gkmiss',      NULL::integer, NULL::integer, FALSE, FALSE, NULL::integer),
      ('25:12', 11, 'RW',  9, 'gkmiss_empty',NULL::integer, NULL::integer, TRUE,  FALSE, 12),
      ('26:40', 11, 'LB6', 4, 'gksave',      NULL::integer, NULL::integer, FALSE, TRUE,  NULL::integer),
      ('27:59', 11, 'CB9', 1, 'gkmiss',      NULL::integer, NULL::integer, FALSE, FALSE, NULL::integer),
      ('29:21', 11, 'RB9', 7, 'gksave',      NULL::integer, NULL::integer, FALSE, FALSE, NULL::integer),
      ('30:50', 11, 'LW',  3, 'gkmiss',      NULL::integer, NULL::integer, FALSE, FALSE, NULL::integer),
      ('32:16', 11, 'CB9', 5, 'gkmiss',      NULL::integer, NULL::integer, FALSE, FALSE, NULL::integer),
      ('33:47', 11, 'RB6', 8, 'gkmiss',      NULL::integer, NULL::integer, FALSE, TRUE,  NULL::integer),
      ('35:05', 11, 'LB9', 2, 'gksave',      NULL::integer, NULL::integer, FALSE, FALSE, NULL::integer),
      ('36:29', 11, 'CB6', 1, 'gkmiss',      NULL::integer, NULL::integer, FALSE, TRUE,  NULL::integer),
      ('37:46', 11, 'RW',  6, 'gkmiss',      NULL::integer, NULL::integer, TRUE,  FALSE, NULL::integer),
      ('39:03', 11, 'CB9', 4, 'gksave',      NULL::integer, NULL::integer, FALSE, FALSE, NULL::integer),
      ('40:22', 11, 'LB6', 3, 'gkmiss',      NULL::integer, NULL::integer, FALSE, TRUE,  NULL::integer),
      ('41:47', 11, 'RB9', 5, 'gkmiss',      NULL::integer, NULL::integer, FALSE, FALSE, 10),
      ('43:15', 11, 'LW',  1, 'gkmiss',      NULL::integer, NULL::integer, FALSE, FALSE, NULL::integer),
      ('44:43', 11, 'CB9', 9, 'gksave',      NULL::integer, NULL::integer, FALSE, FALSE, NULL::integer),
      ('46:05', 11, 'RB6', 2, 'gkmiss',      NULL::integer, NULL::integer, FALSE, TRUE,  NULL::integer),
      ('47:34', 11, 'LB9', 4, 'gkmiss',      NULL::integer, NULL::integer, FALSE, FALSE, NULL::integer),
      ('48:59', 11, 'CB9', 6, 'gkmiss',      NULL::integer, NULL::integer, FALSE, FALSE, NULL::integer),
      ('50:17', 11, 'RW',  8, 'gksave',      NULL::integer, NULL::integer, TRUE,  FALSE, NULL::integer),
      ('52:05', 11, '7M',  7, 'gkmiss',      NULL::integer, NULL::integer, FALSE, FALSE, NULL::integer),
      ('53:12', 11, 'CB9', 3, 'gkmiss',      NULL::integer, NULL::integer, FALSE, FALSE, NULL::integer),
      ('54:45', 11, 'RB9', 2, 'gkmiss',      NULL::integer, NULL::integer, FALSE, FALSE, NULL::integer),
      ('56:10', 11, 'LW',  9, 'gksave',      NULL::integer, NULL::integer, FALSE, FALSE, NULL::integer),
      ('57:28', 11, 'CB6', 4, 'gkmiss',      NULL::integer, NULL::integer, FALSE, TRUE,  NULL::integer),
      ('58:44', 11, 'RB6', 1, 'gkmiss',      NULL::integer, NULL::integer, FALSE, TRUE,  NULL::integer),
      ('59:39', 11, 'LB9', 5, 'gkmiss',      NULL::integer, NULL::integer, FALSE, FALSE, NULL::integer)
    ) AS t(time, playerid, "from", "to", result, "assistPrimary", "assistSecondary", fastbreak, breakthrough, "mistakePlayer")
  ),
  shots_data AS (
    SELECT * FROM china_shots_data
    UNION ALL
    SELECT * FROM france_shots_data
  )
  INSERT INTO public.shots (
    matchid, playerid, "from", "to", result, time,
    "assistPrimary", "assistSecondary", fastbreak, breakthrough, "mistakePlayer"
  )
  SELECT
    v_match_id, playerid, "from", "to", result, time,
    "assistPrimary", "assistSecondary", fastbreak, breakthrough, "mistakePlayer"
  FROM shots_data
  ORDER BY time
  RETURNING id, matchid, playerid, result, time;

  -- Persist shot outcomes into match_event as well.
  -- Keep GK outcomes explicit so gkmiss/gksave are always present in the event timeline.
  INSERT INTO public.match_event (matchid, event, time, playerid, metadata)
  SELECT matchid, result, time, playerid, id::text
  FROM inserted_shots
  WHERE result IN ('goal', 'miss', 'block', 'goal_empty');

  INSERT INTO public.match_event (matchid, event, time, playerid, metadata)
  SELECT matchid, result, time, playerid, id::text
  FROM inserted_shots
  WHERE result IN ('gksave', 'gkmiss', 'gkmiss_empty');

  -- Non-shot player stats, one row per stat increment.
  INSERT INTO public.match_event (matchid, event, time, playerid, metadata)
  VALUES
    -- assists generated from shot creation flow
    (v_match_id, 'assistprimary', '00:48', 8, NULL),
    (v_match_id, 'assistprimary', '01:31', 8, NULL),
    (v_match_id, 'assistsecondary', '01:31', 2, NULL),
    (v_match_id, 'assistprimary', '02:44', 4, NULL),
    (v_match_id, 'assistprimary', '04:12', 8, NULL),
    (v_match_id, 'assistprimary', '05:06', 4, NULL),
    (v_match_id, 'assistprimary', '06:33', 8, NULL),
    (v_match_id, 'assistprimary', '07:25', 5, NULL),
    (v_match_id, 'assistprimary', '08:52', 2, NULL),
    (v_match_id, 'assistprimary', '11:02', 8, NULL),
    (v_match_id, 'assistsecondary', '11:02', 2, NULL),
    (v_match_id, 'assistprimary', '13:30', 4, NULL),
    (v_match_id, 'assistprimary', '14:22', 8, NULL),
    (v_match_id, 'assistprimary', '15:37', 8, NULL),
    (v_match_id, 'assistsecondary', '15:37', 2, NULL),
    (v_match_id, 'assistprimary', '16:50', 4, NULL),
    (v_match_id, 'assistprimary', '17:56', 5, NULL),
    (v_match_id, 'assistprimary', '19:10', 4, NULL),
    (v_match_id, 'assistprimary', '20:35', 8, NULL),
    (v_match_id, 'assistprimary', '21:48', 8, NULL),
    (v_match_id, 'assistprimary', '23:04', 8, NULL),
    (v_match_id, 'assistprimary', '25:20', 8, NULL),
    (v_match_id, 'assistprimary', '27:08', 8, NULL),
    (v_match_id, 'assistsecondary', '27:08', 2, NULL),
    (v_match_id, 'assistprimary', '29:10', 4, NULL),
    (v_match_id, 'assistprimary', '31:45', 8, NULL),
    (v_match_id, 'assistprimary', '33:12', 8, NULL),
    (v_match_id, 'assistprimary', '34:40', 5, NULL),
    (v_match_id, 'assistprimary', '36:05', 8, NULL),
    (v_match_id, 'assistsecondary', '36:05', 2, NULL),
    (v_match_id, 'assistprimary', '37:22', 4, NULL),
    (v_match_id, 'assistprimary', '39:14', 8, NULL),
    (v_match_id, 'assistprimary', '41:42', 8, NULL),
    (v_match_id, 'assistprimary', '43:27', 4, NULL),
    (v_match_id, 'assistprimary', '45:41', 8, NULL),
    (v_match_id, 'assistprimary', '48:30', 8, NULL),
    (v_match_id, 'assistprimary', '56:02', 8, NULL),

    -- defensive contributions
    (v_match_id, 'defense', '03:40', 7, NULL),
    (v_match_id, 'defense', '06:59', 10, NULL),
    (v_match_id, 'defense', '09:16', 12, NULL),
    (v_match_id, 'defense', '14:55', 7, NULL),
    (v_match_id, 'defense', '18:03', 10, NULL),
    (v_match_id, 'defense', '21:26', 18, NULL),
    (v_match_id, 'defense', '27:54', 7, NULL),
    (v_match_id, 'defense', '32:01', 10, NULL),
    (v_match_id, 'defense', '35:44', 18, NULL),
    (v_match_id, 'defense', '38:12', 7, NULL),
    (v_match_id, 'defense', '44:15', 7, NULL),
    (v_match_id, 'defense', '50:11', 10, NULL),
    (v_match_id, 'defense', '53:36', 18, NULL),
    (v_match_id, 'defensex2', '11:45', 7, NULL),
    (v_match_id, 'defensex2', '42:30', 18, NULL),
    (v_match_id, 'defensex2', '57:12', 10, NULL),
    (v_match_id, 'steal', '07:02', 4, NULL),
    (v_match_id, 'steal', '19:52', 8, NULL),
    (v_match_id, 'steal', '38:44', 2, NULL),
    (v_match_id, 'steal', '45:18', 10, NULL),
    (v_match_id, 'steal', '58:08', 7, NULL),

    -- duels, provoked sanctions and mistakes
    (v_match_id, '1on1win', '04:55', 1, NULL),
    (v_match_id, '1on1win', '12:18', 13, NULL),
    (v_match_id, '1on1win', '24:10', 8, NULL),
    (v_match_id, '1on1win', '28:08', 5, NULL),
    (v_match_id, '1on1win', '38:20', 17, NULL),
    (v_match_id, '1on1win', '53:05', 2, NULL),
    (v_match_id, '1on1lost', '10:52', 9, NULL),
    (v_match_id, '1on1lost', '24:58', 12, NULL),
    (v_match_id, '1on1lost', '46:08', 12, NULL),
    (v_match_id, '1on1lost', '55:02', 10, NULL),
    (v_match_id, 'provokePenalty', '11:58', 13, NULL),
    (v_match_id, 'provokePenalty', '24:55', 12, NULL),
    (v_match_id, 'provokePenalty', '52:02', 2, NULL),
    (v_match_id, 'provokeTwoMin', '17:20', 5, NULL),
    (v_match_id, 'provokeTwoMin', '41:18', 8, NULL),
    (v_match_id, 'provokeCard', '34:02', 4, NULL),
    (v_match_id, 'provokeCard', '55:10', 17, NULL),
    (v_match_id, 'lostball', '03:22', 8, NULL),
    (v_match_id, 'lostball', '09:58', 4, NULL),
    (v_match_id, 'lostball', '22:44', 5, NULL),
    (v_match_id, 'lostball', '24:58', 12, NULL),
    (v_match_id, 'lostball', '40:28', 13, NULL),
    (v_match_id, 'lostball', '45:39', 12, NULL),
    (v_match_id, 'lostball', '49:41', 9, NULL),
    (v_match_id, 'lostball', '55:04', 10, NULL),
    (v_match_id, 'norebound', '30:06', 7, NULL),
    (v_match_id, 'norebound', '57:25', 18, NULL),

    -- disciplinary (aligned with provoke events and realistic sanctions sequence)
    (v_match_id, 'yellowcard', '16:10', 7, NULL),
    (v_match_id, 'twominutes', '17:22', 12, NULL),
    (v_match_id, 'yellowcard', '43:52', 10, NULL),
    (v_match_id, 'twominutes', '25:55', 12, NULL),
    (v_match_id, 'twominutes', '41:20', 18, NULL),
    (v_match_id, 'penaltymade', '12:05', 11, NULL),
    (v_match_id, 'penaltymade', '25:01', 11, NULL),
    (v_match_id, 'redcard', '55:20', 10, NULL),
    (v_match_id, 'bluecard', '55:22', 10, NULL),
    (v_match_id, 'twominutes', '51:33', 18, NULL),
    (v_match_id, 'penaltymade', '52:05', 11, NULL);

  -- Build player_stats directly from event counts to guarantee consistency.
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
    "provokePenalty",
    "provokeTwoMin",
    "provokeCard",
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
    gkmiss
  )
  SELECT
    v_match_id,
    e.playerid,
    COUNT(*) FILTER (WHERE e.event = 'goal')::int,
    COUNT(*) FILTER (WHERE e.event = 'goal_empty')::int,
    COUNT(*) FILTER (WHERE e.event = 'gkmiss_empty')::int,
    COUNT(*) FILTER (WHERE e.event = 'assistprimary')::int,
    COUNT(*) FILTER (WHERE e.event = 'assistsecondary')::int,
    COUNT(*) FILTER (WHERE e.event = '1on1win')::int,
    COUNT(*) FILTER (WHERE e.event = '1on1lost')::int,
    COUNT(*) FILTER (WHERE e.event = 'provokePenalty')::int,
    COUNT(*) FILTER (WHERE e.event = 'provokeTwoMin')::int,
    COUNT(*) FILTER (WHERE e.event = 'provokeCard')::int,
    COUNT(*) FILTER (WHERE e.event = 'miss')::int,
    COUNT(*) FILTER (WHERE e.event = 'block')::int,
    COUNT(*) FILTER (WHERE e.event = 'norebound')::int,
    COUNT(*) FILTER (WHERE e.event = 'lostball')::int,
    COUNT(*) FILTER (WHERE e.event = 'steal')::int,
    COUNT(*) FILTER (WHERE e.event = 'defense')::int,
    COUNT(*) FILTER (WHERE e.event = 'defensex2')::int,
    COUNT(*) FILTER (WHERE e.event = 'penaltymade')::int,
    COUNT(*) FILTER (WHERE e.event = 'twominutes')::int,
    COUNT(*) FILTER (WHERE e.event = 'yellowcard')::int,
    COUNT(*) FILTER (WHERE e.event = 'redcard')::int,
    COUNT(*) FILTER (WHERE e.event = 'bluecard')::int,
    COUNT(*) FILTER (WHERE e.event = 'gksave')::int,
    COUNT(*) FILTER (WHERE e.event = 'gkmiss')::int
  FROM public.match_event e
  WHERE e.matchid = v_match_id
    AND e.playerid IS NOT NULL
    AND e.event IN (
      'goal', 'goal_empty', 'gkmiss_empty',
      'assistprimary', 'assistsecondary',
      '1on1win', '1on1lost',
      'provokePenalty', 'provokeTwoMin', 'provokeCard',
      'miss', 'block', 'norebound', 'lostball',
      'steal', 'defense', 'defensex2',
      'penaltymade', 'twominutes', 'yellowcard', 'redcard', 'bluecard',
      'gksave', 'gkmiss'
    )
  GROUP BY e.playerid;

END $$;
