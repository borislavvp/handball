<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useHandballStore } from '~/composables/useHandballStore'
import {
  aggregatePlayerSeason,
  computeTeamSeason,
  AREA_LABELS
} from '~/composables/seasonStats'
import type { Player } from '~/types/handball'

const store = useHandballStore()
const router = useRouter()

onMounted(async () => {
  if (!store.teams.selectedTeam.value) {
    await store.initialize()
  }
})

const team = computed(() => store.teams.selectedTeam.value)

const teamSeason = computed(() =>
  team.value ? computeTeamSeason(team.value.players) : null
)

type Row = {
  player: Player
  isGk: boolean
  season: ReturnType<typeof aggregatePlayerSeason>
}

const rows = computed<Row[]>(() => {
  const players = team.value?.players ?? []
  return players
    .map(player => ({
      player,
      isGk: player.position === 'GK',
      season: aggregatePlayerSeason(player.recentStats ?? [], player.id)
    }))
    .filter(r => r.season.matches > 0)
})

// --- Sortable field leaderboard ---
type SortKey =
  | 'number'
  | 'matches'
  | 'goalsPerGame'
  | 'efficiency'
  | 'attack'
  | 'defense'
  | 'avgValue'
  | 'form'

const sortKey = ref<SortKey>('avgValue')
const sortDir = ref<'asc' | 'desc'>('desc')

function sortValue(r: Row, key: SortKey): number {
  switch (key) {
    case 'number':
      return r.player.number
    case 'matches':
      return r.season.matches
    case 'goalsPerGame':
      return r.season.goalsPerGame
    case 'efficiency':
      return r.season.efficiency
    case 'attack':
      return r.season.attack
    case 'defense':
      return r.season.defense
    case 'avgValue':
      return r.season.avgValue
    case 'form':
      return r.season.form?.delta ?? -Infinity
  }
}

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortKey.value = key
    // Player number reads naturally low-to-high; metrics best-first.
    sortDir.value = key === 'number' ? 'asc' : 'desc'
  }
}

function sortIndicator(key: SortKey): string {
  if (sortKey.value !== key) return ''
  return sortDir.value === 'desc' ? ' ↓' : ' ↑'
}

const fieldRows = computed(() => {
  const list = rows.value.filter(r => !r.isGk)
  const dir = sortDir.value === 'desc' ? -1 : 1
  return [...list].sort((a, b) => {
    const diff = sortValue(a, sortKey.value) - sortValue(b, sortKey.value)
    if (diff !== 0) return diff * dir
    return a.player.number - b.player.number // stable tiebreak
  })
})

const gkRows = computed(() =>
  rows.value.filter(r => r.isGk).sort((a, b) => b.season.gkSaves - a.season.gkSaves)
)

