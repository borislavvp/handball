import type { CreateMatchBody } from '~/types/dto'
import { supabase } from '../utils/databaseClient'

export default defineEventHandler(async (event): Promise<number> => {
  try {

  const body = await readBody<CreateMatchBody>(event)

  if (!body?.opponent || !body?.teamId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Player opponent and teamId are required'
    })
  }

  const { data, error } = await supabase
    .from('match')
    .insert({
      opponent:body.opponent,
      teamid: body.teamId,
      opponentScore: 0,
      score: 0,
      timeoutsLeft: 3,
    })
    .select()
    .single()
  
  return data!.id
}catch{
  throw createError({ statusCode: 400, statusMessage: "ERROR"})
}

})
