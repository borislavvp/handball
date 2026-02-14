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

  -- Core match state timeline
  INSERT INTO public.match_event (matchid, event, time, playerid, metadata)
  VALUES
    (v_match_id, 'playing', '00:00', NULL, 'true'),
    (v_match_id, 'defense_change', '00:00', NULL, '6:0'),
    (v_match_id, 'opponent_defense_change', '00:00', NULL, '6:0'),
    (v_match_id, 'empty_goal_home', '24:18', NULL, 'true'),
    (v_match_id, 'empty_goal_home', '26:02', NULL, 'false'),
    (v_match_id, 'timeout_home', '18:40', NULL, 'china timeout #1'),
    (v_match_id, 'timeout_away', '22:11', NULL, 'france timeout #1'),
    (v_match_id, 'defense_change', '31:10', NULL, '5:1'),
    (v_match_id, 'opponent_defense_change', '33:24', NULL, '5:1'),
    (v_match_id, 'timeout_home', '47:52', NULL, 'china timeout #2'),
    (v_match_id, 'timeout_away', '54:10', NULL, 'france timeout #2'),
    (v_match_id, 'playing', '60:00', NULL, 'false');

  -- China shot-by-shot log (36 attempts, 29 goals)
  WITH shots_data AS (
    SELECT *
    FROM (VALUES
      ('00:48', 2,  'LB9', 2,  'goal',   8,  NULL, FALSE, FALSE, NULL),
      ('01:31', 5,  'RB9', 9,  'goal',   8,  2,    FALSE, FALSE, NULL),
      ('02:44', 7,  'CB6', 7,  'goal',   4,  NULL, FALSE, TRUE,  NULL),
      ('04:12', 1,  'LW',  1,  'goal',   8,  NULL, TRUE,  FALSE, NULL),
      ('05:06', 9,  'RB9', 3,  'gksave', 4,  NULL, FALSE, FALSE, NULL),
      ('06:33', 12, 'LB9', 1,  'goal',   8,  NULL, FALSE, FALSE, NULL),
      ('07:25', 6,  'RW',  9,  'goal',   5,  NULL, TRUE,  FALSE, NULL),
      ('08:52', 8,  'CB9', 2,  'goal',   2,  NULL, FALSE, FALSE, NULL),
      ('10:18', 4,  'CB9', 3,  'miss',   NULL, NULL, FALSE, FALSE, NULL),
      ('11:02', 13, 'RB6', 7,  'goal',   8,  2,    FALSE, TRUE,  NULL),
      ('12:40', 2,  'LB6', 4,  'goal',   8,  NULL, FALSE, TRUE,  NULL),
      ('13:30', 10, 'CB6', 5,  'block',  4,  NULL, FALSE, TRUE,  NULL),
      ('14:22', 16, 'LW',  7,  'goal',   8,  NULL, TRUE,  FALSE, NULL),
      ('15:37', 5,  'RB9', 1,  'goal',   8,  2,    FALSE, FALSE, NULL),
      ('16:50', 8,  'CB9', 6,  'goal',   4,  NULL, FALSE, FALSE, NULL),
      ('17:56', 14, 'RW',  3,  'goal',   5,  NULL, TRUE,  FALSE, NULL),
      ('19:10', 7,  'CB6', 8,  'goal',   4,  NULL, FALSE, TRUE,  NULL),
      ('20:35', 2,  'LB9', 2,  'goal',   8,  NULL, FALSE, FALSE, NULL),
      ('21:48', 9,  'RB9', 10, 'miss',   8,  NULL, FALSE, FALSE, NULL),
      ('23:04', 1,  'LW',  7,  'goal',   8,  NULL, TRUE,  FALSE, NULL),
      ('24:36', 8,  'CB9', 5,  'goal',   2,  NULL, FALSE, FALSE, NULL),
      ('25:20', 12, 'LB9', 11, 'miss',   8,  NULL, FALSE, FALSE, NULL),
      ('27:08', 5,  'RB9', 3,  'goal',   8,  2,    FALSE, FALSE, NULL),
      ('29:10', 7,  'CB6', 4,  'goal',   4,  NULL, FALSE, TRUE,  NULL),
      ('31:45', 2,  'LB9', 1,  'goal',   8,  NULL, FALSE, FALSE, NULL),
      ('33:12', 13, 'RB9', 6,  'goal',   8,  NULL, FALSE, FALSE, NULL),
      ('34:40', 6,  'RW',  8,  'goal',   5,  NULL, TRUE,  FALSE, NULL),
      ('36:05', 4,  'CB9', 5,  'goal',   8,  2,    FALSE, FALSE, NULL),
      ('37:22', 8,  'CB6', 9,  'goal',   4,  NULL, FALSE, TRUE,  NULL),
      ('39:14', 9,  'RB6', 3,  'block',  8,  NULL, FALSE, TRUE,  NULL),
      ('41:03', 17, 'CB9', 2,  'goal',   8,  NULL, FALSE, FALSE, NULL),
      ('43:27', 18, 'CB6', 7,  'goal',   4,  NULL, FALSE, TRUE,  NULL),
      ('45:41', 5,  'RB9', 1,  'gksave', 8,  NULL, FALSE, FALSE, NULL),
      ('48:30', 15, 'RW',  9,  'goal',   8,  NULL, TRUE,  FALSE, NULL),
      ('52:24', 19, 'RB9', 10, 'goal',   8,  NULL, FALSE, FALSE, NULL),
      ('56:02', 2,  'LB9', 2,  'goal',   8,  NULL, FALSE, FALSE, NULL)
    ) AS t(time, playerid, "from", "to", result, "assistPrimary", "assistSecondary", fastbreak, breakthrough, "mistakePlayer")
  ),
  inserted_shots AS (
    INSERT INTO public.shots (
      matchid, playerid, "from", "to", result, time,
      "assistPrimary", "assistSecondary", fastbreak, breakthrough, "mistakePlayer"
    )
    SELECT
      v_match_id, playerid, "from", "to", result, time,
      "assistPrimary", "assistSecondary", fastbreak, breakthrough, "mistakePlayer"
    FROM shots_data
    RETURNING id, matchid, playerid, result, time
  )
  INSERT INTO public.match_event (matchid, event, time, playerid, metadata)
  SELECT matchid, result, time, playerid, id::text
  FROM inserted_shots;

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
    (v_match_id, 'assistprimary', '12:40', 8, NULL),
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
    (v_match_id, 'assistprimary', '24:36', 2, NULL),
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
    (v_match_id, 'assistprimary', '41:03', 8, NULL),
    (v_match_id, 'assistprimary', '43:27', 4, NULL),
    (v_match_id, 'assistprimary', '45:41', 8, NULL),
    (v_match_id, 'assistprimary', '48:30', 8, NULL),
    (v_match_id, 'assistprimary', '52:24', 8, NULL),
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
    (v_match_id, 'defense', '44:15', 7, NULL),
    (v_match_id, 'defense', '50:11', 10, NULL),
    (v_match_id, 'defensex2', '11:45', 7, NULL),
    (v_match_id, 'defensex2', '42:30', 18, NULL),
    (v_match_id, 'steal', '07:02', 4, NULL),
    (v_match_id, 'steal', '19:52', 8, NULL),
    (v_match_id, 'steal', '38:44', 2, NULL),

    -- duels, provoked sanctions and mistakes
    (v_match_id, '1on1win', '12:18', 13, NULL),
    (v_match_id, '1on1win', '28:08', 5, NULL),
    (v_match_id, '1on1win', '53:05', 2, NULL),
    (v_match_id, '1on1lost', '10:52', 9, NULL),
    (v_match_id, '1on1lost', '46:08', 12, NULL),
    (v_match_id, 'provokePenalty', '11:58', 13, NULL),
    (v_match_id, 'provokePenalty', '52:02', 2, NULL),
    (v_match_id, 'provokeTwoMin', '17:20', 5, NULL),
    (v_match_id, 'provokeCard', '34:02', 4, NULL),
    (v_match_id, 'lostball', '03:22', 8, NULL),
    (v_match_id, 'lostball', '09:58', 4, NULL),
    (v_match_id, 'lostball', '22:44', 5, NULL),
    (v_match_id, 'lostball', '40:28', 13, NULL),
    (v_match_id, 'lostball', '49:41', 9, NULL),
    (v_match_id, 'norebound', '30:06', 7, NULL),

    -- disciplinary
    (v_match_id, 'yellowcard', '16:10', 7, NULL),
    (v_match_id, 'yellowcard', '43:52', 10, NULL),
    (v_match_id, 'twominutes', '25:55', 12, NULL),
    (v_match_id, 'twominutes', '51:33', 18, NULL),
    (v_match_id, 'penaltymade', '52:05', 11, NULL),

    -- goalkeeper workload vs France shooting
    (v_match_id, 'gksave', '01:10', 11, NULL),
    (v_match_id, 'gkmiss', '02:05', 11, NULL),
    (v_match_id, 'gkmiss', '03:11', 11, NULL),
    (v_match_id, 'gksave', '04:34', 11, NULL),
    (v_match_id, 'gkmiss', '05:48', 11, NULL),
    (v_match_id, 'gkmiss', '06:50', 11, NULL),
    (v_match_id, 'gkmiss', '08:08', 11, NULL),
    (v_match_id, 'gksave', '09:40', 11, NULL),
    (v_match_id, 'gkmiss', '10:44', 11, NULL),
    (v_match_id, 'gkmiss', '12:01', 11, NULL),
    (v_match_id, 'gkmiss', '13:09', 11, NULL),
    (v_match_id, 'gksave', '14:31', 11, NULL),
    (v_match_id, 'gkmiss', '15:54', 11, NULL),
    (v_match_id, 'gkmiss', '17:02', 11, NULL),
    (v_match_id, 'gksave', '18:27', 11, NULL),
    (v_match_id, 'gkmiss', '19:49', 11, NULL),
    (v_match_id, 'gksave', '21:06', 11, NULL),
    (v_match_id, 'gkmiss', '22:36', 11, NULL),
    (v_match_id, 'gkmiss', '23:58', 11, NULL),
    (v_match_id, 'gkmiss', '25:12', 11, NULL),
    (v_match_id, 'gksave', '26:40', 11, NULL),
    (v_match_id, 'gkmiss', '27:59', 11, NULL),
    (v_match_id, 'gksave', '29:21', 11, NULL),
    (v_match_id, 'gkmiss', '30:50', 11, NULL),
    (v_match_id, 'gkmiss', '32:16', 11, NULL),
    (v_match_id, 'gkmiss', '33:47', 11, NULL),
    (v_match_id, 'gksave', '35:05', 11, NULL),
    (v_match_id, 'gkmiss', '36:29', 11, NULL),
    (v_match_id, 'gkmiss', '37:46', 11, NULL),
    (v_match_id, 'gksave', '39:03', 11, NULL),
    (v_match_id, 'gkmiss', '40:22', 11, NULL),
    (v_match_id, 'gkmiss', '41:47', 11, NULL),
    (v_match_id, 'gkmiss', '43:15', 11, NULL),
    (v_match_id, 'gksave', '44:43', 11, NULL),
    (v_match_id, 'gkmiss', '46:05', 11, NULL),
    (v_match_id, 'gkmiss', '47:34', 11, NULL),
    (v_match_id, 'gkmiss', '48:59', 11, NULL),
    (v_match_id, 'gksave', '50:17', 11, NULL),
    (v_match_id, 'gkmiss', '51:49', 11, NULL),
    (v_match_id, 'gkmiss', '53:12', 11, NULL),
    (v_match_id, 'gkmiss', '54:45', 11, NULL),
    (v_match_id, 'gksave', '56:10', 11, NULL),
    (v_match_id, 'gkmiss', '57:28', 11, NULL),
    (v_match_id, 'gkmiss', '58:44', 11, NULL),
    (v_match_id, 'gkmiss', '59:39', 11, NULL);

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
