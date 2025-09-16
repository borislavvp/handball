<script setup lang="ts">
import type { Position } from '~/types/handball';

export interface ActionItem {
  name: 'key pass' | 'score' | 'miss' | 'good defense' | "bad defense" | 'bad pass' | 'lost ball' | "intercept" | "penalty made" | '2 minute'  | 'change';
}
export interface GoalKeeperActionItem {
  name: 'key pass' | 'score' | 'miss' | 'safe' | "lost ball" | 'bad pass' | 'lost ball' | 'change';
}
const props = defineProps<{
  open: boolean;
  selectedPosition: Position | null
}>();

const emit = defineEmits<{
  (e: 'toggle'): void;
  (e: 'select', action: ActionItem['name'] | GoalKeeperActionItem["name"]): void;
}>();

const defaultActions: ActionItem[] = [
    { name: 'key pass' },
    { name: 'bad pass' },
    { name: 'score' },
    { name: 'miss' },
    { name: 'lost ball' },
    { name: 'good defense' },
    { name: 'bad defense' },
    { name: 'intercept' },
    { name: 'penalty made' },
    { name: '2 minute' },
  { name: 'change' },
];
const goalKeeperActions: GoalKeeperActionItem[] = [
    { name: 'key pass' },
    { name: 'bad pass' },
    { name: 'score' },
    { name: 'miss' },
    { name: 'lost ball' },
    { name: 'safe' },
    { name: 'change' },
];

const menuActions = computed(() => props.selectedPosition?.key === "GK" ? goalKeeperActions : defaultActions);
</script>

<template>
  <div class="relative flex flex-col items-center select-none">
    <!-- Mini buttons stack -->
    <transition-group name="fab" tag="div" class="flex flex-col flex-wrap gap-2 max-h-72 w-full items-center mb-2 space-y-2">
      <button
        v-for="action in menuActions"
        :key="action.name"
        v-show="open"
        @click.stop="emit('select', action.name)"
        class="rounded-full bg-white border-2 border-gray-400 text-gray-900 flex items-center justify-center shadow-lg hover:bg-blue-700 text-sm p-4 text-center shadow-lg"
      >
        <span class="flex-shrink-0 whitespace-normal break-words">{{ action.name }}</span>
      </button>
    </transition-group>

  </div>
</template>

<style>
.fab-enter-active,
.fab-leave-active { transition: all 0.18s ease; }
.fab-enter-from { opacity: 0; transform: translateY(8px) scale(0.95); }
.fab-enter-to { opacity: 1; transform: translateY(0) scale(1); }
.fab-leave-from { opacity: 1; transform: translateY(0) scale(1); }
.fab-leave-to { opacity: 0; transform: translateY(8px) scale(0.95); }
</style>


