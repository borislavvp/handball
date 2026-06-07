<template>
  <div class="rounded-lg p-3 text-center" :class="getSaveClass">
    <div class="flex items-center w-full justify-center px-2">
      <span class="text-md text--400 mr-4">{{ label }}</span>
      <span class="text-md font-semibold text-white">
        {{ efficiency }}%
      </span>
    </div>
    <span class="text-2xl font-semibold">
      {{ data.saved }}/{{ data.total }}<span v-if="noRecoveryCount" class="ml-1 text-sm font-semibold text-orange-200">({{ noRecoveryCount }})</span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  data: { saved: number; total: number };
  noRecoveryCount?: number;
}>()

const efficiency = computed(() =>
  props.data.total === 0
    ? 0
    : Math.round((props.data.saved / props.data.total) * 100)
)


const getSaveClass = computed(() => {
  if (efficiency.value >= 70) {
    return 'bg-emerald-700 text-white';
  } else if (efficiency.value >= 40) {
    return 'bg-amber-600 text-white';
  } else {
    return 'bg-red-800 text-white';
  }
})


</script>
