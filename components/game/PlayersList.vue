<template>
  <div
    ref="listRef"
    class="players-list flex flex-wrap items-start gap-6 touch-none"
  >
    <span
      class="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"
    />
  </div>
  <div
    ref="listRef"
    class="players-list flex flex-wrap items-start gap-6 touch-none"
  >
    <div
      v-for="(p, idx) in orderedPlayers"
      :key="p.id"
      :class="[
        'drop-slot relative',
        dragOverIndex === idx &&
          dragging &&
          draggedIndex !== idx &&
          'drop-slot-active',
        draggedIndex === idx && 'drop-slot-source'
      ]"
    >
      <button
        @pointerdown.prevent="onPointerDown($event, idx)"
        @pointermove="onPointerMove($event, idx)"
        @pointerup="onPointerUp($event, idx)"
        @pointercancel="onPointerCancel"
        @click="onClickTile(p, $event)"
        :style="
          draggedIndex === idx
            ? {
                transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
                zIndex: 60
              }
            : undefined
        "
        :class="[
          'player-tile relative rounded-md w-24 h-24 flex items-center transition-shadow justify-center border-1  select-none',
          // statsMode && !p.currentStats ? 'border-gray-200 bg-gray-200 text-gray-400' :
          store.selection.player.value?.id == p.id
            ? 'shadow-inner text-white border-emerald-900 bg-emerald-900'
            : store.selection.primaryAssist.value?.id == p.id
              ? 'shadow-inner text-white border-emerald-600 bg-emerald-600'
              : store.selection.secondaryAssist.value?.id == p.id
                ? 'shadow-inner text-gray-900 border-emerald-300 bg-emerald-300'
                : store.selection.mistakePlayer.value?.id == p.id
                  ? 'shadow-inner text-gray-900 border-red-400 bg-red-400'
                    : store.selection.noRecoveryPlayer.value?.id == p.id
                    ? 'shadow-inner text-white border-amber-400 bg-amber-400'
                    : // gameMode === 'stats' && !p.currentStats ? 'border-gray-400 bg-gray-200 text-gray-500' :
                      p.position === 'GK'
                      ? 'text-white border-blue-700 bg-blue-400'
                      : 'border-gray-700 bg-white text-gray-900',
          (shouldAnimatePlayerSelection() ||
            shouldAnimateAssistSelection(p) ||
            shouldAnimateMistakeSelection(p) ||
            shouldAnimateNoRecoverySelection(p)) &&
            'animate-border border-white',
          draggedIndex === idx && dragging && 'player-tile-lifted'
        ]"
      >
        <shortcut-chip
          v-if="shiftHeld && idx < 10"
          :combo="slotCombo(idx)"
          size="sm"
          class="absolute top-0 left-0 -mt-1 -ml-1 z-20"
        />
        <span
          v-if="playerFlashKind(p.id) && valueOverlayKey(p.id)"
          :key="valueOverlayKey(p.id)"
          :class="['tile-flash-overlay', `tile-flash-${playerFlashKind(p.id)}`]"
          aria-hidden="true"
        />
        <two-minutes-tag
          v-if="
            store.matches.match.value?.data.value.twoMinutesHome.includes(p.id)
          "
          class="absolute bottom-0 left-0 -mb-4 -ml-4"
          :player-id="p.id"
        />
        <div
          class="flex items-center space-x-2 absolute bottom-0 right-0 -mb-3 mr-1"
        >
          <span
            v-for="_ in p.currentStats?.twominutes"
            class="text-xl font-semibold text-gray-800 px-1 rounded bg-gray-200 border"
            >2</span
          >
          <span v-if="p.currentStats?.bluecard" class="h-7 w-5 bg-blue-400" />
          <span
            v-else-if="p.currentStats?.redcard"
            class="h-7 w-5 bg-red-400"
          />
          <span
            v-else-if="p.currentStats?.yellowcard"
            class="h-7 w-5 bg-yellow-400"
          />
        </div>
        <span
          v-if="p.position === 'GK'"
          :class="[
            'flex items-center space-x-1 py-1 px-2 bg-gradient-to-r from-gray-200 from-10% to-white text-black border border-gray-300 rounded-full absolute top-0 left-0 -mt-4 -ml-1',
            playerSavesFlashing(p.id) && 'saves-flash-pulse'
          ]"
        >
          <wall class="h-7 w-7" />
          <p class="font-bold text-lg">{{ p.currentStats?.gksave }}</p>
        </span>
        <PlayerValueBadge
          v-if="p.currentStats !== undefined"
          :value="p.currentStats.value"
          :player-id="p.id"
          class="absolute top-0 right-0 -mt-4 -mr-4"
        />
        <div class="flex flex-col items-center">
          <div class="flex items-center space-x-1">
            <span class="text-3xl font-semibold">{{ p.number }}</span>
            <span class="text-xl font-semibold">{{ p.position }}</span>
          </div>
          <span class="text-md">{{ p.name.split(" ")[0] }}</span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Player, ShootingTarget } from "~/types/handball";
