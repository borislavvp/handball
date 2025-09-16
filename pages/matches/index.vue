<script setup lang="ts">
import { useHandballStore } from '~/composables/useHandballStore';

const store = useHandballStore();
const newMatchName = ref('');
const selectedTeamId = ref<string | null>(null);

function createMatch() {
  if (!selectedTeamId.value) return;
  const name = newMatchName.value.trim() || 'New Match';
  const match = store.createMatch(name, selectedTeamId.value);
  if (match) navigateTo(`/matches/${match.id}`);
}
</script>

<template>
  <div class="p-4">
    <div class="flex gap-2 items-center flex-wrap mb-4">
      <input v-model="newMatchName" placeholder="Match name" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <span class="text-gray-500 text-sm">{{store.teams.value.length}} teams</span>
      <select v-model="selectedTeamId" v-if="store.teams.value.length > 0" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option disabled value="">Select team</option>
        <option v-for="t in store.teams.value" :key="t?.id || 'empty'" :value="t?.id">{{ t?.name }}</option>
      </select>
      <button :disabled="!selectedTeamId" @click="createMatch" class="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-colors">Create & Open</button>
    </div>

    <h3 class="text-lg font-medium text-gray-700 mb-2">Existing Matches</h3>
    <ul v-if="store.matches.value.length > 0" class="space-y-2">
      <li v-for="m in (store.matches.value)" :key="m?.id || 'empty'" class="flex items-center gap-2 p-2 border-b border-gray-100">
        <NuxtLink :to="`/matches/${m.id}`" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm">{{ m.name }}</NuxtLink>
        <span class="text-gray-500 text-sm">(team: {{ store.getTeam(m.teamId)?.name || 'Unknown' }})</span>
      </li>
    </ul>
  </div>
</template>


