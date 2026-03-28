
// --------------------
// Compute score progression

import type { MatchEvents, ScoreAtMinute } from "~/types/pdf";
import { parseTimeToSeconds } from "./pdf";

// --------------------
export function calculateScoreProgression(events: MatchEvents): ScoreAtMinute[] {
  const scoresByMinute: ScoreAtMinute[] = Array.from({ length: 61 }, (_, minute) => ({
    minute,
    homeScore: 0,
    awayScore: 0,
    difference: 0
  }));

  let homeScore = 0;
  let awayScore = 0;

  // Count every scoring event from both teams
  const scoreEvents = events
    .filter(e =>
      e.event === "goal"
      || e.event === "goal_empty"
      || e.event === "gkmiss"
      || e.event === "gkmiss_empty"
    )
    .map(e => ({
      time: parseTimeToSeconds(e.time),
      team: (e.event === "goal" || e.event === "goal_empty") ? "home" : "away"
    }))
    .sort((a, b) => a.time - b.time);

  // Update scores sequentially
  scoreEvents.forEach(ev => {
    const minute = Math.min(60, Math.floor(ev.time / 60));
    if (ev.team === "home") homeScore++;
    else awayScore++;

    for (let m = minute; m <= 60; m++) {
      scoresByMinute[m]!.homeScore = homeScore;
      scoresByMinute[m]!.awayScore = awayScore;
      scoresByMinute[m]!.difference = homeScore - awayScore;
    }
  });

  return scoresByMinute;
}
