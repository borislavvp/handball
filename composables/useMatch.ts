import type { ActiveMatchData, Match, Team } from "~/types/handball";
import type { LoadingState } from "./useLoading";
import { computePlayerValue } from "./usePlayer";
import { useActiveMatch, type ActiveMatch } from "./useActiveMatch";
import { useSelection } from "./useSelection";

export const useMatch = (loadingState: LoadingState, team: ComputedRef<Team | undefined>) => {
    const matches = useState<Match[]>('matches', () => []);
    const currentActiveMatch = useState<number | null>('currentActiveMatch', () => null);
    const activeMatches = shallowReactive(new Map()) as Map<number, ActiveMatch>;

    function getMatch(id:number){
        return matches.value.find(m => m.id === id);
    }


    function mapPersistedStats(stat: any) {
        return {
            "1on1lost": stat["1on1lost"] ?? 0,
            "1on1win": stat["1on1win"] ?? 0,
            goal: stat.goal ?? 0,
            gkmiss_empty: stat.gkmiss_empty ?? 0,
            goal_empty: stat.goal_empty ?? 0,
            defense: stat.defense ?? 0,
            assistprimary: stat.assistprimary ?? 0,
            assistsecondary: stat.assistsecondary ?? 0,
            defensex2: stat.defensex2 ?? 0,
            steal: stat.steal ?? 0,
            twominutes: stat.twominutes ?? 0,
            yellowcard: stat.yellowcard ?? 0,
            redcard: stat.redcard ?? 0,
            bluecard: stat.bluecard ?? 0,
            penaltymade: stat.penaltymade ?? 0,
            penaltyscored: stat.penaltyscored ?? 0,
            miss: stat.miss ?? 0,
            safe: stat.safe ?? 0,
            lostball: stat.lostball ?? 0,
            gkmiss: stat.gkmiss ?? 0,
            gksave: stat.gksave ?? 0,
            provokePenalty: stat.provokePenalty ?? 0,
            provokeTwoMin: stat.provokeTwoMin ?? 0,
            provokeCard: stat.provokeCard ?? 0,
            block: stat.block ?? 0,
            norebound: stat.norebound ?? 0,
            value: stat.value ?? 0,
        };
    }

    function hydratePlayerViewForMatch(matchId: number) {
        team.value?.players.forEach((player) => {
            if (!player.liveByMatch) {
                player.liveByMatch = {};
            }

            const existing = player.liveByMatch[matchId];
            if (existing) {
                player.currentStats = existing.stats;
                player.currentShots = existing.shots;
                return;
            }

            const persisted = player.recentStats.find((stat) => stat.match.id === matchId);
            if (persisted) {
                player.liveByMatch[matchId] = {
                    stats: mapPersistedStats(persisted),
                    shots: persisted.match.shots.filter((shot) => shot.playerid === player.id),
                };
                computePlayerValue(player, player.liveByMatch[matchId]!.stats);
                player.currentStats = player.liveByMatch[matchId]!.stats;
                player.currentShots = player.liveByMatch[matchId]!.shots;
            } else {
                player.currentStats = undefined;
                player.currentShots = [];
            }
        });
    }

    watch(currentActiveMatch, (matchId) => {
        if (matchId) {
            hydratePlayerViewForMatch(matchId);
        }
    });

    async function deleteMatch(match:Match){
        await $fetch('/api/match/delete', {
            method: 'POST',
            body: { matchId: match.id },
        });
        const m = activeMatches.get(match.id);
        if(m){
            m.dispose();
            activeMatches.delete(match.id);
        }

        const index = matches.value.findIndex(m => m.id === match.id);
        if(index !== -1) {
            matches.value.splice(index, 1);
        }
    }

    async function createMatch(opponent: string): Promise<Match | null> {
        const data = await $fetch('/api/matches', {
            method: 'POST',
            body: { opponent: opponent, teamId: team.value?.id },
        });

        const match: ActiveMatchData = {
            id: data.id as number,
            opponent,
            teamid: team.value!.id,
            createdat: data.createdat,
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

        const active = useActiveMatch(match);
        activeMatches.set(match.id, active);
        currentActiveMatch.value = match.id;
        hydratePlayerViewForMatch(match.id);
        return match;
    }

    async function fetchMatches() {
        const { $supabase } = useNuxtApp();
        loadingState.fetching.value = true;
        const {data, error} = await $supabase.from('match').select("*, shots(*)").order('id', { ascending: true });
        if (error){
            console.error("Error fetching matches:", error.message);
            loadingState.fetching.value = false;
            return;
        }

        matches.value = data!;

        matches.value.forEach((m) => {
            if (!m.result) {
                const active = useActiveMatch(m, true);
                activeMatches.set(m.id, active);
                if (!currentActiveMatch.value) {
                    currentActiveMatch.value = m.id;
                }
                hydratePlayerViewForMatch(m.id);
            }
        });

        if (currentActiveMatch.value) {
            hydratePlayerViewForMatch(currentActiveMatch.value);
        }

        loadingState.fetching.value = false;
    }

    const seeActiveMatch = (match:Match) => {
        const active = activeMatches.get(match.id);
        if(active){
            currentActiveMatch.value = match.id;
            useSelection().resetAll();
            useRouter().push(`/matches/active`);
        }
    };

    const getActiveMatch = (): ActiveMatch | null => {
        if(currentActiveMatch.value){
            const match = activeMatches.get(currentActiveMatch.value);
            return match || null;
        }
        return null;
    };


    return {
        matches,
        match: computed(() => getActiveMatch()),
        activeMatches,
        fetchMatches,
        createMatch,
        getMatch,
        deleteMatch,
        seeActiveMatch,
        hydratePlayerViewForMatch,
    };
};
