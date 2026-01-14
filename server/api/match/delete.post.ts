import type {  GeneralMatchBody } from '~/types/dto'
import { supabase } from '../../utils/databaseClient'

export default defineEventHandler(async (event): Promise<void> => {
  try {

    const body = await readBody<GeneralMatchBody>(event)

    if (!body.matchId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event type and match id are required'
      })
    }
  
    const{error} = await supabase
      .from("match")
      .delete()
      .eq('id', body.matchId)

    if (error) {
        throw createError({ statusCode: 400, statusMessage: "ERROR deleting match"})
    }
  }catch{
    throw createError({ statusCode: 400, statusMessage: "ERROR"})
  }

})
