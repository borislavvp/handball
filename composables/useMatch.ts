import type { CurrentMatch, DefenseSystem, Match, MATCH_EVENTS, Team } from "~/types/handball";
import type { LoadingState } from "./useLoading";
import { computePlayerValue } from "./usePlayer";

export const useMatch = (loadingState: LoadingState, team: ComputedRef<Team | undefined>,  ) => {

    const matches = useState<Match[]>('matches', () => []);
    const currentMatch = ref<CurrentMatch | null>(null);

    // Initialize total seconds
    const totalSeconds = useState<number>('totalSeconds', () => 0);

    // Start timer
    const timer = ref(null as ReturnType<typeof setInterval> | null);
    
    function getMatch(id:number){
        return matches.value.find(m => m.id === id)
    }

    async function deleteMatch(id:number){
        await $fetch('/api/match/delete', {
            method: 'POST',
            body: { matchId: id }
        })
        if(currentMatch.value?.id === id){
            currentMatch.value = null;
            stopMatchTimer();
            totalSeconds.value = 0;
            localStorage.removeItem('currentMatch');
        }

        const index = matches.value.findIndex(m => m.id === id);
        if(index !== -1) {
            matches.value.splice(index, 1);
        }
        
    }

    async function createMatch(opponent: string): Promise<Match | null> {
        const matchId = await $fetch('/api/matches', {
            method: 'POST',
            body: { opponent: opponent, teamId: team.value?.id, }
        });

        const match: CurrentMatch = { 
            id:matchId as number, 
            opponent,
            teamid:team.value!.id, 
            createdat: Date.now().toString(), 
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
        
        matches.value.push(match);
        currentMatch.value = match;
        return match;
    }
    

    const startMatchTimer = () => {
        console.log("START TIMER")
        timer.value = setInterval(() => {
            if (!currentMatch.value!.playing) return;

            totalSeconds.value++;

            // Stop at 60 minutes
            if (totalSeconds.value >= 60 * 60) {
                totalSeconds.value = 60 * 60;
                clearInterval(timer.value!);
            }

            // Compute minutes and seconds
            const minutes = Math.floor(totalSeconds.value / 60);
            const seconds = totalSeconds.value % 60;
            if(minutes === 30 && seconds === 0){
                // Half-time reached
                currentMatch.value!.playing = false;
            }else if(minutes === 60 && seconds === 0){
                endMatch(currentMatch.value!.score > currentMatch.value!.opponentScore ? "WIN" : "LOST")
            }

            // Format as MM:SS
            currentMatch.value!.time = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            saveMatchToLocalStorage(currentMatch.value);
        }, 1000);
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
        const lastMatch = matches.value[matches.value.length -1];
        if(lastMatch && !lastMatch.result){
            const cached = loadMatchFromLocalStorage() as CurrentMatch;
            currentMatch.value = {
                ...lastMatch,
                time: "47:00",
                playing: false,
                defenseSystem: "6:0",
                opponentDefenseSystem: "6:0",
                emptyGoalHome: false,
                emptyGoalAway: false,
                twoMinutesHome: [],
                twoMinutesAway: [],
            };
            if(cached.id === lastMatch.id){
                currentMatch.value = {
                    ...currentMatch.value,  
                    ...cached,
                    result: lastMatch.result
                }
            }else{
                saveMatchToLocalStorage(currentMatch.value);
            }
            if(currentMatch.value?.result !== null){
                currentMatch.value = null;
            }else{
                if(currentMatch.value?.playing){
                    resumeMatch()
                }
                team.value?.players.forEach(p => {
                    const stats = p.recentStats[p.recentStats.length -1]
                    if (stats && stats.match.id === currentMatch.value?.id){
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
            body: { matchId: currentMatch.value?.id, eventType:data.eventType, playerId:data.playerId, metadata:data.metadata, time: currentMatch.value?.time }
        })
    }

    const stopMatchTimer = () => {  
        clearInterval(timer.value!);
        totalSeconds.value = 0;
    }

    const endMatch = (result: "WIN" | "LOST") => {
        currentMatch.value!.result = result;
        currentMatch.value!.playing = false;
        $fetch(`/api/match/${currentMatch.value?.id}`, {
            method: 'PUT',
            body: { result, score: currentMatch.value?.score, opponentScore: currentMatch.value?.opponentScore }
        })
        stopMatchTimer();
        saveMatchToLocalStorage(currentMatch.value);
        logMatchEvent({
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
                totalSeconds.value = seconds  + minutes * 60
            }else{
                totalSeconds.value = seconds
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
        console.log("TIMER", timer.value)
        console.log("RESUME MATCH", currentMatch.value!.playing)
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

    const takeTimeout = (side: 'home' | 'away') => {
        if (side === 'home' && currentMatch.value!.timeoutsLeftHome > 0) {
            currentMatch.value!.timeoutsLeftHome -= 1;
            saveMatchToLocalStorage(currentMatch.value);
            logMatchEvent({
                eventType: 'timeout_home',
                metadata: currentMatch.value!.timeoutsLeftHome
            })
        } else if (side === 'away' && currentMatch.value!.timeoutsLeftAway > 0) {
            currentMatch.value!.timeoutsLeftAway -= 1;
            saveMatchToLocalStorage(currentMatch.value);
            logMatchEvent({
                eventType: 'timeout_away',
                metadata: currentMatch.value!.timeoutsLeftAway
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

    const toggleEmptyGoal = (side: "home" | "away") => {
        if(side === "home"){
            currentMatch.value!.emptyGoalHome = !currentMatch.value!.emptyGoalHome 
            logMatchEvent({
                eventType: `empty_goal_home`,
                metadata: currentMatch.value!.emptyGoalHome
            })
        }else{
            currentMatch.value!.emptyGoalAway = !currentMatch.value!.emptyGoalAway 
            logMatchEvent({
                eventType: `empty_goal_away`,
                metadata: currentMatch.value!.emptyGoalAway
            })
        }
    }
    return {
        matches,
        currentMatch,
        currentMatchTime: computed(() => Math.floor(totalSeconds.value / 60)),
        fetchMatches,
        createMatch,
        logMatchEvent,
        endMatch,
        pauseMatch,
        resumeMatch,
        increaseMatchScore,
        takeTimeout,
        getMatch,
        deleteMatch,
        startMatchTimer,
        changeDefenseSystem,
        changeOpponentDefenseSystem,
        toggleEmptyGoal
    }
}