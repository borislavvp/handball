
<template>
  <div class="p-4">
    <div v-if="!store.teams.teams.value.length">
      Please create a team first!
    </div>
    <div v-else class="flex flex-col gap-2 mb-4">
      <div class="flex items-center space-x-2">
        <input v-model="newMatchName" placeholder="Match opponent" class="px-3 py-2 border w-full border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button :disabled="isEmpty(newMatchName)" @click="createMatch" class="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-colors">Start</button>
      </div>
      <div class="flex flex-col items-start">
        <h3 class="text-lg font-medium text-gray-700 mb-2">Existing Matches</h3>
        <ul v-if="store.matches.matches.value.length > 0" class="space-y-2 w-full">
          <div @click="seeMatch(m)" v-for="m in latestMatches" :key="m?.id || 'empty'" class="flex w-full items-center justify-between p-4 border border-gray-200 rounded bg-white shadow">
            
            <div class="flex items-center gap-2 ">
              <span class="text-md font-semibold uppercase text-white rounded-full border bg-red-600 px-2 py-1">{{ store.teams.getTeam(m.teamid)?.name || 'Unknown' }}</span>
              <span class="text-gray-900 italic text-sm">vs</span>
              <span class="text-md font-semibold uppercase text-gray-900 rounded-full border border-gray-900 px-2 py-1">{{ m.opponent }}</span>
            </div>
            <p 
              v-if="store.matches.currentMatch.value?.id === m.id"
              class="text-md w-35 text-center text-blue-500 border-2 select-none border-blue-500 font-semibold shadow-inner rounded-full px-2 py-1">
              {{store.matches.currentMatch.value?.time }}
            </p>
            <span v-else class="text-md italic text-gray-600">{{ formatDate(m.createdat) }}</span>
            <dropdown-menu>
              <template #trigger>
                <button class="rounded p-3 border border-gray-600 focus:bg-gray-200">⋮</button>
              </template>

              <dropdown-item
                v-if="m.result"
                action-id="pdf-item-42"
                :on-action="() => getPdf(m)"
              >
                PDF
              </dropdown-item>
              <dropdown-item
                action-id="edit-item-42"
                :on-action="() => console.log('edit', m.id)"
              >
                Edit
              </dropdown-item>

              <dropdown-item
                action-id="delete-item-42"
                :on-action="() => store.matches.deleteMatch(m.id!)"
                class="text-red-700"
              >
                Delete
              </dropdown-item>
          </dropdown-menu>

          </div>
        </ul>
      </div>
    </div>
  </div>
</template>



<script setup lang="ts">
import DropdownMenu from '~/components/shared/DropdownMenu.vue';
import DropdownItem from '~/components/shared/DropdownItem.vue';
import { isEmpty } from '@nuxt/ui/runtime/utils/index.js';
import { useHandballStore } from '~/composables/useHandballStore';
import type { Match } from '~/types/handball';

const store = useHandballStore();
const newMatchName = ref('');

async function createMatch() {
  const name = newMatchName.value.trim() || 'New Match';
  const match = await store.matches.createMatch(name);
  if (match) navigateTo(`/matches/active`);
}
const router = useRouter()

onMounted(async () => {
  if(!store.teams.selectedTeam.value){
    await store.initialize();
  }
})

const options = { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" };
const latestMatches = computed(() => store.matches.matches.value.sort((a,b) => new Date(b.createdat!).getTime() - new Date(a.createdat!).getTime()))

const formatDate = (iso?: string) => {
  if(!iso){
    return""
  }
  const date = new Date(iso);
  const formatted = date.toLocaleString("en-GB",options as Intl.DateTimeFormatOptions);
  return formatted
}

const seeMatch = (match: Match) => {
  if(store.matches.match.value?.data.value?.id === match.id){
    router.push({path:`/matches/active`})
  }else{
    router.push({path:`/matches/${match.id}`})
  }
}

const getPdf = async (match: Match) => {
  try {
    const response = await $fetch<ArrayBuffer>(`/api/match/pdf`, {
      method: 'POST',
      body: { matchId: match.id },
      responseType: 'arrayBuffer',
    });

    const blob = new Blob([response], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  } catch (error) {
    console.error('Error fetching PDF:', error);
  }
};

</script>
