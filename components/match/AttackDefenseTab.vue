<template>
  <div class="space-y-10">
    <!-- ATTACK -->
    <section>
      <h2 class="text-lg font-semibold mb-3">Attack by Type of Defense</h2>
      <AttackPerDefenseTable
        :data="stats.attackByOppDefense"
      />
    </section>

    <section>
      <h2 class="text-lg font-semibold mb-3">Attack – Superiority / GK Out</h2>
      <SuperiorityCards :data="stats.attackSuperiority" />
    </section>

    <!-- DEFENSE -->
    <section>
      <h2 class="text-lg font-semibold mb-3">Defense by Type</h2>
      <DefenseBars
        :data="stats.defenseByType"
      />
    </section>

    <section>
      <h2 class="text-lg font-semibold mb-3">Defense – Superiority / GK Out</h2>
      <SuperiorityCards :data="stats.defenseSuperiority" />
    </section>
  </div>
</template>

<script setup lang="ts">
import type { MatchStats } from "~/shared/pdf/fetchMatchStats"
import DefenseBars from "./DefenseBars.vue"
import SuperiorityCards from "./SuperiorityCards.vue"
import AttackPerDefenseTable from "./AttackPerDefenseTable.vue";

defineProps<{ stats: MatchStats }>()
</script>
