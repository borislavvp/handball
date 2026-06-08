
<template>
  <!-- <div class="h-screen flex flex-col overflow-hidden"> -->
    <div v-if="store.loading.value" class="flex flex-col items-center justify-center min-h-screen bg-white text-center">
      <div class="relative w-24 h-24 mb-6">
        <div class="absolute inset-0 rounded-full border-8 border-[#42b883] opacity-20"></div>
        <div class="absolute inset-0 rounded-full border-8 border-t-[#42b883] border-transparent animate-spin"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-xl font-bold text-[#42b883]">%</span>
        </div>
      </div>
      <h2 class="text-2xl font-semibold text-gray-800">Syncing match stats…</h2>
      <p class="text-gray-500 mt-2 text-sm">This may take a few seconds</p>
    </div>
    <!-- <div class="flex flex-1 overflow-hidden"> -->
    <div v-if="!match || !team" class="flex items-center justify-center h-full">
      <p class="text-lg text-gray-600"> 'Match not found.'</p>
    </div>
    <div v-else class="h-screen flex flex-col overflow-hidden">
      <!-- header -->
      <game-header />
      <div class="flex flex-1 overflow-hidden">
        <!-- Team Side -->
        <div class="flex flex-col mt-4 border-r border-gray-200 w-2/5 h-full justify-between overflow-x-hidden overflow-y-auto">
          <div class="flex flex-col justify-center">
            <!-- Players -->
            <div class="h-20 w-full px-4">
              <selected-player-tag v-if="selectedPlayer" :selected-player="selectedPlayer" />
              <div v-else class="h-full w-full rounded  flex items-center justify-center px-8 text-gray-800 select-none">
                <span class="text-xl font-semibold">No player selected. Overall stats visible.</span>
              </div>
            </div>
            <div class="flex flex-wrap w-full ml-8 space-x-6 py-6">
              <players-list
              :stats-mode="store.selection.stats.value.goal"
              :shooting-target="shotBuilder.shootingTarget.value"
              />
            </div>
            <!-- Defense System -->
            <div class="flex items-center justify-between mb-5 mx-8">
              <div class="flex items center text-xl">
                <span class="font-semibold">Defense:</span>
                <select @input="changeDefenseSystem"
                :value="match.data.value.defenseSystem" class="font-semibold underline ml-2">
                  <option value="6:0">6:0</option>
                  <option value="5:1">5:1</option>
                  <option value="3:2:1">3:2:1</option>
                  <option value="4:2">4:2</option>
                  <option value="1:1">1:1</option>
                </select>
              </div>
              <div class="flex items-center text-xl">
                <span class="font-semibold">Opposite Defense:</span>
                <select @input="changeOppositeDefenseSystem"
                :value="match.data.value.opponentDefenseSystem" class="font-semibold underline ml-2">
                  <option value="6:0">6:0</option>
                  <option value="5:1">5:1</option>
                  <option value="3:2:1">3:2:1</option>
                  <option value="4:2">4:2</option>
                  <option value="1:1">1:1</option>
                </select>
              </div>
            </div>
            <div class="flex items-center justify-between mb-5 mx-8">

              <button @click="match.toggleEmptyGoal('home')"
                class="rounded-md select-none px-4 py-2 font-semibold text-lg flex text-gray-900 text-center items-center "
                :class="[
                  match.data.value.emptyGoalHome ? 'bg-yellow-300 shadow-inner' : ' border border-gray-800 bg-white shadow-md '
                ]"
              >EMPTY GOAL</button>
              <button @click="match.toggleEmptyGoal('away')"
                class="rounded-md select-none px-4 py-2 font-semibold text-lg flex text-gray-900 text-center items-center "
                :class="[
                  match.data.value.emptyGoalAway ? 'bg-yellow-300 shadow-inner' : ' border border-gray-800 bg-white shadow-md '
                ]"
              >OPPOSITE EMPTY GOAL</button>

            </div>
          </div>

        </div>
        <!-- Stats Side -->
        <div class="w-3/5 h-full flex flex-col px-10 py-6 bg-gray-100 overflow-x-hidden"
        :class="shotBuilder.shootingTarget.value !== null ? 'overflow-y-auto' : 'overflow-y-hidden'">
          <goal
            @position-click="onShootingTargetClick"
            :goalkeep-selected="selectedPlayer?.position === 'GK'"
            :shooting-target="shotBuilder.shootingTarget.value"
            :shooting-area="shotBuilder.shootingArea.value"
            :player="selectedPlayer"
            :stats-mode="store.selection.stats.value.goal"
            class="relative px-10 bg-gray-100"
          />
          <shooting-position
          v-if="shotBuilder.shootingTarget.value !== null "
            @position-click="onShootingAreaClick"
            :player="selectedPlayer"
            :stats-mode="store.selection.stats.value.goal"
            :selected-shooting-target="shotBuilder.shootingTarget.value"
            class="bg-white px-10 -mt-4 z-100"
          />
          <stats-options
            class="flex-1"
            :class="shotBuilder.shootingTarget.value === null && 'mt-5'"
            :mode="gameMode"
            :goal-selected="shotBuilder.shootingTarget.value !== null"
            :goalkeeper-selected="selectedPlayer?.position === 'GK'"
            :shooting-area="shotBuilder.shootingArea.value"
            :shooting-target="shotBuilder.shootingTarget.value"
            :player="selectedPlayer"
            :assist-primary="selectedPrimaryAssist"
            :assist-secondary="selectedSecondaryAssist"
            :mistake-player="selectedMistakePlayer"
            @shot-added="onShotAdded"
          />
        </div>

      </div>
    </div>
