<template>
  <div class="space-y-6 p-6">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-gray-500">Goals</p>
        <p class="text-2xl font-semibold text-gray-900">{{ totalGoals }}</p>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-gray-500">Saves</p>
        <p class="text-2xl font-semibold text-gray-900">{{ totalSaves }}</p>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-gray-500">Stops Without Recovery</p>
        <p class="text-2xl font-semibold text-gray-900">{{ totalStopsWithoutRecovery }}</p>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-gray-500">Fastbreaks</p>
        <p class="text-2xl font-semibold text-gray-900">{{ stats.fastBreaks.total }}</p>
      </div>
    </div>

    <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 class="text-lg font-semibold text-gray-900 mb-3">Stops Without Recovery by Area</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          v-for="area in noRecoveryAreaRows"
          :key="area.label"
          class="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
        >
          <span class="font-medium text-gray-700">{{ area.label }}</span>
          <span class="text-sm text-gray-600">{{ area.value }}</span>
        </div>
      </div>
    </div>

    <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 class="text-lg font-semibold text-gray-900 mb-3">Shooting by Area</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          v-for="area in areaRows"
          :key="area.label"
          class="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
        >
          <span class="font-medium text-gray-700">{{ area.label }}</span>
          <span class="text-sm text-gray-600">{{ area.value.goals }}/{{ area.value.total }} ({{ area.value.percent }}%)</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MatchStats } from '~/shared/pdf/fetchMatchStats';

const props = defineProps<{ stats: MatchStats }>();

const totalGoals = computed(() => props.stats.players.reduce((sum, p) => sum + p.goalsTotal, 0));
const totalSaves = computed(() => props.stats.goalkeepers.reduce((sum, g) => sum + g.totalSaves, 0));
const totalStopsWithoutRecovery = computed(() => props.stats.goalkeepers.reduce((sum, g) => sum + (g.stopsWithoutRecovery ?? 0), 0));

const areaRows = computed(() => {
  return Array.from(props.stats.areaStats.entries()).map(([label, value]) => ({ label, value }));
});

const noRecoveryAreaRows = computed(() => {
  const areas = props.stats.goalkeepers.reduce((acc, g) => {
    const byArea = g.stopsWithoutRecoveryByArea ?? { by9m: 0, by6m: 0, byWing: 0, by7m: 0, fastbreak: 0, breakthrough: 0 };
    acc.by9m += byArea.by9m;
    acc.by6m += byArea.by6m;
    acc.byWing += byArea.byWing;
    acc.by7m += byArea.by7m;
    acc.fastbreak += byArea.fastbreak;
    acc.breakthrough += byArea.breakthrough;
    return acc;
  }, { by9m: 0, by6m: 0, byWing: 0, by7m: 0, fastbreak: 0, breakthrough: 0 });
  return [
    { label: '9m', value: areas.by9m },
    { label: '6m', value: areas.by6m },
    { label: 'Wing', value: areas.byWing },
    { label: '7m', value: areas.by7m },
    { label: 'Fastbreak', value: areas.fastbreak },
    { label: 'Breakthrough', value: areas.breakthrough },
  ];
});
</script>
