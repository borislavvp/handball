<!-- components/StatsBadge.vue -->
<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
}>()
</script>

<template>
  <div class="stats-badge">
    <span class="value">{{ value }}</span>
    <span class="label">{{ label }}</span>
  </div>
</template>

<style scoped>
.stats-badge {
  padding: 8px 12px;
  border-radius: 12px;
  background: #111;
  color: white;
  text-align: center;
}
.value {
  font-size: 18px;
  font-weight: 600;
}
.label {
  font-size: 12px;
  opacity: 0.7;
}
</style>
