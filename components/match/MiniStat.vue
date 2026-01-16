<!-- components/MiniStat.vue -->
<script setup lang="ts">
import type { MiniStat } from "@/types/stats"

defineProps<{
  stat: MiniStat
}>()
</script>

<template>
  <div class="flex text-md w-14 text-center">
    <span class="mr-2">{{ stat.value }}</span>
    <span class="label">{{ stat.label }}</span>
  </div>
</template>
