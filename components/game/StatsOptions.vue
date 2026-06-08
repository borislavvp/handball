<template>
  <div
    v-if="shootingTarget !== null"
    class="flex select-none flex-col w-full text-xl"
  >
    <div class="relative flex flex-col bg-white px-4 py-4">
      <!-- <span class="font-semibold text-gray-800 pt-2 pb-4">{{goalkeeperSelected ? 'Goalkeeper Saves Statistic' : 'Shooting Statistic' }}</span> -->
      <div
        v-if="goalkeeperSelected"
        class="flex justify-between gap-6 px-6 mb-4"
      >
        <div class="flex-1 relative">
          <toggle-button
            :model-value="oneOnOneLost"
            @update:model-value="val => updateOneOnOneLost(val)"
            negative
            label="1-1 LOST"
          />
          <shortcut-chip
            v-if="ctrlHeld"
            combo="⌃O"
            class="absolute top-1 right-1"
          />
        </div>
        <div class="flex-1 relative">
          <toggle-button
            :model-value="noRecovery"
            @update:model-value="val => updateNoRecovery(val)"
            negative
            label="NO RCV"
          />
        </div>
        <div class="flex-1 relative">
          <toggle-button
            :model-value="fastBreak"
            @update:model-value="val => (shotBuilder.fastBreak.value = val)"
            negative
            label="FASTBREAK"
          />
          <shortcut-chip
            v-if="ctrlHeld"
            combo="⌃F"
            class="absolute top-1 right-1"
          />
        </div>
      </div>
      <div v-else class="flex justify-between gap-6 px-6 mb-4">
        <div class="flex-1 relative">
          <toggle-button
            :model-value="oneOnOneWin"
            @update:model-value="val => (shotBuilder.oneOnOneWin.value = val)"
            label="1-1 WON"
          />
          <shortcut-chip
            v-if="ctrlHeld"
            combo="⌃I"
            class="absolute top-1 right-1"
          />
        </div>
        <div class="flex-1 relative">
          <toggle-button
            :model-value="fastBreak"
            @update:model-value="val => (shotBuilder.fastBreak.value = val)"
            label="FASTBREAK"
          />
          <shortcut-chip
            v-if="ctrlHeld"
            combo="⌃F"
            class="absolute top-1 right-1"
          />
        </div>
      </div>
      <div class="flex w-full justify-between px-6 gap-6">
        <button
          @click="addShotToPlayer(goalkeeperSelected ? 'gkmiss' : 'miss')"
          class="relative rounded flex-1 p-4 bg-red-700 active:bg-red-900 focus:shadow-inner font-semibold text-white"
        >
          {{ goalkeeperSelected ? "GOAL" : "MISS" }}
          <shortcut-chip
            v-if="ctrlHeld"
            :combo="goalkeeperSelected ? '⌃A' : '⌃M'"
            class="absolute top-1 right-1"
          />
        </button>
        <button
          @click="addShotToPlayer('gksave')"
          v-if="goalkeeperSelected"
          class="relative rounded flex-1 p-4 bg-emerald-700 active:bg-emerald-900 focus:shadow-inner font-semibold text-white"
        >
          STOP
          <shortcut-chip
            v-if="ctrlHeld"
            combo="⌃H"
            class="absolute top-1 right-1"
          />
        </button>
        <button
          @click="addShotToPlayer('goal')"
          v-else
          class="relative rounded p-4 flex-1 shadow-md bg-emerald-700 font-semibold text-white active:bg-emerald-900 focus:shadow-inner focus:border-0"
        >
          GOAL
          <shortcut-chip
            v-if="ctrlHeld"
            combo="⌃G"
            class="absolute top-1 right-1"
          />
        </button>
      </div>
    </div>
  </div>
  <div v-else class="flex flex-col select-none w-full text-xl">
    <div class="relative flex flex-col bg-white justify-between p-4 h-98">
      <span
        @click="
          store.selection.stats.value.general =
            !store.selection.stats.value.general
        "
        class="absolute top-0 select-none right-0 -mt-3 -mr-4 rounded-full px-3 py-1 text-2xl font-bold"
        :class="
          store.selection.stats.value.general
            ? 'bg-yellow-300 shadow-inner text-gray-900'
            : 'text-gray-900 bg-white border border-gray-300 shadow-lg'
        "
      >
        %</span
      >
      <div
        v-if="statsPanel.provokesOpenned.value"
        class="absolute flex flex-wrap gap-5 items-center bg-white text-white font-semibold rounded p-4 h-28 -ml-2"
      >
        <button
          @click="setPlayerProvokeTwoMinutes('provokeCard')"
          class="bg-white text-emerald-900 py-4 rounded px-2 shadow-lg border border-emerald-900 flex items-center space-x-4 relative"
        >
          RED <span class="ml-2 h-6 w-4 bg-red-600" />
          <shortcut-chip
            v-if="shiftHeld"
            combo="⇧R"
            class="absolute -top-2 -right-2"
          />
        </button>
        <button
          @click="setPlayerProvokeTwoMinutes('provokeCard')"
          class="bg-white text-emerald-900 py-4 rounded px-2 shadow-lg border border-emerald-900 flex items-center space-x-4 relative"
        >
          BLUE <span class="ml-2 h-6 w-4 bg-blue-600" />
          <shortcut-chip
            v-if="shiftHeld"
            combo="⇧U"
            class="absolute -top-2 -right-2"
          />
        </button>
        <button
          @click="increasePlayerStats('provokeCard')"
          class="bg-white text-emerald-900 py-4 rounded px-2 shadow-lg border border-emerald-900 flex items-center space-x-4 relative"
        >
          YELLOW <span class="ml-2 h-6 w-4 bg-yellow-400" />
          <shortcut-chip
            v-if="shiftHeld"
            combo="⇧Y"
            class="absolute -top-2 -right-2"
          />
        </button>
        <button
          @click="increasePlayerStats('provokePenalty')"
          class="bg-white text-emerald-900 py-4 rounded px-2 shadow-lg border border-emerald-900 relative"
        >
          Penalty
          <shortcut-chip
            v-if="shiftHeld"
            combo="⇧7"
            class="absolute -top-2 -right-2"
          />
        </button>
        <button
          @click="setPlayerProvokeTwoMinutes('provokeTwoMin')"
          class="bg-white text-emerald-900 py-4 rounded px-2 shadow-lg border border-emerald-900 relative"
        >
          2 MIN
          <shortcut-chip
            v-if="shiftHeld"
            combo="⇧2"
            class="absolute -top-2 -right-2"
          />
        </button>
      </div>
      <div
        v-if="statsPanel.extraDefenseOpened.value"
        class="absolute right-0 flex flex-wrap gap-5 items-center bg-white text-white font-semibold rounded-r-4xl p-4 h-28 mr-5"
      >
        <button
          @click="increasePlayerStats('defensex2')"
          class="bg-white h-16 text-emerald-900 py-4 rounded px-2 shadow-lg border border-emerald-900 flex items-center relative"
        >
          <span class="text-md">EXTRA</span>
          <span class="text-4xl -mt-1 font-bold">+</span>
          <shortcut-chip
            v-if="shiftHeld"
            combo="⇧E"
            class="absolute -top-2 -right-2"
          />
        </button>
        <button
          @click="increasePlayerStats('steal')"
          class="bg-white text-emerald-900 py-4 rounded px-2 shadow-lg border border-emerald-900 flex items-center relative"
        >
          <span class="text-md">STEAL</span>
          <steal class="h-6 w-6 text-blue-800" />
          <shortcut-chip
            v-if="shiftHeld"
            combo="⇧S"
            class="absolute -top-2 -right-2"
          />
        </button>
        <button
          @click="setPlayerProvokeTwoMinutes('block')"
          class="bg-white text-emerald-900 py-4 rounded px-2 shadow-lg border border-emerald-900 flex items-center relative"
        >
          <span class="text-md">BLOCK</span>
          <block class="h-6 w-6 text-gray-800" />
          <shortcut-chip
            v-if="shiftHeld"
            combo="⇧B"
            class="absolute -top-2 -right-2"
          />
        </button>
      </div>

      <div v-if="!store.selection.stats.value.general" class="h-full">
        <div
          class="grid px-4 mt-2"
          :class="
            goalkeeperSelected ? 'grid-rows-2 gap-40 ' : 'grid-rows-3 gap-8'
          "
        >
          <div v-if="goalkeeperSelected" class="grid grid-cols-3 gap-16">
            <button
              class="flex flex-col items-center"
              @click="addShotToPlayer('goal_empty')"
              :class="positiveStatStyle"
            >
              <longdistance class="h-12 w-20 text-emerald-800" />
              <span class="text-md">GOAL</span>
            </button>

            <button
              class="flex flex-col items-center"
              @click="increasePlayerStats('lostball')"
              :class="negativeStatStyle"
            >
              <lostball class="h-12 w-12 text-red-600" />
              <span class="text-md">LOST BALL</span>
            </button>

            <button
              class="flex flex-col items-center"
              @click="addShotToPlayer('gkmiss_empty')"
              :class="negativeStatStyle"
            >
              <longdistance
                class="h-12 w-20 text-red-600 transform -scale-x-100"
              />
              <span class="text-md">EMPTY GOAL</span>
            </button>
          </div>
          <div v-if="!goalkeeperSelected" class="grid grid-cols-4 gap-16">
            <button
              class="relative flex flex-col items-center"
              @click="increasePlayerStats('defense')"
              :class="positiveStatStyle"
            >
              <wrestling class="h-12 w-12 text-emerald-800" />
              <span class="text-md">DEFENSE</span>
              <shortcut-chip
                v-if="shiftHeld"
                combo="⇧D"
                class="absolute top-1 right-1"
              />
            </button>
            <button
              class="relative flex flex-col items-center"
              @click="toggleExtraDefense()"
              :class="positiveStatStyle"
            >
              <sumo class="h-12 w-12 text-emerald-800" />
              <span class="text-md">DEFENSE+</span>
            </button>
            <button
              class="relative flex flex-col items-center"
              @click="addShotToPlayer('goal_empty')"
              :class="positiveStatStyle"
            >
              <longdistance class="h-12 w-20 text-emerald-800" />
              <span class="text-md">GOAL LD</span>
            </button>
            <button
              class="relative flex flex-col items-center"
              @click="toggleProvokes()"
              :class="positiveStatStyle"
            >
              <provoke class="h-12 w-12 text-emerald-800" />
              <span class="text-md">PROVOKE</span>
              <shortcut-chip
                v-if="shiftHeld"
                combo="⇧P"
                class="absolute top-1 right-1"
              />
            </button>
          </div>
          <div v-if="!goalkeeperSelected" class="grid grid-cols-4 gap-16">
            <button
              class="relative flex flex-col items-center"
              @click="increasePlayerStats('lostball')"
              :class="negativeStatStyle"
            >
              <lostball class="h-12 w-12 text-red-600" />
              <span class="text-md">LOST BALL</span>
              <shortcut-chip
                v-if="shiftHeld"
                combo="⇧L"
                class="absolute top-1 right-1"
              />
            </button>
            <button
              class="relative flex flex-col items-center"
              @click="increasePlayerStats('1on1lost')"
              :class="negativeStatStyle"
            >
              <span class="text-4xl h-12 font-bold">1-1</span>
              <span class="text-md">1-1 LOST</span>
            </button>
            <button
              class="relative flex flex-col items-center"
              @click="increasePlayerStats('penaltymade')"
              :class="negativeStatStyle"
            >
              <whistle class="h-12 w-12 text-red-600" />
              <span class="text-md">PENALTY</span>
              <shortcut-chip
                v-if="shiftHeld"
                combo="⇧K"
                class="absolute top-1 right-1"
              />
            </button>
            <button
              class="relative flex flex-col items-center"
              @click="increasePlayerStats('norebound')"
              :class="negativeStatStyle"
            >
              <norebound class="h-12 w-12 text-red-600" />
              <span class="text-md text-nowrap">NO REB</span>
              <shortcut-chip
                v-if="shiftHeld"
                combo="⇧N"
                class="absolute top-1 right-1"
              />
            </button>
          </div>
          <div class="grid grid-cols-4 gap-16">
            <button
              class="relative flex flex-col items-center"
              @click="setPlayerTwoMinutes()"
              :class="suspensionStatStyle"
            >
              <twofingers class="h-12 w-12 text-gray-800" />
              <span class="text-md">2 MIN</span>
              <shortcut-chip
                v-if="shiftHeld"
                combo="⇧2"
                class="absolute top-1 right-1"
              />
            </button>
            <button
              class="relative flex flex-col justify-center items-center"
              @click="increasePlayerStats('yellowcard')"
              :class="suspensionStatStyle"
            >
              <span class="h-12 w-8 bg-yellow-500" />
              <span class="text-md">CARD</span>
              <shortcut-chip
                v-if="shiftHeld"
                combo="⇧Y"
                class="absolute top-1 right-1"
              />
            </button>
            <button
              class="relative flex flex-col justify-center items-center"
              @click="increasePlayerStats('redcard')"
              :class="suspensionStatStyle"
            >
              <span class="h-12 w-8 bg-red-600" />
              <span class="text-md">CARD</span>
              <shortcut-chip
                v-if="shiftHeld"
                combo="⇧R"
                class="absolute top-1 right-1"
              />
            </button>
            <button
              class="relative flex flex-col justify-center items-center"
              @click="increasePlayerStats('bluecard')"
              :class="suspensionStatStyle"
            >
              <span class="h-12 w-8 bg-blue-600" />
              <span class="text-md">CARD</span>
              <shortcut-chip
                v-if="shiftHeld"
                combo="⇧U"
                class="absolute top-1 right-1"
              />
            </button>
          </div>
        </div>
      </div>
      <div v-else>
        <stats-overview :player="store.selection.player.value" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ShootingTarget,
  type Player,
  type ShootingArea,
  type ShootingResult,
  type Stats
} from "~/types/handball";
import ToggleButton from "../shared/ToggleButton.vue";
import StatsOverview from "./StatsOverview.vue";
import ShortcutChip from "../shared/ShortcutChip.vue";
import Wrestling from "../icons/wrestling.vue";
import Sumo from "../icons/sumo.vue";
import Provoke from "../icons/provoke.vue";
import Longdistance from "../icons/longdistance.vue";
import Norebound from "../icons/norebound.vue";
import Whistle from "../icons/whistle.vue";
import Lostball from "../icons/lostball.vue";
import Twofingers from "../icons/twofingers.vue";
import Steal from "../icons/steal.vue";
import Block from "../icons/block.vue";
// import { vOnLongPress } from '@vueuse/components'

