import { useState } from 'nuxt/app';
import { watch } from 'vue';
import type { Match, MatchLineup, Orientation, Player, Position, Team, DefensePosKey } from '../types/handball';

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

const defaultLineup = (): MatchLineup => (
  { LW: null, LB: null, CB: null, RB: null, RW: null, PV: null,PV2: null, GK: null, 
    D1: null, D2: null, D3: null, D4: null, D5: null, D6: null });

export function useHandballStore() {
  const teams = useState<Team[]>('teams', () => [] as Team[]);
  const matches = useState<Match[]>('matches', () => []);
  const orientation = useState<Orientation>('orientation', () => 'vertical');
  // Per-team custom position layouts: { [teamId]: { [position]: { x: number; y: number } } }
  const teamPositionLayouts = useState<Record<string, Record<string, { x: number; y: number }>>>('teamPositionLayouts', () => ({}));

  // Ensure arrays are initialized with proper defaults
  if (!teams.value) {
    teams.value = [];
  }
  if (!matches.value) {
    matches.value = [];
  }
  if (!orientation.value) {
    orientation.value = 'vertical';
  }

  // Hydrate saved layouts from localStorage
  if (process.client) {
    const raw = localStorage.getItem('teamPositionLayouts');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          teamPositionLayouts.value = parsed;
        }
      } catch {}
    }
    // Persist on change
    watch(teamPositionLayouts, (v) => {
      try { localStorage.setItem('teamPositionLayouts', JSON.stringify(v || {})); } catch {}
    }, { deep: true });
  }

  function setOrientation(value: Orientation) {
    orientation.value = value;
  }

  function addTeam(name: string): Team {
    const team: Team = { id: generateId('team'), name, players: [], defaults: {}};
    teams.value.push(team);
    return team;
  }

  function updateTeamName(teamId: string, name: string) {
    const t = teams.value.find(t => t.id === teamId);
    if (t) t.name = name;
  }

  function removeTeam(teamId: string) {
    const idx = teams.value.findIndex(t => t.id === teamId);
    if (idx !== -1) teams.value.splice(idx, 1);
    // also remove matches of this team
    matches.value = matches.value.filter(m => m.teamId !== teamId);
  }

  function addPlayer(teamId: string, name: string, position: Position["key"], number: number = 0): Player | null {
    const t = teams.value.find(t => t.id === teamId);
    if (!t) return null;
    const p: Player = { id: generateId('player'), name, number, position };
    t.players.push(p);
    return p;
  }

  function removePlayer(teamId: string, playerId: string) {
    const t = teams.value.find(t => t.id === teamId);
    if (!t) return;
    t.players = t.players.filter(p => p.id !== playerId);
    // remove from any lineup
    matches.value.forEach(m => {
      if (m.teamId !== teamId) return;
      (Object.keys(m.lineup) as (keyof MatchLineup)[]).forEach(pos => {
        if (m.lineup[pos] === playerId) m.lineup[pos] = null;
      });
    });
  }

  function createMatch(name: string, teamId: string): Match | null {
    const t = teams.value.find(t => t.id === teamId);
    if (!t) return null;
    const match: Match = { id: generateId('match'), name, teamId, lineup: defaultLineup(), createdAt: Date.now() };
    // Initialize lineup from team defaults if present
    if (t.defaults) {
      (Object.keys(match.lineup) as (keyof MatchLineup)[]).forEach(pos => {
        const pid = (t.defaults as any)[pos];
        if (pid) (match.lineup as any)[pos] = pid;
      });
    }
    matches.value.push(match);
    return match;
  }

  function assignPlayer(matchId: string, position: Position, playerId: string | null) {
    const m = matches.value.find(m => m.id === matchId);
    if (!m) return;
    // clear position if playerId is null
    if (playerId === null) {
      m.lineup[position.key] = null;
      return;
    }
    // ensure player is from team
    const t = teams.value.find(t => t.id === m.teamId);
    const valid = t?.players.some(p => p.id === playerId);
    if (!valid) return;
    m.lineup[position.key] = playerId;
  }

  function getTeam(teamId: string) {
    return teams.value.find(t => t.id === teamId) || null;
  }

  function getMatch(matchId: string) {
    return matches.value.find(m => m.id === matchId) || null;
  }

  function setTeamDefault(teamId: string, position: Position["key"], playerId: string | null) {
    const t = teams.value.find(t => t.id === teamId);
    if (!t) return;
    if (!t.defaults) t.defaults = {};
    t.defaults[position] = playerId;
  }

  function getTeamPositionLayouts(teamId: string): Record<string, { x: number; y: number }> {
    return teamPositionLayouts.value?.[teamId] || {};
  }

  function setTeamPosition(teamId: string, positionKey: Position["key"] | string, coords: { x: number; y: number }) {
    if (!teamPositionLayouts.value[teamId]) teamPositionLayouts.value[teamId] = {};
    teamPositionLayouts.value[teamId][positionKey] = { x: coords.x, y: coords.y };
  }

  return {
    teams,
    matches,
    orientation,
    setOrientation,
    addTeam,
    updateTeamName,
    removeTeam,
    addPlayer,
    removePlayer,
    createMatch,
    setTeamDefault,
    assignPlayer,
    getTeam,
    getMatch,
    getTeamPositionLayouts,
    setTeamPosition,
  };
}


