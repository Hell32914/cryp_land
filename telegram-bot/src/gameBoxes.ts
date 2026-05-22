export const GAME_BOX_IDS = ['genesis', 'matrix', 'quantum', 'vault', 'liquidity', 'whale'] as const

export type GameBoxId = (typeof GAME_BOX_IDS)[number]

export type GameBoxConfig = {
  id: GameBoxId
  cost: number
  maxPrize: number
  label: string
}

export const GAME_BOXES: Record<GameBoxId, GameBoxConfig> = {
  genesis: { id: 'genesis', cost: 150, maxPrize: 250, label: 'Genesis Pack' },
  matrix: { id: 'matrix', cost: 525, maxPrize: 700, label: 'Matrix Crate' },
  quantum: { id: 'quantum', cost: 1500, maxPrize: 2000, label: 'Quantum Capsule' },
  vault: { id: 'vault', cost: 3750, maxPrize: 5000, label: 'Secure Vault' },
  liquidity: { id: 'liquidity', cost: 7500, maxPrize: 10000, label: 'Liquidity Locker' },
  whale: { id: 'whale', cost: 18750, maxPrize: 25000, label: 'Whale Chest' }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function buildGameOutcomes(cost: number, maxPrize: number): number[] {
  const values = new Set<number>()

  const push = (value: number) => {
    let nextValue = Math.max(0, round2(value))
    while (values.has(nextValue)) nextValue = round2(nextValue + 0.01)
    values.add(nextValue)
  }

  for (let i = 0; i < 45; i++) {
    const ratio = i / 44
    push(ratio * (cost * 0.9))
  }

  for (let i = 0; i < 10; i++) {
    const ratio = (i + 1) / 10
    push(cost * 0.9 + ratio * (cost * 0.15))
  }

  push(maxPrize * 0.35)
  push(maxPrize * 0.5)
  push(maxPrize * 0.7)
  push(maxPrize * 0.9)
  push(maxPrize)

  return Array.from(values)
    .slice(0, 60)
    .sort((a, b) => a - b)
}

export function getGameBoxLabel(boxId: GameBoxId): string {
  return GAME_BOXES[boxId].label
}