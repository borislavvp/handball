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
          <!-- Position (Select dropdown) -->
          <div v-if="editablePlayerId === p.id && editableField === 'position'" class="relative">
            <select 
              v-model="editableData.position"
              @blur="saveField('position', p.id)"
              @keyup.enter="saveField('position', p.id)"
              class="text-md font-bold border rounded px-1"
              :ref="(el) => setSelectRef(el, p.id)"
            >
              <option v-for="pos in positions" :key="pos" :value="pos">{{ pos }}</option>
            </select>
          </div>
          <span 
            v-else 
            class="text-md font-bold cursor-pointer hover:bg-gray-100 px-1 rounded"
            @click="startEdit('position', p.position, p.id)"
          >
            {{ p.position }}
          </span>

          <!-- Number (Input) -->
          <div v-if="editablePlayerId === p.id && editableField === 'number'">
            <input 
              v-model="editableData.number"
              type="number"
              @blur="saveField('number', p.id)"
              @keyup.enter="saveField('number', p.id)"
              class="text-md text-gray-800 border rounded px-1 w-16"
              :ref="(el) => setInputRef(el, p.id)"
            />
          </div>
          <span 
            v-else 
            class="text-md text-gray-800 cursor-pointer hover:bg-gray-100 px-1 rounded"
            @click="startEdit('number', p.number, p.id)"
          >
            #{{ p.number }}
          </span>

          <!-- Name (Input) -->
          <div v-if="editablePlayerId === p.id && editableField === 'name'">
            <input 
              v-model="editableData.name"
              @blur="saveField('name', p.id)"
              @keyup.enter="saveField('name', p.id)"
              class="font-medium border rounded px-1"
              :ref="(el) => setInputRef(el, p.id)"
            />
          </div>
          <span 
            v-else 
            class="font-medium cursor-pointer hover:bg-gray-100 px-1 rounded"
            @click="startEdit('name', p.name, p.id)"
          >
            {{ p.name }}
          </span>
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
import { ref, nextTick, computed } from 'vue'
import type { Player, Position } from '~/types/handball'
import { useHandballStore } from '~/composables/useHandballStore'
import DropdownMenu from '~/components/shared/DropdownMenu.vue'
import DropdownItem from '~/components/shared/DropdownItem.vue'

const store = useHandballStore()

const newTeamName = ref('')

type FieldName = 'position' | 'number' | 'name'
type EditableField = FieldName | null

const editableField = ref<EditableField>(null)
const editablePlayerId = ref<number | null>(null)
const editableData = ref<Partial<Record<FieldName, any>>>({
  position: 'CB',
  number: -1,
  name: ''
})

// Store refs per player using Maps
const selectRefs = new Map<number, HTMLSelectElement>()
const inputRefs = new Map<number, HTMLInputElement>()

// Type-safe ref callback functions
const setSelectRef = (el: Element | any, playerId: number) => {
  if (el && el instanceof HTMLSelectElement) {
    selectRefs.set(playerId, el)
  } else if (el === null) {
    selectRefs.delete(playerId)
  }
}

const setInputRef = (el: Element | any, playerId: number) => {
  if (el && el instanceof HTMLInputElement) {
    inputRefs.set(playerId, el)
  } else if (el === null) {
    inputRefs.delete(playerId)
  }
}

const selectedTeamId = computed({
  get: () => store.teams.selectedTeam.value?.id,
  set: (id) => id && store.teams.selectTeam(id),
})

const positions: Position['key'][] = ['LW','LB','CB','RB','RW','PV','GK']
const name = ref('')
const number = ref<number | null>(null)
const position = ref<Position['key']>('LW')

const startEdit = (field: FieldName, currentValue: string | number, playerId: number): void => {
  // Close any other open edit first
  if (editableField.value !== null) {
    editableField.value = null
    editablePlayerId.value = null
  }
  
  editableField.value = field
  editablePlayerId.value = playerId
  editableData.value[field] = currentValue
  
  nextTick(() => {
    // Focus the appropriate input/select for this specific player
    if (field === 'position') {
      const selectEl = selectRefs.get(playerId)
      if (selectEl) selectEl.focus()
    } else {
      const inputEl = inputRefs.get(playerId)
      if (inputEl) inputEl.focus()
    }
  })
}

const saveField = (field: string, playerId: number) => {
  if (editableField.value === field && editablePlayerId.value === playerId) {
    console.log('Saving field', field, 'for player', playerId, 'with value', editableData.value[field as FieldName])
    // Create update object with only the changed field
    const updateData: Partial<Player> = {
      [field]: editableData.value[field as FieldName]
    }
    store.players.updatePlayer(updateData, playerId)
    editableField.value = null
    editablePlayerId.value = null
  }
}

const addPlayer = () => {
  if (!name.value) return
  store.players.addPlayer(name.value, position.value, Number(number.value ?? 0))
  name.value = ''
  number.value = null
}
</script>