</template>

<script setup lang="ts">
import { useHandballStore } from '~/composables/useHandballStore';
import { ShootingTarget, type DefenseSystem, type Player, type Position, type ShootingArea, type Stats } from '~/types/handball';
import defense from '~/components/icons/defense2.vue';
import attack from '~/components/icons/attack.vue';
import statsIcon from '~/components/icons/statsIcon.vue';
import Goal from '~/components/game/Goal.vue';
import StatsHeadline from '~/components/game/StatsHeadline.vue';
import PlayersList from '~/components/game/PlayersList.vue';
import StatsOverview from '~/components/game/StatsOverview.vue';
// import PlayerPerformanceChart from '~/components/game/PlayerPerformanceChart.vue';
import GameHeader from '~/components/game/GameHeader.vue';
import ShootingPosition from '~/components/game/ShootingPosition.vue';
import StatsOptions from '~/components/game/StatsOptions.vue';
import SelectedPlayerTag from '~/components/game/SelectedPlayerTag.vue';

const { $dialog } = useNuxtApp()

const store = useHandballStore();
const shotBuilder = useShotBuilder();
const statsPanel = useStatsPanel();
const playerOrder = usePlayerOrder();
const shortcuts = useKeyboardShortcuts();

const match = computed(() => store.matches.match.value || null);

const team = computed(() => match.value ? store.teams.getTeam(match.value.data.value.teamid) : null);

const gameMode = computed(() => store.selection.gameMode.value);

const selectedPlayer = computed<Player | null>(() => {
  return store.selection.player.value;
});

const selectedPrimaryAssist = computed<Player | null>(() => {
  return store.selection.primaryAssist.value;
});

const selectedSecondaryAssist = computed<Player | null>(() => {
  return store.selection.secondaryAssist.value;
});

const selectedMistakePlayer = computed<Player | null>(() => {
  return store.selection.mistakePlayer.value;
});

const alertToast = (title: string) => {
  $dialog.alert({ title });
};

const increaseStatForSelected = (stat: Stats) => {
  if (!selectedPlayer.value) {
    alertToast('Please select a player first');
    return;
  }
  store.players.increasePlayerStat(selectedPlayer.value, stat);
  if (statsPanel.provokesOpenned.value) {
    statsPanel.provokesOpenned.value = false;
  }
};

