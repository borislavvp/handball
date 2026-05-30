import type { H3Event } from 'h3'
import { supabase } from '../../../utils/databaseClient'
import {
  decrementPlayerStat,
  decrementShotStats,
  incrementPlayerStat,
  incrementShotStats,
  isShotResult,
  parseShotId,
} from '../../../utils/matchEventStats'
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
  if (shouldWriteShot(body) && (!body.shot?.from || body.shot.to === undefined || body.shot.to === null)) {
    throw createError({ statusCode: 400, statusMessage: 'Shot events require shooting area and target' })
  }
}

function shouldWriteShot(body: EventMutationBody) {
  return isShotResult(body.eventType) && (body.eventType !== 'block' || Boolean(body.shot))
}

export default defineEventHandler(async (event: H3Event) => {
  const eventId = Number(getRouterParam(event, 'id'))
  const body = await readBody<EventMutationBody>(event)

  if (!eventId || Number.isNaN(eventId)) {
    throw createError({ statusCode: 400, statusMessage: 'Event id is required' })
  }
  validateBody(body)

  const { data: existing, error: existingError } = await supabase
    .from('match_event')
    .select('*')
    .eq('id', eventId)
    .single()

  if (existingError || !existing) {
    throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  }

  const previousShotId = parseShotId(existing.metadata)
  let previousShot: any = null
  let metadata: string | null = null

  if (previousShotId) {
    const { data: shot, error: shotFetchError } = await supabase
      .from('shots')
      .select('*')
      .eq('id', previousShotId)
      .maybeSingle()
    if (shotFetchError) throw createError({ statusCode: 400, statusMessage: shotFetchError.message })
    previousShot = shot
  }

  if (shouldWriteShot(body)) {
    const shotPayload = {
      matchid: body.matchId,
      playerid: body.playerId,
      result: body.eventType as ShootingResult,
      time: body.time,
      from: body.shot!.from as ShootingArea,
      to: body.shot!.to as ShootingTarget,
      assistPrimary: body.shot!.assistPrimary ?? null,
      assistSecondary: body.shot!.assistSecondary ?? null,
      mistakePlayer: body.shot!.mistakePlayer ?? null,
      fastbreak: body.shot!.fastbreak ?? false,
      breakthrough: body.shot!.breakthrough ?? false,
    }

    if (previousShotId) {
      const { error: shotError } = await supabase
        .from('shots')
        .update(shotPayload)
        .eq('id', previousShotId)
      if (shotError) throw createError({ statusCode: 400, statusMessage: shotError.message })
      metadata = String(previousShotId)
    } else {
      const { data: shot, error: shotError } = await supabase
        .from('shots')
        .insert(shotPayload)
        .select('id')
        .single()
      if (shotError || !shot) {
        throw createError({ statusCode: 400, statusMessage: shotError?.message || 'Failed to create shot' })
      }
      metadata = String(shot.id)
    }
  } else if (previousShotId) {
    const { error: shotDeleteError } = await supabase.from('shots').delete().eq('id', previousShotId)
    if (shotDeleteError) throw createError({ statusCode: 400, statusMessage: shotDeleteError.message })
  }

  const { data: updated, error: updateError } = await supabase
    .from('match_event')
    .update({
      matchid: body.matchId,
      playerid: body.playerId,
      event: body.eventType,
      time: body.time,
      metadata,
    })
    .eq('id', eventId)
    .select()
    .single()

  if (updateError || !updated) {
    throw createError({ statusCode: 400, statusMessage: updateError?.message || 'Failed to update event' })
  }

  if (previousShot) {
    await decrementShotStats(existing.matchid, previousShot.playerid, {
      result: previousShot.result,
      assistPrimary: previousShot.assistPrimary ?? null,
      assistSecondary: previousShot.assistSecondary ?? null,
    })
  } else {
    await decrementPlayerStat(existing.matchid, existing.playerid, existing.event)
  }

  if (shouldWriteShot(body)) {
    await incrementShotStats(body.matchId, body.playerId, {
      result: body.eventType as ShootingResult,
      assistPrimary: body.shot?.assistPrimary ?? null,
      assistSecondary: body.shot?.assistSecondary ?? null,
    })
  } else {
    await incrementPlayerStat(body.matchId, body.playerId, body.eventType)
  }

  return updated
})
