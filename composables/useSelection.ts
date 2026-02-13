import type { Player } from "~/types/handball";

export type GameMode = "attack" | "defense" | "stats";

export const useSelection = () => {
    const player = useState<Player | null>('selection-player', () => null);
    const primaryAssist = useState<Player | null>('selection-primary-assist', () => null);
    const secondaryAssist = useState<Player | null>('selection-secondary-assist', () => null);
    const mistakePlayer = useState<Player | null>('selection-mistake-player', () => null);
    const oneOnOneLost = useState<boolean | null>('selection-oneonone-lost', () => false);

    const gameMode = useState<GameMode>('selection-game-mode', () => "attack");

    const stats = useState<{
        'goal': boolean,
        'attack': boolean,
        'defense': boolean,
        'general': boolean,
    }>('selection-stats-mode', () => ({
        'goal': false,
        'attack': false,
        'defense': false,
        'general': false,
    }));

    const changeGameMode = (mode: GameMode) => {
        gameMode.value = mode;
    };

    const clearSelection = () => {
        primaryAssist.value = null;
        secondaryAssist.value = null;
        mistakePlayer.value = null;
        oneOnOneLost.value = false;
    };

    const resetAll = () => {
        player.value = null;
        clearSelection();
        gameMode.value = 'attack';
        stats.value.goal = false;
        stats.value.attack = false;
        stats.value.defense = false;
        stats.value.general = false;
    };

    return {
        player,
        primaryAssist,
        secondaryAssist,
        mistakePlayer,
        oneOnOneLost,
        gameMode,
        stats,
        clearSelection,
        resetAll,
        changeGameMode,
    };
};

export type GameSelection = ReturnType<typeof useSelection>;
