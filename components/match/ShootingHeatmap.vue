<script setup lang="ts">
import { computed } from "vue"
import type { ShootingHeatmapCell } from "@/types/stats"

const props = defineProps<{
  cells: ShootingHeatmapCell[]
  goalkeeper?: boolean
}>()

/**
 * Efficiency-based color scale
 */
function getColor(cell: ShootingHeatmapCell) {
  if (cell.attempts === 0) return "#2a2a2a"

  const eff = cell.goals / cell.attempts

  if (props.goalkeeper) {
    // GK: saves effectiveness (inverse logic visually)
    if (eff >= 0.5) return "#22c55e" // green
    if (eff >= 0.3) return "#eab308" // yellow
    return "#ef4444" // red
  }

  // Attack
  if (eff >= 0.6) return "#22c55e"
  if (eff >= 0.4) return "#eab308"
  return "#ef4444"
}

/**
 * Circle radius scaled by volume
 */
function getRadius(attempts: number) {
  if (attempts === 0) return 0
  return Math.min(9, 3 + attempts * 1.2)
}

const title = computed(() =>
  props.goalkeeper ? "Goalkeeper Shot Map" : "Team Shooting Map"
)
</script>

<template>
  <div class="space-y-3">
    <!-- Title -->
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-gray-700">
        {{ title }}
      </h3>

      <!-- Legend -->
      <div class="flex items-center gap-3 text-xs text-gray-500">
        <div class="flex items-center gap-1">
          <span class="w-3 h-3 rounded-full bg-green-500"></span>
          High
        </div>
        <div class="flex items-center gap-1">
          <span class="w-3 h-3 rounded-full bg-yellow-500"></span>
          Medium
        </div>
        <div class="flex items-center gap-1">
          <span class="w-3 h-3 rounded-full bg-red-500"></span>
          Low
        </div>
      </div>
    </div>

    <!-- Heatmap -->
    <svg
      viewBox="0 0 100 100"
      class="w-full rounded-xl bg-zinc-900 p-2"
    >
      <!-- Goal frame hint -->
      <rect
        x="20"
        y="5"
        width="60"
        height="6"
        rx="2"
        fill="#1f2937"
      />

      <g v-for="cell in cells" :key="`${cell.x}-${cell.y}`">
        <!-- Shot circle -->
        <circle
          :cx="cell.x"
          :cy="cell.y"
          :r="getRadius(cell.attempts)"
          :fill="getColor(cell)"
          fill-opacity="0.75"
        />

        <!-- Numbers -->
        <text
          v-if="cell.attempts > 0"
          :x="cell.x"
          :y="cell.y + 1.2"
          text-anchor="middle"
          font-size="3.2"
          fill="white"
          class="select-none"
        >
          {{ props.goalkeeper
            ? `${cell.goals}/${cell.attempts}`
            : `${cell.goals}/${cell.attempts}`
          }}
        </text>
      </g>
    </svg>

    <!-- Footer explanation -->
    <div class="text-xs text-gray-500 flex justify-between">
      <span>
        Circle size = volume
      </span>
      <span>
        {{ goalkeeper ? "Saves / Shots" : "Goals / Shots" }}
      </span>
    </div>
  </div>
</template>
