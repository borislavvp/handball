<template>
  <div>
    <div class="flex items-center justify-between w-full border-b  border-gray-400 mb-6">
      <div class="flex items-center text-lg font-semibold ">
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
      <div>
        <button 
        @click=""
        class="mr-20 bg-blue-900 text-white font-semibold text-lg rounded-md shadow px-4 py-2"
        >PDF</button>
      </div>
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
import type { Match } from '~/types/handball'

const props = defineProps<{ stats: MatchStats, match: Match }>()

const {$dialog} = useNuxtApp()

const store = useHandballStore()

const tabs = [
  'Players',
  'Goalkeepers',
  'Attack / Defense',
  'Shooting'
]

const deleteMatch = () => {
  $dialog.confirm({
    "title": `Deleting game vs ${props.match.opponent.toUpperCase()}`,
    "message": "Are you sure you want to delete the match?"
  }).then(() => {
    store.matches.deleteMatch(props.match)
  })
}

const openPDF = async () => {
  try {
    const response = await $fetch<ArrayBuffer>(`/api/match/pdf`, {
      method: 'POST',
      body: { matchId: props.match.id },
      responseType: 'arrayBuffer',
    });

    const blob = new Blob([response], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  } catch (error) {
    console.error('Error fetching PDF:', error);
  }
};


const active = ref('Players')
</script>

