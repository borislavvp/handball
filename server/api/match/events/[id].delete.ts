import type { H3Event } from 'h3'
import { supabase } from '../../../utils/databaseClient'
import { decrementPlayerStat, decrementShotStats, parseShotId } from '../../../utils/matchEventStats'

export default defineEventHandler(async (event: H3Event) => {
  const eventId = Number(getRouterParam(event, 'id'))

  if (!eventId || Number.isNaN(eventId)) {
    throw createError({ statusCode: 400, statusMessage: 'Event id is required' })
  }

  const { data: existing, error: existingError } = await supabase
    .from('match_event')
    .select('*')
    .eq('id', eventId)
    .single()

  if (existingError || !existing) {
    throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  }

  const shotId = parseShotId(existing.metadata)
  let shot: any = null
  if (shotId) {
    const { data: existingShot, error: shotFetchError } = await supabase
      .from('shots')
      .select('*')
      .eq('id', shotId)
      .maybeSingle()
    if (shotFetchError) throw createError({ statusCode: 400, statusMessage: shotFetchError.message })
    shot = existingShot

    const { error: shotDeleteError } = await supabase.from('shots').delete().eq('id', shotId)
    if (shotDeleteError) throw createError({ statusCode: 400, statusMessage: shotDeleteError.message })
  }

  const { error: deleteError } = await supabase.from('match_event').delete().eq('id', eventId)
  if (deleteError) {
    throw createError({ statusCode: 400, statusMessage: deleteError.message })
  }

  if (shot) {
    await decrementShotStats(existing.matchid, shot.playerid, {
      result: shot.result,
      assistPrimary: shot.assistPrimary ?? null,
      assistSecondary: shot.assistSecondary ?? null,
    })
  } else {
    await decrementPlayerStat(existing.matchid, existing.playerid, existing.event)
  }

  return { ok: true }
})
