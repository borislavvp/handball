import type { CreateTeamBody } from '~/types/dto'
import { supabase } from '../utils/databaseClient'

export default defineEventHandler(async (event): Promise<number> => {
  const body = await readBody<CreateTeamBody>(event)

  if (!body?.name) {
    throw createError({ statusCode: 400, statusMessage: 'Team name is required' })
  }

  const { data, error } = await supabase
    .from('team')
    .insert({ name: body.name })
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message })
  }

  return data.id;
})
