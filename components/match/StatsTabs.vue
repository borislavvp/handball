<template>
  <div>
    <div class="flex items-center justify-center text-lg font-semibold border-b border-gray-400 mb-6">
      <button
        v-for="tab in tabs"
        :key="tab"
        @click="active = tab"
        class="p-4"
        :class="active === tab
          ? 'border-b-2 border-blue-800 text-blue-800'
          : 'text-gray-500 '"
      >
        {{ tab }}
      </button>
    </div>

    <PlayersTab v-if="active === 'Players' && stats?.players" :players="stats.players" />
    <GoalkeepersTab v-if="active === 'Goalkeepers' && stats?.goalkeepers" :goalkeepers="stats.goalkeepers" />
    <AttackDefenseTab v-if="active === 'Attack / Defense' && stats" :stats="stats" />
    <ShootingTab v-if="active === 'Shooting' && stats?.shooting" :stats="stats.shooting" />
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import PlayersTab from './PlayersTab.vue'
import GoalkeepersTab from './GoalkeeperTab.vue'
import AttackDefenseTab from './AttackDefenseTab.vue'
import ShootingTab from './ShootingTab.vue'
import type { MatchStats } from '~/shared/pdf/fetchMatchStats'

defineProps<{ stats: MatchStats }>()

const tabs = [
  'Players',
  'Goalkeepers',
  'Attack / Defense',
  'Shooting'
]

const active = ref('Players')
</script>

