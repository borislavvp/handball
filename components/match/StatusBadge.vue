<!-- components/StatsBadge.vue -->
<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
}>()
</script>

<template>
  <div class="rounded-lg py-1 text-center">
    <span class="font-semibold text-lg mr-1">{{ value }}</span>
    <span class="text-sm opacity-90">{{ label }}</span>
  </div>
</template>

