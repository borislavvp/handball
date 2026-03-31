<script setup lang="ts">
import type { SuperiortyResult } from '~/shared/pdf/pdf'

defineProps<{
  data: Map<string, SuperiortyResult>
}>()

function goals(r: SuperiortyResult) {
  return `${r.scored}/${r.scored + r.missed}`
}
</script>

<template>
  <div class="m-4 rounded-xl shadow">
    <table class="w-full text-sm border-collapse">
      <thead>
        <tr class="text-right ">
          <th></th>
          <th></th>
          <th class="text-lg">Shots</th>
          <th></th>
          <th></th>
          <th></th>
          <th class="text-lg">Reactions</th>
        </tr>
        <tr class="border-b text-left text-lg">
          <th class="py-2 pl-4">Situation</th>
          <th>Goals</th>
          <th>Missed</th>
          <th>Attacks %</th>
          <th>Efficiency %</th>
          <th class="text-center">FB</th>
          <th class="text-center">Late D</th>
          <th class="text-center">Total</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="[label, result] in data"
          :key="label"
          class="border-b last:border-0 text-lg"
        >
          <!-- Label -->
          <td class="py-2 pl-4 font-medium">
            {{ label }}
          </td>

          <!-- Core stats -->
          <td>{{ goals(result) }}</td>
          <td>{{ result.missed }}</td>
          <td>{{ result.attacks }}%</td>
          <td class="font-semibold">{{ result.eff }}%</td>

          <!-- Reactions -->
          <td class="text-center">
            {{ result.reactions.fb }}
          </td>

          <td class="text-center">
            {{ result.reactions.ld }}
          </td>

          <td class="text-center font-semibold">
            {{ result.reactions.total }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
