<template>
  <div class="w-full">
    <!-- Track -->
    <div class="flex justify-between w-full items-center">
        <span class="font-semibold mr-4 text-lg">{{ label }}</span>
        <div
        v-if="showNumbers"
        class="mt-1 text-sm text-slate-600 text-right tabular-nums"
        >
        {{ (value === -1 ? 0 : value) }} / {{ total }}
        </div>
    </div>
    <div class="h-2 w-full rounded-full overflow-hidden" :class="fillClass">
      <!-- Fill -->
      <div
        class="h-full rounded-full transition-all duration-300 ease-out"
        :class="colorClass"
        :style="{ width: (value === -1 ? 0 : value) + '%' }"
      />
    </div>

    <!-- Optional label -->
    
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, required: true },
  label: { type: String, default: 'Stat' },
  showNumbers: { type: Boolean, default: false }
})
const total = 100;


const colorClass = computed(() => {
  if (props.value > 65) return 'bg-emerald-500'
  if (props.value >= 30) return 'bg-amber-500'
  return 'bg-red-500'
})

const fillClass = computed(() => {
  if(props.value === -1) return 'bg-slate-200'
  if (props.value > 65) return 'bg-emerald-200'
  if (props.value >= 30) return 'bg-amber-200'
  return 'bg-red-200'
})
</script>
