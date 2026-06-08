export type Combo = string;

export type ComboAction = () => void | boolean;

export type Keymap = Map<Combo, ComboAction>;

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
};

export const buildCombo = (event: KeyboardEvent): Combo | null => {
  const parts: string[] = [];
  if (event.ctrlKey) parts.push("Ctrl");
  if (event.shiftKey) parts.push("Shift");
  if (event.altKey) parts.push("Alt");
  if (event.metaKey) return null;

  let keyName: string;
  const code = event.code;
  if (code === "Space") {
    keyName = "Space";
  } else if (code === "Escape") {
    keyName = "Escape";
  } else if (code.startsWith("Digit")) {
    keyName = code.slice(5);
  } else if (code === "Minus") {
    keyName = "-";
  } else if (code === "Equal") {
    keyName = "=";
  } else if (code.startsWith("Key")) {
    keyName = code.slice(3);
  } else {
    return null;
  }

  parts.push(keyName);
  return parts.join("+");
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
