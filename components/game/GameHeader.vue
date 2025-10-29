<template>
<div class="flex sticky items-center justify-between bg-gray-800 w-full h-18">
    <button @click="goBack" class="mx-5 rounded transition-colors">
        <back class="w-8 h-8 text-white"/>
    </button>
    <div class="flex items-center gap-3 h-full uppercase font-semibold text-4xl">
        <span class="px-6 flex items-center justify-center h-full bg-blue-400  text-white select-none">
            {{ store.matches.currentMatch.value?.score }}
        </span>
        <span class=" select-none text-white ">{{ team?.name }}</span>
        <div class="flex items-center justify-center h-full">
        <span class="bg-yellow-300 text-black px-5 flex items-center font-bold justify-center h-full select-none">
            {{match?.time}}</span>
        <button @click="toggleMatchTimer()" class="bg-white px-5 flex items-center justify-center h-full">
            <pause v-if="match?.playing" class="h-12 w-12 text-gray-900" />
            <play v-else class="h-12 w-12 text-gray-900" />
        </button>
        </div>
        <span class="text-white select-none">{{ match?.opponent }}</span>
        <span class="px-6 flex items-center justify-center h-full bg-blue-400  text-white select-none">
            {{ match?.opponentScore }}
        </span>
    </div> 
</div>
</template>

<script setup lang="ts">
import { useHandballStore } from '~/composables/useHandballStore';
import back from '../../components/icons/back.vue'
import pause from '~/components/icons/pause.vue';
import play from '~/components/icons/play.vue';

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



