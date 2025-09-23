import { createClient } from '@supabase/supabase-js'
import type { LineupChangeBody } from '~/types/dto'
import { Player } from '../data/Player'
import { supabase } from '../utils/databaseClient'

export default defineEventHandler(async (event): Promise<void> => {
  const body = await readBody<LineupChangeBody>(event)

  if (!body?.lineupId || !body?.teamId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Player name and teamId are required'
    })
  }


  const { data, error } = await supabase
    .from('lineup')
    .upsert(
        { id:body.lineupId, teamid: body.teamId, [body.position.toLowerCase()]: body.playerId, },
    )
  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }
})
