import { useState } from "nuxt/app";

export type AssistSlot =
  | "primaryAssist"
  | "secondaryAssist"
  | "mistake"
  | "noRecovery";

export const useAssistMode = () => {
  const mode = useState<AssistSlot | null>("assistMode", () => null);

  const enter = (slot: AssistSlot) => {
    mode.value = slot;
  };

  const exit = () => {
    mode.value = null;
  };

  const toggle = (slot: AssistSlot) => {
    mode.value = mode.value === slot ? null : slot;
  };

  return {
    mode,
    enter,
    exit,
    toggle
  };
};
