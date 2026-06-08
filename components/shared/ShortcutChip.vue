<template>
    <span
        v-if="combo"
        :class="[
            'shortcut-chip inline-flex items-center justify-center font-mono font-semibold leading-none',
            'border border-gray-400 rounded px-1 py-px text-gray-600 bg-white/80',
            size === 'sm' ? 'text-[10px] min-w-[18px] h-[14px]' : 'text-xs min-w-[22px] h-[18px]',
        ]"
    >{{ combo }}</span>
</template>

<script setup lang="ts">
defineProps<{
    combo?: string | null;
    size?: 'sm' | 'md';
}>();
</script>

<style scoped>
.shortcut-chip {
    user-select: none;
    pointer-events: none;
}
</style>
