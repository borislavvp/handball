import type {  UpdateMatchBody } from '~/types/dto'
import { supabase } from '../utils/databaseClient'

export default defineEventHandler(async (event): Promise<void> => {
  try {

    const body = await readBody<UpdateMatchBody>(event)

    if (!body?.result || !body.matchId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Player opponent and teamId are required'
      })
    }
  
    const { data, error } = await supabase
      .from("match")
      .update(body)
      .eq("id",  Number(body.matchId))

  }catch{
    throw createError({ statusCode: 400, statusMessage: "ERROR"})
  }

})
