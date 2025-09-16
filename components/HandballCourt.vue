<script setup lang="ts">
import type { Orientation, Position, Team, Match, MatchLineup, Player } from '../types/handball';
import { AttackPosValues, DefensePosValues } from '../types/handball'
import upperSideImg from '~/assets/upper_side.svg';
import lowerSideImg from '~/assets/lower_side.svg';
import PositionActionMenu, {type ActionItem, type GoalKeeperActionItem} from './PositionActionMenu.vue';
import { useHandballStore } from '~/composables/useHandballStore';
import PlayerChangeModal from "./PlayerChangeModal.vue";

const props = defineProps<{
  orientation: Orientation;
  team: Team;
  match: Match;
}>();

// Default base positions (percentages within the field container)
const basePositions: Position[] = [
  { key: 'LW', label: 'Left Wing', x: 8, y: 95 },
  { key: 'LB', label: 'Left Back', x: 15, y: 80 },
  { key: 'CB', label: 'Center Back', x: 50, y: 75 },
  { key: 'RB', label: 'Right Back', x: 85, y: 80 },
  { key: 'RW', label: 'Right Wing', x: 92, y: 95 },
  { key: 'PV', label: 'Pivot', x: 35, y: 85 },
  { key: 'PV2', label: 'Pivot', x: 65, y: 85 },
// Defense base positions (lower field), keys are custom strings not tied to lineup
  { key: 'D1', label: '1', x: 10, y: 95 },
  { key: 'D2', label: '2', x: 20, y: 87 },
  { key: 'D3', label: '3', x: 40, y: 84 },
  { key: 'D4', label: '4', x: 57, y: 84 },
  { key: 'D5', label: '5', x: 77, y: 87 },
  { key: 'D6', label: '6', x: 90, y: 95 },
  { key: 'GK', label: 'GK', x: 50, y: 95 },
];
const baseDefense: Position[] = [
];
const mode = ref<"attack" | "defense">("attack");

const selectedPosition = ref<Position | null>(null);
const showPlayerModal = ref(false);
const actionMenuOpen = ref(false);

// Merge saved layout with base positions
const store = useHandballStore();
const courtRef = ref<HTMLDivElement | null>(null);
const positions = ref<Position[]>([]);
const activePositions = computed(() => mode.value == "attack" ?  
positions.value.filter(p => (AttackPosValues as readonly string[]).includes(p.key) || p.key == "GK") : 
positions.value.filter(p => (DefensePosValues as readonly string[]).includes(p.key) || p.key == "GK"))


const toggleMode = () => {
  if (mode.value == "attack"){
    mode.value = "defense";
  }else{
    mode.value = "attack";
  }
}

function loadPositions() {
  const saved = store.getTeamPositionLayouts(props.team.id);
  positions.value = basePositions.map(p => {
    const s = saved[p.key];
    return (s ? { ...p, x: s.x, y: s.y } : { ...p }) as Position;
  });
}

watch(() => props.team.id, () => loadPositions(), { immediate: true });

function getAssigned(lineup: MatchLineup, position: Position) {
  return lineup[position.key] as string | null;
}

function getAssignedPlayer(position: Position): Player | null {
  const playerId = getAssigned(props.match.lineup, position);
  if (!playerId) return null;
  return props.team.players.find(p => p.id === playerId) || null;
}

function onPositionClick(position: Position) {
  const wasOpen = actionMenuOpen.value;
  if(wasOpen && position.key === selectedPosition.value?.key){
    closeAllMenus();
  }else{
    selectedPosition.value = position;
    actionMenuOpen.value = true;
  }
}

function onPlayerSelect(playerId: string | null) {
  if (selectedPosition.value) {
    // emit('assign', selectedPosition.value, playerId);
  }
  showPlayerModal.value = false;
  selectedPosition.value = null;
}

function getPlayersForPosition(position: Position): Player[] {
  return props.team.players.filter(p => p.position === position.key);
}

function getPlayerInitials(player: Player | null): number {
  if (!player) return -1;
  return player.number
}

function onSelectAction(position: Position, action: ActionItem['name'] | GoalKeeperActionItem['name']) {
  // emit('action', position, action);
  // TODO
  if (action === 'change') {
    showPlayerModal.value = true;
  }
  actionMenuOpen.value = false;
}

function closeAllMenus() {
  actionMenuOpen.value = false;
  selectedPosition.value = null;
}

// Drag-and-drop logic with threshold to distinguish click vs drag
type DownState = { key: string; startX: number; startY: number } | null;
let downState: DownState = null;
let isDragging = false;
let suppressNextClick = false;

function getContainerRect(): DOMRect | null {
  const el = courtRef.value;
  if (!el) return null;
  return el.getBoundingClientRect();
}

function startDrag(key: string, ev: MouseEvent | TouchEvent) {
  const point = getEventPoint(ev);
  downState = { key, startX: point.x, startY: point.y };
  isDragging = false;
  suppressNextClick = false;
  document.addEventListener('mousemove', onDrag as any);
  document.addEventListener('mouseup', endDrag as any);
  document.addEventListener('touchmove', onDrag as any, { passive: false });
  document.addEventListener('touchend', endDrag as any);
}

