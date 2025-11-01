<template>
<div class="w-full flex flex-col items-center justify-center">
  <span v-if="!player && statsMode" class="w-full font-semibold text-2xl mb-4 rounded-xl  border border-gray-200  text-gray-800 py-2 px-4 uppercase text-center bg-white mb-2">overview of team {{ store.teams.selectedTeam.value?.name }} shots</span>
  <div class="svg-container">
    <svg
      width="927"
      height="575"
      viewBox="0 0 927 575"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Outer lines -->
        <path
            d="M796.328 575V530.057V130.06H130.059V575"
            :stroke="'#050C58'"
            stroke-width="22.8175"
        />
        <rect x="785.492" y="533.359" width="21.6766" height="41.0714" fill="white" stroke="black" stroke-width="1.14087"/>
        <rect x="785.492" y="445.511" width="21.6766" height="41.0714" fill="white" stroke="black" stroke-width="1.14087"/>
        <rect x="785.492" y="361.086" width="21.6766" height="41.0714" fill="white" stroke="black" stroke-width="1.14087"/>
        <rect x="785.492" y="276.661" width="21.6766" height="41.0714" fill="white" stroke="black" stroke-width="1.14087"/>
        <rect x="785.492" y="192.237" width="21.6766" height="41.0714" fill="white" stroke="black" stroke-width="1.14087"/>
        <rect x="119.219" y="533.359" width="21.6766" height="41.0714" fill="white" stroke="black" stroke-width="1.14087"/>
        <rect x="119.219" y="445.511" width="21.6766" height="41.0714" fill="white" stroke="black" stroke-width="1.14087"/>
        <rect x="119.219" y="361.086" width="21.6766" height="41.0714" fill="white" stroke="black" stroke-width="1.14087"/>
        <rect x="119.219" y="276.661" width="21.6766" height="41.0714" fill="white" stroke="black" stroke-width="1.14087"/>
        <rect x="119.219" y="192.237" width="21.6766" height="41.0714" fill="white" stroke="black" stroke-width="1.14087"/>
        <rect x="185.391" y="119.221" width="46.7758" height="21.6766" fill="white" stroke="black" stroke-width="1.14087"/>
        <rect x="268.676" y="119.221" width="46.7758" height="21.6766" fill="white" stroke="black" stroke-width="1.14087"/>
        <rect x="351.961" y="119.221" width="46.7758" height="21.6766" fill="white" stroke="black" stroke-width="1.14087"/>
        <rect x="435.242" y="119.221" width="46.7758" height="21.6766" fill="white" stroke="black" stroke-width="1.14087"/>
        <rect x="518.527" y="119.221" width="46.7758" height="21.6766" fill="white" stroke="black" stroke-width="1.14087"/>
        <rect x="601.809" y="119.221" width="46.7758" height="21.6766" fill="white" stroke="black" stroke-width="1.14087"/>
        <rect x="685.094" y="119.221" width="46.7758" height="21.6766" fill="white" stroke="black" stroke-width="1.14087"/>
     
        <!-- Dynamic clickable rectangles -->
      <rect
        v-for="(rect, i) in rects"
        :key="i"
        v-bind="rect"
        :fill="getBoxColor(rect.fill,i)"
        @click="handleRectClick(i)"
        style="cursor: pointer; transition: 0.2s ease;"
        />


      <text
        pointer-events="none"
        :key="0"
        :x="480"
        :y="70"
        text-anchor="middle"
        alignment-baseline="middle"
        font-size="65"
        class="select-none"
        :fill="getTextColor(0)"
      >
        {{ getShootingTargetText(0)['text'] }}
      </text>
      <text
        pointer-events="none"
        :key="10"
        :x="55"
        :y="370"
        text-anchor="middle"
        alignment-baseline="middle"
        font-size="65"
        class="select-none"
        :fill="getTextColor(10)"
      >
        {{ getShootingTargetText(10)['text'] }}
      </text>
      <text
        pointer-events="none"
        :key="11"
        :x="865"
        :y="370"
        text-anchor="middle"
        alignment-baseline="middle"
        font-size="65"
        class="select-none"
        :fill="getTextColor(11)"
      >
        {{ getShootingTargetText(11)['text'] }}
      </text>
      <text
        v-for="(num, index) in shootingTargets"
        pointer-events="none"
        :key="num"
        :x="getX(index)"
        :y="getY(index)"
        text-anchor="middle"
        alignment-baseline="middle"
        font-size="65"
        class="select-none"
        :fill="getTextColor(num)"
      >
        {{ getShootingTargetText(num)['text'] }}
      </text>
    </svg>
  </div>
</div>
</template>

<script setup lang="ts">
import { pl } from '@nuxt/ui/runtime/locale/index.js';
import { ref } from 'vue'
import { ShootingTarget, type Player, type ShootingArea } from '~/types/handball';


const props = defineProps<{
    goalkeepSelected: boolean,
    shootingTarget: ShootingTarget | null,
    shootingArea: ShootingArea | null,
    player: Player | null,
    statsMode: boolean
}>()

const emit = defineEmits<{
    (e: 'positionClick', index: number | null): void
}>()
const store = useHandballStore()

