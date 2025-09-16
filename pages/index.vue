<script setup lang="ts">
import { useHandballStore } from '~/composables/useHandballStore';
import type { Position } from '../types/handball';
import { onMounted, watch } from 'vue';

const store = useHandballStore();

const newTeamName = ref('');
const positions: Position["key"][] = ['LW', 'LB', 'CB', 'RB', 'RW', 'PV', 'PV2'];
const selectedTeamId = ref<string | null>(null);
const newPlayerName = ref('');
const newPlayerPosition = ref<Position["key"]>('LW');
const newPlayerNumber = ref<number | null>(null);
const showDefenseDefaults = ref(false);

function createTeam() {
  const name = newTeamName.value.trim();
  if (!name) return;
  const team = store.addTeam(name);
  newTeamName.value = '';
  selectedTeamId.value = team.id;
}

function addPlayer() {
  if (!selectedTeamId.value) return;
  const name = newPlayerName.value.trim();
  if (!name) return;
  const number = Number(newPlayerNumber.value ?? 0) || 0;
  store.addPlayer(selectedTeamId.value, name, newPlayerPosition.value, number);
  newPlayerName.value = '';
  newPlayerNumber.value = null;
}

function removeTeam(teamId: string) {
  store.removeTeam(teamId);
  if (selectedTeamId.value === teamId) {
    const first = store.teams.value[0]?.id ?? null;
    selectedTeamId.value = first;
  }
}

const selectedTeam = computed(() => store.teams.value?.find(t => t.id === selectedTeamId.value) || null);

// Always keep a team selected when available
onMounted(() => {
  if (!selectedTeamId.value && store.teams.value.length > 0) {
    selectedTeamId.value = store.teams.value[0]!.id;
  }
});

watch(store.teams, (teams) => {
  if (teams.length === 0) {
    selectedTeamId.value = null;
    return;
  }
  if (!teams.find(t => t.id === selectedTeamId.value)) {
    selectedTeamId.value = teams[0]!.id;
  }
}, { deep: true });
</script>

<template>
  <div class="p-4">
    <div class="flex gap-4 flex-wrap">
      <div class="min-w-64">
        <h3 class="text-lg font-medium text-gray-700 mb-2">Create Team</h3>
        <div class="flex gap-2 mb-4">
          <input v-model="newTeamName" placeholder="Team name" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button @click="createTeam" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors">Add</button>
        </div>
        <h3 class="text-lg font-medium text-gray-700 mb-2">Teams</h3>
        <div class="flex items-center gap-2">
          <select
            v-model="selectedTeamId"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option disabled value="">Select a team</option>
            <option v-for="t in store.teams.value" :key="t.id || 'empty'" :value="t.id">
              {{ t.name }}
            </option>
          </select>
          <button
            v-if="selectedTeamId"
            @click="removeTeam(selectedTeamId!)"
            class="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-sm"
          >
            Delete
          </button>
        </div>
      </div>
      <div v-if="selectedTeam" class="flex-1 min-w-72">
        <h3 class="text-lg font-medium text-gray-700 mb-2">Players for {{ selectedTeam.name }}</h3>
        <div class="flex gap-2 items-center flex-wrap mb-4">
          <input v-model="newPlayerName" placeholder="Player name" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input v-model.number="newPlayerNumber" type="number" min="0" placeholder="#" class="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select v-model="newPlayerPosition" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option v-for="p in positions" :key="p" :value="p">{{ p }}</option>
          </select>
          <button @click="addPlayer" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors">Add Player</button>
        </div>
        <ul class="space-y-2">
          <li v-for="p in (selectedTeam?.players || [])" :key="p.id || 'empty'" class="flex items-center gap-2 p-2 border-b border-gray-100">
            <span class="w-10 text-sm font-medium">{{ p.position }}</span>
            <span class="w-10 text-sm text-gray-500">#{{ p.number }}</span>
            <span class="flex-1">{{ p.name }}</span>
            <button @click="store.removePlayer(selectedTeam.id, p.id)" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm ml-auto">Remove</button>
          </li>
        </ul>

        <h3 class="text-lg font-medium text-gray-700 mt-4 mb-2">Default lineup</h3>
        <div class="flex items-center gap-3 mb-2">
          <button :class="['px-3 py-1 rounded-md text-sm', !showDefenseDefaults ? 'bg-blue-500 text-white' : 'bg-gray-100']" @click="showDefenseDefaults = false">Attack</button>
          <button :class="['px-3 py-1 rounded-md text-sm', showDefenseDefaults ? 'bg-blue-500 text-white' : 'bg-gray-100']" @click="showDefenseDefaults = true">Defense</button>
        </div>

        <div v-if="!showDefenseDefaults" class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div v-for="pos in positions" :key="pos" class="flex items-center gap-2">
            <label class="w-16 text-sm text-gray-700">{{ pos }}</label>
            <select
              :value="selectedTeam?.defaults?.[pos] ?? ''"
              @change="(e: any) => store.setTeamDefault(selectedTeam!.id, pos, e.target.value || null)"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">- None -</option>
              <option v-for="pl in (selectedTeam?.players || []).filter(pl => pl.position === pos)" :key="pl.id" :value="pl.id">
                #{{ pl.number }} · {{ pl.name }}
              </option>
            </select>
          </div>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div v-for="slot in ['D1','D2','D3','D4','D5','D6'] as Position['key'][]" :key="slot" class="flex items-center gap-2">
            <label class="w-16 text-sm text-gray-700">{{ slot.slice(1) }}</label>
            <select
              :value="selectedTeam?.defaults?.[slot] ?? ''"
              @change="(e: any) => store.setTeamDefault(selectedTeam!.id, slot, e.target.value || null)"
              class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">- None -</option>
              <option v-for="pl in (selectedTeam?.players || [])" :key="pl.id" :value="pl.id">
                #{{ pl.number }} · {{ pl.name }} ({{ pl.position }})
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
  
</template>


