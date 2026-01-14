<template>
  <div>
    <div class="flex gap-4 border-b mb-6">
      <button
        v-for="tab in tabs"
        :key="tab"
        @click="active = tab"
        class="pb-2 text-sm font-medium"
        :class="active === tab
          ? 'border-b-2 border-blue-500 text-blue-600'
          : 'text-gray-400 hover:text-gray-600'"
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

