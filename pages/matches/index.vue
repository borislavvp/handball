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
const options = { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" };

const formatDate = (iso?: string) => {
  if(!iso){
    return""
  }
  const date = new Date(iso);
  const formatted = date.toLocaleString("en-GB",options as Intl.DateTimeFormatOptions);
  return formatted
}
</script>

<template>
  <div class="p-4">
    <div v-if="!store.teams.value.length">
      Please create a team first!
    </div>
    <div v-else class="flex flex-col gap-2 mb-4">
      <div v-if="!store.currentMatch.value" class="flex items-center space-x-2">
        <input v-model="newMatchName" placeholder="Match opponent" class="px-3 py-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button :disabled="isEmpty(newMatchName)" @click="createMatch" class="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-colors">Start</button>
      </div>
      <div class="flex flex-col items-start">
        <h3 class="text-lg font-medium text-gray-700 mb-2">Existing Matches</h3>
        <ul v-if="store.matches.value.length > 0" class="space-y-2 w-full">
          <div v-for="m in (store.matches.value)" :key="m?.id || 'empty'" class="flex w-full items-center justify-between p-4 border border-gray-200 rounded bg-white shadow">
            <div class="flex items-center gap-2 ">
              <span class="text-md font-semibold uppercase text-white rounded-full border bg-red-600 px-2 py-1">{{ store.getTeam(m.teamid)?.name || 'Unknown' }}</span>
              <span class="text-gray-900 italic text-sm">vs</span>
              <span class="text-md font-semibold uppercase text-gray-900 rounded-full border border-gray-900 px-2 py-1">{{ m.opponent }}</span>
            </div>
            <span class="text-sm italic text-gray-600">{{ formatDate(m.createdat) }}</span>
            </div>
        </ul>
      </div>
    </div>
  </div>
</template>


