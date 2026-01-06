<template>
  <button
    @click="toggle"
    :class="[
      'flex items-center border justify-center gap-2 rounded-xl p-4 font-medium transition-all duration-200',
      checked
        ? negative ?'bg-red-600 border-red-500 text-white shadow-md' : 'bg-emerald-600 border-emerald-500 text-white shadow-md '
        : 'bg-gray-100  border-gray-300 text-gray-700  '
    ]"
  >
    <div
      :class="[
        'h-5 w-5 flex items-center justify-center rounded-md border transition-all duration-200',
        checked
          ? 'border-transparent bg-white/20 text-white'
          : 'border-gray-400 bg-transparent text-transparent'
      ]"
    >
      <svg
        v-if="checked"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        class="h-4 w-4"
      >
        <path
          fill-rule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clip-rule="evenodd"
        />
      </svg>
    </div>
    <span>{{ label }}</span>
  </button>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  label: String,
  negative: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['update:modelValue'])

const checked = ref(props.modelValue)

watch(
  () => props.modelValue,
  (val) => (checked.value = val)
)

const toggle = () => {
  checked.value = !checked.value
  emit('update:modelValue', checked.value)
}
</script>
