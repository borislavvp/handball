
<template>
<button  class="p-4 rounded-xl border-2 cursor-pointer ">
    <div class="flex justify-between items-center">
        <div class="flex gap-2 items-center w-35">
            <span class="px-2 py-1 rounded text-md font-semibold bg-gray-800 text-white">
                {{ store.teams.getTeam(m.teamid)?.name }}</span>
            <span class="italic">vs</span>
            <span class="py-1 rounded text-md font-semibold text-gray-800">{{ m.opponent }}</span>
        </div>
        <span class="text-white px-2 py-1 rounded-full shadow-inner" 
        :class="isActive ? 'bg-blue-600': 
        m.result === 'LOST' ? 'bg-red-600' : 
        'bg-emerald-600'"
        >
        {{ isActive ? (m as ActiveMatchData).time : m.result === 'LOST' ? 'Lost' : 'Won' }}
        </span>
        <!-- <DropdownMenu>
        <template #trigger>
            <button class="p-2 border rounded">⋮</button>
        </template>
        <DropdownItem action-id="pdf" v-if="m.result" :on-action="() => $emit('pdf', m)">PDF</DropdownItem>
        <DropdownItem action-id="delete" :on-action="() => store.matches.deleteMatch(m.id!)" class="text-red-600">Delete</DropdownItem>
        </DropdownMenu> -->
        <span class="text-md text-gray-900">{{ formatDate(m.createdat) }}</span>
    </div>
</button>
</template>

<!-- MatchesPanel.vue -->
<script setup lang="ts">
import type { ActiveMatchData, Match } from '~/types/handball';

const store = useHandballStore()

const props = defineProps<{
    m: Match | ActiveMatchData
}>()

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-GB') : ''

const isActive = (props.m as ActiveMatchData).time !== null

</script>
