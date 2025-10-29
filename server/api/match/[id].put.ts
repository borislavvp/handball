import type {  UpdateMatchBody } from '~/types/dto'
import { supabase } from '../../utils/databaseClient'

export default defineEventHandler(async (event): Promise<void> => {
  try {
    const matchId =event.context.params?.id
    const body = await readBody<UpdateMatchBody>(event)

    if (!body?.result || !matchId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Player opponent and teamId are required'
      })
    }
  
    const { data, error } = await supabase
      .from("match")
      .update(body)
      .eq("id",  Number(matchId))

  }catch{
    throw createError({ statusCode: 400, statusMessage: "ERROR"})
  }

})
