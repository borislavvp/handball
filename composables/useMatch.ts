import type { ActiveMatchData, Match, Team } from "~/types/handball";
import type { LoadingState } from "./useLoading";
import { computePlayerValue } from "./usePlayer";
import { useActiveMatch, type ActiveMatch } from "./useActiveMatch";
import type { UnwrapNestedRefs } from "vue";

export const useMatch = (loadingState: LoadingState, team: ComputedRef<Team | undefined>,  ) => {

    const matches = useState<Match[]>('matches', () => []);
    // const activeMatches = useState<ActiveMatch[]>('activeMatches', () => []);
    const currentActiveMatch = useState<number | null>('currentActiveMatch', () => null)

    const activeMatches = shallowReactive(new Map()) as Map<number, ActiveMatch>

    function getMatch(id:number){
        return matches.value.find(m => m.id === id)
    }

    async function deleteMatch(match:Match){
        await $fetch('/api/match/delete', {
            method: 'POST',
            body: { matchId: match.id }
        })
        const m = activeMatches.get(match.id);
        // let index = activeMatches.value.findIndex(m => m.data.value.id === match.id);
        if(m){
            m.dispose()
            activeMatches.delete(match.id)
            // activeMatches.value[index]?.dispose()
            // if(index !== -1) {
                // activeMatches.value.splice(index, 1);
            // }
        }

        const index = matches.value.findIndex(m => m.id === match.id);
        if(index !== -1) {
            matches.value.splice(index, 1);
        }
        
    }

    async function createMatch(opponent: string): Promise<Match | null> {
        const matchId = await $fetch('/api/matches', {
            method: 'POST',
            body: { opponent: opponent, teamId: team.value?.id, }
        });

        const match: ActiveMatchData = { 
            id:matchId as number, 
            opponent,
            teamid:team.value!.id, 
            createdat: Date.now().toLocaleString(), 
            result: null,
            score: 0,
            opponentScore: 0,
            timeoutsLeftHome: 3,
            timeoutsLeftAway: 3,
            time: "00:00",
            playing: false,
            shots: [],
            defenseSystem: "6:0",
            opponentDefenseSystem: "6:0",
            emptyGoalHome: false,
            emptyGoalAway: false,
            twoMinutesHome: [],
            twoMinutesAway: [],
        };
        
        // activeMatches.value.push(useActiveMatch(match));
        const active = useActiveMatch(match) 
        activeMatches.set(match.id, active);
        return match;
    }
    
    async function fetchMatches() {
        const { $supabase } = useNuxtApp()
        loadingState.fetching.value = true;
        const {data, error} = await $supabase.from('match').select("*, shots(*)").eq('teamid', team.value!.id).order('id', { ascending: true }); // ascending: false for descending
        if (error){
            console.error("Error fetching matches:", error.message);
            loadingState.fetching.value = false;
            return;  
        }
        matches.value = data!;
        console.log("DADA", data)
        matches.value.forEach(m => {
            if(!m.result){
                const active = useActiveMatch(m,true)
                activeMatches.set(m.id,active)
                if(!currentActiveMatch.value){
                    currentActiveMatch.value = m.id;
                }
                team.value?.players.forEach(p => {
                    const stats = p.recentStats[p.recentStats.length -1]
                    if (stats && stats.match.id === active.data.value.id){
                        p.currentStats = stats;
                        computePlayerValue(p);
                        if(stats?.goal || stats?.miss || stats?.gkmiss || stats?.gksave){
                            p.currentShots = stats.match.shots.filter(s => s.playerid === p.id);
                        }else{
                            p.currentShots = []
                        }
                    }
                });
            }
        })
        // const lastMatch = matches.value[matches.value.length -1];
        // if(lastMatch && !lastMatch.result){
        //     // const cached = loadMatchFromLocalStorage(lastMatch) as CurrentMatch;
        //     // currentMatch.value = {
        //     //     ...lastMatch,
        //     //     time: "00:00",
        //     //     playing: false,
        //     //     defenseSystem: "6:0",
        //     //     opponentDefenseSystem: "6:0",
        //     //     emptyGoalHome: false,
        //     //     emptyGoalAway: false,
        //     //     twoMinutesHome: [],
        //     //     twoMinutesAway: [],
        //     // };
        //     if(cached.id === lastMatch.id){
        //         currentMatch.value = {
        //             ...currentMatch.value,  
        //             ...cached,
        //             result: lastMatch.result
        //         }
        //     }else{
        //         saveMatchToLocalStorage(currentMatch.value);
        //     }
        //     if(currentMatch.value?.result !== null){
        //         currentMatch.value = null;
        //     }else{
        //         if(currentMatch.value?.playing){
        //             resumeMatch()
        //         }
        //         team.value?.players.forEach(p => {
        //             const stats = p.recentStats[p.recentStats.length -1]
        //             if (stats && stats.match.id === currentMatch.value?.id){
        //                 p.currentStats = stats;
        //                 computePlayerValue(p);
        //                 if(stats?.goal || stats?.miss || stats?.gkmiss || stats?.gksave){
        //                     p.currentShots = stats.match.shots.filter(s => s.playerid === p.id);
        //                 }else{
        //                     p.currentShots = []
        //                 }
        //             }
        //         });
        //     }
        
        loadingState.fetching.value = false;
    }
    
    const seeActiveMatch = (match:Match) => {
        // const active = activeMatches.value.findIndex(m => m.data.value.id === match.id)
        const active = activeMatches.get(match.id)
        if(active){
            currentActiveMatch.value = match.id
            useRouter().push(`/matches/active`)
        }
    }

    const getActiveMatch = (): ActiveMatch | null => {
        if(currentActiveMatch.value){
            const match = activeMatches.get(currentActiveMatch.value)!
            return match
        }
        return null
    }

    return {
        matches,
        match: computed(() => getActiveMatch()),
        activeMatches,
        fetchMatches,
        createMatch,
        getMatch,
        deleteMatch,
        seeActiveMatch
    }
}