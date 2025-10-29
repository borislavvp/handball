<script setup lang="ts">
import { useHandballStore } from '~/composables/useHandballStore';
import type { Position } from '../types/handball';
import { onMounted, watch } from 'vue';

const store = useHandballStore();

const newTeamName = ref('');
const positions: Position["key"][] = ['LW', 'LB', 'CB', 'RB', 'RW', 'PV', "GK", "PV2"];
const newPlayerName = ref('');
const newPlayerPosition = ref<Position["key"]>('LW');
const newPlayerNumber = ref<number | null>(null);
const showDefenseDefaults = ref(false);
const showAddPlayer = ref(true);
const showPlayers = ref(true);
const showLineup = ref(true);

async function createTeam() {
  const name = newTeamName.value.trim();
  if (!name) return;
  const team = await store.teams.addTeam(name);
  newTeamName.value = '';
}

function addPlayer() {
  const name = newPlayerName.value.trim();
  if (!name) return;
  const number = Number(newPlayerNumber.value ?? 0) || 0;
  store.players.addPlayer(name, newPlayerPosition.value, number);
  newPlayerName.value = '';
  newPlayerNumber.value = null;
}

// function removeTeam(teamId: number) {
//   store.removeTeam(teamId);
//   if (selectedTeamId.value === teamId) {
//     const first = store.teams.value[0]?.id ?? null;
//     selectedTeamId.value = first;
//   }
// }


// Always keep a team selected when available
onMounted(() => {
  store.teams.fetchTeams();
});
const goToCurrentMatch = () => {
  useRouter().push(`/matches/active`)
}

function removePlayer(playerId:number,name:string,number:number) {
  const res = window.confirm(`Are you sure you want to delete ${name} (${number})`)
  if(res){
    store.players.removePlayer(playerId)
  }
}

</script>
<template>
  <div v-if="store.loading.value">
   <div class="flex flex-col items-center justify-center min-h-screen bg-white text-center">
      <div class="relative w-24 h-24 mb-6">
        <div class="absolute inset-0 rounded-full border-8 border-[#42b883] opacity-20"></div>
        <div class="absolute inset-0 rounded-full border-8 border-t-[#42b883] border-transparent animate-spin"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-xl font-bold text-[#42b883]">%</span>
        </div>
      </div>
      <h2 class="text-2xl font-semibold text-gray-800">Syncing team stats…</h2>
      <p class="text-gray-500 mt-2 text-sm">This may take a few seconds</p>
    </div>
  </div>
  <div v-else class="p-4 max-w-md mx-auto space-y-4 mb-20">
    <!-- Team Header -->
    <button @click="goToCurrentMatch()" v-if="store.matches.currentMatch.value" class="shadow-sm flex items-center justify-between p-4 w-full rounded border border-gray-700">
      <span class="font-semibold"> ONGOING </span>
      <div class="flex items-center space-x-2">
        <span class="text-md font-semibold uppercase text-white rounded-full border border-red-600 bg-red-600 px-2 py-1">{{ store.teams.selectedTeam.value?.name }}</span>
        <span class="text-gray-900 italic text-sm">vs</span>
        <span class="text-md font-semibold uppercase text-gray-900 rounded-full border border-gray-900 px-2 py-1">{{store.matches.currentMatch.value.opponent }}</span>
      </div>
    </button>
    <div class="bg-white border border-gray-300 rounded-2xl p-4 flex flex-col justify-between items-center">
      <button
          class="w-full flex justify-between items-center py-3 text-left text-gray-700 font-medium"
          @click="showAddPlayer = !showAddPlayer"
        >
          <span>Add Player to {{ store.teams.selectedTeam.value?.name  }}</span>
          <svg
            :class="{'rotate-180': showAddPlayer}"
            class="h-5 w-5 transition-transform"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      <!-- Team actions could go here -->
      <!-- Add Player Accordion -->
      <div v-if="showAddPlayer" class="space-y-3 border-t border-gray-200">
        <div class="flex gap-2 flex-wrap">
          <input
            v-model="newPlayerName"
            placeholder="Player Name"
            class="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            v-model.number="newPlayerNumber"
            type="number"
            min="0"
            placeholder="#"
            class="w-20 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            v-model="newPlayerPosition"
            class="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option v-for="p in positions" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>
        <button
          @click="addPlayer"
          class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition-colors"
        >
          Add Player
        </button>
      </div>
    </div>

    <!-- Players List Accordion -->
    <div class="bg-white border border-gray-300 rounded-2xl">
      <button
        class="w-full flex justify-between items-center px-4 py-3 text-left text-gray-700 font-medium"
        @click="showPlayers = !showPlayers"
      >
        <span>Players ({{ store.teams.selectedTeam.value?.players.length || 0 }})</span>
        <svg
          :class="{'rotate-180': showPlayers}"
          class="h-5 w-5 transition-transform"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <ul v-if="showPlayers" class="divide-y divide-gray-100 max-h-64 overflow-y-auto p-2">
        <li
          v-for="p in store.teams.selectedTeam.value?.players || []"
          :key="p.id"
          class="flex items-center justify-between p-2 bg-gray-50 rounded-lg mb-2"
        >
          <div class="flex items-center gap-2">
            <span class="font-semibold text-sm">{{ p.position }}</span>
            <span class="text-gray-500 text-sm">#{{ p.number }}</span>
            <NuxtLink :to="`/players/${p.id}`" class="text-blue-600 truncate max-w-xs">{{ p.name }}</NuxtLink>
          </div>
          <button
            @click="removePlayer(p.id, p.name, p.number)"
            class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
          >
            Remove
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>