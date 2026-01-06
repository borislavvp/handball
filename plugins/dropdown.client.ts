import { ref, onBeforeUnmount } from 'vue'
import {
  computePosition,
  offset,
  flip,
  shift,
  autoUpdate
} from '@floating-ui/dom'

let activeDropdownId: symbol | null = null

export default defineNuxtPlugin(() => {
  const useDropdown = () => {
    const id = Symbol('dropdown')

    const open = ref(false)
    const referenceEl = ref<HTMLElement | null>(null)
    const floatingEl = ref<HTMLElement | null>(null)
    const floatingStyles = ref<Record<string, string>>({})

    let cleanup: (() => void) | null = null

    const updatePosition = async () => {
      if (!referenceEl.value || !floatingEl.value) return

      const { x, y } = await computePosition(
        referenceEl.value,
        floatingEl.value,
        {
          placement: 'bottom-end',
          middleware: [
            offset(6),
            flip(),
            shift({ padding: 8 })
          ]
        }
      )

      floatingStyles.value = {
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`
      }
    }

    const onClickOutside = (e: MouseEvent) => {
      if (
        referenceEl.value?.contains(e.target as Node) ||
        floatingEl.value?.contains(e.target as Node)
      ) return

      close()
    }

    const openDropdown = async () => {
      // 🔥 close any other dropdown
      if (activeDropdownId && activeDropdownId !== id) {
        document.dispatchEvent(
          new CustomEvent('close-all-dropdowns')
        )
      }

      activeDropdownId = id
      open.value = true

      await updatePosition()

      cleanup = autoUpdate(
        referenceEl.value!,
        floatingEl.value!,
        updatePosition
      )

      document.addEventListener('click', onClickOutside)
    }

    const close = () => {
      if (activeDropdownId === id) {
        activeDropdownId = null
      }

      open.value = false
      cleanup?.()
      cleanup = null
      document.removeEventListener('click', onClickOutside)
    }

    const toggle = () => {
      open.value ? close() : openDropdown()
    }

    const onForceClose = () => {
      if (open.value) close()
    }

    document.addEventListener('close-all-dropdowns', onForceClose)

    onBeforeUnmount(() => {
      close()
      document.removeEventListener('close-all-dropdowns', onForceClose)
    })

    return {
      open,
      referenceEl,
      floatingEl,
      floatingStyles,
      toggle,
      close
    }
  }

  return {
    provide: {
      dropdown: {
        useDropdown
      }
    }
  }
})