const props = defineProps<{
  // mode: "attack" | "defense" | "stats",
  goalkeeperSelected: boolean;
  shootingArea: ShootingArea | null;
  shootingTarget: ShootingTarget | null;
  player: Player | null;
}>();

const emit = defineEmits<{
  (e: "shotAdded"): void;
  (e: "twoMinutes", playedId: number): void;
}>();

const store = useHandballStore();
const statsPanel = useStatsPanel();
const shotBuilder = useShotBuilder();
const positiveStatStyle =
  "rounded-2xl border-2 border-emerald-700 p-2 bg-gray-10 h-24 text-emerald-700 font-semibold uppercase  active:bg-emerald-100 focus:shadow-inner";
const negativeStatStyle =
  "rounded-2xl border-2 border-red-700 p-2 bg-gray-10 h-24 text-red-700 font-semibold uppercase  active:bg-red-100 focus:shadow-inner";
const suspensionStatStyle =
  "flex items-center justify-center rounded-2xl h-24 p-2 border-2 border-gray-400 bg-gray-10 text-gray-700 font-semibold uppercase  active:bg-gray-100 focus:shadow-inner";
const oneOnOneWin = computed(() => shotBuilder.oneOnOneWin.value);
const oneOnOneLost = ref(false);
const noRecovery = computed(() => Boolean(store.selection.noRecovery.value));
const fastBreak = computed(() => shotBuilder.fastBreak.value);
const activeMatch = computed(() => store.matches.match.value!);
const { $dialog } = useNuxtApp();
const { shiftHeld, ctrlHeld } = useModifierState();

