import { ref, computed } from "vue";

export type UndoEntry = {
  /** Reverses the local state mutated by the recorded action. */
  revert: () => void;
  /**
   * Resolves to the server `match_event` id created by the action, so undo can
   * delete it (which also reverses the persisted stat/shot). `null` if the
   * write failed or returned no id.
   */
  eventId: Promise<number | null>;
};

// Module-level LIFO stack. The live-match screen is client-rendered, so a
// singleton avoids serializing closures through Nuxt's SSR payload.
const stack = ref<UndoEntry[]>([]);

export const useUndo = () => {
  const canUndo = computed(() => stack.value.length > 0);

  const record = (entry: UndoEntry) => {
    stack.value.push(entry);
  };

  /** Attach extra local rollback to the most recently recorded action. */
  const augmentLast = (extraRevert: () => void) => {
    const top = stack.value[stack.value.length - 1];
    if (!top) return;
    const prev = top.revert;
    top.revert = () => {
      prev();
      extraRevert();
    };
  };

  const undoLast = async (): Promise<boolean> => {
    const entry = stack.value.pop();
    if (!entry) return false;
    entry.revert();
    try {
      const id = await entry.eventId;
      if (id != null) {
        await $fetch(`/api/match/events/${id}`, { method: "DELETE" });
      }
    } catch (err) {
      console.error("[undo] failed to delete match event", err);
    }
    return true;
  };

  const clear = () => {
    stack.value = [];
  };

  return { stack, canUndo, record, augmentLast, undoLast, clear };
};
