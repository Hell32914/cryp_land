export type OperatorPresenceSession = {
  start: number
  end?: number
}

export type OperatorPresenceEntry = {
  online: boolean
  updatedAt: number
  sessions: OperatorPresenceSession[]
}

export type OperatorPresenceMap = Record<string, OperatorPresenceEntry>

export type OperatorPresenceInterval = {
  start: number
  end: number
}

const PRESENCE_KEY = 'crm.operatorPresence.v1'
const PRESENCE_EVENT = 'crm:operatorPresence'

const safeNow = () => Date.now()

const readPresence = (): OperatorPresenceMap => {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(PRESENCE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as OperatorPresenceMap
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed
  } catch {
    return {}
  }
}

const writePresence = (map: OperatorPresenceMap) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PRESENCE_KEY, JSON.stringify(map))
    window.dispatchEvent(new CustomEvent(PRESENCE_EVENT))
  } catch {
    // ignore storage errors
  }
}

const normalizeUsername = (username: string) => String(username || '').trim()

export const getPresenceMap = (): OperatorPresenceMap => readPresence()

export const getPresenceEntry = (username: string): OperatorPresenceEntry | null => {
  const key = normalizeUsername(username)
  if (!key) return null
  const map = readPresence()
  return map[key] || null
}

export const setOperatorPresence = (username: string, online: boolean, ts: number = safeNow()) => {
  const key = normalizeUsername(username)
  if (!key) return null
  const map = readPresence()
  const existing: OperatorPresenceEntry = map[key] || { online: false, updatedAt: ts, sessions: [] }

  if (online) {
    const last = existing.sessions[existing.sessions.length - 1]
    if (!last || last.end) {
      existing.sessions = [...existing.sessions, { start: ts }]
    }
  } else {
    const last = existing.sessions[existing.sessions.length - 1]
    if (last && !last.end) {
      last.end = ts
      existing.sessions = [...existing.sessions.slice(0, -1), last]
    }
  }

  const updated: OperatorPresenceEntry = {
    online,
    updatedAt: ts,
    sessions: existing.sessions,
  }

  map[key] = updated
  writePresence(map)
  return updated
}

export const ensurePresenceSessionClosed = (username: string, ts: number = safeNow()) => {
  const key = normalizeUsername(username)
  if (!key) return
  const map = readPresence()
  const existing = map[key]
  if (!existing) return
  const last = existing.sessions[existing.sessions.length - 1]
  if (last && !last.end) {
    last.end = ts
    map[key] = { ...existing, online: false, updatedAt: ts, sessions: [...existing.sessions.slice(0, -1), last] }
    writePresence(map)
  }
}

export const getOnlineIntervals = (username: string, fromTs: number, toTs: number): OperatorPresenceInterval[] => {
  const entry = getPresenceEntry(username)
  if (!entry) return []
  const now = safeNow()
  const intervals: OperatorPresenceInterval[] = []

  for (const session of entry.sessions) {
    const start = session.start
    const end = session.end ?? now
    if (end < fromTs || start > toTs) continue
    intervals.push({
      start: Math.max(start, fromTs),
      end: Math.min(end, toTs),
    })
  }

  return intervals.sort((a, b) => a.start - b.start)
}

export const getOnlineOverlapMs = (
  intervals: OperatorPresenceInterval[],
  start: number,
  end: number
) => {
  if (!intervals.length) return 0
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0
  let total = 0
  for (const interval of intervals) {
    if (interval.end <= start || interval.start >= end) continue
    const overlapStart = Math.max(start, interval.start)
    const overlapEnd = Math.min(end, interval.end)
    if (overlapEnd > overlapStart) total += overlapEnd - overlapStart
  }
  return total
}

export const subscribePresence = (callback: () => void) => {
  if (typeof window === 'undefined') return () => {}

  const handleStorage = (event: StorageEvent) => {
    if (event.key === PRESENCE_KEY) callback()
  }

  const handleCustom = () => callback()

  window.addEventListener('storage', handleStorage)
  window.addEventListener(PRESENCE_EVENT, handleCustom)

  return () => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener(PRESENCE_EVENT, handleCustom)
  }
}
