<template>
  <div
    class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
  >
    <div
      class="relative bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600 rounded-2xl p-4 w-64 shadow-2xl text-center text-gray-900"
      @click.stop
    >
      <!-- Player header -->
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm font-semibold uppercase">{{ player.position }}</span>
        <span class="text-lg font-bold">#{{ player.number }}</span>
      </div>

      <!-- Player name -->
      <h2 class="text-xl font-bold mb-4">{{ player.name }}</h2>

      <!-- Stats grid -->
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div v-for="(value, stat) in player.stats" :key="stat" class="flex justify-between">
          <span class="capitalize">{{ stat }}</span>
          <span class="font-bold">{{ value }}</span>
        </div>
      </div>

      <!-- Close button -->
      <button
        @click="close"
        class="absolute top-2 right-2 bg-white rounded-full w-7 h-7 flex items-center justify-center text-gray-800 font-bold shadow-md hover:bg-gray-100"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import type { Player } from "~/types/handball";

interface Props {
  player:Player
}

const props = defineProps<Props>()
const emit = defineEmits(["close"])


function close() {
  emit("close")
}
</script>
