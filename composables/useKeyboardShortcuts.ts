import { onBeforeUnmount } from "vue";
import { useEventListener } from "@vueuse/core";
import {
  buildCombo,
  shouldIgnoreKeyEvent,
  useKeymap,
  type Keymap
} from "./useKeymap";

export const useKeyboardShortcuts = () => {
  const { keymap, register, unregister, press, clear } = useKeymap();

  const handler = (event: KeyboardEvent) => {
    if (shouldIgnoreKeyEvent(event)) return;
    const combo = buildCombo(event);
    if (!combo) return;
    if (press(combo)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  if (import.meta.client) {
    useEventListener(window, "keydown", handler, { capture: true });
  }

  onBeforeUnmount(() => {
    clear();
  });

  return {
    keymap: keymap as Keymap,
    register,
    unregister,
    press,
    clear
  };
};
