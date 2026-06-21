
<template>
  <div class="h-screen flex flex-col">
    <div v-if="store.loading.value || stats === null" class="flex flex-col items-center justify-center min-h-screen bg-white text-center">
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
    <div v-else class="w-full">
      <div v-if="!match || !team " class="flex items-center justify-center h-full">
        <p class="text-lg text-gray-600"> Match not found. </p>
      </div>
      <div v-if="match && stats" class="flex-1 flex flex-col">
        <StatsHeader :match="match"/>
        <div
          v-if="hasOpponentTeam"
          class="flex items-center gap-3 px-5 py-2 bg-gray-100 border-b"
        >
          <span class="text-sm font-semibold text-gray-700">Analysis for:</span>
          <button
            @click="toggleViewedTeam"
            class="px-3 py-1.5 rounded-lg border-2 font-semibold text-sm"
            :class="
              isOpponentView
                ? 'border-rose-600 text-rose-700 bg-rose-50'
                : 'border-emerald-700 text-emerald-700 bg-emerald-50'
            "
          >
            {{ viewedTeam?.name ?? "—" }}
            <span class="ml-2 opacity-70">⇄ switch</span>
          </button>
        </div>
        <StatsTabs :stats="stats" :match="match" :team-id="activeViewTeamId" @stats-changed="loadStats(matchId, viewedTeamId)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHandballStore } from '~/composables/useHandballStore';
import StatsTabs from '@/components/match/StatsTabs.vue'
import StatsHeader from '@/components/match/StatsHeader.vue'
import { fetchMatchStats } from '~/shared/pdf/fetchMatchStats';

const route = useRoute();
const store = useHandballStore();
const matchId = computed(() => Number(route.params.id));

const match = computed(() => store.matches.getMatch(matchId.value));
const team = computed(() => match.value ? store.teams.getTeam(match.value.teamid) : null);

// Which team's analysis is shown. Defaults to the home team; can switch to the
// opponent when the match was played against an existing team.
const viewedTeamId = ref<number | null>(null);
const homeTeamId = computed(() => match.value?.teamid ?? null);
const opponentTeamId = computed(() => match.value?.opponentTeamId ?? null);
const hasOpponentTeam = computed(() => opponentTeamId.value != null);
const activeViewTeamId = computed(() => viewedTeamId.value ?? homeTeamId.value);
const isOpponentView = computed(
  () => hasOpponentTeam.value && activeViewTeamId.value === opponentTeamId.value
);
const viewedTeam = computed(() =>
  activeViewTeamId.value != null ? store.teams.getTeam(activeViewTeamId.value) : null
);

const stats = ref<any>(null)

async function loadStats(id: number, teamId?: number | null) {
  store.loadingState.fetching.value = true;
  try {
    if (!id || Number.isNaN(id)) {
      stats.value = null;
      return;
    }
    stats.value = await fetchMatchStats(id, teamId ?? undefined);
  } finally {
    store.loadingState.fetching.value = false;
  }
}

const toggleViewedTeam = async () => {
  if (!hasOpponentTeam.value) return;
  viewedTeamId.value = isOpponentView.value ? homeTeamId.value : opponentTeamId.value;
  await loadStats(matchId.value, viewedTeamId.value);
};

watch(
  () => route.params.id,
  async () => {
    viewedTeamId.value = homeTeamId.value;
    await loadStats(matchId.value, viewedTeamId.value);
  },
  { immediate: true }
);
</script>