const setPlayerProvokeTwoMinutes = (stat: Stats) => {
  if (!selectedPlayer.value) {
    alertToast('Please select a player first');
    return;
  }
  increaseStatForSelected(stat);
  match.value?.addTwoMinute(selectedPlayer.value.id, 'away');
  if (statsPanel.provokesOpenned.value) {
    statsPanel.provokesOpenned.value = false;
  }
};

const toggleMatchTimer = () => {
  if (!match.value) return;
  if (match.value.data.value.playing) {
    match.value.pauseMatch();
  } else {
    match.value.resumeMatch();
  }
};

const cancelCascade = () => {
  if (statsPanel.provokesOpenned.value) {
    statsPanel.provokesOpenned.value = false;
    return;
  }
  if (statsPanel.extraDefenseOpened.value) {
    statsPanel.extraDefenseOpened.value = false;
    return;
  }
  if (shotBuilder.shootingTarget.value !== null) {
    shotBuilder.setShootingTarget(null);
    store.selection.clearSelection();
    return;
  }
  if (store.selection.player.value !== null) {
    store.selection.player.value = null;
    store.selection.clearSelection();
  }
};

const selectPlayerAtSlot = (slot: number) => {
  const p = playerOrder.playerAtSlot(team.value, slot);
  if (!p) return false;
  store.selection.player.value = p;
  return true;
};

const selectTargetDigit = (digit: string) => {
  if (!selectedPlayer.value) {
    alertToast('Please select a player first');
    return false;
  }
  const n = Number(digit);
  if (!Number.isInteger(n) || n < 0 || n > 9) return false;
  shotBuilder.setShootingTarget(n as ShootingTarget);
  return true;
};

const selectTargetSymbol = (symbol: '-' | '=') => {
  if (!selectedPlayer.value) {
    alertToast('Please select a player first');
    return false;
  }
  const map: Record<string, ShootingTarget> = {
    '-': ShootingTarget.OUT_LEFT,
    '=': ShootingTarget.OUT_RIGHT,
  };
  const t = map[symbol];
  if (t === undefined) return false;
  shotBuilder.setShootingTarget(t);
  return true;
};

const selectShootingAreaLetter = (letter: string) => {
  const map: Record<string, ShootingArea> = {
    L: 'LW',
    W: 'RW',
    T: '7M',
  };
  const fixed: Record<string, ShootingArea> = {
    B: 'LB9',
    C: 'CB9',
    R: 'RB9',
  };
  if (map[letter]) {
    shotBuilder.cycleShootingArea(map[letter]!);
    return true;
  }
  if (fixed[letter]) {
    shotBuilder.cycleShootingArea(fixed[letter]!);
    return true;
  }
  return false;
};

const confirmShot = (result: 'goal' | 'miss' | 'gksave' | 'gkmiss') => {
  if (!selectedPlayer.value) {
    alertToast('Please select a player first');
    return false;
  }
  if (shotBuilder.shootingTarget.value === null || shotBuilder.shootingArea.value === null) {
    alertToast('Pick shooting area and target');
    return false;
  }
  fireShot(result);
  return true;
};

const fireShot = (result: 'goal' | 'miss' | 'gksave' | 'gkmiss') => {
  if (!selectedPlayer.value) return;
  const player = selectedPlayer.value;
  const isGK = player.position === 'GK';
  const activeMatch = match.value!;

  if (shotBuilder.oneOnOneWin.value) {
    store.players.increasePlayerStat(player, '1on1win');
  }
  if (store.selection.oneOnOneLost.value && store.selection.mistakePlayer.value) {
    store.players.increasePlayerStat(store.selection.mistakePlayer.value, '1on1lost');
  }
  if (store.selection.noRecovery.value && store.selection.noRecoveryPlayer.value) {
    store.players.increasePlayerStat(store.selection.noRecoveryPlayer.value, 'norebound');
  }
  if (result === 'gkmiss') {
    activeMatch.increaseMatchScore('away');
  } else if (result === 'goal') {
    activeMatch.increaseMatchScore('home');
  }
  store.players.addShotToPlayer(player, {
    from: shotBuilder.shootingArea.value!,
    to: shotBuilder.shootingTarget.value!,
    result,
    time: activeMatch.data.value.time,
    playerid: player.id,
    fastbreak: shotBuilder.fastBreak.value,
    breakthrough: isGK ? Boolean(store.selection.oneOnOneLost.value) : shotBuilder.oneOnOneWin.value,
    assistPrimary: store.selection.primaryAssist.value?.id ?? null,
    assistSecondary: store.selection.secondaryAssist.value?.id ?? null,
    mistakePlayer: store.selection.mistakePlayer.value?.id ?? null,
    noRecovery: store.selection.noRecovery.value,
    noRecoveryPlayer: store.selection.noRecoveryPlayer.value?.id ?? null,
    matchid: activeMatch.data.value.id,
  });
  shotBuilder.clearShot();
  store.selection.clearSelection();
};

