import { ShootingTarget } from "~/types/handball";
import type { ShootingArea, Stats } from "~/types/handball";

export type AssistTarget =
  | "primaryAssist"
  | "secondaryAssist"
  | "mistake"
  | "noRecovery";

export type RegisterFn = (combo: string, action: () => void | boolean) => void;

/**
 * Semantic actions the live-match keymap drives. Keeping them granular lets the
 * mapping (which combo does what, and the aiming / provoke-menu gating) be
 * unit-tested with spies, while the concrete behaviour stays in the page.
 */
export type MatchKeymapDeps = {
  // context predicates
  isAiming: () => boolean; // a goal cell is currently selected
  isProvokeOpen: () => boolean;

  // global
  togglePlayClock: () => void;
  cancel: () => void; // Escape
  undoLast: () => void | Promise<unknown>;

  // selection / stats
  selectPlayer: (slot: number) => void;
  increaseStat: (stat: Stats) => void;
  provokeWithTwoMin: (stat: Stats) => void;
  blockStat: () => void;
  toggleProvokes: () => void;
  toggleAssist: (target: AssistTarget) => void;

  // shot flow
  setGoalTarget: (target: ShootingTarget) => void;
  setOutTarget: (which: "top" | "left" | "right") => void;
  setShootingArea: (area: ShootingArea) => void;
  confirmGoal: () => void; // Enter (field goal / GK save)
  confirmMiss: () => void; // Backspace (field miss / GK goal-against)
  toggleFastBreak: () => void;
  toggleOneOnOne: () => void;
  toggleNoRecovery: () => void;
};

// Player slots 0-8, mirrored on the goal-position grid.
const PLAYER_LETTERS = ["Q", "W", "E", "A", "S", "D", "Z", "X", "C"] as const;

const GOAL_CELLS: Array<[string, ShootingTarget]> = [
  ["Q", ShootingTarget.GOAL_TOP_LEFT],
  ["W", ShootingTarget.GOAL_TOP_MIDDLE],
  ["E", ShootingTarget.GOAL_TOP_RIGHT],
  ["A", ShootingTarget.GOAL_MIDDLE_LEFT],
  ["S", ShootingTarget.GOAL_MIDDLE_MIDDLE],
  ["D", ShootingTarget.GOAL_MIDDLE_RIGHT],
  ["Z", ShootingTarget.GOAL_BOTTOM_LEFT],
  ["X", ShootingTarget.GOAL_BOTTOM_MIDDLE],
  ["C", ShootingTarget.GOAL_BOTTOM_RIGHT]
];

// Shooting-from positions (active only while aiming). RW shares Ctrl+L with the
// lost-ball stat, so it is wired separately.
const SHOOTING_AREAS: Array<[string, ShootingArea]> = [
  ["G", "LW"],
  ["Y", "LB9"],
  ["H", "LB6"],
  ["U", "CB9"],
  ["J", "CB6"],
  ["O", "RB9"],
  ["K", "RB6"],
  ["7", "7M"]
];

export const useMatchKeymap = (deps: MatchKeymapDeps) => {
  const aiming = () => deps.isAiming();

  const register = (reg: RegisterFn) => {
    // --- Always available ---
    reg("Space", deps.togglePlayClock);
    reg("Escape", deps.cancel);
    reg("Ctrl+Backspace", () => deps.undoLast());
    reg("Enter", () => {
      if (aiming()) deps.confirmGoal();
    });
    reg("Backspace", () => {
      if (aiming()) deps.confirmMiss();
    });

    // --- Player selection (Shift + 3x3 letter grid for the first 9) ---
    PLAYER_LETTERS.forEach((letter, slot) => {
      reg(`Shift+${letter}`, () => deps.selectPlayer(slot));
    });
    reg("Shift+1", () => deps.selectPlayer(9));
    reg("Shift+2", () => {
      if (deps.isProvokeOpen()) deps.provokeWithTwoMin("provokeTwoMin");
      else deps.selectPlayer(10);
    });
    reg("Shift+3", () => deps.selectPlayer(11));
    reg("Shift+4", () => deps.selectPlayer(12));
    reg("Shift+5", () => deps.selectPlayer(13));
    reg("Shift+6", () => deps.selectPlayer(14));
    reg("Shift+7", () => {
      if (deps.isProvokeOpen()) deps.increaseStat("provokePenalty");
      else deps.selectPlayer(15);
    });
    reg("Shift+8", () => deps.selectPlayer(16));
    reg("Shift+9", () => deps.selectPlayer(17));
    reg("Shift+0", () => deps.selectPlayer(18));

    // --- Non-shot stats / cards / provoke (Shift) ---
    reg("Shift+O", () => deps.increaseStat("goal_empty"));
    reg("Shift+K", () => deps.increaseStat("penaltymade"));
    reg("Shift+N", () => deps.increaseStat("norebound"));
    reg("Shift+P", () => deps.toggleProvokes());

    reg("Shift+Y", () => {
      if (deps.isProvokeOpen()) deps.increaseStat("provokeCard");
      else deps.increaseStat("yellowcard");
    });
    reg("Shift+R", () => {
      if (deps.isProvokeOpen()) deps.provokeWithTwoMin("provokeCard");
      else deps.increaseStat("redcard");
    });
    reg("Shift+U", () => {
      if (deps.isProvokeOpen()) deps.provokeWithTwoMin("provokeCard");
      else deps.increaseStat("bluecard");
    });

    // Assist pickers.
    reg("Shift+G", () => deps.toggleAssist("primaryAssist"));
    reg("Shift+H", () => deps.toggleAssist("secondaryAssist"));
    reg("Shift+M", () => deps.toggleAssist("mistake"));
    reg("Shift+J", () => deps.toggleAssist("noRecovery"));

    // --- Goal position (Ctrl + 3x3 grid, always re-pickable) ---
    GOAL_CELLS.forEach(([letter, target]) => {
      reg(`Ctrl+${letter}`, () => deps.setGoalTarget(target));
    });
    reg("Ctrl+0", () => deps.setOutTarget("top"));
    reg("Ctrl+-", () => deps.setOutTarget("left"));
    reg("Ctrl+=", () => deps.setOutTarget("right"));

    // --- Shooting-from position (Ctrl, only while aiming) ---
    SHOOTING_AREAS.forEach(([letter, area]) => {
      reg(`Ctrl+${letter}`, () => {
        if (aiming()) deps.setShootingArea(area);
      });
    });
    // Ctrl+L: RW while aiming, lost-ball stat otherwise.
    reg("Ctrl+L", () => {
      if (aiming()) deps.setShootingArea("RW");
      else deps.increaseStat("lostball");
    });

    // --- Stats on Ctrl (only while NOT aiming) ---
    reg("Ctrl+F", () => {
      if (aiming()) deps.toggleFastBreak();
      else deps.increaseStat("defense");
    });
    reg("Ctrl+R", () => {
      if (!aiming()) deps.increaseStat("defensex2");
    });
    reg("Ctrl+T", () => {
      if (!aiming()) deps.increaseStat("steal");
    });
    reg("Ctrl+B", () => {
      if (!aiming()) deps.blockStat();
    });

    // --- Shot toggles (only while aiming) ---
    reg("Ctrl+I", () => {
      if (aiming()) deps.toggleOneOnOne();
    });
    reg("Ctrl+N", () => {
      if (aiming()) deps.toggleNoRecovery();
    });
  };

  return { register };
};
