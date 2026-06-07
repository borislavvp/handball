import { supabase } from './databaseClient'
import type { ShootingResult, Stats } from '~/types/handball'

export const shotResultStats = [
  'goal',
  'miss',
  'block',
  'gksave',
  'gkmiss',
  'goal_empty',
  'gkmiss_empty',
] as const satisfies readonly Stats[]

const statColumns = [
  '1on1lost',
  '1on1win',
  'goal',
  'gkmiss_empty',
  'goal_empty',
  'defense',
  'assistprimary',
  'assistsecondary',
  'defensex2',
  'steal',
  'twominutes',
  'yellowcard',
  'redcard',
  'bluecard',
  'penaltymade',
  'miss',
  'lostball',
  'gkmiss',
  'gksave',
  'provokePenalty',
  'provokeTwoMin',
  'provokeCard',
  'block',
  'norebound',
] as const satisfies readonly Stats[]

const shotResultSet = new Set<string>(shotResultStats)
const statColumnSet = new Set<string>(statColumns)

type PlayerStatsRow = Partial<Record<Stats, number>> & {
  matchid: number
  playerid: number
}

type ShotStats = {
  result: ShootingResult
  assistPrimary?: number | null
  assistSecondary?: number | null
  mistakePlayer?: number | null
  noRecoveryPlayer?: number | null
}

function emptyStats() {
  return Object.fromEntries(statColumns.map((column) => [column, 0])) as Record<Stats, number>
}

export function isShotResult(eventType: string): eventType is ShootingResult {
  return shotResultSet.has(eventType)
}

export function isStatColumn(eventType: string): eventType is Stats {
  return statColumnSet.has(eventType)
}

export function parseShotId(metadata: string | null) {
  if (!metadata) return null
  const id = Number(metadata)
  return Number.isInteger(id) && id > 0 ? id : null
}

async function fetchPlayerStats(matchId: number, playerId: number) {
  const { data, error } = await supabase
    .from('player_stats')
    .select('*')
    .eq('matchid', matchId)
    .eq('playerid', playerId)
    .maybeSingle()

  if (error) throw error
  return data as PlayerStatsRow | null
}

export async function incrementPlayerStat(matchId: number, playerId: number | null | undefined, stat: string | null | undefined) {
  if (!playerId || !stat || !isStatColumn(stat)) return

  const existing = await fetchPlayerStats(matchId, playerId)
  if (!existing) {
    const { error } = await supabase
      .from('player_stats')
      .insert({
        matchid: matchId,
        playerid: playerId,
        ...emptyStats(),
        [stat]: 1,
      })
    if (error) throw error
    return
  }

  const { error } = await supabase
    .from('player_stats')
    .update({ [stat]: (existing[stat] ?? 0) + 1 } as any)
    .eq('matchid', matchId)
    .eq('playerid', playerId)
  if (error) throw error
}

export async function decrementPlayerStat(matchId: number, playerId: number | null | undefined, stat: string | null | undefined) {
  if (!playerId || !stat || !isStatColumn(stat)) return

  const existing = await fetchPlayerStats(matchId, playerId)
  if (!existing) return

  const { error } = await supabase
    .from('player_stats')
    .update({ [stat]: Math.max((existing[stat] ?? 0) - 1, 0) }as any )
    .eq('matchid', matchId)
    .eq('playerid', playerId)
  if (error) throw error
}

export async function incrementShotStats(matchId: number, playerId: number, shot: ShotStats) {
  await incrementPlayerStat(matchId, playerId, shot.result)
  await incrementPlayerStat(matchId, shot.assistPrimary, 'assistprimary')
  await incrementPlayerStat(matchId, shot.assistSecondary, 'assistsecondary')
  await incrementPlayerStat(matchId, shot.mistakePlayer, '1on1lost')
  await incrementPlayerStat(matchId, shot.noRecoveryPlayer, 'norebound')
}

export async function decrementShotStats(matchId: number, playerId: number, shot: ShotStats) {
  await decrementPlayerStat(matchId, playerId, shot.result)
  await decrementPlayerStat(matchId, shot.assistPrimary, 'assistprimary')
  await decrementPlayerStat(matchId, shot.assistSecondary, 'assistsecondary')
  await decrementPlayerStat(matchId, shot.mistakePlayer, '1on1lost')
  await decrementPlayerStat(matchId, shot.noRecoveryPlayer, 'norebound')
}