onMounted(async () => {
  if(!store.teams.selectedTeam.value){
    await store.initialize();
  }
})

onActivated(() => {
  if(match.value && (match.value.data.value.result)){
    $dialog.alert({
      title: 'Match Ended',
      message: 'This match has already ended. Please go back to matches overview.',
      okText: 'View Analysis',
    }).then(() => {
      useRouter().push('/matches');
    });
  }
})

watch(() => match.value?.data.value.id, () => {
  shotBuilder.clearShot();
  store.selection.resetAll();
  statsPanel.closeAll();
});

watch(() => match.value?.data.value.result, () => {
   if(match.value && (match.value.data.value.result)){
    $dialog.alert({
      title: 'Match Ended',
      message: 'This match has already ended. Please go back to matches overview.',
      okText: 'View Analysis',
    }).then(() => {
      useRouter().push(`/matches/${match.value?.data.value.id}`);
    });
  }
});

watch(() => selectedPlayer.value?.id, () => {
  shotBuilder.oneOnOneWin.value = false;
  store.selection.oneOnOneLost.value = false;
  store.selection.noRecovery.value = false;
});

const registerKeymap = () => {
  shortcuts.register('Space', toggleMatchTimer);
  shortcuts.register('Escape', cancelCascade);

  shortcuts.register('Shift+1', () => selectPlayerAtSlot(0));
  shortcuts.register('Shift+2', () => {
    if (statsPanel.provokesOpenned.value) {
      setPlayerProvokeTwoMinutes('provokeTwoMin');
      return;
    }
    selectPlayerAtSlot(1);
  });
  shortcuts.register('Shift+3', () => selectPlayerAtSlot(2));
  shortcuts.register('Shift+4', () => selectPlayerAtSlot(3));
  shortcuts.register('Shift+5', () => selectPlayerAtSlot(4));
  shortcuts.register('Shift+6', () => selectPlayerAtSlot(5));
  shortcuts.register('Shift+7', () => {
    if (statsPanel.provokesOpenned.value) {
      increaseStatForSelected('provokePenalty');
      return;
    }
    selectPlayerAtSlot(6);
  });
  shortcuts.register('Shift+8', () => selectPlayerAtSlot(7));
  shortcuts.register('Shift+9', () => selectPlayerAtSlot(8));
  shortcuts.register('Shift+0', () => selectPlayerAtSlot(9));

  shortcuts.register('Shift+D', () => increaseStatForSelected('defense'));
  shortcuts.register('Shift+E', () => increaseStatForSelected('defensex2'));
  shortcuts.register('Shift+S', () => increaseStatForSelected('steal'));
  shortcuts.register('Shift+B', () => {
    if (selectedPlayer.value) {
      setPlayerProvokeTwoMinutes('block');
    } else {
      increaseStatForSelected('block');
    }
  });
  shortcuts.register('Shift+L', () => increaseStatForSelected('lostball'));
  shortcuts.register('Shift+K', () => increaseStatForSelected('penaltymade'));
  shortcuts.register('Shift+N', () => increaseStatForSelected('norebound'));

  shortcuts.register('Shift+Y', () => {
    if (statsPanel.provokesOpenned.value) {
      increaseStatForSelected('provokeCard');
      return;
    }
    increaseStatForSelected('yellowcard');
  });
  shortcuts.register('Shift+R', () => {
    if (statsPanel.provokesOpenned.value) {
      setPlayerProvokeTwoMinutes('provokeCard');
      return;
    }
    increaseStatForSelected('redcard');
  });
  shortcuts.register('Shift+U', () => {
    if (statsPanel.provokesOpenned.value) {
      setPlayerProvokeTwoMinutes('provokeCard');
      return;
    }
    increaseStatForSelected('bluecard');
  });

  shortcuts.register('Shift+P', () => {
    if (shotBuilder.shootingTarget.value !== null) {
      shotBuilder.setShootingTarget(null);
      store.selection.clearSelection();
    }
    statsPanel.toggleProvokes();
  });

  shortcuts.register('Ctrl+0', () => selectTargetDigit('0'));
  shortcuts.register('Ctrl+1', () => selectTargetDigit('1'));
  shortcuts.register('Ctrl+2', () => selectTargetDigit('2'));
  shortcuts.register('Ctrl+3', () => selectTargetDigit('3'));
  shortcuts.register('Ctrl+4', () => selectTargetDigit('4'));
  shortcuts.register('Ctrl+5', () => selectTargetDigit('5'));
  shortcuts.register('Ctrl+6', () => selectTargetDigit('6'));
  shortcuts.register('Ctrl+7', () => selectTargetDigit('7'));
  shortcuts.register('Ctrl+8', () => selectTargetDigit('8'));
  shortcuts.register('Ctrl+9', () => selectTargetDigit('9'));
  shortcuts.register('Ctrl+-', () => selectTargetSymbol('-'));
  shortcuts.register('Ctrl+=', () => selectTargetSymbol('='));

  shortcuts.register('Ctrl+L', () => selectShootingAreaLetter('L'));
  shortcuts.register('Ctrl+W', () => selectShootingAreaLetter('W'));
  shortcuts.register('Ctrl+B', () => selectShootingAreaLetter('B'));
  shortcuts.register('Ctrl+C', () => selectShootingAreaLetter('C'));
  shortcuts.register('Ctrl+R', () => selectShootingAreaLetter('R'));
  shortcuts.register('Ctrl+T', () => selectShootingAreaLetter('T'));

  shortcuts.register('Ctrl+F', () => {
    if (shotBuilder.shootingTarget.value !== null) {
      shotBuilder.toggleFastBreak();
    }
  });
  shortcuts.register('Ctrl+I', () => {
    if (shotBuilder.shootingTarget.value !== null && selectedPlayer.value?.position !== 'GK') {
      shotBuilder.toggleOneOnOneWin();
    }
  });
  shortcuts.register('Ctrl+O', () => {
    if (shotBuilder.shootingTarget.value !== null && selectedPlayer.value?.position === 'GK') {
      store.selection.oneOnOneLost.value = !store.selection.oneOnOneLost.value;
    }
  });

  shortcuts.register('Ctrl+G', () => confirmShot('goal'));
  shortcuts.register('Ctrl+M', () => confirmShot('miss'));
  shortcuts.register('Ctrl+H', () => confirmShot('gksave'));
  shortcuts.register('Ctrl+A', () => confirmShot('gkmiss'));
};

registerKeymap();

function onShotAdded(){
  shotBuilder.clearShot();
  store.selection.clearSelection();
}

function onShootingTargetClick(index: number | null){
  shotBuilder.setShootingTarget(index);
  if (shotBuilder.shootingTarget.value === null) {
    store.selection.clearSelection();
  }
}


function onShootingAreaClick(index: ShootingArea | null){
  shotBuilder.setShootingArea(index);
}

function changeDefenseSystem(e:Event) {
 match.value?.changeDefenseSystem((e.target as HTMLInputElement).value as DefenseSystem)
}

function changeOppositeDefenseSystem(e:Event) {
 match.value?.changeOpponentDefenseSystem((e.target as HTMLInputElement).value as DefenseSystem)
}

</script>

<style scoped>

</style>

