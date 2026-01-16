
<!-- MatchesPanel.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useHandballStore } from '~/composables/useHandballStore'
import DropdownMenu from '~/components/shared/DropdownMenu.vue'
import DropdownItem from '~/components/shared/DropdownItem.vue'
import type { Match } from '~/types/handball'

const store = useHandballStore()
const router = useRouter()
const newMatchName = ref('')

const latestMatches = computed(() =>
  [...store.matches.matches.value.filter(m => m.teamid === store.teams.selectedTeam.value?.id)]
    .sort((a,b) => new Date(b.createdat!).getTime() - new Date(a.createdat!).getTime())
)

const createMatch = async () => {
  const match = await store.matches.createMatch(newMatchName.value || 'New Match')
  if (match) router.push('/matches/active')
}

const seeMatch = (m: Match) => {
  router.push(store.matches.currentMatch.value?.id === m.id
    ? '/matches/active'
    : `/matches/${m.id}`)
}

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-GB') : ''
</script>

<template>
  <section class="bg-white rounded-2xl shadow-sm p-6">
    <h2 class="text-xl font-semibold mb-4">Matches</h2>

    <div class="flex gap-2 mb-4">
      <input v-model="newMatchName" placeholder="Opponent" class="px-3 py-2 rounded-xl border bg-gray-50 text-md flex-1" />
      <button @click="createMatch" class="px-4 py-2 rounded bg-blue-600 text-white text-md hover:bg-blue-700">Start</button>
    </div>

    <div class="space-y-3">
      <div v-if="latestMatches.length" v-for="m in latestMatches" :key="m.id"
           @click="seeMatch(m)"
           class="p-4 rounded-xl border-2 cursor-pointer " :class="m.result === 'LOST' ? 'border-red-600' : m.result === 'WIN' ? 'border-emerald-600' : 'border-blue-600'"
        >
        <div class="flex justify-between items-center">
          <div class="flex gap-2 items-center w-35">
            <span class="px-2 py-1 rounded text-md font-semibold bg-gray-800 text-white">{{ store.teams.getTeam(m.teamid)?.name }}</span>
            <span class="italic">vs</span>
            <span class="py-1 rounded text-md font-semibold text-gray-800">{{ m.opponent }}</span>
          </div>
          <span class="text-white px-2 py-1 rounded-full shadow-inner" 
          :class="m.result === 'LOST' ? 
          'bg-red-600' : m.result === 'WIN' ? 
          'bg-emerald-600' :
          'bg-blue-600'"
          >{{ m.result === 'LOST' ? 'Lost' : m.result === 'WIN' ? 'Won' : store.matches.currentMatch.value?.time }}</span>
          <!-- <DropdownMenu>
            <template #trigger>
              <button class="p-2 border rounded">⋮</button>
            </template>
            <DropdownItem action-id="pdf" v-if="m.result" :on-action="() => $emit('pdf', m)">PDF</DropdownItem>
            <DropdownItem action-id="delete" :on-action="() => store.matches.deleteMatch(m.id!)" class="text-red-600">Delete</DropdownItem>
          </DropdownMenu> -->
          <span class="text-md text-gray-900">{{ formatDate(m.createdat) }}</span>
        </div>
      </div>
      <div v-else class="text-gray-900 text-xl mt-2">
        No matches played yet.
      </div>
    </div>
  </section>
</template>
