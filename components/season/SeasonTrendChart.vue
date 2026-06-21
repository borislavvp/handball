<script setup lang="ts">
import { computed } from 'vue'
import type { SeasonTrendPoint } from '~/composables/seasonStats'

interface Props {
  trend: SeasonTrendPoint[]
}

const props = defineProps<Props>()

const series = computed(() => [
  {
    name: 'Value',
    type: 'column',
    data: props.trend.map(p => p.value)
  },
  {
    name: 'Efficiency %',
    type: 'line',
    data: props.trend.map(p => p.efficiency)
  }
])

const chartOptions = computed<ApexCharts.ApexOptions>(() => ({
  chart: {
    height: 320,
    type: 'line',
    stacked: false,
    toolbar: { show: false },
    zoom: { enabled: false }
  },
  dataLabels: { enabled: false },
  stroke: { width: [0, 4], curve: 'smooth' },
  plotOptions: { bar: { columnWidth: '45%', borderRadius: 4 } },
  xaxis: {
    categories: props.trend.map((p, i) => `${i + 1}. ${p.label}`),
    labels: {
      style: { colors: '#9CA3AF', fontWeight: 500 },
      rotate: -35,
      trim: true,
      maxHeight: 80
    }
  },
  yaxis: [
    {
      seriesName: 'Value',
      axisBorder: { show: true, color: '#6366F1' },
      labels: { style: { colors: '#6366F1' } },
      title: { text: 'Value', style: { color: '#6366F1' } }
    },
    {
      seriesName: 'Efficiency %',
      opposite: true,
      min: 0,
      max: 100,
      axisBorder: { show: true, color: '#10B981' },
      labels: {
        style: { colors: '#10B981' },
        formatter: (v: number) => `${Math.round(v)}%`
      },
      title: { text: 'Efficiency', style: { color: '#10B981' } }
    }
  ],
  tooltip: { theme: 'dark', shared: true, intersect: false },
  legend: {
    position: 'top',
    horizontalAlign: 'center',
    fontSize: '14px',
    labels: { colors: '#374151' }
  },
  colors: ['#6366F1', '#10B981']
}))
</script>

<template>
  <div class="w-full">
    <ClientOnly>
      <apexchart
        v-if="trend.length"
        type="line"
        height="320"
        :options="chartOptions"
        :series="series"
      />
      <p v-else class="text-sm text-gray-500 text-center py-8">
        No matches recorded yet.
      </p>
    </ClientOnly>
  </div>
</template>
