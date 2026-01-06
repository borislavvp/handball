<template>
  <div ref="referenceEl" class="inline-flex" @click.stop="toggle">
    <slot name="trigger" />
  </div>

  <Teleport to="body">
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="open"
        ref="floatingEl"
        :style="floatingStyles"
        class="flex flex-col items-start space-y-4 z-[10000] min-w-[180px] rounded-xl bg-white p-4 shadow-xl ring-1 ring-black/5"
      >
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const { $dropdown } = useNuxtApp()
const {
  open,
  referenceEl,
  floatingEl,
  floatingStyles,
  toggle,
  close
} = $dropdown.useDropdown()

const onClickOutside = (e: MouseEvent) => {
  if (
    floatingEl.value?.contains(e.target as Node) ||
    referenceEl.value?.contains(e.target as Node)
  )
    return
  close()
}

watch(open, (v) => {
  if (v) document.addEventListener('click', onClickOutside)
  else document.removeEventListener('click', onClickOutside)
})
</script>