watch(
  () => props.player,
  newVal => {
    shotBuilder.oneOnOneWin.value = false;
    oneOnOneLost.value = false;
    store.selection.oneOnOneLost.value = false;
    store.selection.noRecovery.value = false;
  }
);

const toggleExtraDefense = () => {
  statsPanel.toggleExtraDefense();
};

const toggleProvokes = () => {
  statsPanel.toggleProvokes();
};

const increasePlayerStats = (stat: Stats, player: Player = props.player!) => {
  store.players.increasePlayerStat(player, stat);
  if (statsPanel.provokesOpenned.value) {
    statsPanel.provokesOpenned.value = false;
  }
};

const addShotToPlayer = (result: ShootingResult) => {
  if (!props.player) {
    $dialog.alert({ title: "Please select a player!" });
    return;
  }

  let shootingArea = props.shootingArea;
  let shootingTarget = props.shootingTarget;

  if (result === "gkmiss_empty" || result === "goal_empty") {
    shootingArea = "CB9";
    shootingTarget = ShootingTarget.GOAL_MIDDLE_MIDDLE;
  } else if (props.shootingTarget === null || props.shootingArea === null) {
    $dialog.alert({ title: "Please select shooting area and target!" });
    return;
  } else {
    shootingArea = props.shootingArea!;
    shootingTarget = props.shootingTarget!;
  }
  if (shotBuilder.oneOnOneWin.value) {
    increasePlayerStats("1on1win");
  }
  if (oneOnOneLost.value) {
    increasePlayerStats("1on1lost", store.selection.mistakePlayer.value!);
  }
  if (noRecovery.value && store.selection.noRecoveryPlayer.value) {
    increasePlayerStats("norebound", store.selection.noRecoveryPlayer.value);
  }
  if (result === "gkmiss" || result === "gkmiss_empty") {
    activeMatch.value.increaseMatchScore("away");
  } else if (result === "goal" || result === "goal_empty") {
    activeMatch.value.increaseMatchScore("home");
    // increasePlayerStats('goal_empty', props.player!)
  }
  store.players.addShotToPlayer(props.player, {
    from: shootingArea,
    to: shootingTarget,
    result: result,
    time: activeMatch.value.data.value.time,
    playerid: props.player.id,
    fastbreak: shotBuilder.fastBreak.value,
    breakthrough: props.goalkeeperSelected
      ? oneOnOneLost.value
      : shotBuilder.oneOnOneWin.value,
    assistPrimary: store.selection.primaryAssist.value?.id || null,
    assistSecondary: store.selection.secondaryAssist.value?.id || null,
    mistakePlayer: store.selection.mistakePlayer.value?.id || null,
    noRecovery: noRecovery.value,
    noRecoveryPlayer: store.selection.noRecoveryPlayer.value?.id || null,
    matchid: activeMatch.value.data.value!.id
  });

  shotBuilder.clearShot();
  store.selection.clearSelection();
  emit("shotAdded");
};

const updateOneOnOneLost = (val: boolean) => {
  oneOnOneLost.value = val;
  store.selection.oneOnOneLost.value = val;
};

const updateNoRecovery = (val: boolean) => {
  store.selection.noRecovery.value = val;
  if (!val) {
    store.selection.noRecoveryPlayer.value = null;
  }
};

const setPlayerProvokeTwoMinutes = (stat: Stats) => {
  increasePlayerStats(stat);
  store.matches.match.value?.addTwoMinute(props.player!.id, "away");
  if (statsPanel.provokesOpenned.value) {
    statsPanel.provokesOpenned.value = false;
  }
};
const setPlayerTwoMinutes = () => {
  increasePlayerStats("twominutes");
  store.matches.match.value?.addTwoMinute(props.player!.id, "home");
};
</script>

<style scoped></style>
