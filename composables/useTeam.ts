import type { Team } from "~/types/handball";
import type { LoadingState } from "./useLoading";

export const useTeam = (loadingState: LoadingState) => {

    const teams = useState<Team[]>('teams', () => []);
    const selectedTeamId = ref<number | undefined | null>(0);
    const selectedTeam = computed(() => teams.value?.find(t => t.id === selectedTeamId.value));
   
    async function fetchTeams(): Promise<void> {
        const { $supabase } = useNuxtApp()
        try{
        loadingState.fetching.value = true
        const { data: teamData, error:err1 } = await $supabase.from('team').select(`
            id,
            name,
            player (
                id,
                name,
                number,
                position,
                player_stats (*,match (id,result,createdat,opponent, shots(*)))
            )`
        )
        
        if (!teamData || teamData.length == 0 ){
            loadingState.fetching.value = false;
            return;
        }
        
        if (err1) {
            loadingState.fetching.value = false;
            throw createError({ statusCode: 500, message: "error.message" })
        }

        teams.value = teamData.map(t => ({
            id: t.id,
            name: t.name,
            players: t.player.map( p => ({
                ...p,
                recentStats: p.player_stats,
            })).sort((a,b) => a.number - b.number),
        } as Team));
        selectedTeamId.value = teamData[0]?.id;
        loadingState.fetching.value = false;

        }catch(err){
        loadingState.fetching.value = false;
        }
    }

    async function addTeam(name: string): Promise<Team | null> {
        try{
        loadingState.fetching.value = true;
        const teamId = await $fetch('/api/teams', {
            method: 'POST',
            body: { name: name }
        })
        const team: Team = { id: teamId, name, players: [] };
        
        teams.value.push(team);
        loadingState.fetching.value = false;
        return team;
        }catch(err){
        loadingState.fetching.value = false;
        return null;
        }
    }
    
    function getTeam(teamId: number) {
        return teams.value.find(t => t.id === teamId) || null;
    }

    function removeTeam(teamId: number) {
        const idx = teams.value.findIndex(t => t.id === teamId);
        if (idx !== -1) teams.value.splice(idx, 1);
    }

    return {
        teams,
        selectedTeam,
        fetchTeams,
        addTeam,
        removeTeam,
        getTeam,
    }
}