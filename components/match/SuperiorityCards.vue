<template>
  <div class="space-y-4">
    <div
      v-for="[label, result] in data"
      :key="label"
      class="border rounded-lg p-4"
    >
      <div class="flex justify-between items-center mb-3">
        <h3 class="font-semibold">{{ label }}</h3>
        <span class="text-sm text-gray-500">
          {{ result.attacks }} attacks · {{ result.eff }}%
        </span>
      </div>

      <div class="grid grid-cols-3 gap-4 text-sm">
        
        <div>
          <div class="text-gray-500 text-xs">Goals</div>
          <div class="font-semibold">{{ result.scored }}/{{ result.scored + result.missed }}</div>
        </div>
        <div>
          <div class="text-gray-500 text-xs">Missed</div>
          <div class="font-semibold">{{ result.missed }}</div>
        </div>
        <div>
          <div class="text-gray-500 text-xs">Efficiency</div>
          <div class="font-semibold">{{ result.eff }}%</div>
        </div>

      </div>

      <!-- REACTIONS -->
      <div class="mt-4 bg-gray-50 rounded-md p-3">
        <div class="text-xs uppercase text-gray-500 mb-2">
          Attack reactions
        </div>

        <div class="grid grid-cols-3 gap-3 text-sm">
          <div class="bg-white rounded p-2 text-center shadow-sm">
            <div class="text-xs text-gray-500">Fastbreak</div>
            <div class="font-semibold">{{ result.reactions.fb }}</div>
          </div>
          <div class="bg-white rounded p-2 text-center shadow-sm">
            <div class="text-xs text-gray-500">Late defense</div>
            <div class="font-semibold">{{ result.reactions.ld }}</div>
          </div>
          <div class="bg-white rounded p-2 text-center shadow-sm">
            <div class="text-xs text-gray-500">Total</div>
            <div class="font-semibold">{{ result.reactions.total }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SuperiortyResult } from '~/shared/pdf/pdf';

defineProps<{
  data: Map<string, SuperiortyResult>
}>()
</script>

