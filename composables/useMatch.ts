import type { CurrentMatch, DefenseSystem, Match, MATCH_EVENTS, Team } from "~/types/handball";
import type { LoadingState } from "./useLoading";

export const useMatch = (loadingState: LoadingState, team: ComputedRef<Team | undefined>,  ) => {

    const matches = useState<Match[]>('matches', () => []);
    const currentMatch = ref<CurrentMatch | null>(null);

    // Initialize total seconds
    let totalSeconds = 0;

    // Start timer
    const timer = ref(null as ReturnType<typeof setInterval> | null);
    
    function getMatch(id:number){
        return matches.value.find(m => m.id === id)
    }

    async function createMatch(opponent: string): Promise<Match | null> {
        const matchId = await $fetch('/api/matches', {
            method: 'POST',
            body: { opponent: opponent, teamId: team.value, }
        })

        const match: CurrentMatch = { 
            id:matchId , opponent,
            teamid:team.value!.id, 
            createdat: Date.now().toString(), 
            result: null,
            score: 0,
            opponentScore: 0,
            timeoutsLeft: 3,
            time: "00:00",
            playing: false,
            shots: [],
            defenseSystem: "6:0",
            opponentDefenseSystem: "6:0",
            emptyGoal: false,
        };
        
        matches.value.push(match);
        currentMatch.value = match;
        return match;
    }
    

    const startMatchTimer = () => {
        timer.value = setInterval(() => {
            if (!currentMatch.value!.playing) return;

            totalSeconds++;

            // Stop at 60 minutes
            if (totalSeconds >= 60 * 60) {
                totalSeconds = 60 * 60;
                clearInterval(timer.value!);
            }

            // Compute minutes and seconds
            const minutes = Math.floor(totalSeconds / 60);
            if(minutes === 30){
                // Half-time reached
                currentMatch.value!.playing = false;
            }else if(minutes === 60){
                endMatch(currentMatch.value!.score > currentMatch.value!.opponentScore ? "WIN" : "LOST")
            }

            const seconds = totalSeconds % 60;

            // Format as MM:SS
            currentMatch.value!.time = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            saveMatchToLocalStorage(currentMatch.value);
        }, 1000);
    }

    async function fetchMatches() {
        const { $supabase } = useNuxtApp()
        loadingState.fetching.value = true;
        const {data, error} = await $supabase.from('match').select("*, shots(*)").eq('teamid', team.value!.id)
        if (error){
            console.error("Error fetching matches:", error.message);
            loadingState.fetching.value = false;
            return;  
        }
        matches.value = data!;
        const lastMatch = matches.value[matches.value.length -1];
        if(lastMatch && !lastMatch.result){
            currentMatch.value = {
                ...loadMatchFromLocalStorage(),
                ...lastMatch
            };
            if(currentMatch.value?.result !== null){
                currentMatch.value = null;
            }else{
                if(currentMatch.value?.playing){
                    resumeMatch()
                }
                team.value?.players.forEach(p => {
                    const stats = p.recentStats[p.recentStats.length -1]
                    if (stats ){
                        p.currentShots = stats.match.shots || [];
                        p.currentStats = stats;
                    }
                });
            }
        }
        loadingState.fetching.value = false;
    }
    
    // Utility function to save match to localStorage
    function saveMatchToLocalStorage(match: typeof currentMatch.value) {
        if (!match) return;
        const data = {
            match,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('currentMatch', JSON.stringify(data));
    }
    
    function logMatchEvent(data: {eventType: MATCH_EVENTS, playerId?: number, metadata?: any}) {
        $fetch('/api/match/event', {
        method: 'POST',
        body: { matchId: currentMatch.value?.id, eventType:data.eventType, playerId:data.playerId, metadata:data.metadata }
        })
    }

    const stopMatchTimer = () => {  
        clearInterval(timer.value!);
    }

    const endMatch = (result: "WIN" | "LOST") => {
        currentMatch.value!.result = result;
        currentMatch.value!.playing = false;
        $fetch(`/api/match/${currentMatch.value?.id}`, {
            method: 'PUT',
            body: { result, score: currentMatch.value?.score, opponentScore: currentMatch.value?.opponentScore }
        })
        clearInterval(timer.value!);
        saveMatchToLocalStorage(currentMatch.value);logMatchEvent({
            eventType: 'playing',
            metadata: false
        })
    }

    function loadMatchFromLocalStorage() {
        const saved = localStorage.getItem('currentMatch');
        if (saved) {
            const data = JSON.parse(saved);
            const seconds = Number(data.match.time.split(":")[1]);
            const minutes = Number(data.match.time.split(":")[0]);
            if(minutes){
                totalSeconds = seconds  + minutes * 60
            }else{
                totalSeconds = seconds
            }
            console.log("Last updated:", data.lastUpdated);
            if (data.match.playing){
                startMatchTimer()
            }
            return data.match;
        }else{
            return {
                result: null,
                score: 0,
                opponentScore: 0,
                timeoutsLeft: 3,
                time: "00:00",
                playing: false,
                shots: [],
                defenseSystem: "6:0",
                opponentDefenseSystem: "6:0",
                emptyGoal: false,
            }
        }
    }

    const pauseMatch = () => {
        currentMatch.value!.playing = false;
        saveMatchToLocalStorage(currentMatch.value);
        logMatchEvent({
            eventType: 'playing',
            metadata: false
        })
    }

    const resumeMatch = () => {
        console.log(timer.value)
        if (timer.value === null) {
            startMatchTimer();
        }
        currentMatch.value!.playing = true;
        saveMatchToLocalStorage(currentMatch.value);
        logMatchEvent({
            eventType: 'playing',
            metadata: true
        })
    }

    const increaseMatchScore = (team: "home" | "away") => {
        if (team === "home") {
            currentMatch.value!.score! += 1; 
        } else {
            currentMatch.value!.opponentScore! += 1;
        }
        saveMatchToLocalStorage(currentMatch.value);
    }

    const takeTimeout = () => {
        if (currentMatch.value!.timeoutsLeft > 0) {
            currentMatch.value!.timeoutsLeft -= 1;
            saveMatchToLocalStorage(currentMatch.value);
            logMatchEvent({
                eventType: 'timeout',
                metadata: currentMatch.value!.timeoutsLeft
            })
        }
    }

    const changeDefenseSystem = (defense: DefenseSystem) => {
        currentMatch.value!.defenseSystem = defense;
        saveMatchToLocalStorage(currentMatch.value);
        logMatchEvent({
            eventType: 'defense_change',
            metadata: defense
        })
    }
    
    const changeOpponentDefenseSystem = (defense: DefenseSystem) => {
        currentMatch.value!.opponentDefenseSystem = defense;
        saveMatchToLocalStorage(currentMatch.value);
        logMatchEvent({
            eventType: 'opponent_defense_change',
            metadata: defense
        })
    }

    const toggleEmptyGoal = () => {
        currentMatch.value!.emptyGoal = !currentMatch.value!.emptyGoal 
        logMatchEvent({
            eventType: 'empty_goal',
            metadata: currentMatch.value!.emptyGoal
        })
    }
    return {
        matches,
        currentMatch,
        fetchMatches,
        createMatch,
        logMatchEvent,
        endMatch,
        pauseMatch,
        resumeMatch,
        increaseMatchScore,
        takeTimeout,
        getMatch,
        startMatchTimer,
        stopMatchTimer,
        changeDefenseSystem,
        changeOpponentDefenseSystem,
        toggleEmptyGoal
    }
}