
import { supabase } from '../../utils/databaseClient'

export default defineEventHandler(async (event) => {
  const playerId = Number(getRouterParam(event, 'id'))

  if (!playerId) {
    throw createError({ statusCode: 400, statusMessage: 'Player ID is required' })
  }

  const { error } = await supabase
    .from('player')
    .delete()
    .eq('id', playerId)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { success: true, id: playerId }
})
