<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div class="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl">
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

      <div class="grid max-h-[calc(90vh-73px)] grid-cols-1 overflow-auto md:grid-cols-[1fr_330px]">
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
                  {{ event.shot.from }} · target {{ event.shot.to }}{{ event.shot.fastbreak ? ' · fastbreak' : '' }}{{ event.shot.breakthrough ? ' · breakthrough' : '' }}
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

        <form class="space-y-4 p-5" @submit.prevent="saveEvent">
          <div class="flex items-center justify-between">
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

          <label class="block">
            <span class="mb-1 block text-sm font-semibold text-gray-700">Time</span>
            <input
              v-model="form.time"
              class="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="12:34"
            />
          </label>

          <label class="block">
            <span class="mb-1 block text-sm font-semibold text-gray-700">Event</span>
            <select v-model="form.eventType" class="w-full rounded-md border border-gray-300 px-3 py-2">
              <optgroup v-for="group in eventGroups" :key="group.label" :label="group.label">
                <option v-for="option in group.options" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </optgroup>
            </select>
          </label>

          <div v-if="isShotEvent" class="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-3">
            <label class="block">
              <span class="mb-1 block text-sm font-semibold text-gray-700">Area</span>
              <select v-model="form.shot.from" class="w-full rounded-md border border-gray-300 px-3 py-2">
                <option v-for="area in shootingAreas" :key="area" :value="area">{{ area }}</option>
              </select>
            </label>

            <label class="block">
              <span class="mb-1 block text-sm font-semibold text-gray-700">Target</span>
              <select v-model.number="form.shot.to" class="w-full rounded-md border border-gray-300 px-3 py-2">
                <option v-for="target in shootingTargets" :key="target.value" :value="target.value">
                  {{ target.label }}
                </option>
              </select>
            </label>

            <div class="grid grid-cols-2 gap-2">
              <label class="flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700">
                <input v-model="form.shot.fastbreak" type="checkbox" />
                Fastbreak
              </label>
              <label class="flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700">
                <input v-model="form.shot.breakthrough" type="checkbox" />
                Breakthrough
              </label>
            </div>

            <label class="block">
              <span class="mb-1 block text-sm font-semibold text-gray-700">Primary Assist</span>
              <select v-model.number="form.shot.assistPrimary" class="w-full rounded-md border border-gray-300 px-3 py-2">
                <option :value="null">None</option>
                <option v-for="p in roster" :key="p.id" :value="p.id">#{{ p.number }} {{ p.name }}</option>
              </select>
            </label>

            <label class="block">
              <span class="mb-1 block text-sm font-semibold text-gray-700">Secondary Assist</span>
              <select v-model.number="form.shot.assistSecondary" class="w-full rounded-md border border-gray-300 px-3 py-2">
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
import type { ShootingArea, ShootingTarget, Stats } from '~/types/handball'

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

const eventGroups = [
  { label: 'Shooting', options: [
    { value: 'goal', label: 'Goal' },
    { value: 'miss', label: 'Miss' },
    { value: 'block', label: 'Blocked Shot' },
    { value: 'goal_empty', label: 'Empty Goal' },
  ] },
  { label: 'Goalkeeper', options: [
    { value: 'gksave', label: 'Save' },
    { value: 'gkmiss', label: 'Goal Against' },
    { value: 'gkmiss_empty', label: 'Empty Goal Against' },
  ] },
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

const shootingAreas = ['LW', 'LB9', 'LB6', 'CB9', 'CB6', 'RB6', 'RB9', 'RW', '7M'] as const
const shootingTargets = [
  { value: 0, label: 'Out Top' },
  { value: 1, label: 'Top Left' },
  { value: 2, label: 'Top Middle' },
  { value: 3, label: 'Top Right' },
  { value: 4, label: 'Middle Left' },
  { value: 5, label: 'Middle Middle' },
  { value: 6, label: 'Middle Right' },
  { value: 7, label: 'Bottom Left' },
  { value: 8, label: 'Bottom Middle' },
  { value: 9, label: 'Bottom Right' },
  { value: 10, label: 'Out Left' },
  { value: 11, label: 'Out Right' },
] as const

const editingEvent = ref<EditableEvent | null>(null)
const saving = ref(false)
const error = ref('')

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
  },
})

const sortedEvents = computed(() => [...props.events].sort((a, b) => a.time.localeCompare(b.time)))
const isShotEvent = computed(() => shotResultSet.has(form.eventType))

function labelFor(eventType: string) {
  for (const group of eventGroups) {
    const option = group.options.find((item) => item.value === eventType)
    if (option) return option.label
  }
  return eventType
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
  form.shot.from = 'CB9'
  form.shot.to = 5 as ShootingTarget
  form.shot.fastbreak = false
  form.shot.breakthrough = false
  form.shot.assistPrimary = null
  form.shot.assistSecondary = null
  form.shot.mistakePlayer = null
}

function startEdit(event: EditableEvent) {
  editingEvent.value = event
  error.value = ''
  form.time = event.time
  form.eventType = event.event === 'block' && !event.shot ? 'block_defense' : event.event as Stats
  form.shot.from = event.shot?.from || 'CB9'
  form.shot.to = (event.shot?.to ?? 5) as ShootingTarget
  form.shot.fastbreak = event.shot?.fastbreak ?? false
  form.shot.breakthrough = event.shot?.breakthrough ?? false
  form.shot.assistPrimary = event.shot?.assistPrimary ?? null
  form.shot.assistSecondary = event.shot?.assistSecondary ?? null
  form.shot.mistakePlayer = event.shot?.mistakePlayer ?? null
}

function buildPayload() {
  return {
    matchId: props.matchId,
    playerId: props.player.id,
    eventType: form.eventType === 'block_defense' ? 'block' : form.eventType,
    time: form.time,
    shot: isShotEvent.value
      ? {
          from: form.shot.from,
          to: form.shot.to,
          assistPrimary: form.shot.assistPrimary,
          assistSecondary: form.shot.assistSecondary,
          mistakePlayer: form.shot.mistakePlayer,
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
