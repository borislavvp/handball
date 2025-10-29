<script setup lang="ts">
import { useHandballStore } from '~/composables/useHandballStore';

const route = useRoute();
const store = useHandballStore();
const id = Number(route.params.id);

const match = computed(() => store.matches.getMatch(id));
const team = computed(() => match.value ? store.teams.getTeam(match.value.teamid) : null);

</script>

<template>
  <div class="h-screen flex flex-col">
    <div v-if="store.loading.value" class="flex flex-col items-center justify-center min-h-screen bg-white text-center">
      <div class="relative w-24 h-24 mb-6">
        <div class="absolute inset-0 rounded-full border-8 border-[#42b883] opacity-20"></div>
        <div class="absolute inset-0 rounded-full border-8 border-t-[#42b883] border-transparent animate-spin"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-xl font-bold text-[#42b883]">%</span>
        </div>
      </div>
      <h2 class="text-2xl font-semibold text-gray-800">Syncing match stats…</h2>
      <p class="text-gray-500 mt-2 text-sm">This may take a few seconds</p>
    </div>
    <div class="w-full">
      <div v-if="!match || !team" class="flex items-center justify-center h-full">
        <p class="text-lg text-gray-600"> 'Match not found.'</p>
      </div>
      <div v-else class="flex-1 flex flex-col">
       Match statistics soon
      </div>
    </div>
  </div>
</template>


