<template>
<div class="h-full w-full rounded bg-emerald-900 flex items-center justify-between px-8 text-white select-none">
    <div class="flex items-center space-x-3">
        <span class="text-xl font-semibold">{{ selectedPlayer.name }}</span>
        <div class="flex items-center space-x-1">
            <span class="text-3xl font-semibold">{{ selectedPlayer.number }}</span>
            <span class="text-xl font-semibold">{{ selectedPlayer.position }}</span>
        </div>
    </div>
    <span v-if="selectedPlayer.currentStats" class="text-xl font-semibold rounded px-8 py-2"
    :class="[
        selectedPlayer.currentStats?.value! < 0  ? 'bg-gradient-to-r from-red-700 from-10% via-red-800 via-30% to-red-900 to-90% text-white ' 
        : selectedPlayer.currentStats?.value! > 0 ? 'bg-gradient-to-b from-emerald-600 from-10% via-emerald-700 via-50% to-emerald-600 to-90% text-white ' 
        // : p.currentStats?.value > 0 ? 'bg-gradient-to-r from-emerald-700 from-10% via-emerald-800 via-30% to-emerald-900 to-90% text-white ' 
        // : p.currentStats?.value > 0 ? 'bg-emerald-600 text-white border-emerald-800' 
        : 'bg-gradient-to-r from-gray-200 from-10%  border to-white text-gray-900 border-gray-300',
    ]">
    {{ selectedPlayer.currentStats?.value! > 0 ? `+${selectedPlayer.currentStats?.value}` : selectedPlayer.currentStats?.value }}</span>
</div>
 
</template> 

<script setup lang="ts">
import { computed } from 'vue';
import type { Player } from '~/types/handball';
const props = defineProps<{
    selectedPlayer: Player
}>()
const store = useHandballStore();


</script>
