import { useMagicKeys } from "@vueuse/core";
import { computed } from "vue";

export const useModifierState = () => {
  const keys = useMagicKeys();

  const shiftHeld = computed(() => Boolean(keys.shift?.value));
  const ctrlHeld = computed(() => Boolean(keys.ctrl?.value));
  const altHeld = computed(() => Boolean(keys.alt?.value));

  return {
    shiftHeld,
    ctrlHeld,
    altHeld
  };
};
