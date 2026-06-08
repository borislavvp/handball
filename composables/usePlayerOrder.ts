import { useState } from "nuxt/app";
import { computed } from "vue";
import type { Player, Team } from "~/types/handball";

export const usePlayerOrder = () => {
  const reorderIds = useState<number[] | null>(
    "playerOrder-reorderIds",
    () => null
  );

  const sortPlayers = (players: Player[] | undefined): Player[] => {
    if (!players) return [];
    return players.slice().sort((a, b) => {
      const GOALKEEPER_POSITION = "GK";
      const aIsGK = a.position === GOALKEEPER_POSITION;
      const bIsGK = b.position === GOALKEEPER_POSITION;
      if (aIsGK && !bIsGK) return -1;
      if (!aIsGK && bIsGK) return 1;
      return 0;
    });
  };

  const orderedPlayers = (team: Team | undefined | null): Player[] => {
    const base = sortPlayers(team?.players);
    const ids = reorderIds.value;
    if (!ids || ids.length === 0) return base;
    const byId = new Map(base.map(p => [p.id, p]));
    const result: Player[] = [];
    for (const id of ids) {
      const p = byId.get(id);
      if (p) {
        result.push(p);
        byId.delete(id);
      }
    }
    for (const p of byId.values()) result.push(p);
    return result;
  };

  const setReorder = (newOrder: number[] | null) => {
    reorderIds.value = newOrder;
  };

  const clearReorder = () => {
    reorderIds.value = null;
  };

  const slotFor = (
    team: Team | undefined | null,
    playerId: number
  ): number | null => {
    const list = orderedPlayers(team);
    const idx = list.findIndex(p => p.id === playerId);
    return idx === -1 ? null : idx;
  };

  const playerAtSlot = (
    team: Team | undefined | null,
    slot: number
  ): Player | null => {
    const list = orderedPlayers(team);
    return list[slot] ?? null;
  };

  return {
    reorderIds: computed(() => reorderIds.value),
    orderedPlayers,
    setReorder,
    clearReorder,
    slotFor,
    playerAtSlot
  };
};
