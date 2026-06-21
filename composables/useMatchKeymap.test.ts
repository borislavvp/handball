import { describe, expect, it, vi } from 'vitest'
import { useKeymap } from './useKeymap'
import { useMatchKeymap, type MatchKeymapDeps } from './useMatchKeymap'
import { ShootingTarget } from '~/types/handball'

const makeDeps = (over: Partial<MatchKeymapDeps> = {}): MatchKeymapDeps => ({
  isAiming: vi.fn(() => false),
  isProvokeOpen: vi.fn(() => false),
  togglePlayClock: vi.fn(),
  cancel: vi.fn(),
  undoLast: vi.fn(),
  selectPlayer: vi.fn(),
  increaseStat: vi.fn(),
  provokeWithTwoMin: vi.fn(),
  blockStat: vi.fn(),
  toggleProvokes: vi.fn(),
  toggleAssist: vi.fn(),
  setGoalTarget: vi.fn(),
  setOutTarget: vi.fn(),
  setShootingArea: vi.fn(),
  confirmGoal: vi.fn(),
  confirmMiss: vi.fn(),
  toggleFastBreak: vi.fn(),
  toggleOneOnOne: vi.fn(),
  toggleNoRecovery: vi.fn(),
  ...over
})

const setup = (over: Partial<MatchKeymapDeps> = {}) => {
  const km = useKeymap()
  const deps = makeDeps(over)
  useMatchKeymap(deps).register(km.register)
  return { km, deps }
}

describe('useMatchKeymap — global', () => {
  it('Space toggles the clock, Escape cancels, Ctrl+Backspace undoes', () => {
    const { km, deps } = setup()
    km.press('Space')
    km.press('Escape')
    km.press('Ctrl+Backspace')
    expect(deps.togglePlayClock).toHaveBeenCalledOnce()
    expect(deps.cancel).toHaveBeenCalledOnce()
    expect(deps.undoLast).toHaveBeenCalledOnce()
  })
})

describe('useMatchKeymap — player selection', () => {
  it.each([
    ['Shift+Q', 0],
    ['Shift+W', 1],
    ['Shift+E', 2],
    ['Shift+A', 3],
    ['Shift+S', 4],
    ['Shift+D', 5],
    ['Shift+Z', 6],
    ['Shift+X', 7],
    ['Shift+C', 8],
    ['Shift+1', 9],
    ['Shift+0', 18]
  ])('%s selects slot %d', (combo, slot) => {
    const { km, deps } = setup()
    km.press(combo)
    expect(deps.selectPlayer).toHaveBeenCalledWith(slot)
  })

  it('Shift+2 / Shift+7 select players when the provoke menu is closed', () => {
    const { km, deps } = setup({ isProvokeOpen: () => false })
    km.press('Shift+2')
    km.press('Shift+7')
    expect(deps.selectPlayer).toHaveBeenCalledWith(10)
    expect(deps.selectPlayer).toHaveBeenCalledWith(15)
    expect(deps.provokeWithTwoMin).not.toHaveBeenCalled()
  })

  it('Shift+2 / Shift+7 fire provoke actions when the provoke menu is open', () => {
    const { km, deps } = setup({ isProvokeOpen: () => true })
    km.press('Shift+2')
    km.press('Shift+7')
    expect(deps.provokeWithTwoMin).toHaveBeenCalledWith('provokeTwoMin')
    expect(deps.increaseStat).toHaveBeenCalledWith('provokePenalty')
    expect(deps.selectPlayer).not.toHaveBeenCalled()
  })
})

describe('useMatchKeymap — non-shot stats / cards / assists', () => {
  it.each([
    ['Shift+O', 'goal_empty'],
    ['Shift+K', 'penaltymade'],
    ['Shift+N', 'norebound'],
    ['Shift+Y', 'yellowcard'],
    ['Shift+R', 'redcard'],
    ['Shift+U', 'bluecard']
  ])('%s records %s with provoke menu closed', (combo, stat) => {
    const { km, deps } = setup({ isProvokeOpen: () => false })
    km.press(combo)
    expect(deps.increaseStat).toHaveBeenCalledWith(stat)
  })

  it('cards route to provoke actions when the menu is open', () => {
    const { km, deps } = setup({ isProvokeOpen: () => true })
    km.press('Shift+Y')
    expect(deps.increaseStat).toHaveBeenCalledWith('provokeCard')
    km.press('Shift+R')
    km.press('Shift+U')
    expect(deps.provokeWithTwoMin).toHaveBeenCalledTimes(2)
    expect(deps.provokeWithTwoMin).toHaveBeenCalledWith('provokeCard')
  })

  it('Shift+P toggles the provoke menu', () => {
    const { km, deps } = setup()
    km.press('Shift+P')
    expect(deps.toggleProvokes).toHaveBeenCalledOnce()
  })

  it.each([
    ['Shift+G', 'primaryAssist'],
    ['Shift+H', 'secondaryAssist'],
    ['Shift+M', 'mistake'],
    ['Shift+J', 'noRecovery']
  ])('%s toggles the %s picker', (combo, target) => {
    const { km, deps } = setup()
    km.press(combo)
    expect(deps.toggleAssist).toHaveBeenCalledWith(target)
  })
})

