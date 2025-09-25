<script setup lang="ts">
import { useHandballStore } from '~/composables/useHandballStore';

const route = useRoute();
const store = useHandballStore();

const match = computed(() => store.getMatch(store.currentMatch.value!.id));
const team = computed(() => match.value ? store.getTeam(match.value.teamid) : null);

// Responsive orientation: horizontal on md+ screens, vertical on small
const isWide = ref(false);
let mq: MediaQueryList | null = null;
const update = () => {
  if (!mq) return;
  isWide.value = mq.matches;
  store.setOrientation(mq.matches ? 'horizontal' : 'vertical');
};

onMounted(() => {
  mq = window.matchMedia('(min-width: 768px)');
  mq.addEventListener('change', update);
  update();
});

onBeforeUnmount(() => {
  if (mq) mq.removeEventListener('change', update);
});
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
        <HandballCourt
            :orientation="store.orientation.value"
            :team="team!"
            :match="match!"
          />
        <!-- <div class="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <h2 class="text-xl font-semibold text-gray-900">{{ match.name }} — {{ team.name }}</h2>
        </div>
        <div class="flex-1">
          <HandballCourt
            :orientation="store.orientation.value"
            :court-image="courtImg"
            :team="team"
            :match="match"
            @assign="onAssign"
          />
        </div> -->
      </div>
    </div>
  </div>
</template>


