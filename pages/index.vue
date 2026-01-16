<script setup lang="ts">
import { onMounted } from 'vue'
import { useHandballStore } from '~/composables/useHandballStore'
import Header from '~/components/layout/Header.vue'
import PlayersPanel from '~/components/layout/PlayersPanel.vue'
import MatchesPanel from '~/components/layout/MatchesPanel.vue'

const store = useHandballStore()

// onMounted(async () => {
//   if (!store.teams.selectedTeam.value) {
//     await store.initialize()
//   }
// })
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <Header />
    <div v-if="store.loading.value" class="flex flex-col items-center justify-center min-h-screen bg-white text-center">
      <div class="relative w-24 h-24 mb-6">
        <div class="absolute inset-0 rounded-full border-8 border-[#42b883] opacity-20"></div>
        <div class="absolute inset-0 rounded-full border-8 border-t-[#42b883] border-transparent animate-spin"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-xl font-bold text-[#42b883]">%</span>
        </div>
      </div>
      <h2 class="text-2xl font-semibold text-gray-800">Loading team data…</h2>
      <p class="text-gray-500 mt-2 text-sm">This may take a few seconds</p>
    </div>
    <div v-else class="p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
      <PlayersPanel class="xl:col-span-2" />
      <MatchesPanel />
    </div>
  </div>
</template>