import TwoMinutesTag from "~/components/game/TwoMinutesTag.vue";
import Wall from "../icons/wall.vue";
import PlayerValueBadge from "../shared/PlayerValueBadge.vue";
import ShortcutChip from "../shared/ShortcutChip.vue";

const props = defineProps<{
  statsMode: boolean;
  shootingTarget: ShootingTarget | null;
}>();

const emits = defineEmits<{
  (e: "two-min-over", playerId: number): void;
}>();

const store = useHandballStore();
const playerOrder = usePlayerOrder();
const { shiftHeld } = useModifierState();
const assistMode = useAssistMode();
const { flash: flashState, isFlashing } = usePlayerFlash();

const isPlayerFlashing = (playerId: number) => {
  void flashState.value;
  return isFlashing(playerId);
};

const playerFlashKind = (
  playerId: number
): "positive" | "negative" | "neutral" | null => {
  void flashState.value;
  if (!isPlayerFlashing(playerId)) return null;
  if (flashState.value.target !== "value") return null;
  return flashState.value.kind;
};

const savingPlayerIds = ref(new Set<number>());
const lastSavesTimestamp = ref(0);

watch(
  () => flashState.value,
  async next => {
    if (next.target !== "saves") return;
    if (next.timestamp === lastSavesTimestamp.value) return;
    if (next.playerId === null) return;
    if (next.timestamp === 0) return;
    lastSavesTimestamp.value = next.timestamp;
    const nextSet = new Set(savingPlayerIds.value);
    nextSet.delete(next.playerId);
    savingPlayerIds.value = nextSet;
    await nextTick();
    nextSet.add(next.playerId);
    savingPlayerIds.value = nextSet;
    setTimeout(() => {
      const cleared = new Set(savingPlayerIds.value);
      cleared.delete(next.playerId!);
      savingPlayerIds.value = cleared;
    }, 1100);
  },
  { deep: true }
);

const playerSavesFlashing = (playerId: number) =>
  savingPlayerIds.value.has(playerId);

const valueOverlayKey = (playerId: number) => {
  void flashState.value;
  if (!isPlayerFlashing(playerId)) return 0;
  if (flashState.value.target !== "value") return 0;
  return flashState.value.timestamp;
};

const teamPlayers = computed(() => {
  const players = store.teams.activeTeam.value?.players;
  if (!players) {
    return [];
  }
  return players.slice().sort((a, b) => {
    const GOALKEEPER_POSITION = "GK";
    const aIsGK = a.position === GOALKEEPER_POSITION;
    const bIsGK = b.position === GOALKEEPER_POSITION;
    if (aIsGK && !bIsGK) {
      return -1;
    }
    if (!aIsGK && bIsGK) {
      return 1;
    }
    return 0;
  });
});

const draggedIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);
const dragging = ref(false);
const dragOffset = reactive({ x: 0, y: 0 });
const wasDragged = ref(false);
const listRef = ref<HTMLElement | null>(null);

const orderedPlayers = computed<Player[]>(() =>
  playerOrder.orderedPlayers(store.teams.activeTeam.value)
);

const PLAYER_SLOT_LETTERS = ["Q", "W", "E", "A", "S", "D", "Z", "X", "C"];

const slotCombo = (idx: number): string => {
  if (idx >= 0 && idx < PLAYER_SLOT_LETTERS.length) {
    return `Shift+${PLAYER_SLOT_LETTERS[idx]}`;
  }
  if (idx === 9) return "Shift+1"; // 10th player onward use numbers
  return "";
};

watch(teamPlayers, next => {
  const ids = playerOrder.reorderIds.value;
  if (!ids) return;
  const validIds = new Set(next.map(p => p.id));
  const filtered = ids.filter(id => validIds.has(id));
  playerOrder.setReorder(filtered.length === next.length ? filtered : null);
});

const DRAG_THRESHOLD_PX = 6;
let activePointerId: number | null = null;
let startX = 0;
let startY = 0;
let startIndex = 0;

