<script setup lang="ts">
const store = useHandballStore()
const goalAcc = computed(() => {
    let totalGoals = 0;
    let allAttempts = 0;
    store.selectedTeam.value?.players.forEach(p => {
        const stats = p.stats[p.stats.length-1];
        if(stats){
            totalGoals += stats.goal;
            allAttempts += stats.goal + stats.miss;
        }
    } )
    return Math.round(Number((totalGoals/allAttempts).toFixed(2))*100) || 0;
})
const defenseEff = computed(() => {
    let totalGoodDeff = 0;
    let allDeff = 0;
    store.selectedTeam.value?.players.forEach(p => {
        const stats = p.stats[p.stats.length-1];
        if(stats){
            totalGoodDeff += stats.gooddefense;
            allDeff += stats.gooddefense + stats.baddefense;
        }
    } )
    return Math.round(Number((totalGoodDeff/allDeff).toFixed(2))*100) || 0;
})
const passAcc = computed(() => {
    let totalGoodPass = 0;
    let allPass = 0;
    store.selectedTeam.value?.players.forEach(p => {
        const stats = p.stats[p.stats.length-1];
        if(stats){
            totalGoodPass += stats.goodpass;
            allPass += stats.goodpass + stats.badpass;
        }
    })
    
    return Math.round(Number((totalGoodPass/allPass).toFixed(2))*100) || 0;
})

</script>
<template>
<div class="flex flex-wrap justify-center gap-6 select-none">
  <!-- Shots -->
  <div class="flex flex-col items-center">
    <span class="text-gray-100 text-xl font-medium">Shots</span>
    <div class="mt-2 w-20 h-20 flex items-center justify-center rounded-full bg-gray-200 relative">
      <span class="text-2xl font-bold " :class="goalAcc > 70 ? 'text-green-600' : goalAcc > 40 ?'text-yellow-500' : 'text-red-500'">{{ goalAcc }}%</span>
      <!-- Optional: add a progress circle background with Tailwind + custom CSS -->
    </div>
  </div>

  <!-- Defense -->
  <div class="flex flex-col items-center">
    <span class="text-gray-100 text-xl font-medium">Defense</span>
    <div class="mt-2 w-20 h-20 flex items-center justify-center rounded-full bg-gray-200 relative">
      <span class="text-2xl font-bold " :class="defenseEff > 70 ? 'text-green-600' : defenseEff > 40 ?'text-yellow-500' : 'text-red-500'">{{ defenseEff }}%</span>
    </div>
  </div>

  <!-- Pass -->
  <div class="flex flex-col items-center">
    <span class="text-gray-100 text-xl font-medium">Pass</span>
    <div class="mt-2 w-20 h-20 flex items-center justify-center rounded-full bg-gray-200 relative">
      <span class="text-2xl font-bold ":class="passAcc > 70 ? 'text-green-600' : passAcc > 40 ?'text-yellow-500' : 'text-red-500'">{{ passAcc }}%</span>
    </div>
  </div>
</div>

</template>