<script setup lang="ts">
import { computed } from 'vue'
import type { PlayerForm } from '~/composables/seasonStats'

interface Props {
  form: PlayerForm | null
}

const props = defineProps<Props>()

const symbol = computed(() => {
  if (!props.form) return ''
  if (props.form.direction === 'up') return '▲'
  if (props.form.direction === 'down') return '▼'
  return '▬'
})

const colorClass = computed(() => {
  if (!props.form) return 'text-gray-300'
  if (props.form.direction === 'up') return 'text-emerald-600'
  if (props.form.direction === 'down') return 'text-red-500'
  return 'text-gray-400'
})

const title = computed(() => {
  if (!props.form) return 'Not enough matches for a form trend'
  const sign = props.form.delta > 0 ? '+' : ''
  return `Last ${props.form.window}: ${props.form.recentAvgValue} avg (${sign}${props.form.delta} vs season)`
})
</script>

<template>
  <span v-if="form" :class="colorClass" :title="title" class="inline-flex items-center gap-0.5 text-xs font-semibold">
    {{ symbol }}{{ form.recentAvgValue }}
  </span>
  <span v-else class="text-gray-300 text-xs">—</span>
</template>
