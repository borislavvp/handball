<template>
<div class="flex sticky items-center justify-between bg-gray-800 w-full h-18">
    <button @click="goBack" class="mx-5 rounded transition-colors">
        <back class="w-8 h-8 text-white"/>
    </button>
    <div class="flex items-center h-full uppercase font-semibold text-4xl">
        <span @click="match.takeTimeout('home')" 
              class="select-none h-full w-19  flex justify-center items-center "
              :class="[
                match.data.value.timeoutsLeftHome ? 'text-gray-900 focus:bg-gray-100 bg-white  ' : 'bg-gray-200 text-gray-400  '
              ]"
              >
                T{{match.data.value.timeoutsLeftHome}}</span>
        <span class="w-19  flex items-center justify-center h-full bg-blue-400  text-white select-none">
            {{ match.data.value.score }}
        </span>
        <div class="relative"  >
            <span class="mx-4 select-none text-white ">{{ team?.name }}</span>
            <div v-if="match.data.value.twoMinutesHome.length > 0" class="flex absolute text-sm justify-between px-4 left-0 bottom-0 border border-gray-300 text-center bg-white  -mb-11 items-center w-full py-1">
                <span>{{ match.data.value.twoMinutesHome.length  }}</span>
                <header-two-minutes-tag v-show="value === match.data.value.twoMinutesHome[0]"
                 v-for="value in match.data.value.twoMinutesHome" :player-id="value" />
            </div>
        </div>
        <div class="flex items-center justify-center h-full">
            <span class="bg-yellow-300 text-black px-5 flex items-center font-bold justify-center h-full select-none">
                {{match.data.value.time}}</span>
            <button @click="toggleMatchTimer()" class="bg-white px-5 flex items-center justify-center h-full">
                <pause v-if="match.data.value.playing" class="h-12 w-12 text-gray-900" />
                <play v-else class="h-12 w-12 text-gray-900" />
            </button>
        </div>
        <div class="relative"  >
            <span class="mx-4 select-none text-white ">{{ match.data.value.opponent }}</span>
            <div v-if="match.data.value.twoMinutesAway.length > 0" class="flex absolute text-sm justify-between px-4 left-0 bottom-0 border border-gray-300 text-center bg-white  -mb-11 items-center w-full py-1">
                <span>{{ match.data.value.twoMinutesAway.length  }}</span>
                <header-two-minutes-tag  v-show="value === match.data.value.twoMinutesAway[0]" 
                v-for="value in match.data.value.twoMinutesAway":player-id="value" />
            </div>
        </div>
        <span class="w-19 flex items-center justify-center h-full bg-blue-400  text-white select-none">
            {{ match.data.value.opponentScore }}
        </span>
        <span @click="match.takeTimeout('away')" 
              class="select-none h-full w-19 flex justify-center items-center "
              :class="[
                match.data.value.timeoutsLeftAway ? 'text-gray-900 focus:bg-gray-100 bg-white  ' : 'bg-gray-200 text-gray-400'
              ]"
              >
                T{{match.data.value.timeoutsLeftAway}}</span>
    </div> 
</div>
</template>

<script setup lang="ts">
import { useHandballStore } from '~/composables/useHandballStore';
import back from '../../components/icons/back.vue'
import pause from '~/components/icons/pause.vue';
import play from '~/components/icons/play.vue';
import HeaderTwoMinutesTag from './HeaderTwoMinutesTag.vue';

const store = useHandballStore();
const match = computed(() => store.matches.match.value!);
const team = computed(() =>  store.teams.getTeam(match.value.data.value.teamid));
const goBack = () => useRouter().back();
console.log(match.value.data)
const toggleMatchTimer = () => {
    if(!match.value) return;
    if(match.value.data.value.playing){
        match.value.pauseMatch();
    }else{
        match.value.resumeMatch();
    }
}

</script>



