import type { Player } from "~/types/handball";

export type GameMode = "attack" | "defense" | "stats";

export const useSelection = () => {
    const player = useState<Player | null>(() => null);
    const primaryAssist = useState<Player | null>(() => null);
    const secondaryAssist = useState<Player | null>(() => null);
    const mistakePlayer = useState<Player | null>(() => null);
    const oneOnOneLost = useState<boolean | null>(() => false);
    
    const gameMode = ref<GameMode>("attack");
    
    const stats = useState<{
        'goal': boolean,
        'attack': boolean,
        'defense': boolean,
        'general': boolean,
    }>(() => ({
        'goal': false,
        'attack': false,
        'defense': false,
        'general': false,
    }));

    const changeGameMode = (mode: GameMode) => {
        gameMode.value = mode;
    }

    const clearSelection = () => {
        primaryAssist.value = null;
        secondaryAssist.value = null;
        mistakePlayer.value = null;
        oneOnOneLost.value = false;
    }

    return {
        player,
        primaryAssist,
        secondaryAssist,
        mistakePlayer,
        oneOnOneLost,
        gameMode,
        stats,
        clearSelection,
        changeGameMode,
    }
}

export type GameSelection = ReturnType<typeof useSelection>;