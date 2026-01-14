import type {  ShotsBody } from '~/types/dto'
import { supabase } from '../utils/databaseClient'
import { Stats } from '~/types/handball'

const incrementOrCreateStat = async (matchId:number, playerId:number, stat:Stats) => {
    const {data,error} = await supabase
        .from("player_stats").select()
        .eq('playerid', playerId)
        .eq('matchid', matchId)
        .single()

    if(data){
        await supabase.rpc('increment_stat', {
            column_name: stat,
            matchid: matchId,
            playerid: playerId,
        })
    }else{
        await supabase.from("player_stats").insert({
            matchid: matchId,
            playerid: playerId,
            [stat]: 1,
        })
    }
}

export default defineEventHandler(async (event): Promise<void> => {
  try {

    const body = await readBody<ShotsBody>(event)

    if (!body.playerId || !body.matchId || !body.shot) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Player id and shot and match id are required'
      })
    }
  
    const {data,error} = await supabase
      .from("shots")
      .insert({
        matchid: body.matchId,
        playerid: body.playerId,
        from: body.shot.from,
        to: body.shot.to,
        result: body.shot.result,
        time: body.shot.time,
        assistPrimary: body.shot.assistPrimary ?? null,
        assistSecondary: body.shot.assistSecondary ?? null,
        fastbreak: body.shot.fastbreak ?? false,
        breakthrough: body.shot.breakthrough ?? false,
        mistakePlayer: body.shot.mistakePlayer ?? null,
      }).select().single()
      console.log(data, error);
    if (error || !data) {
        throw createError({ statusCode: 400, statusMessage: error.message})
    }
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
        metadata: `${data?.id}`
    })
    
    incrementOrCreateStat(body.matchId, body.playerId, body.shot.result as Stats);
    if(body.shot.assistPrimary){
        incrementOrCreateStat(body.matchId, body.shot.assistPrimary, "assistprimary");
    }
    if(body.shot.assistSecondary){
        incrementOrCreateStat(body.matchId, body.shot.assistSecondary, "assistsecondary");
    }

  }catch{
    throw createError({ statusCode: 400, statusMessage: "ERROR"})
  }

})
