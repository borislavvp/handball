<template>
  <span
    v-if="keys.length"
    :class="['shortcut-chip', sizeClass]"
    role="presentation"
  >
    <template v-for="(key, i) in keys" :key="i">
      <span v-if="i > 0" class="shortcut-plus" aria-hidden="true">+</span>
      <kbd :class="['shortcut-key', `shortcut-chip-${size}`]">
        {{ key }}
      </kbd>
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { getShortcutKey } from "~/components/utils/formatShortcut";

const props = withDefaults(
  defineProps<{
    combo?: string | null;
    size?: "sm" | "md" | "lg";
  }>(),
  { size: "md" }
);

const keys = computed(() => {
  const value = getShortcutKey(props.combo);
  return value ? value.split("+") : [];
});

const sizeClass = computed(() => `shortcut-chip-size-${props.size}`);
</script>

<style scoped>
.shortcut-chip {
  display: inline-flex;
  align-items: center;
  pointer-events: none;
  user-select: none;
  line-height: 1;
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    "Segoe UI",
    Roboto,
    sans-serif;
}

.shortcut-chip-size-sm {
  gap: 4px;
}
.shortcut-chip-size-md {
  gap: 6px;
}
.shortcut-chip-size-lg {
  gap: 8px;
}

.shortcut-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  letter-spacing: 0.01em;
  white-space: nowrap;
  border-radius: 6px;
  background: linear-gradient(180deg, #334155 0%, #0f172a 100%);
  border: 1px solid #020617;
  color: #f8fafc;
  box-shadow:
    inset 0 -2px 0 rgba(0, 0, 0, 0.28),
    0 1px 1px rgba(15, 23, 42, 0.2);
  animation: shortcut-pop 140ms ease-out;
}

.shortcut-chip-size-sm .shortcut-key {
  font-size: 12px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
}
.shortcut-chip-size-md .shortcut-key {
  font-size: 14px;
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
}
.shortcut-chip-size-lg .shortcut-key {
  font-size: 16px;
  min-width: 36px;
  height: 32px;
  padding: 0 10px;
}

.shortcut-plus {
  color: #475569;
  font-weight: 600;
  font-size: 12px;
}
.shortcut-chip-size-sm .shortcut-plus {
  font-size: 10px;
}
.shortcut-chip-size-lg .shortcut-plus {
  font-size: 14px;
}

@keyframes shortcut-pop {
  from {
    transform: translateY(2px) scale(0.92);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}
</style>
