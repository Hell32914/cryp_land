import crypto from 'node:crypto'

export const GAME_BOX_IDS = ['starter', 'silver', 'gold', 'platinum'] as const

export type GameBoxId = (typeof GAME_BOX_IDS)[number]

export type GameBoxConfig = {
  id: GameBoxId
  cost: number
  maxPrize: number
  label: string
}

export const GAME_BOXES: Record<GameBoxId, GameBoxConfig> = {
  starter: { id: 'starter', cost: 10, maxPrize: 100, label: 'STARTER BOX' },
  silver: { id: 'silver', cost: 50, maxPrize: 500, label: 'SILVER BOX' },
  gold: { id: 'gold', cost: 250, maxPrize: 2500, label: 'GOLD BOX' },
  platinum: { id: 'platinum', cost: 1000, maxPrize: 10000, label: 'PLATINUM BOX' }
}

const GAME_PRIZE_TEMPLATE = [
  { multiplier: 0, weight: 1642 },
  { multiplier: 0.1, weight: 1500 },
  { multiplier: 0.5, weight: 2000 },
  { multiplier: 0.8, weight: 2000 },
  { multiplier: 1.2, weight: 1738 },
  { multiplier: 2.5, weight: 700 },
  { multiplier: 5, weight: 320 },
  { multiplier: 10, weight: 100 },
] as const

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

export function buildGameOutcomes(cost: number): number[] {
  return GAME_PRIZE_TEMPLATE.map((entry) => round2(cost * entry.multiplier))
}

export function pickGamePrize(cost: number) {
  const outcomes = buildGameOutcomes(cost)
  const draw = crypto.randomInt(1, 10001)
  let cumulativeWeight = 0
  let prizeIndex = GAME_PRIZE_TEMPLATE.length - 1

  for (let i = 0; i < GAME_PRIZE_TEMPLATE.length; i++) {
    cumulativeWeight += GAME_PRIZE_TEMPLATE[i].weight
    if (draw <= cumulativeWeight) {
      prizeIndex = i
      break
    }
  }

  return {
    outcomes,
    prizeIndex,
    prize: outcomes[prizeIndex] ?? 0,
  }
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