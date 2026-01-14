<!-- components/MiniStat.vue -->
<script setup lang="ts">
import type { MiniStat } from "@/types/stats"

defineProps<{
  stat: MiniStat
}>()
</script>

<template>
  <div class="mini-stat">
    <span class="label">{{ stat.label }}</span>
    <span class="value">{{ stat.value }}</span>
  </div>
</template>

<style scoped>
.mini-stat {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}
</style>
