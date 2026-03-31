<template>
  <div
    class="size-10 rounded-full flex items-center justify-center bg-black/60 text-white text-lg font-semibold border-2 border-gray-600"
  >
    {{ formattedTime }}
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{
    playerId:number
}>()
const emit = defineEmits<{
    (e:'twoMinOver',playerId:number): void
}>()

const store = useHandballStore();
const timeLeft = ref(120) // seconds (2 minutes)
let interval: any

// Format as M:SS
const formattedTime = computed(() => {
  const minutes = Math.floor(timeLeft.value / 60)
  const seconds = timeLeft.value % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

onMounted(() => {
  interval = setInterval(() => {
    if(store.matches.match.value?.data.value?.playing === false){
      return;
    }
    
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      clearInterval(interval)
      store.matches.match.value?.data.value?.twoMinutesHome.splice(
        store.matches.match.value?.data.value.twoMinutesHome.indexOf(props.playerId), 1
      )
    }
  }, 1000)
})

onBeforeUnmount(() => {
  clearInterval(interval)
})
</script>

<style scoped>
/* Optional subtle animation */
div {
  transition: opacity 0.3s ease;
}
</style>
