<script setup lang="ts">
import { computed } from 'vue'

interface PlayerStat {
  value: number
  goal: number
  miss: number
  assist: number
  unbalance: number
  provoke: number
  ['1on1win']: number
  lostball: number
  steal: number
  block: number
  defense: number
  defensex2: number
  ['1on1lost']: number
  penaltymade: number
  norebound: number
  twominutes: number
}

interface Props {
  player: {
    name: string
    recentStats: PlayerStat[]
  }
}

const props = defineProps<Props>()

// --- Compute attack & defense values ---
const matchStats = computed(() => {
  return props.player.recentStats.map((stats) => {
    const attackValue =
      (stats.goal - stats.miss) +
      ((stats.assist + stats.unbalance + stats.provoke + stats['1on1win']) -
        stats.lostball)

    const defenseValue =
      (stats.steal + stats.block + stats.defense + stats.defensex2) -
      stats['1on1lost'] -
      stats.penaltymade -
      stats.norebound -
      stats.twominutes

    return {
      attackValue,
      defenseValue,
      totalValue: stats.value
    }
  })
})

// --- Chart Data ---
const series = computed(() => [
  {
    name: 'Attack',
    type: 'column',
    data: matchStats.value.map((s) => s.attackValue)
  },
  {
    name: 'Defense',
    type: 'column',
    data: matchStats.value.map((s) => s.defenseValue)
  },
  {
    name: 'Player Value',
    type: 'line',
    data: matchStats.value.map((s) => s.totalValue)
  }
])

const chartOptions = computed<ApexCharts.ApexOptions>(() => ({
  chart: {
    height: 350,
    type: 'line',
    stacked: false,
    toolbar: { show: false },
    zoom: { enabled: false }
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    width: [1, 1, 4],
    curve: 'smooth'
  },
  xaxis: {
    categories: props.player.recentStats.map((_, i) => `Match ${i + 1}`),
    labels: {
      style: { colors: '#9CA3AF', fontWeight: 500 }
    }
  },
  yaxis: [
    {
      seriesName: 'Attack',
      axisBorder: { show: true, color: '#10B981' }, // green
      labels: { style: { colors: '#10B981' } },
      title: { text: 'Attack', style: { color: '#10B981' } }
    },
    {
      seriesName: 'Defense',
      opposite: true,
      axisBorder: { show: true, color: '#3B82F6' }, // blue
      labels: { style: { colors: '#3B82F6' } },
      title: { text: 'Defense', style: { color: '#3B82F6' } }
    },
    {
      seriesName: 'Player Value',
      opposite: true,
      axisBorder: { show: true, color: '#F59E0B' }, // orange
      labels: { style: { colors: '#F59E0B' } },
      title: { text: 'Value', style: { color: '#F59E0B' } }
    }
  ],
  tooltip: {
    theme: 'dark',
    shared: true,
    intersect: false
  },
  legend: {
    position: 'top',
    horizontalAlign: 'center',
    fontSize: '14px',
    labels: { colors: '#374151' }
  },
  colors: ['#10B981', '#3B82F6', '#F59E0B'] // green, blue, orange
}))
</script>

<template>
  <div class="w-full">
    <apexchart
      type="line"
      height="350"
      :options="chartOptions"
      :series="series"
    />
  </div>
</template>

<style scoped>
.w-full {
  width: 100%;
}
</style>
