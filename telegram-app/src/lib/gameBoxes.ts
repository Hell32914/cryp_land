import starterBoxImage from '../../../BOX/1.webp'
import silverBoxImage from '../../../BOX/2.webp'
import goldBoxImage from '../../../BOX/3.webp'
import platinumBoxImage from '../../../BOX/4.webp'

export const GAME_BOX_IDS = ['starter', 'silver', 'gold', 'platinum'] as const

export type GameBoxId = (typeof GAME_BOX_IDS)[number]

export type GameBoxConfig = {
  id: GameBoxId
  name: string
  cost: number
  maxPrize: number
  imageSrc: string
}

export const GAME_BOXES: GameBoxConfig[] = [
  { id: 'starter', name: 'STARTER BOX', cost: 10, maxPrize: 100, imageSrc: starterBoxImage },
  { id: 'silver', name: 'SILVER BOX', cost: 50, maxPrize: 500, imageSrc: silverBoxImage },
  { id: 'gold', name: 'GOLD BOX', cost: 250, maxPrize: 2500, imageSrc: goldBoxImage },
  { id: 'platinum', name: 'PLATINUM BOX', cost: 1000, maxPrize: 10000, imageSrc: platinumBoxImage },
]
