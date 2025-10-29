<template>
    <div class="bg-white relative justify-between font-bold rounded-xl  border border-gray-200 flex text-gray-800 py-2 px-4 w-full text-2xl mb-4" >
        <span>{{ player.number }} {{ player.position }}</span>
        <span class="font-semibold">{{ player.name }}</span>
        <span class="content"></span>
        <span v-if="player.currentStats" class="absolute right-0 -mt-4 mr-4 flex  shadow-inner border border-gray-300 justify-center items-center rounded-full size-17 bg-green-300 ">
            <span class="-ml-1">
                {{player.currentStats!.value > 0 ? `+${player.currentStats?.value}` : player.currentStats?.value }}
            </span>
        </span>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Player, Stats } from '~/types/handball';

const props = defineProps<{
    player:Player
}>();


</script>

<style scoped>

</style>