function onDrag(ev: MouseEvent | TouchEvent) {
  if (!downState) return;
  const rect = getContainerRect();
  if (!rect) return;
  const p = getEventPoint(ev);
  const dx = p.x - downState.startX;
  const dy = p.y - downState.startY;
  const threshold = 4; // pixels
  if (!isDragging && Math.hypot(dx, dy) > threshold) {
    isDragging = true;
    closeAllMenus();
  }
  if (!isDragging) return;
  ev.preventDefault?.();
  const key = downState.key;
  const xPct = clamp(((p.x - rect.left) / rect.width) * 100, 0, 100);
  const yPct = clamp(((p.y - rect.top) / rect.height) * 100, 0, 100);
  const idx = positions.value.findIndex(pos => pos.key === key);
  const curr = positions.value[idx]!;
  positions.value[idx] = { key: curr.key, label: curr.label, x: xPct, y: yPct };
}

function endDrag() {
  if (downState && isDragging) {
    const current = positions.value.find(p => p.key === downState!.key);
    if (current) {
      store.setTeamPosition(props.team.id, current.key, { x: current.x, y: current.y });
    }
    suppressNextClick = true;
  }
  downState = null;
  isDragging = false;
  document.removeEventListener('mousemove', onDrag as any);
  document.removeEventListener('mouseup', endDrag as any);
  document.removeEventListener('touchmove', onDrag as any);
  document.removeEventListener('touchend', endDrag as any);
}

function getEventPoint(ev: MouseEvent | TouchEvent): { x: number; y: number } {
  if ((ev as TouchEvent).touches && (ev as TouchEvent).touches.length > 0) {
    const t = (ev as TouchEvent).touches[0];
    return { x: t!.clientX, y: t!.clientY };
  }
  const m = ev as MouseEvent;
  return { x: m.clientX, y: m.clientY };
}

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
</script>
<!-- style="background-color: #0061F9;" -->
<template>
  <div class="w-full h-screen relative px-5 py-9 bg-blue-500"  @click.self="closeAllMenus()">
    <!-- Court Image -->
    <div ref="courtRef" class="relative w-full h-full border-4 border-white">
      <!-- <div class="absolute top-0 left-1/2 w- border-3 border-white h-4 -mt-4"></div> -->
      <img :src="upperSideImg" style="margin-top: -26.6px" :class="[
        'w-full object-contain absolute top-0',
        orientation === 'horizontal' ? 'rotate-90' : ''
      ]" alt="Court" />
      <img :src="lowerSideImg"  style="margin-bottom: -26.6px" :class="[
        'w-full object-contain absolute bottom-0',
        orientation === 'horizontal' ? 'rotate-90' : ''
      ]" alt="Court" />
      <div class="absolute top-1/2 left-0 w-full border-2 border-white"></div>
      <div class="relative top-0 w-full h-1/2">
        <div class="absolute bottom-0 -left-5 -mb-7 w-full">
          <button class="shadow-2xl text-white font-semibold rounded-full w-24 h-14" :class="mode === 'attack' ? 'bg-red-500 border-red-700' : 'bg-blue-900 border-gray-900'" @click="toggleMode">{{ mode === "attack" ? 'Defense' : 'Attack' }}</button>
        </div>
      </div>
      <!-- Position Circles -->
      <div v-for="pos in activePositions" :key="pos.key" 
          class="cursor-pointer">
        <div @mousedown.stop="startDrag(pos.key, $event)"
            @touchstart.stop="startDrag(pos.key, $event)"
            @click.stop="!suppressNextClick && onPositionClick(pos)"
            @click.capture="suppressNextClick = false"
            :style="{ 
              position: 'absolute', 
              left: `${pos.x}%`, 
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)'
            }"
            :class="[
            'w-16 h-16 rounded-full flex items-center justify-center border-2 text-sm font-bold text-white transition-colors',
            selectedPosition?.key == pos.key ? 'shadow-inner shadow-lg bg-gray-500 border-gray-600' : mode === 'attack' ? 'shadow-xl bg-blue-800 border-blue-800' : 'shadow-xl border-red-500 bg-red-500'
          ]">
          <span v-if="getAssignedPlayer(pos)">
            {{ getPlayerInitials(getAssignedPlayer(pos)) }}
          </span>
          <span v-else>{{ pos.key }}</span>
        </div>
       
      <!-- <div class="text-xs text-center mt-1 text-gray-600 font-medium">
        {{ pos.label }}
      </div> -->
      </div>
      <div class="absolute -mt-34 rounded-2xl w-full z-50">
          <PositionActionMenu
            :open="actionMenuOpen"
            :selectedPosition="selectedPosition"
            @toggle="actionMenuOpen = !actionMenuOpen"
            @select="(action) => onSelectAction(selectedPosition!, action)"
          />
        </div>
    </div>

    <!-- Player Selection Modal -->
    <PlayerChangeModal v-if="showPlayerModal && selectedPosition" 
      :match="match" 
      :team="team" 
      :selected-position="selectedPosition"  
      @cancel="showPlayerModal = false"
    />
  </div>
</template>


