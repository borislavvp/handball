import type {  MatchEventBody } from '~/types/dto'
import { supabase } from '../../utils/databaseClient'

export default defineEventHandler(async (event): Promise<void> => {
  try {

    const body = await readBody<MatchEventBody>(event)

    if (!body?.eventType || !body.matchId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event type and match id are required'
      })
    }
  
    await supabase
      .from("match_event")
      .insert({
        matchid: body.matchId,
        event: body.eventType,
        time: body.time,
        playerid: body.playerId ?? null,
        metadata: body.metadata 
      })

  }catch{
    throw createError({ statusCode: 400, statusMessage: "ERROR"})
  }

})
