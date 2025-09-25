<script setup lang="ts">
import { createHandballStore,provideHandballStore } from './composables/useHandballStore';
import back from './components/icons/back.vue'
const store = createHandballStore()
provideHandballStore(store)

onMounted(async () => {
  await store.initialize();
})

const endCurrentMatch = (result: "WIN" | "LOST") => {
  store.endCurrentMatch(result);
  useRouter().push("/matches/")
}

const inGame = computed(() => useRoute().path.includes("matches") && store.currentMatch.value)

useHead({
  meta: [
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
    { name: 'apple-mobile-web-app-title', content: 'Handball Stats' }
  ],
  link: [
    { rel: 'apple-touch-icon', sizes: "180x180", href:"/icons/apple-touch-icon.png" },
    { rel: 'shortcut icon',  href:"/icons/favicon.ico" },
    { rel: 'manifest',  href:"/icons/site.webmanifest" },
    { rel: 'icon', type: "image/svg+xml", href:"/icons/favicon.svg" },
    { rel: 'icon', type: "image/png", href:"/icons/favicon-96x96.png" , sizes:"96x96" }
    
  ]
})
</script>
<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator />
    
    <header v-if="inGame"   class="px-3 py-2 flex justify-between items-center border-b border-gray-200 bg-white ">
      <div class="flex items-center gap-3">
        <NuxtLink to="/" class="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded transition-colors">
          <back class="w-5 h-5 text-gray-800"/>
        </NuxtLink>
      </div>
      <div class="flex items-center space-x-3 ">
        <span class="uppercase text-sm font-semibold">Set result </span>
        <button @click="endCurrentMatch('WIN')" class="rounded-full px-2 py-1  font-semibold bg-white border-2 border-green-800 text-green-800">WIN</button>
        <button @click="endCurrentMatch('LOST')" class="rounded-full px-2 py-1  font-semibold text-white bg-gray-800">LOST</button>
      </div>
    </header>
    <header v-else class="px-3 py-2 flex gap-3 items-center border-b border-gray-200 bg-white ">
      <NuxtLink to="/" class="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded transition-colors">Team</NuxtLink>
      <NuxtLink to="/matches" class="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded transition-colors">Match</NuxtLink>
    </header>
    <main class="overflow-x-hidden">
        <NuxtPage :keepalive="true"/>
    </main>
  </div>
</template>
