<script setup lang="ts">
import { useHandballStore } from '~/composables/useHandballStore';

const route = useRoute();
const store = useHandballStore();
const id = Number(route.params.id);

const match = computed(() => store.getMatch(id));
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
    <div v-if="!match || !team" class="flex items-center justify-center h-full">
      <p class="text-lg text-gray-600">{{store.loading.value ? 'Loading...' : 'Match not found.'}}</p>
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
</template>


