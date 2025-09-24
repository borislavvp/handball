<script setup lang="ts">
import type { Player, Position, Stats } from '~/types/handball';

export interface ActionItem {
  type: Stats,
  name: string,
  icon?:string
}
const props = defineProps<{
  open: boolean;
  selectedPosition: Position | null
  playerNumber?: number
}>();

const emit = defineEmits<{
  (e: 'toggle'): void;
  (e: 'select', action: ActionItem['type']): void;
}>();

const defaultActions: ActionItem[] = [
    { type:"goodpass", name: 'pass', icon:"plus" },
    { type:"goal", name: 'goal', icon:"plus" },
    { type:"gooddefense", name: 'defense', icon:"plus" },
    { type:"intercept", name: 'intercept', icon:"plus" },
    { type:"penaltyscored", name: 'penalty', icon:"plus" },
    { type:"badpass", name: 'pass', icon:"minus" },
    { type:"miss", name: 'miss', icon:"minus" },
    { type:"baddefense", name: 'defense', icon:"minus" },
    { type:"penaltymade", name: 'penalty', icon:"minus" },
    { type:"twominutes", name: '2 min' },
    { type:"yellowcard", name: 'yellow' },
    { type:"redcard", name: 'red' },
];
const goalKeeperActions: Partial<ActionItem>[] = [
    { type:"goodpass", name: 'pass', icon:"plus" },
    { type:"badpass", name: 'pass', icon:"minus" },
    { type:"goal", name: 'goal', icon:"plus" },
    { type:"miss", name: 'miss', icon:"minus" },
    { type:"safe", name: 'safe', icon:"plus" },
];
const menuActions = computed(() => props.selectedPosition?.key === "GK" ? goalKeeperActions : defaultActions);
const activeAction= ref<ActionItem["type"] | null>();

function handleClick(action: ActionItem["type"]) {
  activeAction.value = action
  emit('select', action)
  setTimeout(() => {
    activeAction.value = null
  }, 50) // flicker duration
}


</script>
<template>
  <transition>
    <div
      v-if="open"
    >
      <!-- Positive Actions -->
      <div class="flex flex-col gap-2 items-center">
        <button
          v-for="action in menuActions.filter(a => a.icon === 'plus')"
          :key="action.type"
          @click.stop="handleClick(action.type!)"
          class="flex items-center justify-center w-18 h-16 rounded-xl shadow-sm text-white bg-emerald-600 border border-green-600 text-sm font-medium active:scale-95 transition-transform duration-150 cursor-pointer"
        >
          <span>{{ action.name }}</span>
        </button>
      </div>

      <!-- Neutral / Special Actions -->
      <div class="flex flex-col gap-2 items-center">
        <button
          v-for="action in menuActions.filter(a => !a.icon)"
          :key="action.type"
          @click.stop="handleClick(action.type!)"
          class="flex items-center justify-center w-18 h-16 rounded-xl shadow-sm text-white bg-yellow-600 border border-yellow-500 text-sm font-medium active:scale-95 transition-transform duration-150 cursor-pointer"
        >
          <span>{{ action.name }}</span>
        </button>
      </div>

      <!-- Negative Actions -->
      <div class="flex flex-col gap-2 items-center">
        <button
          v-for="action in menuActions.filter(a => a.icon === 'minus')"
          :key="action.type"
          @click.stop="handleClick(action.type!)"
          class="flex items-center justify-center w-18 h-16 rounded-xl shadow-sm text-white bg-red-700 border border-red-600 text-sm font-medium active:scale-95 transition-transform duration-150 cursor-pointer"
        >
          <span>{{ action.name }}</span>
        </button>
      </div>
    </div>
  </transition>
</template>
