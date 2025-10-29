<template>
    <div class="flex flex-col w-full text-xl" >
    <!-- Attack Shooting Overview -->
    <!-- Defense Overview -->
    <!-- Extra Single Stats -->
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Player, Stats } from '~/types/handball';

const props = defineProps<{
    player: Player | null
}>()

const store = useHandballStore();


</script>

<style scoped>

</style>
