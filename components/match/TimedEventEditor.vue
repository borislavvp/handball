<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div class="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-xl">
      <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <div>
          <h3 class="text-lg font-bold text-gray-900">#{{ player.number }} {{ player.name }}</h3>
          <p class="text-sm text-gray-500">Value {{ value > 0 ? `+${value}` : value }}</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="rounded-md bg-blue-900 px-3 py-2 text-sm font-semibold text-white"
            @click="startAdd"
          >
            Add Event
          </button>
          <button class="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700" @click="emit('close')">
            Close
          </button>
        </div>
      </div>

      <div class="grid max-h-[calc(92vh-73px)] grid-cols-1 overflow-auto md:grid-cols-[320px_1fr]">
        <div class="border-r border-gray-200 p-5">
          <div v-if="events.length === 0" class="rounded-md border border-dashed border-gray-300 p-5 text-center text-gray-500">
            No timed events yet.
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="event in sortedEvents"
              :key="event.id"
              class="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2"
            >
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-sm font-semibold text-blue-900">{{ event.time }}</span>
                  <span class="font-semibold text-gray-900">{{ labelForEvent(event) }}</span>
                </div>
                <p v-if="event.shot" class="mt-1 text-xs text-gray-500">
                  {{ event.shot.from }} · target {{ event.shot.to }}{{ event.shot.fastbreak ? ' · fastbreak' : '' }}{{ event.shot.breakthrough ? ' · breakthrough' : '' }}{{ event.shot.noRecovery ? ' · no recovery' + (event.shot.noRecoveryPlayer ? ' (' + playerName(event.shot.noRecoveryPlayer) + ')' : '') : '' }}
                </p>
              </div>
              <div class="ml-3 flex shrink-0 gap-2">
                <button class="rounded border border-gray-300 px-2 py-1 text-sm font-semibold text-gray-700" @click="startEdit(event)">
                  Edit
                </button>
                <button class="rounded border border-red-300 px-2 py-1 text-sm font-semibold text-red-700" @click="deleteEvent(event)">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <form class="space-y-5 p-5" @submit.prevent="saveEvent">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h4 class="font-bold text-gray-900">{{ editingEvent ? 'Edit Event' : 'New Event' }}</h4>
            <button
              v-if="editingEvent"
              type="button"
              class="text-sm font-semibold text-blue-800"
              @click="startAdd"
            >
              New
            </button>
          </div>

          <div class="grid gap-4 lg:grid-cols-[180px_1fr]">
            <label class="block">
              <span class="mb-1 block text-sm font-semibold text-gray-700">Time</span>
              <input
                v-model="form.time"
                class="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="12:34"
              />
            </label>

            <div>
              <span class="mb-1 block text-sm font-semibold text-gray-700">Event Type</span>
              <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                  v-for="option in primaryEventModes"
                  :key="option.value"
                  type="button"
                  class="rounded-md border px-3 py-2 text-sm font-semibold"
                  :class="activeMode === option.value ? 'border-blue-900 bg-blue-900 text-white' : 'border-gray-300 bg-white text-gray-700'"
                  @click="selectPrimaryMode(option.value)"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="activeMode === 'shot'" class="space-y-4 rounded-md border border-gray-200 bg-gray-50 p-4">
            <div>
              <span class="mb-2 block text-sm font-semibold text-gray-700">Shot Result</span>
              <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                  v-for="option in visibleShotOptions"
                  :key="option.value"
                  type="button"
                  class="rounded-md border px-3 py-2 text-sm font-semibold"
                  :class="form.eventType === option.value ? option.activeClass : 'border-gray-300 bg-white text-gray-700'"
                  @click="selectShotResult(option.value)"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

              <div class="grid grid-cols-2 gap-2 lg:col-span-1">
                <label class="flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700">
                  <input v-model="form.shot.fastbreak" type="checkbox" />
                  Fastbreak
                </label>
                <label class="flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700">
                  <input v-model="form.shot.breakthrough" type="checkbox" />
                  Breakthrough
                </label>
              </div>
            <div class="grid gap-4 xl:grid-cols-2">
              <div class="rounded-md border border-gray-200 bg-white p-3">
                <div class="mb-2 flex items-center justify-between">
                  <span class="text-sm font-semibold text-gray-700">Goal Target</span>
                  <span class="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">{{ targetLabel }}</span>
                </div>
                <Goal
                  :goalkeep-selected="isGoalkeeper"
                  :shooting-target="form.shot.to"
                  :shooting-area="form.shot.from"
                  :player="visualPlayer"
                  :stats-mode="false"
                  @position-click="setShotTarget"
                />
              </div>
              <div class="rounded-md border border-gray-200 bg-white p-3">
                <div class="mb-2 flex items-center justify-between">
                  <span class="text-sm font-semibold text-gray-700">Shooting Area</span>
                  <span class="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">{{ form.shot.from }}</span>
                </div>
                <ShootingPosition
                  :player="visualPlayer"
                  :stats-mode="false"
                  :selected-shooting-target="form.shot.to"
                  @position-click="setShotArea"
                />
              </div>
            </div>

              
              <div class="grid grid-cols-3 gap-4 lg:col-span-1">
                <label class="block">
                  <span class="mb-1 block text-sm font-semibold text-gray-700">Primary Assist</span>
                  <select v-model.number="form.shot.assistPrimary" class="w-full rounded-md border border-gray-300 px-3 py-2">
                    <option :value="null">None</option>
                    <option v-for="p in roster" :key="p.id" :value="p.id">#{{ p.number }} {{ p.name }}</option>
                  </select>
                </label>

                <label class="block">
                  <span class="mb-1 block text-sm font-semibold text-gray-700">Mistake Player</span>
                  <select v-model.number="form.shot.mistakePlayer" class="w-full rounded-md border border-gray-300 px-3 py-2">
                    <option :value="null">None</option>
                    <option v-for="p in roster" :key="p.id" :value="p.id">#{{ p.number }} {{ p.name }}</option>
                  </select>
                </label>

                <div v-if="isGoalkeeper" class="space-y-3 rounded-md border border-orange-200 bg-orange-50 p-3">
                  <label class="flex items-center gap-2">
                    <input v-model="form.shot.noRecovery" type="checkbox" class="size-4 rounded border-gray-300" />
                    <span class="text-sm font-semibold text-gray-700">No Recovery (NO RCV)</span>
                  </label>
                  <label class="block">
                    <span class="mb-1 block text-sm font-semibold text-gray-700">No Recovery Player</span>
                    <select v-model.number="form.shot.noRecoveryPlayer" :disabled="!form.shot.noRecovery" class="w-full rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-100">
                      <option :value="null">None</option>
                      <option v-for="p in roster" :key="p.id" :value="p.id">#{{ p.number }} {{ p.name }}</option>
                    </select>
                  </label>
                </div>

                <label class="block">
                  <span class="mb-1 block text-sm font-semibold text-gray-700">Secondary Assist</span>
                  <select v-model.number="form.shot.assistSecondary" class="w-full rounded-md border border-gray-300 px-3 py-2">
                    <option :value="null">None</option>
                    <option v-for="p in roster" :key="p.id" :value="p.id">#{{ p.number }} {{ p.name }}</option>
                  </select>
                </label>
              </div>
            </div>

          <div v-else class="space-y-4 rounded-md border border-gray-200 bg-gray-50 p-4">
            <div v-for="group in visibleStatGroups" :key="group.label">
              <span class="mb-2 block text-sm font-semibold text-gray-700">{{ group.label }}</span>
              <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                <button
                  v-for="option in group.options"
                  :key="option.value"
                  type="button"
                  class="rounded-md border px-3 py-2 text-sm font-semibold"
                  :class="form.eventType === option.value ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-gray-300 bg-white text-gray-700'"
                  @click="selectStatEvent(option.value)"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
          </div>

          <p v-if="error" class="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{{ error }}</p>

          <button
            type="submit"
            class="w-full rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-60"
            :disabled="saving"
          >
            {{ saving ? 'Saving...' : 'Save Event' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { MatchStats } from '~/shared/pdf/fetchMatchStats'
import { ShootingTarget, type Player, type ShootingArea, type Stats } from '~/types/handball'
import Goal from '~/components/game/Goal.vue'
import ShootingPosition from '~/components/game/ShootingPosition.vue'

type PlayerSummary = MatchStats['players'][number] | MatchStats['goalkeepers'][number]
type EditableEvent = MatchStats['events'][number]

const props = defineProps<{
  matchId: number
  player: PlayerSummary
  value: number
  events: EditableEvent[]
  roster: MatchStats['roster']
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'statsChanged'): void
}>()
const { $dialog } = useNuxtApp();

const shotResults = ['goal', 'miss', 'block', 'gksave', 'gkmiss', 'goal_empty', 'gkmiss_empty'] as const
const shotResultSet = new Set<string>(shotResults)
const timePattern = /^\d{1,2}:[0-5]\d$/

const primaryEventModes = [
  { value: 'shot', label: 'Shot' },
  { value: 'attack', label: 'Attack' },
  { value: 'defense', label: 'Defense' },
  { value: 'suspension', label: 'Cards' },
] as const

type EventMode = typeof primaryEventModes[number]['value']

const fieldShotOptions = [
  { value: 'goal', label: 'Goal', activeClass: 'border-emerald-700 bg-emerald-700 text-white' },
  { value: 'miss', label: 'Miss', activeClass: 'border-red-700 bg-red-700 text-white' },
  { value: 'block', label: 'Blocked', activeClass: 'border-amber-600 bg-amber-600 text-white' },
  { value: 'goal_empty', label: 'Empty Goal', activeClass: 'border-emerald-700 bg-emerald-700 text-white' },
] as const

const goalkeeperShotOptions = [
  { value: 'gksave', label: 'Save', activeClass: 'border-emerald-700 bg-emerald-700 text-white' },
  { value: 'gkmiss', label: 'Goal Against', activeClass: 'border-red-700 bg-red-700 text-white' },
  { value: 'gkmiss_empty', label: 'Empty Goal', activeClass: 'border-red-700 bg-red-700 text-white' },
] as const

const statGroups = [
  { label: 'Attack', options: [
    { value: 'assistprimary', label: 'Primary Assist' },
    { value: 'assistsecondary', label: 'Secondary Assist' },
    { value: '1on1win', label: '1-on-1 Won' },
    { value: 'provokePenalty', label: 'Provoked 7m' },
    { value: 'provokeTwoMin', label: 'Provoked 2 Min' },
    { value: 'provokeCard', label: 'Provoked Card' },
    { value: 'lostball', label: 'Lost Ball' },
  ] },
  { label: 'Defense', options: [
    { value: 'defense', label: 'Defense' },
    { value: 'defensex2', label: 'Defense Plus' },
    { value: 'steal', label: 'Steal' },
    { value: 'block_defense', label: 'Block' },
    { value: '1on1lost', label: '1-on-1 Lost' },
    { value: 'penaltymade', label: 'Penalty Made' },
    { value: 'norebound', label: 'No Rebound' },
  ] },
  { label: 'Suspensions', options: [
    { value: 'twominutes', label: '2 Minutes' },
    { value: 'yellowcard', label: 'Yellow Card' },
    { value: 'redcard', label: 'Red Card' },
    { value: 'bluecard', label: 'Blue Card' },
  ] },
] as const

const editingEvent = ref<EditableEvent | null>(null)
const saving = ref(false)
const error = ref('')
const activeMode = ref<EventMode>('attack')

const form = reactive({
  time: '00:00',
  eventType: 'defense' as Stats | 'block_defense',
  shot: {
    from: 'CB9' as ShootingArea,
    to: 5 as ShootingTarget,
    fastbreak: false,
    breakthrough: false,
    assistPrimary: null as number | null,
    assistSecondary: null as number | null,
    mistakePlayer: null as number | null,
    noRecovery: false,
    noRecoveryPlayer: null as number | null,
  },
})

const sortedEvents = computed(() => [...props.events].sort((a, b) => a.time.localeCompare(b.time)))
const isShotEvent = computed(() => shotResultSet.has(form.eventType))
const rosterPlayer = computed(() => props.roster.find((player) => player.id === props.player.id))
const isGoalkeeper = computed(() => rosterPlayer.value?.position === 'GK')
const visibleShotOptions = computed(() => isGoalkeeper.value ? goalkeeperShotOptions : fieldShotOptions)
const visibleStatGroups = computed(() => {
  const labelByMode: Record<EventMode, string> = {
    shot: 'Shooting',
    attack: 'Attack',
    defense: 'Defense',
    suspension: 'Suspensions',
  }
  return statGroups.filter((group) => group.label === labelByMode[activeMode.value])
})
const targetLabel = computed(() => {
  if (form.shot.to === ShootingTarget.OUT_TOP) return 'Out Top'
  if (form.shot.to === ShootingTarget.OUT_LEFT) return 'Out Left'
  if (form.shot.to === ShootingTarget.OUT_RIGHT) return 'Out Right'
  return `Target ${form.shot.to}`
})
const visualPlayer = computed<Player | null>(() => {
  const player = rosterPlayer.value
  if (!player) return null
  return {
    id: player.id,
    name: player.name,
    number: player.number,
    position: player.position,
    currentShots: [],
    currentStats: undefined,
    liveByMatch: {},
    recentStats: [],
    hasTwoMinutes: false,
    hasCard: null,
  }
})

function labelFor(eventType: string) {
  for (const group of [{ label: 'Shooting', options: [...fieldShotOptions, ...goalkeeperShotOptions] }, ...statGroups]) {
    const option = group.options.find((item) => item.value === eventType)
    if (option) return option.label
  }
  return eventType
}

function playerName(id: number) {
  const p = props.roster.find((player) => player.id === id)
  return p ? `${p.number} ${p.name}` : `#${id}`
}

function labelForEvent(event: EditableEvent) {
  if (event.event === 'block' && !event.shot) return 'Block'
  return labelFor(event.event)
}

function startAdd() {
  editingEvent.value = null
  error.value = ''
  form.time = '00:00'
  form.eventType = 'defense'
  activeMode.value = 'attack'
  form.shot.from = 'CB9'
  form.shot.to = 5 as ShootingTarget
  form.shot.fastbreak = false
  form.shot.breakthrough = false
  form.shot.assistPrimary = null
  form.shot.assistSecondary = null
  form.shot.mistakePlayer = null
  form.shot.noRecovery = false
  form.shot.noRecoveryPlayer = null
}

function startEdit(event: EditableEvent) {
  editingEvent.value = event
  error.value = ''
  form.time = event.time
  form.eventType = event.event === 'block' && !event.shot ? 'block_defense' : event.event as Stats
  activeMode.value = modeForEvent(form.eventType, Boolean(event.shot))
  form.shot.from = event.shot?.from || 'CB9'
  form.shot.to = (event.shot?.to ?? 5) as ShootingTarget
  form.shot.fastbreak = event.shot?.fastbreak ?? false
  form.shot.breakthrough = event.shot?.breakthrough ?? false
  form.shot.assistPrimary = event.shot?.assistPrimary ?? null
  form.shot.assistSecondary = event.shot?.assistSecondary ?? null
  form.shot.mistakePlayer = event.shot?.mistakePlayer ?? null
  form.shot.noRecovery = event.shot?.noRecovery ?? false
  form.shot.noRecoveryPlayer = event.shot?.noRecoveryPlayer ?? null
}

function modeForEvent(eventType: string, hasShot: boolean): EventMode {
  if (shotResultSet.has(eventType) && (eventType !== 'block' || hasShot)) return 'shot'
  for (const group of statGroups) {
    if (group.options.some((option) => option.value === eventType)) {
      return group.label.toLowerCase() as EventMode
    }
  }
  return 'attack'
}

function selectPrimaryMode(mode: EventMode) {
  activeMode.value = mode
  if (mode === 'shot') {
    form.eventType = (isGoalkeeper.value ? 'gksave' : 'goal') as Stats
    if (form.shot.to === null || form.shot.to === undefined) {
      form.shot.to = ShootingTarget.GOAL_MIDDLE_MIDDLE
    }
    return
  }

  const group = statGroups.find((item) => item.label.toLowerCase() === mode)
  form.eventType = group?.options[0]?.value as Stats | 'block_defense'
}

function selectShotResult(eventType: Stats) {
  form.eventType = eventType
  if (eventType === 'goal_empty' || eventType === 'gkmiss_empty') {
    form.shot.from = 'CB9'
    form.shot.to = ShootingTarget.GOAL_MIDDLE_MIDDLE
  }
}

function selectStatEvent(eventType: Stats | 'block_defense') {
  form.eventType = eventType
}

function setShotArea(area: ShootingArea | null) {
  if (area) form.shot.from = area
}

function setShotTarget(target: number | null) {
  if (target !== null) form.shot.to = target as ShootingTarget
}

function buildPayload() {
  return {
    matchId: props.matchId,
    playerId: props.player.id,
    eventType: form.eventType === 'block_defense' ? 'block' : form.eventType,
    time: form.time,
    shot: activeMode.value === 'shot'
      ? {
          from: form.shot.from,
          to: form.shot.to,
          assistPrimary: form.shot.assistPrimary,
          assistSecondary: form.shot.assistSecondary,
          mistakePlayer: form.shot.mistakePlayer,
          noRecovery: form.shot.noRecovery,
          noRecoveryPlayer: form.shot.noRecoveryPlayer,
          fastbreak: form.shot.fastbreak,
          breakthrough: form.shot.breakthrough,
        }
      : undefined,
  }
}

async function saveEvent() {
  error.value = ''
  if (!timePattern.test(form.time)) {
    error.value = 'Time must use MM:SS format.'
    return
  }

  saving.value = true
  try {
    await $fetch(editingEvent.value ? `/api/match/events/${editingEvent.value.id}` : '/api/match/events', {
      method: editingEvent.value ? 'PUT' : 'POST',
      body: buildPayload(),
    })
    emit('statsChanged')
    startAdd()
  } catch (err: any) {
    error.value = err?.statusMessage || err?.data?.statusMessage || 'Could not save event.'
  } finally {
    saving.value = false
  }
}

async function deleteEvent(event: EditableEvent) {
  const confirmed = await $dialog.confirm({
    title:`Delete ${labelForEvent(event)} at ${event.time}?`,
    message: 'This action cannot be undone.',
  })
  if (!confirmed) return

  saving.value = true
  error.value = ''
  try {
    await $fetch(`/api/match/events/${event.id}`, { method: 'DELETE' })
    emit('statsChanged')
    if (editingEvent.value?.id === event.id) startAdd()
  } catch (err: any) {
    error.value = err?.statusMessage || err?.data?.statusMessage || 'Could not delete event.'
  } finally {
    saving.value = false
  }
}

startAdd()
</script>
