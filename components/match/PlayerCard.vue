
<template>
  <div class="bg-white rounded-xl shadow p-4">
    <div class="flex justify-between items-center">
      <div>
        <div class="font-semibold">
          #{{ player.number }} {{ player.name }}
        </div>
        <div class="text-xs text-gray-400">
          Value: {{ player.value }}
        </div>
      </div>

      <div class="text-right">
        <div class="text-lg font-bold">
          {{ player.goalsTotal }}/{{ player.attempts }}
        </div>
        <div class="text-xs text-gray-400">
          {{ player.efficiency }}%
        </div>
      </div>
    </div>

    <!-- Shot distribution -->
    <div class="mt-4 grid grid-cols-5 gap-2 text-xs text-center">
      <StatBadge label="9m" :value="`${player.by9m.scored}/${player.by9m.total}`" />
      <StatBadge label="6m" :value="`${player.by6m.scored}/${player.by6m.total}`" />
      <StatBadge label="Wing" :value="`${player.byWing.scored}/${player.byWing.total}`" />
      <StatBadge label="7m" :value="`${player.by7m.scored}/${player.by7m.total}`" />
      <StatBadge label="FB" :value="`${player.fastbreak.scored}/${player.fastbreak.total}`" />
    </div>

    <!-- Defense -->
    <div class="mt-4 grid grid-cols-4 gap-2 text-xs">
      <MiniStat :stat="{label: 'Stl', value: player.steals}" />
      <MiniStat :stat="{label: 'Blk', value: player.blocks}" />
      <MiniStat :stat="{label: 'Def', value: player.defense}" />
      <MiniStat :stat="{label: 'LB', value: player.lostballs}" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MatchStats } from '~/shared/pdf/fetchMatchStats';
import MiniStat from './MiniStat.vue'
import StatBadge from './StatusBadge.vue'
defineProps<{ player: MatchStats['players'][number] }>()
</script>
