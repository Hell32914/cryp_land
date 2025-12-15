import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export interface CardSettings {
  minPerDay: number
  maxPerDay: number
  startTime: string
  endTime: string
}

const SETTINGS_FILE = path.join(__dirname, '..', 'card-settings.json')

// Default settings
const DEFAULT_SETTINGS: CardSettings = {
  minPerDay: parseInt(process.env.CARDS_MIN_PER_DAY || '4'),
  maxPerDay: parseInt(process.env.CARDS_MAX_PER_DAY || '16'),
  startTime: process.env.CARDS_START_TIME || '07:49',
  endTime: process.env.CARDS_END_TIME || '22:30'
}

/**
 * Load settings from file or use defaults
 */
export async function loadCardSettings(): Promise<CardSettings> {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    // File doesn't exist, use defaults
    return DEFAULT_SETTINGS
  }
}

/**
 * Save settings to file
 */
export async function saveCardSettings(settings: CardSettings): Promise<void> {
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8')
}

/**
 * Get current settings (cached)
 */
let cachedSettings: CardSettings | null = null

export async function getCardSettings(): Promise<CardSettings> {
  if (!cachedSettings) {
    cachedSettings = await loadCardSettings()
  }
  return cachedSettings
}

/**
 * Update settings and clear cache
 */
export async function updateCardSettings(settings: Partial<CardSettings>): Promise<CardSettings> {
  const current = await getCardSettings()
  const updated = { ...current, ...settings }
  await saveCardSettings(updated)
  cachedSettings = updated
  return updated
}
