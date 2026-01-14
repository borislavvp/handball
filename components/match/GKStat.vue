<template>
  <div class="rounded-lg bg-neutral-900 p-3 text-center">
    <div class="text-xs text-neutral-400">{{ label }}</div>
    <div class="text-lg font-semibold">
      {{ data.saved }}/{{ data.total }}
    </div>
    <div class="text-xs text-neutral-500">
      {{ efficiency }}%
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  data: { saved: number; total: number };
}>()

const efficiency = computed(() =>
  props.data.total === 0
    ? 0
    : Math.round((props.data.saved / props.data.total) * 100)
)
</script>
