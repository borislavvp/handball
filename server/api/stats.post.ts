import type { CreateStatsBody } from '~/types/dto'
import { supabase } from '../utils/databaseClient'

export default defineEventHandler(async (event): Promise<void> => {
    const body = await readBody<CreateStatsBody>(event)

    if (!body?.matchId || !body?.playerId) {
    throw createError({
        statusCode: 400,
        statusMessage: 'Player id and match id are required'
    })
    }
    const {data: statsExist} = await supabase.from("player_stats").select("*")
    .eq("playerid", body.playerId)
    .eq("matchid", body.matchId)

    if (statsExist?.length){
        return;
    }
    const {error} = await supabase.from("player_stats").insert({
        matchid: body.matchId,
        playerid: body.playerId,
    })

    if(error){
        throw createError({ statusCode: 400, statusMessage: error.message})
    }

})
