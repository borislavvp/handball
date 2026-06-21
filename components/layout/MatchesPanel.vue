
<template>
  <section class="bg-white rounded-2xl shadow-sm p-6">
    <h2 class="text-xl font-semibold mb-4">Matches</h2>

    <div class="flex flex-col gap-2 mb-4">
      <div class="flex items-center gap-2">
        <span class="text-md text-gray-700">Opponent:</span>
        <ClientOnly>
          <DropdownMenu>
            <template #trigger>
              <button class="px-1 underline text-md text-blue-600 font-medium">
                {{ opponentTeam ? opponentTeam.name : "New team…" }}
              </button>
            </template>
            <DropdownItem :action-id="'__new__'" :on-action="clearOpponentTeam">New team…</DropdownItem>
            <DropdownItem
              v-for="t in opponentTeamOptions"
              :key="t.id"
              :action-id="t.name"
              :on-action="() => selectOpponentTeam(t.id)"
            >{{ t.name }}</DropdownItem>
          </DropdownMenu>
        </ClientOnly>
      </div>
      <div class="flex gap-2">
        <input
          v-model="newMatchName"
          :disabled="!!opponentTeam"
          placeholder="Opponent name"
          class="px-3 py-2 rounded-xl border bg-gray-50 text-md flex-1 disabled:opacity-60"
        />
        <button @click="createMatch" class="px-4 py-2 rounded bg-blue-600 text-white text-md hover:bg-blue-700">Start</button>
      </div>
    </div>

    <div class="flex flex-col space-y-3">
      <span class="text-gray-800 text-lg mt-2 mb-6">Ongoing matches</span>
      <match-item 
        v-if="latestActiveMatches.length > 0"
        v-for="m in latestActiveMatches" 
        :m="m.data.value"
        @click="seeMatch(m.data.value)"
      />
      <span class="mt-8 text-gray-800 text-lg border-t">Recent matches</span>
      <match-item 
          v-if="latestMatches.length>0"
          v-for="m in latestMatches" 
          :m="m"
          @click="seeResults(m)"
      />
      <div v-if="!latestActiveMatches.length && !latestMatches.length" class="text-gray-900 text-xl mt-2">
        No matches played yet.
      </div>
    </div>
  </section>
</template>

<!-- MatchesPanel.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useHandballStore } from '~/composables/useHandballStore'
import MatchItem from './MatchItem.vue'
import DropdownMenu from '~/components/shared/DropdownMenu.vue'
import DropdownItem from '~/components/shared/DropdownItem.vue'
import type { Match } from '~/types/handball'

const store = useHandballStore()
const router = useRouter()
const newMatchName = ref('')
const opponentTeamId = ref<number | null>(null)

// Teams you can face: every team in your roster except the home (selected) one.
const opponentTeamOptions = computed(() =>
  store.teams.teams.value.filter(t => t.id !== store.teams.selectedTeam.value?.id)
)
const opponentTeam = computed(() =>
  opponentTeamId.value != null
    ? store.teams.teams.value.find(t => t.id === opponentTeamId.value) ?? null
    : null
)

const selectOpponentTeam = (id: number) => {
  opponentTeamId.value = id
}
const clearOpponentTeam = () => {
  opponentTeamId.value = null
}

const latestActiveMatches = computed(() =>
  Array.from(store.matches.activeMatches.values()).filter(m => m.data.value.teamid === store.teams.selectedTeam.value?.id)
    .sort((a,b) => new Date(b.data.value.createdat!).getTime() - new Date(a.data.value.createdat!).getTime())
    .slice(0,10)
)
// const latestActiveMatches = computed(() =>
//   Array.from(store.matches.activeMatches.values())
//     .sort((a,b) => new Date(b.data.value.createdat!).getTime() - new Date(a.data.value.createdat!).getTime())
//     .slice(0,10)
// )

const latestMatches = computed(() =>
  store.matches.matches.value
    .filter((m) => m.result)
    .sort((a,b) => new Date(b.createdat!).getTime() - new Date(a.createdat!).getTime())
    .slice(0,10)
)

const createMatch = async () => {
  const opponentName = opponentTeam.value?.name ?? (newMatchName.value || 'New Match')
  const match = await store.matches.createMatch(opponentName, opponentTeam.value?.id ?? null)
  if (match) router.push('/matches/active')
}

const seeMatch = (m: Match) => store.matches.seeActiveMatch(m)

const seeResults = (m:Match) => router.push(`/matches/${m.id}`)

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-GB') : ''
</script>
