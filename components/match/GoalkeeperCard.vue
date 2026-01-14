<template>
    <div class="font-semibold mb-3">
      #{{ keeper.number }} {{ keeper.name }} — {{ keeper.efficiency }}%
    </div>

    <div class="grid grid-cols-3 gap-4">
      <GKStat label="9m" :data="keeper.by9m" />
      <GKStat label="6m" :data="keeper.by6m" />
      <GKStat label="Wing" :data="keeper.byWing" />
      <GKStat label="7m" :data="keeper.by7m" />
      <GKStat label="Fast break" :data="keeper.fastbreak" />
    </div>
</template>

<script setup lang="ts">
import type { MatchStats } from '~/shared/pdf/fetchMatchStats';
import GKStat from './GKStat.vue'


const props = defineProps<{
  keeper: MatchStats['goalkeepers'][number]
}>()

</script>

<style scoped>
.keeper-card {
  background: #1c1c1c;
  padding: 16px;
  border-radius: 16px;
}
</style>
