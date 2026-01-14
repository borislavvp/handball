
<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm border-collapse">
      <thead>
        <tr class="border-b text-left">
          <th class="py-2 pr-4">Defense</th>
          <th>9m</th>
          <th>6m</th>
          <th>Wing</th>
          <th>Total</th>
          <th class="text-center">Stl.</th>
          <th class="text-center">7m</th>
          <th class="text-center">2m</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="[label, bucket] in data"
          :key="label"
          class="border-b last:border-0"
        >
          <td class="py-2 pr-4 font-medium">{{ label }}</td>

          <td>{{ format(bucket.by9m) }}</td>
          <td>{{ format(bucket.by6m) }}</td>
          <td>{{ format(bucket.byWing) }}</td>
          <td class="font-semibold">{{ format(bucket.shots) }}</td>

          <td class="text-center text-blue-600">
            {{ bucket.steals }}
          </td>

          <td class="text-center text-red-600">
            {{ bucket.commitedSeven }}
          </td>

          <td class="text-center text-red-600">
            {{ bucket.twoMinutesCommitted }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { DefenseTypeBucket } from '~/types/pdf';

defineProps<{
  data: Map<string, DefenseTypeBucket>
}>()

function format(stat: { total: number; saved: number }) {
  return `${stat.saved}/${stat.total}`
}
</script>
