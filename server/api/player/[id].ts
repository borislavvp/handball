import type { H3Event } from "h3"
import { supabase } from '../../utils/databaseClient'
import { AttackPosKey, DefensePosKey, Position } from "~/types/handball"

export default defineEventHandler(async (event: H3Event) => {
  const playerId = event.context.params?.id
  const body = await readBody(event) as { name?: string, number?: number, position?: AttackPosKey | DefensePosKey }

  if (!playerId) {
    throw createError({ statusCode: 400, statusMessage: "Player ID is required" })
  }

  // Validate required fields if provided
  if (body.name !== undefined && !body.name.trim()) {
    throw createError({ statusCode: 400, statusMessage: "Name cannot be empty" })
  }
  if (body.number !== undefined && (body.number === null || isNaN(body.number))) {
    throw createError({ statusCode: 400, statusMessage: "Number cannot be empty" })
  }

  // Only update provided fields
  const { data, error } = await supabase
    .from("player")
    .update(body)
    .eq("id",  Number(playerId))

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data
})