const rects = [
  { x: 119.219, y: 0.570437, width: 687.946, height: 117.51, fill: 'white', stroke: 'black', 'stroke-width': 1.14 },
  
  { x: 142.035, y: 142.038, width: 213.343, height: 141.468, fill: 'white', stroke: 'black', 'stroke-width': 1.14 },
  { x: 356.52, y: 142.038, width: 213.343, height: 141.468, fill: 'white', stroke: 'black', 'stroke-width': 1.14 },
  { x: 571.004, y: 142.038, width: 213.343, height: 141.468, fill: 'white', stroke: 'black', 'stroke-width': 1.14 },
  { x: 142.035, y: 284.648, width: 213.343, height: 147.173, fill: 'white', stroke: 'black', 'stroke-width': 1.14 },
  { x: 356.52, y: 284.648, width: 213.343, height: 147.173, fill: 'white', stroke: 'black', 'stroke-width': 1.14 },
  { x: 571.004, y: 284.648, width: 213.343, height: 147.173, fill: 'white', stroke: 'black', 'stroke-width': 1.14 },
  { x: 142.035, y: 432.961, width: 213.343, height: 141.468, fill: 'white', stroke: 'black', 'stroke-width': 1.14 },
  { x: 356.52, y: 432.961, width: 213.343, height: 141.468, fill: 'white', stroke: 'black', 'stroke-width': 1.14 },
  { x: 571.004, y: 432.961, width: 213.343, height: 141.468, fill: 'white', stroke: 'black', 'stroke-width': 1.14 },
  
  { x: -0.570437, y: 0.570437, width: 117.51, height: 455.208, fill: 'white', stroke: 'black', 'stroke-width': 1.14, transform:"matrix(-1 0 0 1 117.508 118.65)" },
  { x: -0.570437, y: 0.570437, width: 117.51, height: 455.208, fill: 'white', stroke: 'black', 'stroke-width': 1.14, transform:"matrix(-1 0 0 1 925.25 118.65)" },
]

const shootingTargets = [
  ShootingTarget.GOAL_TOP_LEFT,
  ShootingTarget.GOAL_TOP_MIDDLE,
  ShootingTarget.GOAL_TOP_RIGHT,
  ShootingTarget.GOAL_MIDDLE_LEFT,
  ShootingTarget.GOAL_MIDDLE_MIDDLE,
  ShootingTarget.GOAL_MIDDLE_RIGHT,
  ShootingTarget.GOAL_BOTTOM_LEFT,
  ShootingTarget.GOAL_BOTTOM_MIDDLE,
  ShootingTarget.GOAL_BOTTOM_RIGHT
]

// base positions
const baseX = 240
const baseY = 225
const offsetY = 145


// calculate X position
function getX(index:number) {
  if ([0,3,6].includes(index)) return baseX;
  if ([1,4,7].includes(index)) return baseX + 230;
  if ([1,4,7].includes(index)) return baseX + 230;
  if ([2,5,8].includes(index)) return baseX + 2*220;
  return baseX
}

// calculate Y position
function getY(index:number) {
  if ([0, 1, 2].includes(index)) return baseY
  if ([3, 4, 5].includes(index)) return baseY + offsetY
  if ([6, 7, 8].includes(index)) return baseY + offsetY * 2
  return baseY
}

function handleRectClick(i:number) {
  if(props.shootingTarget === i) {
    emit('positionClick', null);
    return;
  }
  emit('positionClick', i);
}

function getScoreColor(score: number){
  let boxColor = '';
  let textColor = '';
  if (score === 0) {
    boxColor = '#e5e7eb'; // gray background
    textColor = '#6b7280'; // medium gray text
  } else if (score < 30) {
    boxColor = '#fee2e2'; // soft red
    textColor = '#b91c1c'; // dark red
  } else if (score < 60) {
    boxColor = '#fef3c7'; // soft yellow
    textColor = '#92400e'; // brownish orange
  } else if (score < 80) {
    boxColor = '#dcfce7'; // soft green
    textColor = '#166534'; // dark green
  } else {
    boxColor = '#bbf7d0'; // mint green
    textColor = '#065f46'; // deep green
  } 
  return {boxColor,textColor};
}

function getShootingTargetText (target: ShootingTarget){
  if(props.statsMode){
    if(props.player){
      console.log(props.player)
      const shots = props.player.currentShots?.filter(s => s.to === target)
      .filter(s => props.shootingArea? s.from === props.shootingArea : true);
      console.log(shots)
      const type = props.player.position === 'GK' ? "gksave" : "goal";
      const positive = shots?.filter(s => s.result === type).length ?? 0;
      const score = shots?.length ? (positive/shots.length*100) : 0;
      const color = getScoreColor(score) 
      
      return {text:`${positive}/${shots?.length ?? 0}`, color}
    }else{
      const shots = store.matches.currentMatch.value?.shots.filter(s => s.to === target && s.result !== 'gkmiss' && s.result !== 'gksave')
      .filter(s => props.shootingArea? s.from === props.shootingArea : true);
      const positive = shots?.filter(s => s.result === "goal").length ?? 0;
      const score = shots?.length ? (positive/shots.length*100) : 0
      const color = getScoreColor(score) 
      return {text:`${positive}/${shots?.length ?? 0}`, color}
    }
  }else{
    return {text:target}
  }
}

function getBoxColor(defaultFill:string, index:number){
  if(props.statsMode){
    if(props.shootingTarget === index){
      return "#050C58"
    }
    return getShootingTargetText(index).color?.boxColor
  }else{
    if(props.shootingTarget === index){
      return "#007a55"
    }
    return defaultFill
  }
}
function getTextColor(index:number){
  if(props.statsMode){
    if(props.shootingTarget === index){
      return "white"
    }
    return getShootingTargetText(index).color?.textColor
  }else{
    if(props.shootingTarget === index){
      return "white"
    }
    return "#050C58"
  }
}

</script>

<style scoped>
.svg-container {
  width: 100%;
  display: flex;
  justify-content: center;
}

svg {
  max-width: 100%;
  height: auto;
}
</style>
