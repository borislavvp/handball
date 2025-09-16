<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator />
    <header class="px-3 py-2 flex gap-3 items-center border-b border-gray-200 bg-gray-50">
      <NuxtLink to="/" class="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded transition-colors">Teams</NuxtLink>
      <NuxtLink to="/matches" class="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded transition-colors">Matches</NuxtLink>
    </header>
    <main class="overflow-x-hidden">
      <NuxtPage />
    </main>
  </div>
</template>
