import type { H3Event } from 'h3'
import { supabase } from '../utils/databaseClient'
import { IncreaseStatBody } from '~/types/dto'

export default defineEventHandler(async (event: H3Event): Promise<void> => {
  const body = await readBody<IncreaseStatBody>(event)

  if (!body?.matchId || !body?.playerId || !body?.statType) {
    throw createError({
      statusCode: 400,
      statusMessage: 'matchId, playerId and field are required'
    })
  }

  // Build dynamic update object
  const { error } = await supabase.rpc('increment_stat', {
    column_name: body.statType,
    matchid: body.matchId,
    playerid: body.playerId,
  })

  
  if (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message
    })
  }
})