describe('useMatchKeymap — goal position', () => {
  it.each([
    ['Ctrl+Q', ShootingTarget.GOAL_TOP_LEFT],
    ['Ctrl+W', ShootingTarget.GOAL_TOP_MIDDLE],
    ['Ctrl+E', ShootingTarget.GOAL_TOP_RIGHT],
    ['Ctrl+A', ShootingTarget.GOAL_MIDDLE_LEFT],
    ['Ctrl+S', ShootingTarget.GOAL_MIDDLE_MIDDLE],
    ['Ctrl+D', ShootingTarget.GOAL_MIDDLE_RIGHT],
    ['Ctrl+Z', ShootingTarget.GOAL_BOTTOM_LEFT],
    ['Ctrl+X', ShootingTarget.GOAL_BOTTOM_MIDDLE],
    ['Ctrl+C', ShootingTarget.GOAL_BOTTOM_RIGHT]
  ])('%s picks the goal cell', (combo, target) => {
    const { km, deps } = setup()
    km.press(combo)
    expect(deps.setGoalTarget).toHaveBeenCalledWith(target)
  })

  it.each([
    ['Ctrl+0', 'top'],
    ['Ctrl+-', 'left'],
    ['Ctrl+=', 'right']
  ])('%s picks the %s out zone', (combo, which) => {
    const { km, deps } = setup()
    km.press(combo)
    expect(deps.setOutTarget).toHaveBeenCalledWith(which)
  })
})

describe('useMatchKeymap — shooting position (only while aiming)', () => {
  it.each([
    ['Ctrl+G', 'LW'],
    ['Ctrl+Y', 'LB9'],
    ['Ctrl+H', 'LB6'],
    ['Ctrl+U', 'CB9'],
    ['Ctrl+J', 'CB6'],
    ['Ctrl+O', 'RB9'],
    ['Ctrl+K', 'RB6'],
    ['Ctrl+L', 'RW'],
    ['Ctrl+7', '7M']
  ])('%s sets %s when a goal cell is selected', (combo, area) => {
    const { km, deps } = setup({ isAiming: () => true })
    km.press(combo)
    expect(deps.setShootingArea).toHaveBeenCalledWith(area)
  })

  it('does nothing for shooting keys when not aiming', () => {
    const { km, deps } = setup({ isAiming: () => false })
    km.press('Ctrl+G')
    km.press('Ctrl+U')
    expect(deps.setShootingArea).not.toHaveBeenCalled()
  })
})

describe('useMatchKeymap — context-dual keys', () => {
  it('Ctrl+L = lost ball when not aiming, RW when aiming', () => {
    const notAiming = setup({ isAiming: () => false })
    notAiming.km.press('Ctrl+L')
    expect(notAiming.deps.increaseStat).toHaveBeenCalledWith('lostball')
    expect(notAiming.deps.setShootingArea).not.toHaveBeenCalled()

    const aiming = setup({ isAiming: () => true })
    aiming.km.press('Ctrl+L')
    expect(aiming.deps.setShootingArea).toHaveBeenCalledWith('RW')
    expect(aiming.deps.increaseStat).not.toHaveBeenCalled()
  })

  it('Ctrl+F = defense when not aiming, fastbreak toggle when aiming', () => {
    const notAiming = setup({ isAiming: () => false })
    notAiming.km.press('Ctrl+F')
    expect(notAiming.deps.increaseStat).toHaveBeenCalledWith('defense')

    const aiming = setup({ isAiming: () => true })
    aiming.km.press('Ctrl+F')
    expect(aiming.deps.toggleFastBreak).toHaveBeenCalledOnce()
  })
})

describe('useMatchKeymap — stats on Ctrl (only while not aiming)', () => {
  it.each([
    ['Ctrl+R', 'defensex2'],
    ['Ctrl+T', 'steal']
  ])('%s records %s when not aiming', (combo, stat) => {
    const { km, deps } = setup({ isAiming: () => false })
    km.press(combo)
    expect(deps.increaseStat).toHaveBeenCalledWith(stat)
  })

  it('Ctrl+B triggers the block action when not aiming', () => {
    const { km, deps } = setup({ isAiming: () => false })
    km.press('Ctrl+B')
    expect(deps.blockStat).toHaveBeenCalledOnce()
  })

  it('does not fire stats while aiming', () => {
    const { km, deps } = setup({ isAiming: () => true })
    km.press('Ctrl+R')
    km.press('Ctrl+T')
    km.press('Ctrl+B')
    expect(deps.increaseStat).not.toHaveBeenCalled()
    expect(deps.blockStat).not.toHaveBeenCalled()
  })
})

describe('useMatchKeymap — confirm + shot toggles (only while aiming)', () => {
  it('Enter confirms a goal and Backspace a miss while aiming', () => {
    const { km, deps } = setup({ isAiming: () => true })
    km.press('Enter')
    km.press('Backspace')
    expect(deps.confirmGoal).toHaveBeenCalledOnce()
    expect(deps.confirmMiss).toHaveBeenCalledOnce()
  })

  it('Enter / Backspace do nothing when not aiming', () => {
    const { km, deps } = setup({ isAiming: () => false })
    km.press('Enter')
    km.press('Backspace')
    expect(deps.confirmGoal).not.toHaveBeenCalled()
    expect(deps.confirmMiss).not.toHaveBeenCalled()
  })

  it('Ctrl+I / Ctrl+N toggle 1-on-1 and no-recovery while aiming', () => {
    const { km, deps } = setup({ isAiming: () => true })
    km.press('Ctrl+I')
    km.press('Ctrl+N')
    expect(deps.toggleOneOnOne).toHaveBeenCalledOnce()
    expect(deps.toggleNoRecovery).toHaveBeenCalledOnce()
  })

  it('Ctrl+I / Ctrl+N do nothing when not aiming', () => {
    const { km, deps } = setup({ isAiming: () => false })
    km.press('Ctrl+I')
    km.press('Ctrl+N')
    expect(deps.toggleOneOnOne).not.toHaveBeenCalled()
    expect(deps.toggleNoRecovery).not.toHaveBeenCalled()
  })
})
