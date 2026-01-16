<script setup lang="ts">
import { computed } from 'vue'
import { useHandballStore } from '~/composables/useHandballStore'

const store = useHandballStore()

const router = useRouter()

const selectedTeamId = computed({
  get: () => store.teams.selectedTeam.value?.id,
  set: (id) => id && store.teams.selectTeam(id),
})


</script>

<template>
  <header class="flex sticky items-center justify-between bg-gray-800 w-full h-18 text-white px-6 text-2xl">
    <div class="flex items-center">
        <button @click="router.push('/')" class="p-2 rounded-full hover:bg-gray-100">
            Teams
        </button>
        <button class="p-2 rounded-full hover:bg-gray-100">
            Settings
        </button>
    </div>
    <!-- <select v-model="selectedTeamId" class="px-4 py-2 rounded-xl border bg-gray-50  text-sm font-medium">
        <option v-for="t in store.teams.teams.value" :key="t.id" :value="t.id">
            {{ t.name }}
        </option>
    </select> -->
  </header>
</template>