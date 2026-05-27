export const GAME_BOX_IDS = ['starter', 'silver', 'gold', 'platinum'] as const

export type GameBoxId = (typeof GAME_BOX_IDS)[number]

export type GameBoxConfig = {
  id: GameBoxId
  cost: number
  maxPrize: number
  label: string
}

export const GAME_BOXES: Record<GameBoxId, GameBoxConfig> = {
  starter: { id: 'starter', cost: 150, maxPrize: 250, label: 'STARTER BOX' },
  silver: { id: 'silver', cost: 525, maxPrize: 700, label: 'SILVER BOX' },
  gold: { id: 'gold', cost: 1500, maxPrize: 2000, label: 'GOLD BOX' },
  platinum: { id: 'platinum', cost: 3750, maxPrize: 5000, label: 'PLATINUM BOX' }
}

const LEGACY_GAME_BOX_MAPPING: Record<string, GameBoxId> = {
  genesis: 'starter',
  matrix: 'silver',
  quantum: 'gold',
  vault: 'platinum',
  liquidity: 'platinum',
  whale: 'platinum',
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

export function getGameBox(boxId: string): GameBoxConfig | null {
  const resolvedId = GAME_BOX_IDS.includes(boxId as GameBoxId)
    ? (boxId as GameBoxId)
    : LEGACY_GAME_BOX_MAPPING[boxId]

  return resolvedId ? GAME_BOXES[resolvedId] : null
}

export function getGameBoxLabel(boxId: string): string {
  return getGameBox(boxId)?.label ?? String(boxId || 'UNKNOWN BOX').toUpperCase()
}