function tileSlotAt(clientX: number, clientY: number): number {
  const slots =
    listRef.value?.querySelectorAll<HTMLElement>(".drop-slot") ?? [];
  for (let i = 0; i < slots.length; i++) {
    const rect = slots[i]!.getBoundingClientRect();
    if (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    ) {
      return i;
    }
  }
  return -1;
}

function onPointerDown(event: PointerEvent, index: number) {
  if (event.button !== undefined && event.button !== 0) return;
  activePointerId = event.pointerId;
  startX = event.clientX;
  startY = event.clientY;
  startIndex = index;
  wasDragged.value = false;
  (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
}

function onPointerMove(event: PointerEvent, _index: number) {
  if (activePointerId !== event.pointerId) return;
  const dx = event.clientX - startX;
  const dy = event.clientY - startY;
  if (!dragging.value) {
    if (Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD_PX) return;
    dragging.value = true;
    draggedIndex.value = startIndex;
    dragOverIndex.value = startIndex;
    wasDragged.value = true;
  }
  dragOffset.x = dx;
  dragOffset.y = dy;
  const hover = tileSlotAt(event.clientX, event.clientY);
  if (hover !== -1) dragOverIndex.value = hover;
  else dragOverIndex.value = null;
}

function onPointerUp(event: PointerEvent, _index: number) {
  if (activePointerId !== event.pointerId) return;
  const wasDragging = dragging.value;
  const sourceIndex = draggedIndex.value;
  const targetIndex = dragOverIndex.value;
  if (
    wasDragging &&
    sourceIndex !== null &&
    targetIndex !== null &&
    sourceIndex !== targetIndex
  ) {
    const list = [...orderedPlayers.value];
    const [moved] = list.splice(sourceIndex, 1);
    list.splice(targetIndex, 0, moved!);
    playerOrder.setReorder(list.map(p => p.id));
  }
  try {
    (event.currentTarget as HTMLElement).releasePointerCapture?.(
      event.pointerId
    );
  } catch {}
  resetDrag();
}

function onPointerCancel(event: PointerEvent) {
  if (activePointerId !== event.pointerId) return;
  try {
    (event.currentTarget as HTMLElement).releasePointerCapture?.(
      event.pointerId
    );
  } catch {}
  resetDrag();
}

function resetDrag() {
  activePointerId = null;
  dragging.value = false;
  draggedIndex.value = null;
  dragOverIndex.value = null;
  dragOffset.x = 0;
  dragOffset.y = 0;
  wasDragged.value = false;
}

function onClickTile(p: Player, event: MouseEvent) {
  if (wasDragged.value) {
    wasDragged.value = false;
    event.preventDefault();
    return;
  }
  onPlayerClick(p);
}

function onPlayerClick(p: Player) {
  const mode = assistMode.mode.value;
  if (mode) {
    if (mode === "primaryAssist") store.selection.primaryAssist.value = p;
    if (mode === "secondaryAssist") store.selection.secondaryAssist.value = p;
    if (mode === "mistake") store.selection.mistakePlayer.value = p;
    if (mode === "noRecovery") store.selection.noRecoveryPlayer.value = p;
    assistMode.exit();
    return;
  }

  const selectMistakePlayer =
    store.selection.player.value?.position === "GK" &&
    store.selection.oneOnOneLost.value;
  const selectNoRecoveryPlayer =
    store.selection.player.value?.position === "GK" &&
    store.selection.noRecovery.value;

  if (p.id === store.selection.player.value?.id) {
    store.selection.player.value = null;
    store.selection.clearSelection();
  } else if (
    props.shootingTarget === null ||
    store.selection.player.value === null ||
    (store.selection.player.value.position === "GK" &&
      !store.selection.oneOnOneLost.value &&
      !store.selection.noRecovery.value)
  ) {
    store.selection.player.value = p;
  } else {
    if (selectMistakePlayer) {
      if (store.selection.mistakePlayer.value?.id === p.id) {
        store.selection.mistakePlayer.value = null;
      } else {
        store.selection.mistakePlayer.value = p;
      }
    } else if (selectNoRecoveryPlayer) {
      if (store.selection.noRecoveryPlayer.value?.id === p.id) {
        store.selection.noRecoveryPlayer.value = null;
      } else {
        store.selection.noRecoveryPlayer.value = p;
      }
    } else if (store.selection.primaryAssist.value?.id === p.id) {
      store.selection.primaryAssist.value = null;
    } else if (store.selection.secondaryAssist.value?.id === p.id) {
      store.selection.secondaryAssist.value = null;
    } else if (store.selection.primaryAssist.value === null) {
      store.selection.primaryAssist.value = p;
    } else {
      store.selection.secondaryAssist.value = p;
    }
  }
}

const shouldAnimatePlayerSelection = () => {
  return (
    !store.selection.player.value &&
    props.shootingTarget !== null &&
    (store.selection.primaryAssist.value === null ||
      store.selection.secondaryAssist.value === null ||
      store.selection.mistakePlayer.value === null)
  );
};

const shouldAnimateAssistSelection = (p: Player) => {
  return (
    store.selection.player.value &&
    store.selection.player.value.position !== "GK" &&
    store.selection.player.value.id !== p.id &&
    props.shootingTarget !== null &&
    store.selection.primaryAssist.value?.id !== p.id &&
    store.selection.secondaryAssist.value?.id !== p.id
  );
};

const shouldAnimateMistakeSelection = (p: Player) => {
  return (
    store.selection.player.value &&
    store.selection.player.value.position === "GK" &&
    store.selection.player.value.id !== p.id &&
    props.shootingTarget !== null &&
    store.selection.mistakePlayer.value?.id !== p.id &&
    store.selection.oneOnOneLost.value
  );
};

const shouldAnimateNoRecoverySelection = (p: Player) => {
  return (
    store.selection.player.value &&
    store.selection.player.value.position === "GK" &&
    store.selection.player.value.id !== p.id &&
    props.shootingTarget !== null &&
    store.selection.noRecoveryPlayer.value?.id !== p.id &&
    store.selection.noRecovery.value
  );
};

function onTwoMinutesOver(playedId: number) {
  emits("two-min-over", playedId);
}
</script>

<style scoped>
.players-list {
  position: relative;
}

@keyframes zebra-slide {
  from {
    background-position: 0 0;
  }
  to {
    background-position: 16px 0;
  }
}

.animate-border::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2px;
  background-image: repeating-linear-gradient(
    45deg,
    black 0,
    black 15%,
    white 25%,
    white 50%
  );
  background-size: 16px 16px;
  animation: zebra-slide 0.5s linear infinite;

  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  z-index: 0;
}