// --- CSV export ---
function csvCell(value: string | number): string {
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function exportCsv() {
  const header = [
    'Number', 'Name', 'Position', 'Matches', 'Goals', 'GoalsPerGame',
    'Efficiency%', 'Attack%', 'Defense%', 'SavePercent', 'AvgValue',
    'TotalValue', 'RecentAvgValue', 'FormDelta', 'BestZone', 'BestZoneRate%'
  ]
  const lines = rows.value.map(r => {
    const s = r.season
    return [
      r.player.number,
      r.player.name,
      r.player.position,
      s.matches,
      s.totals.goal,
      s.goalsPerGame,
      s.efficiency,
      s.attack,
      s.defense,
      s.gkSaves,
      s.avgValue,
      s.totalValue,
      s.form ? s.form.recentAvgValue : '',
      s.form ? s.form.delta : '',
      s.bestZone ? AREA_LABELS[s.bestZone.area] : '',
      s.bestZone ? s.bestZone.goalRate : ''
    ].map(csvCell).join(',')
  })
  const csv = [header.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const safeName = (team.value?.name ?? 'team').replace(/[^a-z0-9]+/gi, '_').toLowerCase()
  a.href = url
  a.download = `${safeName}_season_stats.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-5xl mx-auto p-4 space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Season Overview</h1>
        <div class="flex items-center gap-3">
          <span v-if="team" class="text-sm text-gray-500">{{ team.name }}</span>
          <button
            v-if="rows.length"
            @click="exportCsv"
            class="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-800 text-white hover:bg-gray-700"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div v-if="store.loading.value" class="text-gray-600">Loading season data…</div>

      <template v-else-if="teamSeason">
        <!-- Team season band -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div class="bg-white shadow rounded-2xl p-4 text-center">
            <p class="text-2xl font-bold text-gray-900">
              {{ teamSeason.wins }}<span class="text-gray-400">–</span>{{ teamSeason.losses }}
            </p>
            <p class="text-xs text-gray-500 mt-1">Record ({{ teamSeason.matchesPlayed }} played)</p>
          </div>
          <div class="bg-white shadow rounded-2xl p-4 text-center">
            <p class="text-2xl font-bold text-gray-900">
              {{ teamSeason.goalsFor }}<span class="text-gray-400">:</span>{{ teamSeason.goalsAgainst }}
            </p>
            <p class="text-xs text-gray-500 mt-1">Goals (for : against)</p>
          </div>
          <div class="bg-white shadow rounded-2xl p-4 text-center">
            <p class="text-2xl font-bold text-emerald-600">{{ teamSeason.attack }}%</p>
            <p class="text-xs text-gray-500 mt-1">Attack efficiency</p>
          </div>
          <div class="bg-white shadow rounded-2xl p-4 text-center">
            <p class="text-2xl font-bold text-blue-600">{{ teamSeason.defense }}%</p>
            <p class="text-xs text-gray-500 mt-1">Defense efficiency</p>
          </div>
          <div class="bg-white shadow rounded-2xl p-4 text-center">
            <p class="text-2xl font-bold text-amber-600">{{ teamSeason.gkSaves }}%</p>
            <p class="text-xs text-gray-500 mt-1">GK save rate</p>
          </div>
        </div>

        <!-- Field player leaderboard -->
        <div class="bg-white shadow rounded-2xl p-4">
          <h2 class="text-lg font-semibold text-gray-900 mb-3">Field Players</h2>
          <div v-if="!fieldRows.length" class="text-sm text-gray-500 py-4">
            No field-player stats recorded yet.
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-gray-500 border-b select-none">
                  <th class="py-2 pr-2 font-medium cursor-pointer hover:text-gray-800" @click="toggleSort('number')">#{{ sortIndicator('number') }}</th>
                  <th class="py-2 pr-2 font-medium">Player</th>
                  <th class="py-2 px-2 font-medium text-right cursor-pointer hover:text-gray-800" @click="toggleSort('matches')">GP{{ sortIndicator('matches') }}</th>
                  <th class="py-2 px-2 font-medium text-right cursor-pointer hover:text-gray-800" @click="toggleSort('goalsPerGame')">Goals/G{{ sortIndicator('goalsPerGame') }}</th>
                  <th class="py-2 px-2 font-medium text-right cursor-pointer hover:text-gray-800" @click="toggleSort('efficiency')">Eff%{{ sortIndicator('efficiency') }}</th>
                  <th class="py-2 px-2 font-medium text-right cursor-pointer hover:text-gray-800" @click="toggleSort('attack')">Atk%{{ sortIndicator('attack') }}</th>
                  <th class="py-2 px-2 font-medium text-right cursor-pointer hover:text-gray-800" @click="toggleSort('defense')">Def%{{ sortIndicator('defense') }}</th>
                  <th class="py-2 px-2 font-medium text-right cursor-pointer hover:text-gray-800" @click="toggleSort('avgValue')">Avg Val{{ sortIndicator('avgValue') }}</th>
                  <th class="py-2 px-2 font-medium text-right cursor-pointer hover:text-gray-800" @click="toggleSort('form')">Form{{ sortIndicator('form') }}</th>
                  <th class="py-2 pl-2 font-medium">Best zone</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="r in fieldRows"
                  :key="r.player.id"
                  class="border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                  @click="router.push(`/players/${r.player.id}`)"
                >
                  <td class="py-2 pr-2 text-gray-500">{{ r.player.number }}</td>
                  <td class="py-2 pr-2 font-medium text-gray-900">
                    {{ r.player.name }}
                    <span class="text-xs text-gray-400">· {{ r.player.position }}</span>
                  </td>
                  <td class="py-2 px-2 text-right">{{ r.season.matches }}</td>
                  <td class="py-2 px-2 text-right">{{ r.season.goalsPerGame }}</td>
                  <td class="py-2 px-2 text-right">{{ r.season.efficiency }}%</td>
                  <td class="py-2 px-2 text-right text-emerald-600">{{ r.season.attack }}%</td>
                  <td class="py-2 px-2 text-right text-blue-600">{{ r.season.defense }}%</td>
                  <td
                    class="py-2 px-2 text-right font-semibold"
                    :class="r.season.avgValue >= 0 ? 'text-gray-900' : 'text-red-500'"
                  >
                    {{ r.season.avgValue > 0 ? '+' : '' }}{{ r.season.avgValue }}
                  </td>
                  <td class="py-2 px-2 text-right">
                    <FormIndicator :form="r.season.form" />
                  </td>
                  <td class="py-2 pl-2 text-gray-600">
                    <template v-if="r.season.bestZone">
                      {{ AREA_LABELS[r.season.bestZone.area] }}
                      <span class="text-xs text-gray-400">{{ r.season.bestZone.goalRate }}%</span>
                    </template>
                    <span v-else class="text-gray-300">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Goalkeeper leaderboard -->
        <div v-if="gkRows.length" class="bg-white shadow rounded-2xl p-4">
          <h2 class="text-lg font-semibold text-gray-900 mb-3">Goalkeepers</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-gray-500 border-b">
                  <th class="py-2 pr-2 font-medium">#</th>
                  <th class="py-2 pr-2 font-medium">Player</th>
                  <th class="py-2 px-2 font-medium text-right">GP</th>
                  <th class="py-2 px-2 font-medium text-right">Saves</th>
                  <th class="py-2 px-2 font-medium text-right">Save%</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="r in gkRows"
                  :key="r.player.id"
                  class="border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                  @click="router.push(`/players/${r.player.id}`)"
                >
                  <td class="py-2 pr-2 text-gray-500">{{ r.player.number }}</td>
                  <td class="py-2 pr-2 font-medium text-gray-900">{{ r.player.name }}</td>
                  <td class="py-2 px-2 text-right">{{ r.season.matches }}</td>
                  <td class="py-2 px-2 text-right">{{ r.season.totals.gksave }}</td>
                  <td class="py-2 px-2 text-right text-amber-600">{{ r.season.gkSaves }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>

      <div v-else class="text-gray-600">Select a team to view season analytics.</div>
    </div>
  </div>
</template>
