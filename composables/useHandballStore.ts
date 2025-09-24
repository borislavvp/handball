import { useState } from 'nuxt/app';
import { provide, inject, watch } from 'vue';
import type { Match, MatchLineup, Orientation, Player, PlayerStats, Position, Stats, Team } from '../types/handball';
import type { CreatePlayerBody, LineupChangeBody } from "../types/dto"

    
export function createHandballStore() {
  const loading = useState<boolean>('store_loading', () => true);
  const teams = useState<Team[]>('teams', () => [] as Team[]);
  const matches = useState<Match[]>('matches', () => []);
  const orientation = useState<Orientation>('orientation', () => 'vertical');
  // Per-team custom position layouts: { [teamId]: { [position]: { x: number; y: number } } }
  const teamPositionLayouts = useState<Record<string, Record<string, { x: number; y: number }>>>('teamPositionLayouts', () => ({}));
  const selectedTeamId = ref<number | undefined | null>(null);
  const selectedTeam = computed(() => teams.value?.find(t => t.id === selectedTeamId.value) || null);
  const currentMatch = ref<Match | null>(null);
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

  async function fetchTeams(): Promise<void> {
    const { $supabase } = useNuxtApp()
    try{
      loading.value = true
      const { data: teamData, error:err1 } = await $supabase.from('team').select(`
          id,
          name,
          player (
            id,
            name,
            number,
            position,
            player_stats (
              baddefense,
              badpass,
              goal,
              gooddefense,
              goodpass,
              intercept,
              lostball,
              miss,
              penaltymade,
              penaltyscored,
              safe,
              twominutes,
              yellowcard,
              redcard,
              match (
                id,
                opponent,
                result,
                createdat
              )
            )
          )`
      )
      
      if (!teamData || teamData.length == 0 ){
        loading.value = false;
        return;
      }
      const { data: lineupData, error: err2 } = await $supabase.from('lineup').select(`
        id,
        teamid,
        lw,
        lb,
        cb,
        rb,
        rw,
        pv,
        pv2,
        d1,
        d2,
        d3,
        d4,
        d5,
        d6,
        gk
      `)
      .eq('teamid', teamData[0]!.id)

      
      if (err1 || err2) {
        loading.value = false;
        throw createError({ statusCode: 500, message: "error.message" })
      }

      if(lineupData.length === 0){
        await $supabase
        .from('lineup')
        .insert([{ teamid: teamData[0]?.id }])
      }
      teams.value = teamData.map(t => ({
        id: t.id,
        name: t.name,
        players: t.player.map( p => ({
          ...p,
          stats: p.player_stats,
        })).sort((a,b) => a.number - b.number),
        lineups:  lineupData.map(l => ({
          id:l.id,
          CB: l.cb,
          LW: l.lw,
          LB: l.lb,
          RW: l.rw,
          RB: l.rb,
          PV: l.pv,
          PV2: l.pv2,
          D1: l.d1,
          D2: l.d2,
          D3: l.d3,
          D4: l.d4,
          D5: l.d5,
          D6: l.d6,
          GK: l.gk
        }))
      } as Team));
      selectedTeamId.value = teamData[0]?.id;
      loading.value = false;

    }catch(err){
      loading.value = false;
    }
  }

  async function addTeam(name: string): Promise<Team | null> {
    try{
      loading.value = true;
      const teamId = await $fetch('/api/teams', {
        method: 'POST',
        body: { name: name }
      })
      const team: Team = { id: teamId, name, players: [], lineups: []};
      
      teams.value.push(team);
      loading.value = false;
      return team;
    }catch(err){
      loading.value = false;
      return null;
    }
  }


  function removeTeam(teamId: number) {
    const idx = teams.value.findIndex(t => t.id === teamId);
    if (idx !== -1) teams.value.splice(idx, 1);
    // also remove matches of this team
    matches.value = matches.value.filter(m => m.teamid !== teamId);
  }

  async function getPlayerStats(playerId: number): Promise<PlayerStats[]>{
    const { $supabase } = useNuxtApp()
    loading.value = true;
    const {data, error} = await $supabase.from('player_stats').select(`
      goal,
      miss,
      goodpass,
      badpass,
      safe,
      gooddefense,
      baddefense,
      penaltymade,
      penaltyscored,
      intercept,
      lostball,
      twominutes,
      yellowcard,
      redcard,
      match (
        id,
        opponent,
        result,
        createdat
      )
    `).eq('playerid', playerId)
    if (error){
      return [];
    }
    const p: PlayerStats[] = data;
    loading.value = false;
    return p;
  }

  async function addPlayer(name: string, position: Position["key"], number: number): Promise<Player | null> {
    if (!selectedTeam) return null;
    loading.value = true;
    const playerId = await $fetch('/api/player', {
      method: 'POST',
      body: { name, number, position, teamId:selectedTeamId.value } as CreatePlayerBody
    })
    const p: Player = { id: playerId, name, number, position, stats:[] };
    selectedTeam.value?.players.push(p);
    loading.value = false;
    return p;
  }

  function getPlayer(playerId:number){
    const p = selectedTeam.value?.players.find(p => p.id === playerId);
    return p;
  }

  async function updatePlayer(data:Record<string, any>,playerId:number){
    await $fetch(`/api/player/${playerId}`, {
      method: 'PUT',
      body: data
    })
  }

  function removePlayer(teamId: number, playerId: number) {
    const t = teams.value.find(t => t.id === teamId);
    if (!t) return;

    t.players = t.players.filter(p => p.id !== playerId);
  }

  function initPlayerStats(match:Match){
    return {
      baddefense: 0,
      goal: 0,
      gooddefense: 0,
      goodpass: 0,
      badpass: 0,
      intercept: 0,
      twominutes: 0,
      redcard: 0,
      yellowcard: 0,
      penaltymade: 0,
      penaltyscored: 0,
      miss: 0,
      safe: 0,
      lostball: 0,
      match:{
        id: match.id,
        result: match.result,
        createdat: match.createdat,
        opponent: match.opponent
      }
    } as PlayerStats
  }

  async function createMatch(opponent: string): Promise<Match | null> {
    const matchId = await $fetch('/api/matches', {
      method: 'POST',
      body: { opponent: opponent, teamId: selectedTeamId.value, }
    })
    const match: Match = { 
      id:matchId , opponent, teamid:selectedTeamId.value!,
      lineup: selectedTeam.value?.lineups[0]!, createdat: Date.now().toString(), result: null};
    const lineup = selectedTeam.value?.lineups[0]!

    type LineupKey = keyof typeof lineup;
    (Object.keys(lineup ) as LineupKey[]).forEach(l => {
      if(l !== "id"){
        const p = getPlayer(lineup[l]!)
        p?.stats.push(initPlayerStats(match))
      }
    })
    matches.value.push(match);
    currentMatch.value = match;
    return match;
  }

  function changePlayer(matchId: number, position: Position, playerId: number) {
    const m = matches.value.find(m => m.id === matchId);
    if (!m) return;
    m.lineup[position.key] = playerId;
    $fetch('/api/stats', {
      method: 'POST',
      body: { matchId: matchId, playerId: playerId }
    })
  }

  function increasePlayerStat(player: Player,stat:Stats){
    if(!player.stats.length){
        player.stats.splice(0, 0, initPlayerStats(currentMatch.value!));
        $fetch('/api/stats', {
          method: 'POST',
          body: { matchId: currentMatch.value?.id, playerId: player.id }
        })
    }
    const pStats = player!.stats[player.stats.length-1]
    pStats![stat] += 1;
    $fetch('/api/stats', {
      method: 'PUT',
      body: { matchId: currentMatch.value?.id, playerId: player.id, statType: stat }
    })
  }

  function getTeam(teamId: number) {
    return teams.value.find(t => t.id === teamId) || null;
  }

  function endCurrentMatch(result: "WIN" | "LOST"){
    if(currentMatch.value){
      currentMatch.value.result = result;
      $fetch('/api/match', {
        method: 'PUT',
        body: { matchId: currentMatch.value?.id, result }
      })
      currentMatch.value = null;
    }
  }

  async function fetchMatches() {
    const { $supabase } = useNuxtApp()
    loading.value = true;
    const {data, error} = await $supabase.from('match').select("*").eq('teamid', selectedTeamId.value!)
    if (error){
    }
    matches.value = data!.map(m => {
      const match = {
        ...m,
        lineup:{} as any
      }
      if(!m.result){
        currentMatch.value = match;
      }
      return match
  });
    loading.value = false;
  }
  function getMatch(matchId: number) {
    return matches.value.find(m => m.id === matchId) || null;
  }

  function saveLineup(lineupId:number,position: Position["key"], playerId: number){
    $fetch('/api/lineup', {
      method: 'POST',
      body: { lineupId, teamId:selectedTeam.value?.id,playerId,position } as LineupChangeBody
    })
  }

  function changeLineup(position: Position["key"], playerId: number) {
    const lineupId = 0;
    if (!selectedTeam.value) return;
    selectedTeam.value.lineups[lineupId]![position] = playerId;
    saveLineup(selectedTeam.value.lineups[lineupId]!.id,position,playerId);
  }

  function getTeamPositionLayouts(teamId: number): Record<string, { x: number; y: number }> {
    return teamPositionLayouts.value?.[teamId] || {};
  }

  function setTeamPosition(teamId: number, positionKey: Position["key"] | string, coords: { x: number; y: number }) {
    if (!teamPositionLayouts.value[teamId]) teamPositionLayouts.value[teamId] = {};
    teamPositionLayouts.value[teamId][positionKey] = { x: coords.x, y: coords.y };
  }

  const initialize = async () => {
    await fetchTeams();
    await fetchMatches();
  }

  return {
    loading,
    teams,
    matches,
    orientation,
    selectedTeam,
    currentMatch,
    initialize,
    setOrientation,
    addTeam,
    removeTeam,
    addPlayer,
    removePlayer,
    createMatch,
    fetchTeams,
    fetchMatches,
    changeLineup,
    changePlayer,
    updatePlayer,
    increasePlayerStat,
    getTeam,
    getMatch,
    endCurrentMatch,
    getPlayerStats,
    getTeamPositionLayouts,
    setTeamPosition,
  };
}


export const provideHandballStore = (store: ReturnType<typeof createHandballStore>) => {
  provide('handballStore', store)
}

export const useHandballStore = () => {
  return inject("handballStore") as ReturnType<typeof createHandballStore>
}