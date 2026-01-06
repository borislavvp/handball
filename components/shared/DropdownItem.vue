<template>
  <button
    :disabled="loading"
    class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-md
           transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
    @click="handleClick"
  >
    <span >
      <slot />
    </span>

    <span v-if="loading" class="flex items-center gap-2">
      <svg class="h-6 w-6 animate-spin" viewBox="0 0 24 24">
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
          fill="none"
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      <!-- Loading… -->
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDropdownActions } from '@/composables/useDropdownActions'

const { start, stop, isLoading } = useDropdownActions()

const props = defineProps<{
  actionId: string
  onAction: () => Promise<void> | void
}>()

const loading = computed(() => isLoading(props.actionId))

const handleClick = async () => {
  if (loading.value) return

  start(props.actionId)

  try {
    await props.onAction()
  } finally {
    setTimeout(() => stop(), 1000)
  }
}
</script>
