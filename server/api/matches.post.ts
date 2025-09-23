import { createClient } from '@supabase/supabase-js'
import type { CreateMatchBody } from '~/types/dto'
import { Match } from '../data/Match'
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
      teamid: body.teamId
    })
    .select()
    .single<Match>()

  const {data:lineup, error:errLineup} = await supabase.from("lineup").select(`
    lw,
    lb,
    cb,
    rb,
    rw,
    pv,
    pv2,
    d1,
    d2,
    d3,
    d4,
    d5,
    d6,
    gk
  `).eq("teamid",body.teamId)
  const ln = lineup![0] 
  type LineupKey = keyof typeof ln;
  (Object.keys(lineup![0]) as LineupKey[]).forEach(async k => {
    await supabase.from("player_stats").insert({
      matchid: data!.id,
      playerid: lineup![0][k]!,
    })
  })

  return data!.id
}catch{
  throw createError({ statusCode: 400, statusMessage: "ERROR"})
}

})
