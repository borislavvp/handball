
<template>
  <section class="bg-white rounded-2xl shadow-sm p-6">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center">
        <h2 class="text-xl font-semibold mr-4">Team:</h2>
        <ClientOnly>
          <DropdownMenu>
            <template #trigger>
              <button class="px-1 underline text-xl text-blue-600 font-medium">
                {{ store.teams.selectedTeam.value?.name }}</button>
              </template>
              <DropdownItem v-for="t in store.teams.teams.value.filter(n => n.id !== store.teams.selectedTeam.value?.id)" :key="t.id" :action-id="t.name" 
                :on-action="() => store.teams.selectTeam(t.id)">{{ t.name }}</DropdownItem>
          </DropdownMenu>
        </ClientOnly>
      </div>
      <div>
        <span class="text-xl font-semibold mr-4">New team</span>
        <input :disabled="store.loading.value" v-model="newTeamName" placeholder="Team Name" class="px-3 py-2 rounded border bg-gray-50 text-md mr-2" />
        <button :disabled="store.loading.value" 
        @click="store.teams.addTeam(newTeamName)" 
        class="px-4 py-2 rounded bg-blue-600 text-white text-md hover:bg-blue-700"
        :class="store.loading.value ? 'opacity-50 cursor-not-allowed' : ''"
        >
          Add
        </button>
      </div>
    </div>

    <div class="grid sm:grid-cols-2 gap-3">
      <div v-if="store.teams.selectedTeam.value?.players.length"
       v-for="p in store.teams.selectedTeam.value?.players || []" :key="p.id"
           class="p-3 rounded-xl bg-gray-50 flex justify-between">
        <div class="flex gap-2">
          <span class="text-md font-bold">{{ p.position }}</span>
          <span class="text-md text-gray-800">#{{ p.number }}</span>
          <span class="font-medium">{{ p.name }}</span>
        </div>
        <NuxtLink :to="`/players/${p.id}`" class="text-blue-600 text-md">Stats</NuxtLink>
      </div>
      <div v-else class="col-span-2 text-xl text-gray-900">
        <div>No players added yet.</div>
        <div>Add players using the form below.</div>
      </div>
    </div>

    <div class="mt-6 border-t pt-4 flex gap-2 flex-wrap">
      <input v-model="name" placeholder="Name" class="px-3 py-2 rounded border bg-gray-50 text-md" />
      <input v-model.number="number" placeholder="#" type="number" class="px-3 py-2 rounded border bg-gray-50 text-md w-20" />
      <select v-model="position" class="px-3 py-2 rounded border bg-gray-50 text-md">
        <option v-for="p in positions" :key="p">{{ p }}</option>
      </select>
      <button @click="addPlayer" class="ml-4 px-4 py-2 rounded bg-blue-600 text-white text-md hover:bg-blue-700">Add</button>
    </div>
  </section>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import type { Position } from '~/types/handball'
import { useHandballStore } from '~/composables/useHandballStore'
import DropdownMenu from '~/components/shared/DropdownMenu.vue'
import DropdownItem from '~/components/shared/DropdownItem.vue'

const store = useHandballStore()

const newTeamName = ref('')

const selectedTeamId = computed({
  get: () => store.teams.selectedTeam.value?.id,
  set: (id) => id && store.teams.selectTeam(id),
})

const positions: Position['key'][] = ['LW','LB','CB','RB','RW','PV','PV2','GK']
const name = ref('')
const number = ref<number | null>(null)
const position = ref<Position['key']>('LW')

const addPlayer = () => {
  if (!name.value) return
  store.players.addPlayer(name.value, position.value, Number(number.value ?? 0))
  name.value = ''
  number.value = null
}
</script>
