import type { H3Event } from 'h3'
import { supabase } from '../../../utils/databaseClient'
import { incrementPlayerStat, incrementShotStats, isShotResult } from '../../../utils/matchEventStats'
import type { ShootingArea, ShootingResult, ShootingTarget, Stats } from '~/types/handball'

type EventMutationBody = {
  matchId: number
  playerId: number
  eventType: Stats
  time: string
  shot?: {
    from?: ShootingArea
    to?: ShootingTarget
    assistPrimary?: number | null
    assistSecondary?: number | null
    mistakePlayer?: number | null
    noRecovery?: boolean
    noRecoveryPlayer?: number | null
    fastbreak?: boolean
    breakthrough?: boolean
  }
}

const timePattern = /^\d{1,2}:[0-5]\d$/

function validateBody(body: EventMutationBody) {
  if (!body?.matchId || !body?.playerId || !body?.eventType || !body?.time) {
    throw createError({ statusCode: 400, statusMessage: 'matchId, playerId, eventType and time are required' })
  }
  if (!timePattern.test(body.time)) {
    throw createError({ statusCode: 400, statusMessage: 'Time must use MM:SS format' })
  }
}

function shouldWriteShot(body: EventMutationBody) {
  return isShotResult(body.eventType) && (body.eventType !== 'block' || Boolean(body.shot))
}

export default defineEventHandler(async (event: H3Event) => {
  const body = await readBody<EventMutationBody>(event)
  validateBody(body)

  let metadata: string | null = null

  if (shouldWriteShot(body)) {
    if (!body.shot?.from || body.shot.to === undefined || body.shot.to === null) {
      throw createError({ statusCode: 400, statusMessage: 'Shot events require shooting area and target' })
    }

    const { data, error } = await supabase
      .from('shots')
      .insert({
        matchid: body.matchId,
        playerid: body.playerId,
        result: body.eventType as ShootingResult,
        time: body.time,
        from: body.shot.from,
        to: body.shot.to,
        assistPrimary: body.shot.assistPrimary ?? null,
        assistSecondary: body.shot.assistSecondary ?? null,
        mistakePlayer: body.shot.mistakePlayer ?? null,
        noRecovery: body.shot.noRecovery ?? false,
        noRecoveryPlayer: body.shot.noRecoveryPlayer ?? null,
        fastbreak: body.shot.fastbreak ?? false,
        breakthrough: body.shot.breakthrough ?? false,
      })
      .select('id')
      .single()

    if (error || !data) {
      throw createError({ statusCode: 400, statusMessage: error?.message || 'Failed to create shot' })
    }
    metadata = String(data.id)
  }

  const { data: matchEvent, error: eventError } = await supabase
    .from('match_event')
    .insert({
      matchid: body.matchId,
      playerid: body.playerId,
      event: body.eventType,
      time: body.time,
      metadata,
    })
    .select()
    .single()

  if (eventError || !matchEvent) {
    throw createError({ statusCode: 400, statusMessage: eventError?.message || 'Failed to create event' })
  }

  if (shouldWriteShot(body)) {
    await incrementShotStats(body.matchId, body.playerId, {
      result: body.eventType as ShootingResult,
      assistPrimary: body.shot?.assistPrimary ?? null,
      assistSecondary: body.shot?.assistSecondary ?? null,
      mistakePlayer: body.shot?.mistakePlayer ?? null,
      noRecoveryPlayer: body.shot?.noRecoveryPlayer ?? null,
    })
  } else {
    await incrementPlayerStat(body.matchId, body.playerId, body.eventType)
  }

  return matchEvent
})
