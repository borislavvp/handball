<script setup lang="ts">
import { createHandballStore,provideHandballStore } from './composables/useHandballStore';
const store = createHandballStore()
provideHandballStore(store)

onMounted(async () => {
  await store.initialize();
})

const endCurrentMatch = (result: "WIN" | "LOST") => {
  store.endCurrentMatch(result);
  useRouter().push("/matches/")
}

useHead({
  meta: [
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
    { name: 'apple-mobile-web-app-title', content: 'Handball Stats' }
  ],
  link: [
    { rel: 'apple-touch-icon', href: '/icons/handball.png' }
  ]
})
</script>
<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator />
    
    <header class="px-3 py-2 flex justify-between items-center border-b border-gray-200 bg-white ">
      <div class="flex items-center gap-3">
        <NuxtLink to="/" class="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded transition-colors">Team</NuxtLink>
        <NuxtLink to="/matches" class="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded transition-colors">Match</NuxtLink>
      </div>
      <div class="flex items-center space-x-3 ">
        <button @click="endCurrentMatch('WIN')" class="rounded-full px-2 py-1  font-semibold text-white bg-green-800">WIN</button>
        <button @click="endCurrentMatch('LOST')" class="rounded-full px-2 py-1  font-semibold text-white bg-gray-800">LOST</button>
      </div>
    </header>
    <main class="overflow-x-hidden">
        <NuxtPage :keepalive="true"/>
    </main>
  </div>
</template>
