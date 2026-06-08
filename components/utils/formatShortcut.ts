export type ShortcutToken = {
  kind: "modifier" | "key";
  label: string;
};

const MODIFIER_LABELS: Record<string, string> = {
  "⇧": "Shift",
  "⌃": "Ctrl",
  "⌥": "Alt",
  "⌘": "Meta"
};

const MODIFIER_ORDER = ["Ctrl", "Shift", "Alt", "Meta"];

export const parseCombo = (
  combo: string | null | undefined
): ShortcutToken[] => {
  if (!combo) return [];
  return combo.split("+").map(part => {
    if (MODIFIER_ORDER.includes(part)) {
      return { kind: "modifier" as const, label: part };
    }
    return {
      kind: "key" as const,
      label: MODIFIER_LABELS[part] ?? part
    };
  });
};

export const formatShortcut = (combo: string | null | undefined): string =>
  parseCombo(combo)
    .map(t => t.label)
    .join(" + ");

export const getShortcutKey = (combo: string | null | undefined): string => {
  const tokens = parseCombo(combo);
  return tokens
    .filter(t => t.kind === "key")
    .map(t => t.label)
    .join("+");
};
