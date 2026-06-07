<template>
  <span
    ref="badgeRef"
    :class="[
      'player-value-badge',
      'flex shrink-0 items-center justify-center rounded-full font-semibold transition-transform',
      sizeClass,
      colorClass,
      flashing && `flash-${kind}`,
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

const { flash } = usePlayerFlash()

const flashing = ref(false)
const lastFlashedStat = ref<string | null>(null)
const lastKind = ref<'positive' | 'negative' | 'neutral'>('neutral')
const lastTimestamp = ref(0)
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

const kind = computed(() => lastKind.value)

const trigger = async (next: { playerId: number | null, stat: string | null, kind: 'positive' | 'negative' | 'neutral', timestamp: number }) => {
    lastFlashedStat.value = next.stat
    lastKind.value = next.kind
    lastTimestamp.value = next.timestamp
    flashing.value = false
    await nextTick()
    flashing.value = true
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
        flashing.value = false
    }, 1100)
}

watch(() => flash.value, (next) => {
    if (next.playerId !== props.playerId) return
    if (next.timestamp === 0) return
    if (next.target !== 'value') return
    if (next.timestamp === lastTimestamp.value) return
    trigger(next)
}, { deep: true })

onUnmounted(() => {
    if (timer) clearTimeout(timer)
})
</script>

<style scoped>
.player-value-badge {
    transform-origin: center;
}

@keyframes pulse-positive {
    0%   { transform: scale(1);    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.9); }
    25%  { transform: scale(1.5);  box-shadow: 0 0 0 18px rgba(16, 185, 129, 0); }
    55%  { transform: scale(0.92); }
    100% { transform: scale(1);    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

@keyframes pulse-negative {
    0%   { transform: scale(1);    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.9); }
    25%  { transform: scale(1.5);  box-shadow: 0 0 0 18px rgba(239, 68, 68, 0); }
    55%  { transform: scale(0.92); }
    100% { transform: scale(1);    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

@keyframes pulse-neutral {
    0%   { transform: scale(1);    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.9); }
    25%  { transform: scale(1.4);  box-shadow: 0 0 0 14px rgba(59, 130, 246, 0); }
    100% { transform: scale(1);    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
}

.flash-positive { animation: pulse-positive 1s ease-out; }
.flash-negative { animation: pulse-negative 1s ease-out; }
.flash-neutral  { animation: pulse-neutral 1s ease-out; }
</style>