.tile-flash-overlay {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 0;
}

@keyframes flash-positive-tile {
  0% {
    background-color: rgb(52, 211, 153);
    opacity: 1;
  }
  30% {
    background-color: rgb(52, 211, 153);
    opacity: 0.9;
  }
  100% {
    background-color: rgb(52, 211, 153);
    opacity: 0;
  }
}

@keyframes flash-negative-tile {
  0% {
    background-color: rgb(251, 113, 133);
    opacity: 1;
  }
  30% {
    background-color: rgb(251, 113, 133);
    opacity: 0.9;
  }
  100% {
    background-color: rgb(251, 113, 133);
    opacity: 0;
  }
}

@keyframes flash-neutral-tile {
  0% {
    background-color: rgb(96, 165, 250);
    opacity: 1;
  }
  30% {
    background-color: rgb(96, 165, 250);
    opacity: 0.9;
  }
  100% {
    background-color: rgb(96, 165, 250);
    opacity: 0;
  }
}

.tile-flash-positive {
  animation: flash-positive-tile 1s ease-out forwards;
}
.tile-flash-negative {
  animation: flash-negative-tile 1s ease-out forwards;
}
.tile-flash-neutral {
  animation: flash-neutral-tile 1s ease-out forwards;
}

@keyframes saves-pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.9);
  }
  25% {
    transform: scale(1.6);
    box-shadow: 0 0 0 20px rgba(16, 185, 129, 0);
  }
  55% {
    transform: scale(0.92);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

.saves-flash-pulse {
  transform-origin: center;
  animation: saves-pulse 1s ease-out;
  z-index: 5;
}

.drop-slot {
  border-radius: 0.5rem;
  transition: transform 0.15s ease;
  position: relative;
}

.drop-slot-active {
  transform: scale(1.05);
}

.drop-slot-active::before {
  content: "";
  position: absolute;
  inset: 0;
  border: 2px dashed rgba(59, 130, 246, 0.7);
  border-radius: 0.5rem;
  pointer-events: none;
  z-index: 40;
}

.drop-slot-source {
  opacity: 0.35;
}

.player-tile {
  cursor: grab;
  touch-action: none;
}

.player-tile:active {
  cursor: grabbing;
}

.player-tile-lifted {
  box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.4);
  cursor: grabbing;
  transition: none;
}
</style>
