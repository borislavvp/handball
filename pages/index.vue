<script setup lang="ts">
import { useHandballStore } from '~/composables/useHandballStore';
import type { Position } from '../types/handball';
import { onMounted, watch } from 'vue';

const store = useHandballStore();

const newTeamName = ref('');
const positions: Position["key"][] = ['LW', 'LB', 'CB', 'RB', 'RW', 'PV', "GK", "PV2"];
const newPlayerName = ref('');
const newPlayerPosition = ref<Position["key"]>('LW');
const newPlayerNumber = ref<number | null>(null);
const showDefenseDefaults = ref(false);
const showAddPlayer = ref(true);
const showPlayers = ref(true);
const showLineup = ref(true);

async function createTeam() {
  const name = newTeamName.value.trim();
  if (!name) return;
  const team = await store.addTeam(name);
  newTeamName.value = '';
}

function addPlayer() {
  const name = newPlayerName.value.trim();
  if (!name) return;
  const number = Number(newPlayerNumber.value ?? 0) || 0;
  store.addPlayer(name, newPlayerPosition.value, number);
  newPlayerName.value = '';
  newPlayerNumber.value = null;
}

// function removeTeam(teamId: number) {
//   store.removeTeam(teamId);
//   if (selectedTeamId.value === teamId) {
//     const first = store.teams.value[0]?.id ?? null;
//     selectedTeamId.value = first;
//   }
// }


// Always keep a team selected when available
// onMounted(async () => {
//   await store.initialize();
// });

const lineupChanged = async (position:Position["key"], playerID:EventTarget) => {
  await store.changeLineup(position,Number((playerID as HTMLInputElement).value));
}

</script>
<template>
  <div class="p-4 max-w-md mx-auto space-y-4 mb-20">
    <!-- Team Header -->
    <div class="bg-white shadow-md rounded-2xl p-4 flex flex-col justify-between items-center">
      <button
          class="w-full flex justify-between items-center py-3 text-left text-gray-700 font-medium"
          @click="showAddPlayer = !showAddPlayer"
        >
          <span>Add Player to {{ store.selectedTeam.value?.name  }}</span>
          <svg
            :class="{'rotate-180': showAddPlayer}"
            class="h-5 w-5 transition-transform"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      <!-- Team actions could go here -->
      <!-- Add Player Accordion -->
      <div v-if="showAddPlayer" class="space-y-3 border-t border-gray-200">
        <div class="flex gap-2 flex-wrap">
          <input
            v-model="newPlayerName"
            placeholder="Player Name"
            class="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            v-model.number="newPlayerNumber"
            type="number"
            min="0"
            placeholder="#"
            class="w-20 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            v-model="newPlayerPosition"
            class="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option v-for="p in positions" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>
        <button
          @click="addPlayer"
          class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition-colors"
        >
          Add Player
        </button>
      </div>
    </div>

    <!-- Players List Accordion -->
    <div class="bg-white shadow-md rounded-2xl">
      <button
        class="w-full flex justify-between items-center px-4 py-3 text-left text-gray-700 font-medium"
        @click="showPlayers = !showPlayers"
      >
        <span>Players ({{ store.selectedTeam.value?.players.length || 0 }})</span>
        <svg
          :class="{'rotate-180': showPlayers}"
          class="h-5 w-5 transition-transform"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <ul v-if="showPlayers" class="divide-y divide-gray-100 max-h-64 overflow-y-auto p-2">
        <li
          v-for="p in store.selectedTeam.value?.players || []"
          :key="p.id"
          class="flex items-center justify-between p-2 bg-gray-50 rounded-lg mb-2"
        >
          <div class="flex items-center gap-2">
            <span class="font-semibold text-sm">{{ p.position }}</span>
            <span class="text-gray-500 text-sm">#{{ p.number }}</span>
            <NuxtLink :to="`/players/${p.id}`" class="text-blue-600 truncate max-w-xs">{{ p.name }}</NuxtLink>
          </div>
          <button
            @click="store.removePlayer(store.selectedTeam.value!.id, p.id)"
            class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
          >
            Remove
          </button>
        </li>
      </ul>
    </div>

    <!-- Default Lineup Accordion -->
    <div class="bg-white shadow-md rounded-2xl">
      <button
        class="w-full flex justify-between items-center px-4 py-3 text-left text-gray-700 font-medium"
        @click="showLineup = !showLineup"
      >
        <span>Default Lineup</span>
        <svg
          :class="{'rotate-180': showLineup}"
          class="h-5 w-5 transition-transform"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div v-if="showLineup" class="p-4 space-y-3 border-t border-gray-200">
        <!-- Attack/Defense Toggle -->
        <div class="flex gap-3 flex-wrap">
          <button
            :class="['px-3 py-1 rounded-md text-sm', !showDefenseDefaults ? 'bg-blue-500 text-white' : 'bg-gray-100']"
            @click="showDefenseDefaults = false"
          >
            Attack
          </button>
          <button
            :class="['px-3 py-1 rounded-md text-sm', showDefenseDefaults ? 'bg-blue-500 text-white' : 'bg-gray-100']"
            @click="showDefenseDefaults = true"
          >
            Defense
          </button>
        </div>

        <!-- Lineup Selects -->
        <!-- Attack Lineup -->
        <div v-if="!showDefenseDefaults" class="flex flex-col gap-3">
          <div
            v-for="pos in positions"
            :key="pos"
            class="flex items-center gap-2"
          >
            <label class="w-16 text-sm font-medium text-gray-700">{{ pos }}</label>
            <select
              @change="(e) => lineupChanged(pos, e.target!)"
              :value="store.selectedTeam.value?.lineups?.[0]?.[pos] ?? ''"
              class="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">- None -</option>
              <option
                v-for="pl in (store.selectedTeam.value?.players || []).filter(pl => pos==='PV2' ? pl.position === 'PV' : pl.position === pos)"
                :key="pl.id"
                :value="pl.id"
              >
                #{{ pl.number }} · {{ pl.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Defense Lineup -->
        <div v-else class="flex flex-col gap-3">
          <div
            v-for="slot in ['D1','D2','D3','D4','D5','D6'] as Position['key'][]"
            :key="slot"
            class="flex items-center gap-2"
          >
            <label class="w-16 text-sm font-medium text-gray-700">{{ slot.slice(1) }}</label>
            <select
              @change="(e) => lineupChanged(slot, e.target!)"
              :value="store.selectedTeam.value?.lineups?.[0]?.[slot] ?? ''"
              class="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">- None -</option>
              <option
                v-for="pl in store.selectedTeam.value?.players || []"
                :key="pl.id"
                :value="pl.id"
              >
                #{{ pl.number }} · {{ pl.name }} ({{ pl.position }})
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>