import type { Stats } from '~/types/handball'

type FlashState = {
    playerId: number | null
    stat: string | null
    kind: 'positive' | 'negative' | 'neutral'
    target: 'value' | 'saves' | 'none'
    timestamp: number
}

const positiveStats = new Set<string>([
    'goal', 'goal_empty', 'gksave',
    'assistprimary', 'assistsecondary',
    '1on1win', 'provokePenalty', 'provokeTwoMin', 'provokeCard',
    'steal', 'block', 'defense', 'defensex2',
])

const negativeStats = new Set<string>([
    'miss', 'gkmiss', 'gkmiss_empty',
    '1on1lost', 'norebound', 'lostball', 'penaltymade',
    'twominutes', 'yellowcard', 'redcard', 'bluecard',
    'mistakePlayer', 'noRecoveryPlayer',
])

export function classifyStat(stat: string): 'positive' | 'negative' | 'neutral' {
    if (positiveStats.has(stat)) return 'positive'
    if (negativeStats.has(stat)) return 'negative'
    return 'neutral'
}

type TriggerOptions = {
    target?: 'value' | 'saves' | 'none'
}

export const usePlayerFlash = () => {
    const flash = useState<FlashState>('player-flash', () => ({
        playerId: null,
        stat: null,
        kind: 'neutral',
        target: 'none',
        timestamp: 0,
    }))

    const trigger = (playerId: number, stat: string, options: TriggerOptions = {}) => {
        flash.value = {
            playerId,
            stat,
            kind: classifyStat(stat),
            target: options.target ?? 'value',
            timestamp: Date.now(),
        }
    }

    const isFlashing = (playerId: number, maxAgeMs = 1500) => {
        if (flash.value.playerId !== playerId) return false
        return Date.now() - flash.value.timestamp < maxAgeMs
    }

    return { flash, trigger, isFlashing }
}
