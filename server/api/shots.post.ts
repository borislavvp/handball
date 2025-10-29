import type {  ShotsBody } from '~/types/dto'
import { supabase } from '../utils/databaseClient'

export default defineEventHandler(async (event): Promise<void> => {
  try {

    const body = await readBody<ShotsBody>(event)

    if (!body.playerId || !body.matchId || !body.shot) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Player id and shot and match id are required'
      })
    }
  
    await supabase
      .from("shots")
      .insert({
        matchid: body.matchId,
        playerid: body.playerId,
        from: body.shot.from,
        to: body.shot.to,
        result: body.shot.result,
        time: body.shot.time,
        assistid: body.assistId,
      })
    if(body.shot.result === 'gkmiss'){
      await supabase.rpc('increment_match_score', {
            column_name: "opponentScore",
            matchid: body.matchId,
        })
    }else if(body.shot.result === 'goal'){
      await supabase.rpc('increment_match_score', {
            column_name: "score",
            matchid: body.matchId,
        })
    }
    await supabase
    .from("match_event")
    .insert({
        matchid: body.matchId,
        playerid: body.playerId,
        event: body.shot.result,
        time: body.shot.time,
    })
    if(body.hasStats){
        await supabase.rpc('increment_stat', {
            column_name: body.shot.result,
            matchid: body.matchId,
            playerid: body.playerId,
        })
    }else{
        await supabase.from("player_stats").insert({
            matchid: body.matchId,
            playerid: body.playerId,
            [body.shot.result]: 1,
        })
    }

    if(body.assistId){
        await supabase
        .from("match_event")
        .insert({
            matchid: body.matchId,
            playerid: body.assistId,
            event: "assist",
            time: body.shot.time,
        })

        if(body.assistHasStats){
            await supabase.rpc('increment_stat', {
                column_name: "assist",
                matchid: body.matchId,
                playerid: body.assistId,
            })
        }else{
            await supabase.from("player_stats").insert({
                matchid: body.matchId,
                playerid: body.assistId,
                "assist": 1,
            })
        }

    }

  }catch{
    throw createError({ statusCode: 400, statusMessage: "ERROR"})
  }

})
