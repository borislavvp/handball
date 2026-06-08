import { onBeforeUnmount } from "vue";
import { useEventListener } from "@vueuse/core";
import {
  buildCombo,
  clearPendingPrefix,
  shouldIgnoreKeyEvent,
  useKeymap,
  type Keymap
} from "./useKeymap";

export const useKeyboardShortcuts = () => {
  const { keymap, register, unregister, press, clear } = useKeymap();

  const handler = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      clearPendingPrefix();
    }
    if (shouldIgnoreKeyEvent(event)) return;
    const { combo, consumed } = buildCombo(event);
    if (consumed) {
      event.preventDefault();
    }
    if (!combo) return;
    press(combo);
  };

  if (import.meta.client) {
    useEventListener(window, "keydown", handler, { capture: true });
  }

  onBeforeUnmount(() => {
    clear();
    clearPendingPrefix();
  });

  return {
    keymap: keymap as Keymap,
    register,
    unregister,
    press,
    clear
  };
};
