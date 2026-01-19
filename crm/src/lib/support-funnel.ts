export type SupportFunnelStage = {
  id: string
  label: string
  locked?: boolean
}

export type SupportFunnelUpdateKind = 'stages' | 'chatStageMap' | 'pinnedChatIds'

const STORAGE_KEYS = {
  stages: 'crm.support.funnelStages.v1',
  chatStageMap: 'crm.support.chatStageMap.v1',
  pinnedChatIds: 'crm.support.pinnedChatIds.v1',
} as const

const PRIMARY_STAGE_ID = 'primary'

const SUPPORT_FUNNEL_EVENT = 'crm.supportFunnel.updated'

function emitSupportFunnelUpdate(kind: SupportFunnelUpdateKind) {
  try {
    window.dispatchEvent(new CustomEvent(SUPPORT_FUNNEL_EVENT, { detail: { kind } }))
  } catch {
    // ignore
  }
}

function kindFromStorageKey(key: string | null): SupportFunnelUpdateKind | null {
  if (!key) return null
  if (key === STORAGE_KEYS.stages) return 'stages'
  if (key === STORAGE_KEYS.chatStageMap) return 'chatStageMap'
  if (key === STORAGE_KEYS.pinnedChatIds) return 'pinnedChatIds'
  return null
}

export function subscribeSupportFunnelUpdates(onUpdate: (kind: SupportFunnelUpdateKind) => void) {
  const onCustom = (e: Event) => {
    const ce = e as CustomEvent
    const kind = ce?.detail?.kind as SupportFunnelUpdateKind | undefined
    if (kind) onUpdate(kind)
  }

  const onStorage = (e: StorageEvent) => {
    const kind = kindFromStorageKey(e.key)
    if (kind) onUpdate(kind)
  }

  window.addEventListener(SUPPORT_FUNNEL_EVENT, onCustom)
  window.addEventListener('storage', onStorage)

  return () => {
    window.removeEventListener(SUPPORT_FUNNEL_EVENT, onCustom)
    window.removeEventListener('storage', onStorage)
  }
}

export function getPrimaryStageId() {
  return PRIMARY_STAGE_ID
}

export function ensurePrimaryStage(stages: SupportFunnelStage[], primaryLabel = 'Primary contact'): SupportFunnelStage[] {
  const hasPrimary = stages.some((s) => s.id === PRIMARY_STAGE_ID)
  const normalized = stages.map((s) => (s.id === PRIMARY_STAGE_ID ? { ...s, locked: true } : s))
  if (hasPrimary) return normalized

  return [{ id: PRIMARY_STAGE_ID, label: primaryLabel, locked: true }, ...normalized]
}

function normalizeAndMigrateStages(
  storedStages: SupportFunnelStage[],
  defaultStages: SupportFunnelStage[],
  primaryLabel: string,
): SupportFunnelStage[] {
  // Goal:
  // - Keep stable IDs (so DB stages and client stage-map keep working)
  // - Upgrade older default labels to the new labels
  // - Ensure the new default stages exist and appear in the expected order
  // - Preserve user-custom labels and any extra custom stages

  const defaultById = new Map<string, SupportFunnelStage>()
  for (const st of defaultStages) defaultById.set(st.id, st)

  const oldDefaultLabels: Record<string, string[]> = {
    secondary: ['Secondary contact', 'Вторичный контакт', 'Вторинний контакт'],
    decision: ['Decision making', 'Принятие решения', 'Прийняття рішення'],
    success: ['Successfully completed', 'Успешно завершено', 'Успішно завершено'],
    fail: ['Unsuccessfully completed', 'Неуспешно завершено', 'Неуспішно завершено'],
    spam: ['Spam', 'Спам'],
  }

  const storedById = new Map<string, SupportFunnelStage>()
  for (const st of storedStages) {
    if (!st?.id) continue
    storedById.set(st.id, { id: String(st.id), label: String(st.label ?? ''), locked: Boolean(st.locked) })
  }

  // Upgrade labels only if they look like old defaults (avoid overwriting custom labels).
  for (const [id, st] of storedById) {
    const desired = defaultById.get(id)?.label
    if (!desired) continue
    const old = oldDefaultLabels[id]
    if (old && old.includes(st.label)) {
      storedById.set(id, { ...st, label: desired })
    }
  }

  // Build result in the default order, ensuring all default stages exist.
  const result: SupportFunnelStage[] = []
  // Primary stage first.
  const storedPrimary = storedById.get(PRIMARY_STAGE_ID)
  result.push({ id: PRIMARY_STAGE_ID, label: storedPrimary?.label || primaryLabel, locked: true })

  for (const def of defaultStages) {
    if (def.id === PRIMARY_STAGE_ID) continue
    const existing = storedById.get(def.id)
    result.push({
      id: def.id,
      label: existing?.label || def.label,
      locked: Boolean(def.locked || existing?.locked),
    })
  }

  // Append any custom stages that are not part of defaults (keep their relative order).
  const defaultIds = new Set(defaultStages.map((s) => s.id))
  for (const st of storedStages) {
    if (!st?.id) continue
    const id = String(st.id)
    if (defaultIds.has(id)) continue
    const label = typeof st.label === 'string' ? st.label : String(st.label ?? '')
    if (!label.trim()) continue
    result.push({ id, label, locked: Boolean((st as any).locked) })
  }

  return ensurePrimaryStage(result, primaryLabel)
}

export function loadSupportFunnelStages(defaultStages: SupportFunnelStage[]): SupportFunnelStage[] {
  const defaultPrimaryLabel =
    defaultStages.find((s) => s.id === PRIMARY_STAGE_ID)?.label || 'Primary contact'

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.stages)
    if (!raw) return ensurePrimaryStage(defaultStages, defaultPrimaryLabel)
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return ensurePrimaryStage(defaultStages, defaultPrimaryLabel)

    const stages = parsed
      .filter((s: any) => s && typeof s.id === 'string' && typeof s.label === 'string')
      .map((s: any) => ({ id: String(s.id), label: String(s.label), locked: Boolean(s.locked) }))

    const base = stages.length ? stages : defaultStages
    return normalizeAndMigrateStages(base, defaultStages, defaultPrimaryLabel)
  } catch {
    return normalizeAndMigrateStages(defaultStages, defaultStages, defaultPrimaryLabel)
  }
}

export function saveSupportFunnelStages(stages: SupportFunnelStage[]) {
  const primaryLabel = stages.find((s) => s.id === PRIMARY_STAGE_ID)?.label || 'Primary contact'
  localStorage.setItem(STORAGE_KEYS.stages, JSON.stringify(ensurePrimaryStage(stages, primaryLabel)))
  emitSupportFunnelUpdate('stages')
}

export function loadSupportChatStageMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.chatStageMap)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Record<string, string>
  } catch {
    return {}
  }
}

export function saveSupportChatStageMap(map: Record<string, string>) {
  localStorage.setItem(STORAGE_KEYS.chatStageMap, JSON.stringify(map))
  emitSupportFunnelUpdate('chatStageMap')
}

export function loadPinnedChatIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.pinnedChatIds)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((v) => String(v)).filter(Boolean)
  } catch {
    return []
  }
}

export function savePinnedChatIds(ids: string[]) {
  localStorage.setItem(STORAGE_KEYS.pinnedChatIds, JSON.stringify(Array.from(new Set(ids))))
  emitSupportFunnelUpdate('pinnedChatIds')
}
