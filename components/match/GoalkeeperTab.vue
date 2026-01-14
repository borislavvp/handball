<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <GoalkeeperCard
      v-for="gk in goalkeepers"
      :key="gk.id"
      :keeper="gk"
    />
  </div>
</template>

<script setup lang="ts">
import type { MatchStats } from "~/shared/pdf/fetchMatchStats";
import GoalkeeperCard from "./GoalkeeperCard.vue"
defineProps<{ goalkeepers: MatchStats['goalkeepers'] }>()
</script>
