<script setup lang="ts">
import type {  Position, Team, Match, MatchLineup, Player, } from '../types/handball';

import { useHandballStore } from '~/composables/useHandballStore';

const props = defineProps<{
  selectedPosition: Position;
  team: Team;
  match: Match;
}>();

const emit = defineEmits<{
  (e: 'cancel'): void;
}>();

const store = useHandballStore();


function onPlayerSelect(playerId: number) {
  if (props.selectedPosition) {
    store.changePlayer(props.match.id, props.selectedPosition, playerId);
  }
  emit("cancel")
}

function getPlayersForPosition(position: Position): Player[] {
  return props.team.players.filter(p => p.position === position.key);
}

</script>
<template>
    <div class="fixed inset-0 flex items-center justify-center z-100">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">
          Select Player for {{ selectedPosition.label }}
        </h3>
        
        <div class="space-y-2 mb-4 max-h-60 overflow-y-auto">
          <button v-for="player in getPlayersForPosition(selectedPosition)" 
                  :key="player.id"
                  @click="onPlayerSelect(player.id)"
                  class="w-full text-left p-3 rounded-md border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors">
            <span class="font-medium">{{ player.name }}</span>
            <span class="text-sm text-gray-500 ml-2">({{ player.position }})</span>
          </button>
        </div>
        
        <div class="flex gap-2">
          <button @click="emit('cancel')" 
                  class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
</template>


