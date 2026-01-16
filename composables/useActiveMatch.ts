import type {  ActiveMatchData, DefenseSystem, Match, MATCH_EVENTS, Team } from "~/types/handball";


export const useActiveMatch = (data: Match, loadCache:boolean = false ) => {
    
    const matchCacheKey = `current-${data.id}-${data.opponent}`

    const initializeData = (match:Match): ActiveMatchData => {
        return { 
            ...match, 
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
    }
    const totalSeconds = ref<number>(0);
    const timer = ref(null as ReturnType<typeof setInterval> | null);
    
    const match = ref<ActiveMatchData>(loadCache ? loadMatchFromLocalStorage(data) : initializeData(data));
    

    const startMatchTimer = () => {
        console.log("START TIMER", match.value.opponent)
        console.log("START TIMER", totalSeconds)
        timer.value = setInterval(() => {
            if (!match.value.playing) return;

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
                match.value.playing = false;
            }else if(minutes === 60 && seconds === 0){
                endMatch(match.value.score > match.value.opponentScore ? "WIN" : "LOST")
            }

            // Format as MM:SS
            match.value.time = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            saveMatchToLocalStorage(match.value);
        }, 1000);
    }

    
    // Utility function to save match to localStorage
    function saveMatchToLocalStorage(match: ActiveMatchData) {
        if (!match) return;
        const data = {
            match,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(matchCacheKey, JSON.stringify(data));
    }
    
    function logMatchEvent(data: {eventType: MATCH_EVENTS, playerId?: number, metadata?: any}) {
        $fetch('/api/match/event', {
            method: 'POST',
            body: { matchId: match.value?.id, eventType:data.eventType, playerId:data.playerId, metadata:data.metadata, time: match.value?.time }
        })
    }

    const stopMatchTimer = () => {  
        clearInterval(timer.value!);
        totalSeconds.value = 0;
    }

    const endMatch = (result: "WIN" | "LOST") => {
        match.value.result = result;
        match.value.playing = false;
        $fetch(`/api/match/${match.value?.id}`, {
            method: 'PUT',
            body: { result, score: match.value?.score, opponentScore: match.value?.opponentScore }
        })
        stopMatchTimer();
        saveMatchToLocalStorage(match.value);
        logMatchEvent({
            eventType: 'playing',
            metadata: false
        })
    }

    
    function loadMatchFromLocalStorage(match: Match) {
        const saved = localStorage.getItem(matchCacheKey);
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
                id:match.id,
                teamid: match.teamid,
                opponent: match.opponent,
                createdat: match.createdat,
                result: null,
                score: 0,
                opponentScore: 0,
                time: "00:00",
                playing: false,
                shots: [],
                timeoutsLeftHome: 3,
                timeoutsLeftAway: 3,
                defenseSystem: "6:0",
                opponentDefenseSystem: "6:0",
                emptyGoalHome: false,
                emptyGoalAway: false,
                twoMinutesHome: [],
                twoMinutesAway: [],
            }
        }
    }
    const pauseMatch = () => {
        match.value.playing = false;
        saveMatchToLocalStorage(match.value);
        logMatchEvent({
            eventType: 'playing',
            metadata: false
        })
    }

    const resumeMatch = () => {
        console.log("TIMER", timer.value)
        console.log("RESUME MATCH", match.value.playing)
        if (timer.value === null) {
            startMatchTimer();
        }
        match.value.playing = true;
        saveMatchToLocalStorage(match.value);
        logMatchEvent({
            eventType: 'playing',
            metadata: true
        })
    }

    const increaseMatchScore = (team: "home" | "away") => {
        if (team === "home") {
            match.value.score! += 1; 
        } else {
            match.value.opponentScore! += 1;
        }
        saveMatchToLocalStorage(match.value);
    }

    const takeTimeout = (side: 'home' | 'away') => {
        if (side === 'home' && match.value.timeoutsLeftHome > 0) {
            match.value.timeoutsLeftHome -= 1;
            saveMatchToLocalStorage(match.value);
            logMatchEvent({
                eventType: 'timeout_home',
                metadata: match.value.timeoutsLeftHome
            })
        } else if (side === 'away' && match.value.timeoutsLeftAway > 0) {
            match.value.timeoutsLeftAway -= 1;
            saveMatchToLocalStorage(match.value);
            logMatchEvent({
                eventType: 'timeout_away',
                metadata: match.value.timeoutsLeftAway
            })
        }
    }

    const changeDefenseSystem = (defense: DefenseSystem) => {
        match.value.defenseSystem = defense;
        saveMatchToLocalStorage(match.value);
        logMatchEvent({
            eventType: 'defense_change',
            metadata: defense
        })
    }
    
    const changeOpponentDefenseSystem = (defense: DefenseSystem) => {
        match.value.opponentDefenseSystem = defense;
        saveMatchToLocalStorage(match.value);
        logMatchEvent({
            eventType: 'opponent_defense_change',
            metadata: defense
        })
    }

    const toggleEmptyGoal = (side: "home" | "away") => {
        if(side === "home"){
            match.value.emptyGoalHome = !match.value.emptyGoalHome 
            logMatchEvent({
                eventType: `empty_goal_home`,
                metadata: match.value.emptyGoalHome
            })
        }else{
            match.value.emptyGoalAway = !match.value.emptyGoalAway 
            logMatchEvent({
                eventType: `empty_goal_away`,
                metadata: match.value.emptyGoalAway
            })
        }
    }

    const dispose = () => {
        stopMatchTimer();
        timer.value = null;
        localStorage.removeItem(matchCacheKey)
    }

    return {
        data: match ,
        logMatchEvent,
        endMatch,
        pauseMatch,
        resumeMatch,
        increaseMatchScore,
        takeTimeout,
        startMatchTimer,
        changeDefenseSystem,
        changeOpponentDefenseSystem,
        toggleEmptyGoal,
        dispose
    }
}

export type ActiveMatch = ReturnType<typeof useActiveMatch>
