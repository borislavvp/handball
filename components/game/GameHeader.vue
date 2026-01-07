<template>
<div class="flex sticky items-center justify-between bg-gray-800 w-full h-18">
    <button @click="goBack" class="mx-5 rounded transition-colors">
        <back class="w-8 h-8 text-white"/>
    </button>
    <div class="flex items-center h-full uppercase font-semibold text-4xl">
        <span @click="store.matches.takeTimeout" 
              class="select-none h-full w-19  flex justify-center items-center "
              :class="[
                store.matches.currentMatch.value?.timeoutsLeft ? 'text-gray-900 focus:bg-gray-100 bg-white  ' : 'bg-gray-200 text-gray-400  '
              ]"
              >
                T{{store.matches.currentMatch.value?.timeoutsLeft}}</span>
        <span class="w-19  flex items-center justify-center h-full bg-blue-400  text-white select-none">
            {{ store.matches.currentMatch.value?.score }}
        </span>
        <div class="relative"  >
            <span class="mx-4 select-none text-white ">{{ team?.name }}</span>
            <div v-if="store.matches.currentMatch.value!.twoMinutesHome.length > 0" class="flex absolute text-sm justify-between px-4 left-0 bottom-0 border border-gray-300 text-center bg-white  -mb-11 items-center w-full py-1">
                <span>{{ store.matches.currentMatch.value?.twoMinutesHome.length  }}</span>
                <header-two-minutes-tag v-show="value === store.matches.currentMatch.value?.twoMinutesHome[0]"
                 v-for="value in store.matches.currentMatch.value?.twoMinutesHome" :player-id="value" />
            </div>
        </div>
        <div class="flex items-center justify-center h-full">
            <span class="bg-yellow-300 text-black px-5 flex items-center font-bold justify-center h-full select-none">
                {{match?.time}}</span>
            <button @click="toggleMatchTimer()" class="bg-white px-5 flex items-center justify-center h-full">
                <pause v-if="match?.playing" class="h-12 w-12 text-gray-900" />
                <play v-else class="h-12 w-12 text-gray-900" />
            </button>
        </div>
        <div class="relative"  >
            <span class="mx-4 select-none text-white ">{{ match?.opponent }}</span>
            <div v-if="store.matches.currentMatch.value!.twoMinutesAway.length > 0" class="flex absolute text-sm justify-between px-4 left-0 bottom-0 border border-gray-300 text-center bg-white  -mb-11 items-center w-full py-1">
                <span>{{ store.matches.currentMatch.value?.twoMinutesAway.length  }}</span>
                <header-two-minutes-tag  v-show="value === store.matches.currentMatch.value?.twoMinutesAway[0]" 
                v-for="value in store.matches.currentMatch.value?.twoMinutesAway":player-id="value" />
            </div>
        </div>
        <span class="w-19 flex items-center justify-center h-full bg-blue-400  text-white select-none">
            {{ match?.opponentScore }}
        </span>
        <span @click="store.matches.takeTimeout" 
              class="select-none h-full w-19 flex justify-center items-center "
              :class="[
                store.matches.currentMatch.value?.timeoutsLeft ? 'text-gray-900 focus:bg-gray-100 bg-white  ' : 'bg-gray-200 text-gray-400'
              ]"
              >
                T{{store.matches.currentMatch.value?.timeoutsLeft}}</span>
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
const team = computed(() =>  store.teams.getTeam(store.matches.currentMatch.value!.teamid));
const match = computed(() => store.matches.currentMatch.value);
const goBack = () => useRouter().back();
const toggleMatchTimer = () => {
    if(!store.matches.currentMatch.value) return;
    if(store.matches.currentMatch.value.playing){
        store.matches.pauseMatch();
    }else{
        store.matches.resumeMatch();
    }
}

</script>



