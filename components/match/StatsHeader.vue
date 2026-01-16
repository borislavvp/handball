<template>
<div class="flex sticky items-center justify-between bg-gray-800 w-full h-18">
    <button @click="goBack" class="mx-5 rounded transition-colors">
        <back class="w-8 h-8 text-white"/>
    </button>
    <div class="flex items-center h-full uppercase font-semibold text-4xl">
        <span  
              class="select-none h-full w-19  flex justify-center items-center "
              :class="[
                match.timeoutsLeftHome ? 'text-gray-900 focus:bg-gray-100 bg-white  ' : 'bg-gray-200 text-gray-400  '
              ]"
              >
                T{{match.timeoutsLeftHome}}</span>
        <div class="relative"  >
            <span class="mx-4 select-none text-white ">{{team?.name }}</span>
        </div>
        <span class="w-19  flex items-center justify-center h-full bg-blue-400  text-white select-none">
            {{ match.score }}
        </span>
        <div class="relative">
            <span class="mx-4 select-none text-white ">{{ match?.opponent }}</span>
        </div>
        <span class="w-19 flex items-center justify-center h-full bg-blue-400  text-white select-none">
            {{ match?.opponentScore }}
        </span>
        <span  
              class="select-none h-full w-19 flex justify-center items-center "
              :class="[
                match.timeoutsLeftAway ? 'text-gray-900 focus:bg-gray-100 bg-white  ' : 'bg-gray-200 text-gray-400'
              ]"
        >T{{match.timeoutsLeftAway}}</span>
    </div> 
</div>
</template>

<script setup lang="ts">
import { useHandballStore } from '~/composables/useHandballStore';
import back from '../../components/icons/back.vue'
import pause from '~/components/icons/pause.vue';
import play from '~/components/icons/play.vue';
import type { Match } from '~/types/handball';

const store = useHandballStore();


const props = defineProps<{
    match: Match
}>();

const team = computed(() => store.teams.getTeam(props.match.teamid));

const goBack = () => useRouter().back();

</script>



