<script setup lang="ts">
import type { DefenseBucket } from '~/types/pdf';


defineProps<{
  data: Map<string, DefenseBucket>
}>()

function format(stat: { total: number; scored: number }) {
  return `${stat.scored}/${stat.total}`
}
</script>

<template>
  <div class="m-4 rounded-xl shadow">
    <table class="w-full text-sm border-collapse">
      <thead>
        <tr class="border-b text-lg text-left">
          <th class="py-2 pl-4">Defense</th>
          <th>9m</th>
          <th>6m</th>
          <th>Wing</th>
          <th>7m</th>
          <th>Total</th>
          <th class="text-center">+7m</th>
          <th class="text-center">+2m</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="[label, bucket] in data"
          :key="label"
          class="border-b last:border-0 text-lg"
        >
          <td class="py-2 pl-4 font-medium">{{ label }}</td>

          <td>{{ format(bucket.by9m) }}</td>
          <td>{{ format(bucket.by6m) }}</td>
          <td>{{ format(bucket.byWing) }}</td>
          <td>{{ format(bucket.by7m) }}</td>
          <td class="font-semibold">{{ format(bucket.shots) }}</td>

          <td class="text-center text-green-600">
            {{ bucket.provoked7m }}
          </td>

          <td class="text-center text-red-600">
            {{ bucket.provoked2m }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
