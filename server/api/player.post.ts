import type { CreatePlayerBody } from '~/types/dto'
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
      position: body.position
    })
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  return data.id
})
