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

// Combos are single modifier + key. A previous two-step "prefix" mechanism
// (Ctrl+side then position, e.g. Ctrl+L then Ctrl+B) was removed when shooting
// positions moved to dedicated single keys. These remain as no-ops so existing
// imports keep working.
export const consumePendingPrefix = (): string | null => null;

export const clearPendingPrefix = () => {};

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

export const buildCombo = (event: KeyboardEvent): ComboResult => {
  const parts: string[] = [];
  if (event.ctrlKey) parts.push("Ctrl");
  if (event.shiftKey) parts.push("Shift");
  if (event.altKey) parts.push("Alt");
  if (event.metaKey) {
    if (isMac) {
      parts.length = 0;
      parts.push("Ctrl");
      if (event.shiftKey) parts.push("Shift");
    } else {
      return { combo: null, consumed: false, fired: false };
    }
  }

  const keyName = codeToKeyName(event.code);
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
