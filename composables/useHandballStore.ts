import { useState } from 'nuxt/app';
import { provide, inject } from 'vue';
import { useLoading } from './useLoading';
import type { Player } from '~/types/handball';
import { useSelection } from './useSelection';

    
export function createHandballStore() {
  const loadingState = useLoading();
  const teams = useTeam(loadingState);
  const matches = useMatch(loadingState, teams.selectedTeam);
  const players = usePlayer(loadingState, teams.selectedTeam, matches.match);
  const selection = useSelection();
  const stats = useStats(selection, teams.selectedTeam);
  
  const initialize = async () => {
    loadingState.loading.value = true;
    await teams.fetchTeams();
    await matches.fetchMatches();
    loadingState.loading.value = false;
  }

  return {
    loading: computed(() => loadingState.fetching.value),
    fetching: computed(() => loadingState.fetching.value),
    teams,
    matches,
    players,
    selection,
    stats,
    initialize,
  };
}


export const provideHandballStore = (store: ReturnType<typeof createHandballStore>) => {
  provide('handballStore', store)
}

export const useHandballStore = () => {
  return inject("handballStore") as ReturnType<typeof createHandballStore>
}