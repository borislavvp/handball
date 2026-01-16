<script setup lang="ts">
import { createHandballStore,provideHandballStore } from './composables/useHandballStore';
import GlobalDialog from './components/shared/GlobalDialog.vue';
import Header from '~/components/layout/Header.vue'


const store = createHandballStore()
provideHandballStore(store)

onMounted(() => {
  store.initialize();
})


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
const goBack = () => useRouter().back();

</script>
<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator />
    <GlobalDialog />
    
    <!-- <header v-if="inGame"   class="px-3 py-2 flex justify-between items-center border-b border-gray-200 bg-white ">
      <div class="flex items-center gap-3">
        <button @click="goBack()" class="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded transition-colors">
          <back class="w-5 h-5 text-gray-800"/>
        </button>
      </div>
      <div class="flex items-center space-x-3 ">
        <span class="uppercase text-sm font-semibold">Set result </span>
        <button @click="endCurrentMatch('WIN')" class="rounded-full px-2 py-1  font-semibold bg-white border-2 border-green-800 text-green-800">WIN</button>
        <button @click="endCurrentMatch('LOST')" class="rounded-full px-2 py-1  font-semibold text-white bg-gray-800">LOST</button>
      </div>
    </header> -->
    <!-- <header v-if="!inGame" class="px-3 py-2 flex gap-3 items-center border-b border-gray-200 bg-white ">
      <NuxtLink to="/" class="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded transition-colors">Team</NuxtLink>
      <NuxtLink to="/matches" class="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded transition-colors">Matches</NuxtLink>
    </header> -->
    <!-- <Header /> -->

    <main class="overflow-x-hidden select-none">
        <NuxtPage :keepalive="true"/>
    </main>
  </div>
</template>
