import { createClient } from '@supabase/supabase-js'
import type { CreatePlayerBody } from '~/types/dto'
import { Player } from '../data/Player'
import { supabase } from '../utils/databaseClient'

export default defineEventHandler(async (event): Promise<number> => {
  const body = await readBody<CreatePlayerBody>(event)

  if (!body?.name || !body?.teamId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Player name and teamId are required'
    })
  }


  const { data, error } = await supabase
    .from('player')
    .insert({
      teamid: body.teamId,
      name: body.name,
      number: body.number,
      position: body.position ?? undefined
    })
    .select()
    .single<Player>()
  console.log(data)
  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  return data.id
})
