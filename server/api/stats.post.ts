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
    
    const {error} = await supabase.from("player_stats").insert({
        matchid: body.matchId,
        playerid: body.playerId,
        [body.statType]: 1,
    })
    
    supabase
    .from("match_event")
    .insert({
        matchid: body.matchId,
        event: body.statType,
        time: body.time,
        playerid: body.playerId,
    })

    if(error){
        throw createError({ statusCode: 400, statusMessage: error.message})
    }

})
