type FlashState = {
    playerId: number | null
    stat: string | null
    delta: number
    timestamp: number
}

export const usePlayerFlash = () => {
    const flash = useState<FlashState>('player-flash', () => ({
        playerId: null,
        stat: null,
        delta: 0,
        timestamp: 0,
    }))

    const trigger = (playerId: number, stat: string, delta: number) => {
        flash.value = { playerId, stat, delta, timestamp: Date.now() }
    }

    const isFlashing = (playerId: number, maxAgeMs = 1500) => {
        if (flash.value.playerId !== playerId) return false
        return Date.now() - flash.value.timestamp < maxAgeMs
    }

    return { flash, trigger, isFlashing }
}
