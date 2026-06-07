<template>
  <span
    ref="badgeRef"
    :class="[
      'flex shrink-0 items-center justify-center rounded-full text-lg font-semibold transition-transform',
      sizeClass,
      colorClass,
      flashing && 'flash-pulse',
    ]"
    :data-stat="lastFlashedStat"
  >
    <p :class="(value > 0 || value < 0) && '-ml-1'">{{ formatted }}</p>
  </span>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
    value: number
    playerId: number
    size?: 'sm' | 'md' | 'lg'
}>(), {
    size: 'md',
})

const { isFlashing, flash } = usePlayerFlash()

const flashing = ref(false)
const lastFlashedStat = ref<string | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null

const sizeClass = computed(() => {
    switch (props.size) {
        case 'sm': return 'size-8 text-sm'
        case 'lg': return 'size-12 text-xl'
        default: return 'size-10 text-lg'
    }
})

const colorClass = computed(() => {
    if (props.value < 0) return 'bg-gradient-to-r from-red-700 from-10% via-red-800 via-30% to-red-900 to-90% text-white'
    if (props.value > 0) return 'bg-gradient-to-b from-emerald-600 from-10% via-emerald-700 via-50% to-emerald-600 to-90% text-white'
    return 'bg-gradient-to-r from-gray-200 from-10% border to-white text-gray-900 border border-gray-300'
})

const formatted = computed(() => {
    if (props.value > 0) return `+${props.value}`
    return `${props.value}`
})

watch(() => flash.value, (next) => {
    if (next.playerId !== props.playerId) return
    if (next.timestamp === 0) return
    lastFlashedStat.value = next.stat
    flashing.value = true
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
        flashing.value = false
        lastFlashedStat.value = null
    }, 1400)
}, { deep: true })

onUnmounted(() => {
    if (timer) clearTimeout(timer)
})
</script>

<style scoped>
@keyframes value-flash-pulse {
    0% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(66, 184, 131, 0.7);
    }
    20% {
        transform: scale(1.35);
        box-shadow: 0 0 0 14px rgba(66, 184, 131, 0);
    }
    60% {
        transform: scale(1.15);
    }
    100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(66, 184, 131, 0);
    }
}

.flash-pulse {
    animation: value-flash-pulse 1.2s ease-out;
    z-index: 1;
}
</style>
