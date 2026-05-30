<template>
  <div class="flex items-center justify-center gap-6 p-6">
    <GoalkeeperCard
      v-for="gk in goalkeepers"
      :key="gk.id"
      :keeper="gk"
      :match-id="matchId"
      :events="eventsByPlayer.get(gk.id) || []"
      :roster="stats.roster"
      @stats-changed="emit('statsChanged')"
    />
  </div>
</template>

<script setup lang="ts">
import type { MatchStats } from "~/shared/pdf/fetchMatchStats";
import GoalkeeperCard from "./GoalkeeperCard.vue"
const props = defineProps<{ stats: MatchStats, matchId: number }>()
const emit = defineEmits<{
  (e: 'statsChanged'): void;
}>()

const goalkeepers = computed(() => {
  const statsByPlayer = new Map(props.stats.goalkeepers.map((player) => [player.id, player]))
  return props.stats.roster
    .filter((player) => player.position === 'GK')
    .map((player) => statsByPlayer.get(player.id) || {
      id: player.id,
      number: player.number,
      name: player.name,
      value: 0,
      assistsPrimary: 0,
      assistsSecondary: 0,
      lostball: 0,
      totalSaves: 0,
      attempts: 0,
      efficiency: 0,
      by9m: { saved: 0, total: 0 },
      by6m: { saved: 0, total: 0 },
      byWing: { saved: 0, total: 0 },
      by7m: { saved: 0, total: 0 },
      fastbreak: { saved: 0, total: 0 },
      breakthrough: { saved: 0, total: 0 },
    })
    .sort((a, b) => b.value - a.value)
})

const eventsByPlayer = computed(() => {
  const events = new Map<number, MatchStats['events']>()
  props.stats.events.forEach((event) => {
    if (!event.playerid) return
    if (!events.has(event.playerid)) events.set(event.playerid, [])
    events.get(event.playerid)!.push(event)
  })
  events.forEach((playerEvents) => {
    playerEvents.sort((a, b) => a.time.localeCompare(b.time))
  })
  return events
})
</script>
