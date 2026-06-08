import { useState } from "nuxt/app";
import type { ShootingArea, ShootingTarget } from "~/types/handball";

const STATS_6M_AREA: Record<string, ShootingArea> = {
  LB9: "LB6",
  LB6: "LB9",
  CB9: "CB6",
  CB6: "CB9",
  RB9: "RB6",
  RB6: "RB9"
};

export const useShotBuilder = () => {
  const shootingTarget = useState<ShootingTarget | null>(
    "shotBuilder-target",
    () => null
  );
  const shootingArea = useState<ShootingArea | null>(
    "shotBuilder-area",
    () => null
  );
  const fastBreak = useState<boolean>("shotBuilder-fastBreak", () => false);
  const oneOnOneWin = useState<boolean>("shotBuilder-oneOnOneWin", () => false);

  const setShootingTarget = (t: ShootingTarget | null) => {
    shootingTarget.value = t;
    if (t === null) {
      shootingArea.value = null;
    }
  };

  const setShootingArea = (a: ShootingArea | null) => {
    shootingArea.value = a;
  };

  const cycleShootingArea = (next: ShootingArea) => {
    const current = shootingArea.value;
    if (current === next) {
      const toggled = STATS_6M_AREA[next];
      if (toggled) {
        shootingArea.value = toggled;
        return;
      }
    }
    const currentVariant = current ? STATS_6M_AREA[current] : null;
    if (currentVariant === next) {
      shootingArea.value = next;
      return;
    }
    shootingArea.value = next;
  };

  const toggleFastBreak = () => {
    fastBreak.value = !fastBreak.value;
  };

  const toggleOneOnOneWin = () => {
    oneOnOneWin.value = !oneOnOneWin.value;
  };

  const clearShot = () => {
    shootingTarget.value = null;
    shootingArea.value = null;
    fastBreak.value = false;
    oneOnOneWin.value = false;
  };

  return {
    shootingTarget,
    shootingArea,
    fastBreak,
    oneOnOneWin,
    setShootingTarget,
    setShootingArea,
    cycleShootingArea,
    toggleFastBreak,
    toggleOneOnOneWin,
    clearShot
  };
};
