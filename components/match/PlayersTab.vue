
<template>
  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
    <PlayerCard
      v-for="p in players"
      :key="p.id"
      :player="p"
    />
  </div>
</template>



<script setup lang="ts">
import type { MatchStats } from "~/shared/pdf/fetchMatchStats";
import PlayerCard from "./PlayerCard.vue"
defineProps<{ players: MatchStats['players'] }>()
</script>

