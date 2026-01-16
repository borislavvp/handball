<template>
  <div class="flex gap-6">
    <ShootingHeatmap
      :cells="stats.totalPlayerGrid"
    />

    <ShootingHeatmap
      :cells="stats.totalGoalkeeperGrid"
      goalkeeper
    />
    {{ stats.totalGoalkeeperGrid }}
  </div>
</template>

<script setup lang="ts">
import ShootingHeatmap from "./ShootingHeatmap.vue"
import type { ShootingTabStats } from "@/types/stats"
defineProps<{
  stats: ShootingTabStats
}>()
</script>
