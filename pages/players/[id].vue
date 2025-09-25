<script setup lang="ts">
import { useHandballStore } from '~/composables/useHandballStore';
import type { Player, PlayerStats, Position } from '~/types/handball';

const route = useRoute();
const store = useHandballStore();
const id = Number(route.params.id);
const originalPlayer = ref<Player | undefined>(undefined)

const player = ref<Player | undefined>(undefined)

const positions: Position["key"][] = ['LW', 'LB', 'CB', 'RB', 'RW', 'PV', "GK"];

onMounted(() => {
    const data = store.selectedTeam.value?.players.find(p => p.id === id)
    originalPlayer.value = data
    player.value = {...originalPlayer.value as Player}
})
const isEditing = ref(false)

function toggleEdit() {
  if(isEditing.value){
    saveChanges();
  }
  isEditing.value = !isEditing.value;
}

function removePlayer() {
  alert(`Remove player ${player.value!.name}`)
}
async function saveChanges() {
  if(!player.value){
    return
  }
  // Basic validation
  if (player.value.name?.trim() === "" || player.value.number.toString() === "") {
    alert("Invalid name or number")
    return
  }

  // Compare fields
  const updatedFields: Record<string, any> = {}
  if(player.value.name !== originalPlayer.value?.name){
    updatedFields["name"] = player.value.name
  }
  if(player.value.number !== originalPlayer.value?.number){
    updatedFields["number"] = player.value.number
  }
  if(player.value.position !== originalPlayer.value?.position){
    updatedFields["position"] = player.value.position
  }
  
  console.log(updatedFields)
  if (Object.keys(updatedFields).length === 0) {
    return
  }

  try {
    store.updatePlayer(updatedFields, player.value.id!)
    const playerIndex = store.selectedTeam.value?.players.findIndex(p => p.id === player.value!.id)
    originalPlayer.value = { ...player.value as Player }
    if (playerIndex !== undefined && playerIndex > -1) {
      // Update each field in place
      const targetPlayer = store.selectedTeam.value!.players[playerIndex]
      targetPlayer!.name = player.value.name
      targetPlayer!.number = player.value.number
      targetPlayer!.position = player.value.position
    }
  } catch (err) {
    console.error(err)
    alert("Failed to update player")
  }
}

</script>
  
<template>
  <div class="h-screen flex flex-col">
    <div v-if="!player" class="flex items-center justify-center h-full">
      <p class="text-lg text-gray-600">Player data not found.</p>
    </div>
    <div v-if="store.loading.value">
      <p class="text-lg text-gray-600">Loading player data ...</p>
    </div>
    <div class="p-4 w-full mx-auto" v-if="player && !store.loading.value">
      <!-- Player Card -->
      <div class="bg-white shadow-md rounded-2xl p-4 space-y-4">
        <!-- Header -->
        <div class="flex justify-between w-full items-center space-x-5">
          <div>
            <h2 class="text-lg font-bold text-gray-900">{{ player.name }}</h2>
            <p class="text-sm text-gray-500">
              #{{ player.number }} · {{ player.position }}
            </p>
          </div>
          <button
            @click="removePlayer"
            class="px-3 py-1 text-xs rounded-full bg-red-100 text-red-600 font-medium"
          >
            Remove
          </button>
        </div>

        <!-- Editable fields -->
        <div v-if="isEditing" class="space-y-3">
          <input
            v-model="player.name"
            class="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Name"
          />
          <input
            v-model="player.number"
            type="number"
            class="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Number"
          />
          <select v-model="player.position" 
            placeholder="Position" class="w-full border rounded-lg px-3 py-2 text-sm">
            <option v-for="p in positions" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>

        <!-- Stats per Match -->
      <div v-for="stat in player.stats" :key="stat.match.id" class="bg-white shadow rounded-xl p-4 space-y-2">
        <!-- Match Info -->
        <div class="flex justify-between items-center">
          <div class="w-full">
            <div class="flex items-center justify-between">
              <p class="font-semibold text-gray-900">Match vs {{ stat.match.opponent }} </p>
              <p v-if="store.currentMatch.value?.id === stat.match.id"
               class="text-xs text-white bg-blue-500 font-semibold shadow-inner border border-blue-400 rounded-full px-2 py-1">ONGOING</p>
            </div>
            <p class="text-xs text-gray-500">{{ new Date(stat.match.createdat!).toLocaleDateString() }}</p>
            <p v-if="stat.match.result" class="text-xs text-green-600 font-medium">{{ stat.match.result }}</p>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-3 gap-2 text-center text-sm mt-2">
          <div class="bg-gray-50 rounded-lg p-2">
            <p class="font-semibold">{{ stat.goal }}</p>
            <p class="text-gray-500">Goals</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-2">
            <p class="font-semibold">{{ stat.miss }}</p>
            <p class="text-gray-500">Misses</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-2">
            <p class="font-semibold">{{ stat.goodpass }}</p>
            <p class="text-gray-500">Good Pass</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-2">
            <p class="font-semibold">{{ stat.badpass }}</p>
            <p class="text-gray-500">Bad Pass</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-2">
            <p class="font-semibold">{{ stat.intercept }}</p>
            <p class="text-gray-500">Interceptions</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-2">
            <p class="font-semibold">{{ stat.lostball }}</p>
            <p class="text-gray-500">Lost Ball</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-2">
            <p class="font-semibold">{{ stat.gooddefense }}</p>
            <p class="text-gray-500">Good Defense</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-2">
            <p class="font-semibold">{{ stat.baddefense }}</p>
            <p class="text-gray-500">Bad Defense</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-2">
            <p class="font-semibold">{{ stat.yellowcard }}</p>
            <p class="text-gray-500">Yellow</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-2">
            <p class="font-semibold">{{ stat.redcard }}</p>
            <p class="text-gray-500">Red</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-2">
            <p class="font-semibold">{{ stat.twominutes }}</p>
            <p class="text-gray-500">2 Min</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-2">
            <p class="font-semibold">{{ stat.penaltyscored }}</p>
            <p class="text-gray-500">Penalty Scored</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-2">
            <p class="font-semibold">{{ stat.penaltymade }}</p>
            <p class="text-gray-500">Penalty Made</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-2">
            <p class="font-semibold">{{ stat.safe }}</p>
            <p class="text-gray-500">Safe</p>
          </div>
        </div>
        </div>
        <!-- Remove Button -->
        <button
          @click="toggleEdit"
          class="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold"
        >
          {{ isEditing ? "Save" : "Edit" }}
        </button>
      </div>
    </div>
  </div>
</template>


