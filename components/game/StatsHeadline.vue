<template>
    <div v-if="player" class="bg-white relative justify-between font-bold rounded-xl  border border-gray-200 flex text-gray-800 py-2 px-4 w-full text-2xl mb-4" >
        <span>{{ player.number }} {{ player.position }}</span>
        <span class="font-semibold">{{ player.name }}</span>
        <span class="content"></span>
        <span v-if="player.currentStats" 
            class="absolute right-0 -mt-4 mr-4 flex shadow-inner border  justify-center items-center rounded-full size-17 font-semibold "
            :class="player.currentStats?.value > 0 ? 'bg-emerald-600 border-emerald-800 text-white' :
            player.currentStats?.value === 0 ? 'bg-gray-100 border-gray-700 text-gray-800' :
             'bg-red-600 border-red-800 text-white'"
        >
            <span :class="player.currentStats?.value !== 0 && '-ml-2'">
                {{player.currentStats!.value > 0 ? `+${player.currentStats?.value}` : player.currentStats?.value }}
            </span>
        </span>
    </div>
    <span v-else class="bg-white items-center justify-center uppercase font-bold rounded-xl  border border-gray-200 flex text-gray-800 py-2 px-4 w-full text-2xl mb-4" >
        overview of team {{ store.teams.selectedTeam.value?.name }} shots
    </span>
</template>

<script setup lang="ts">
import type { Player} from '~/types/handball';

defineProps<{
    player:Player | null;
}>();

const store = useHandballStore();

</script>

<style scoped>

</style>
