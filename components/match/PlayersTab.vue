
<template>
  <div class="grid grid-cols-3 gap-4 p-6">
      <PlayerCard
        v-for="p in players.sort((a, b) => b.value - a.value)"
        :key="p.id"
        :player="p"
      />
    </div>
</template>



<script setup lang="ts">
import type { MatchStats } from "~/shared/pdf/fetchMatchStats";
import PlayerCard from "./PlayerCard.vue"
const props = defineProps<{ players: MatchStats['players'] }>()


</script>

