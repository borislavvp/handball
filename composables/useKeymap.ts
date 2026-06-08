export type Combo = string;

export type ComboAction = () => void | boolean;

export type Keymap = Map<Combo, ComboAction>;

export type ComboResult = {
  combo: string | null;
  consumed: boolean;
  fired: boolean;
};

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
};

const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPod|iPhone|iPad/.test(navigator.platform);

const SIDE_KEYS = new Set(["L", "C", "R", "7"]);
const POSITION_KEYS = new Set(["W", "B", "M"]);
const PREFIX_TIMEOUT_MS = 1000;

let pendingPrefix: { key: string; expires: number } | null = null;

export const consumePendingPrefix = (): string | null => {
  if (pendingPrefix && Date.now() < pendingPrefix.expires) {
    const key = pendingPrefix.key;
    pendingPrefix = null;
    return key;
  }
  pendingPrefix = null;
  return null;
};

export const clearPendingPrefix = () => {
  pendingPrefix = null;
};

const codeToKeyName = (code: string): string => {
  if (code === "Space") return "Space";
  if (code === "Escape") return "Escape";
  if (code === "Minus") return "-";
  if (code === "Equal") return "=";
  if (code.startsWith("Digit")) return code.slice(5);
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Numpad")) return code.slice(6);
  return code;
};

const ctrlLike = (event: KeyboardEvent): boolean =>
  event.ctrlKey || (isMac && event.metaKey);

export const buildCombo = (event: KeyboardEvent): ComboResult => {
  const parts: string[] = [];
  if (event.ctrlKey) parts.push("Ctrl");
  if (event.shiftKey) parts.push("Shift");
  if (event.altKey) parts.push("Alt");
  if (event.metaKey) {
    if (isMac) {
      parts.length = 0;
      parts.push("Ctrl");
    } else {
      return { combo: null, consumed: false, fired: false };
    }
  }

  const keyName = codeToKeyName(event.code);
  const isCtrl = ctrlLike(event);

  if (
    isCtrl &&
    pendingPrefix &&
    Date.now() < pendingPrefix.expires &&
    POSITION_KEYS.has(keyName)
  ) {
    const prefix = pendingPrefix.key;
    pendingPrefix = null;
    return {
      combo: ["Ctrl", prefix, keyName].join("+"),
      consumed: true,
      fired: true
    };
  }

  if (isCtrl && SIDE_KEYS.has(keyName) && !event.shiftKey) {
    pendingPrefix = { key: keyName, expires: Date.now() + PREFIX_TIMEOUT_MS };
    return { combo: null, consumed: true, fired: false };
  }

  if (
    pendingPrefix &&
    Date.now() >= pendingPrefix.expires &&
    !SIDE_KEYS.has(keyName) &&
    !POSITION_KEYS.has(keyName)
  ) {
    pendingPrefix = null;
  }

  parts.push(keyName);
  return { combo: parts.join("+"), consumed: true, fired: true };
};

export const shouldIgnoreKeyEvent = (event: KeyboardEvent): boolean => {
  if (event.repeat) return true;
  if (isEditableTarget(event.target)) return true;
  return false;
};

export const createKeymap = (): Keymap => new Map<Combo, ComboAction>();

export const useKeymap = () => {
  const keymap = createKeymap();

  const register = (combo: Combo, action: ComboAction) => {
    keymap.set(combo, action);
  };

  const unregister = (combo: Combo) => {
    keymap.delete(combo);
  };

  const press = (combo: Combo): boolean => {
    const action = keymap.get(combo);
    if (!action) return false;
    try {
      const result = action();
      if (result === false) return false;
    } catch (err) {
      console.error(`[keymap] action for ${combo} threw`, err);
      return false;
    }
    return true;
  };

  const has = (combo: Combo): boolean => keymap.has(combo);

  const clear = () => keymap.clear();

  return {
    keymap,
    register,
    unregister,
    press,
    has,
    clear
  };
};
