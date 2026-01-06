<template>
<Teleport to="body">
    <div v-if="state?.open" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
        <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 class="mb-2 text-xl font-semibold text-gray-900">{{ state.title }}</h3>
            <p class="mb-4 text-lg text-gray-900">{{ state.message }}</p>
            <input
                v-if="state.type === 'prompt'"
                class="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                v-model="input"
                :placeholder="state.placeholder"
            />
            <div class="flex justify-end gap-2">
                <button
                    v-if="state.type !== 'alert'"
                    @click="cancel"
                    class="rounded-lg px-4 py-2 text-lg font-medium text-gray-700 hover:bg-gray-100"
                >Cancel</button>
                <button
                    @click="confirm"
                    class="rounded-lg bg-blue-600 px-4 py-2 text-lg font-medium text-white hover:bg-blue-700"
                >{{okText}}</button>
            </div>
        </div>
    </div>
</Teleport>
</template>


<script setup lang="ts">
const nuxtApp = useNuxtApp()
const state = computed(() => nuxtApp.$dialog?.state)
const input = ref('')

watch(
  () => state.value?.open,
  (v) => {
    if (v) input.value = state.value?.defaultValue ?? ''
  }
)

const okText = computed(() => {
    return state.value.okText || 'OK'
})

watch(
  () => state.value?.open,
  (v) => {
    if (v) input.value = state.value?.defaultValue ?? ''
  }
)

const confirm = () => {
  if (!state.value) return

  if (state.value.type === 'prompt') {
    state.value.resolve?.(input.value)
  } else {
    state.value.resolve?.(true)
  }

  nuxtApp.$dialog.close()
}

const cancel = () => {
  if (!state.value) return

  state.value.resolve?.(
    state.value.type === 'confirm' ? false : null
  )

  nuxtApp.$dialog.close()
}
</script>