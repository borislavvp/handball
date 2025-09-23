<script setup lang="ts">
import { isEmpty } from '@nuxt/ui/runtime/utils/index.js';
import { useHandballStore } from '~/composables/useHandballStore';
const store = useHandballStore();
const newMatchName = ref('');

async function createMatch() {
  const name = newMatchName.value.trim() || 'New Match';
  const match = await store.createMatch(name);
  if (match) navigateTo(`/matches/${match.id}`);
}
const router = useRouter()
onMounted(async () => {
  await store.initialize();
  if(store.currentMatch.value){
    router.push({path:`/matches/${store.currentMatch.value.id}`})
  }
})
onActivated(() => {
  if(store.currentMatch.value){
    router.push({path:`/matches/${store.currentMatch.value.id}`})
  }
})
</script>

<template>
  <div class="p-4">
    <div v-if="!store.teams.value.length">
      Please create a team first!
    </div>
    <div v-else class="flex gap-2 items-center flex-wrap mb-4">
      <div v-if="!store.currentMatch.value">
        <input v-model="newMatchName" placeholder="Match opponent" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button :disabled="isEmpty(newMatchName)" @click="createMatch" class="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-colors">Create & Open</button>
      </div>
      
      <h3 class="text-lg font-medium text-gray-700 mb-2">Existing Matches</h3>
      <ul v-if="store.matches.value.length > 0" class="space-y-2">
        <li v-for="m in (store.matches.value)" :key="m?.id || 'empty'" class="flex items-center gap-2 p-2 border-b border-gray-100">
          <NuxtLink :to="`/matches/${m.id}`" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm">{{ m.opponent }}</NuxtLink>
          <span class="text-gray-500 text-sm">(team: {{ store.getTeam(m.teamid)?.name || 'Unknown' }})</span>
        </li>
      </ul>
    </div>
  </div>
</template>


