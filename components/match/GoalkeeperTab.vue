<template>
  <div class="flex items-center justify-center gap-6 p-6">
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
