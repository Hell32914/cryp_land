export type SupportFunnelStage = {
  id: string
  label: string
  locked?: boolean
}

export type SupportFunnelUpdateKind = 'stages' | 'chatStageMap' | 'pinnedChatIds' | 'stageAliases'

const STORAGE_KEYS = {
  stages: 'crm.support.funnelStages.v1',
  chatStageMap: 'crm.support.chatStageMap.v1',
  pinnedChatIds: 'crm.support.pinnedChatIds.v1',
  stageAliases: 'crm.support.funnelStageAliases.v1',
} as const

const PRIMARY_STAGE_ID = 'primary'

export function canonicalizeStageId(value?: string | null): string | null {
  if (typeof value !== 'string') return null
  const raw = value.trim()
  if (!raw) return null
  // Internal UI-only column id should never be persisted.
  if (raw === '__unknown_stage__') return null

  const normalized = raw
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\u0400-\u04ff-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)

  return normalized || null
}

const LEGACY_PENDING_DEPOSIT_ID = 'pending-deposit'

function isLegacyPendingDepositStage(stage: SupportFunnelStage): boolean {
  const id = canonicalizeStageId(stage?.id)
  const labelId = canonicalizeStageId(stage?.label)
  return id === LEGACY_PENDING_DEPOSIT_ID || labelId === LEGACY_PENDING_DEPOSIT_ID
}

function dedupeStages(stages: SupportFunnelStage[]): SupportFunnelStage[] {
  const seen = new Set<string>()
  const result: SupportFunnelStage[] = []
  for (const s of stages) {
    const id = canonicalizeStageId(s?.id) || null
    if (!id) continue
    if (seen.has(id)) continue
    seen.add(id)
    result.push({ ...s, id })
  }
  return result
}

const SUPPORT_FUNNEL_EVENT = 'crm.supportFunnel.updated'

function emitSupportFunnelUpdate(kind: SupportFunnelUpdateKind) {
  try {
    window.dispatchEvent(new CustomEvent(SUPPORT_FUNNEL_EVENT, { detail: { kind } }))
  } catch {
    // ignore
  }
}

function setLocalStorageJsonSilently(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

function kindFromStorageKey(key: string | null): SupportFunnelUpdateKind | null {
  if (!key) return null
  if (key === STORAGE_KEYS.stages) return 'stages'
  if (key === STORAGE_KEYS.chatStageMap) return 'chatStageMap'
  if (key === STORAGE_KEYS.pinnedChatIds) return 'pinnedChatIds'
  if (key === STORAGE_KEYS.stageAliases) return 'stageAliases'
  return null
}

function resolveAlias(id: string, aliases: Record<string, string>): string {
  let cur = canonicalizeStageId(id) || id
  const seen = new Set<string>()
  while (aliases[cur] && !seen.has(cur)) {
    seen.add(cur)
    cur = canonicalizeStageId(aliases[cur]) || aliases[cur]
  }
  return cur
}

function mergeStageAliases(a: Record<string, string>, b: Record<string, string>): Record<string, string> {
  const merged: Record<string, string> = { ...a }
  for (const [fromRaw, toRaw] of Object.entries(b)) {
    const from = canonicalizeStageId(fromRaw)
    const to = canonicalizeStageId(toRaw)
    if (!from || !to) continue
    if (from === to) continue
    merged[from] = to
  }

  // Resolve chains (a->b, b->c => a->c)
  const out: Record<string, string> = {}
  for (const [from, to] of Object.entries(merged)) {
    const resolved = resolveAlias(to, merged)
    if (from !== resolved) out[from] = resolved
  }
  return out
}

function buildImplicitAliasesFromDefaults(defaultStages: SupportFunnelStage[]): Record<string, string> {
  // Map slug(label) -> stable default id.
  // Example (EN/RU in this app): label "Deposit" => slug "deposit" should map to id "success".
  const aliases: Record<string, string> = {}
  for (const st of defaultStages) {
    const id = canonicalizeStageId(st?.id)
    const labelKey = canonicalizeStageId(String(st?.label ?? ''))
    if (!id || !labelKey) continue
    if (id === labelKey) continue
    // Don't alias the UI-only column.
    if (labelKey === '__unknown_stage__') continue
    aliases[labelKey] = id
  }
  return aliases
}

function areAliasMapsEqual(a: Record<string, string>, b: Record<string, string>): boolean {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) return false
  for (const k of aKeys) {
    if (a[k] !== b[k]) return false
  }
  return true
}

function dedupeStagesByLabel(
  stages: SupportFunnelStage[],
  defaultStages: SupportFunnelStage[],
): { stages: SupportFunnelStage[]; aliases: Record<string, string>; changed: boolean } {
  // Note: duplicates we need to fix are often not by id, but by label.
  // Example: default id "success" has label "Deposit", and user created custom id "deposit" with label "Deposit".

  const defaultIdSet = new Set<string>()
  for (const s of defaultStages) {
    const id = canonicalizeStageId(s?.id) || null
    if (id) defaultIdSet.add(id)
  }

  const groups = new Map<string, SupportFunnelStage[]>()
  for (const st of stages) {
    const labelKey = canonicalizeStageId(String(st?.label ?? ''))
    if (!labelKey) continue
    const arr = groups.get(labelKey) || []
    arr.push(st)
    groups.set(labelKey, arr)
  }

  const winnerByLabel = new Map<string, string>()
  const aliases: Record<string, string> = {}
  let hasDupes = false

  for (const [labelKey, items] of groups) {
    if (items.length <= 1) continue
    hasDupes = true

    // Prefer keeping default stage id (so DB stage ids keep matching expected columns).
    const winner =
      items.find((s) => {
        const sid = canonicalizeStageId(s?.id) || null
        return Boolean(sid && defaultIdSet.has(sid))
      }) || items[0]

    const winnerId = canonicalizeStageId(winner.id) || winner.id
    winnerByLabel.set(labelKey, winnerId)

    for (const it of items) {
      const itId = canonicalizeStageId(it.id) || it.id
      if (itId === winnerId) continue
      aliases[itId] = winnerId
    }
  }

  if (!hasDupes) return { stages, aliases: {}, changed: false }

  const addedWinnerFor = new Set<string>()
  const out: SupportFunnelStage[] = []
  for (const st of stages) {
    const labelKey = canonicalizeStageId(String(st?.label ?? ''))
    if (!labelKey) continue

    const winnerId = winnerByLabel.get(labelKey)
    if (!winnerId) {
      out.push(st)
      continue
    }

    const sid = canonicalizeStageId(st.id) || st.id
    if (sid !== winnerId) continue
    if (addedWinnerFor.has(labelKey)) continue
    addedWinnerFor.add(labelKey)
    out.push({ ...st, id: winnerId })
  }

  return { stages: out, aliases, changed: out.length !== stages.length || Object.keys(aliases).length > 0 }
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
    const id = canonicalizeStageId(st?.id) || null
    if (!id) continue
    storedById.set(id, { id, label: String(st.label ?? ''), locked: Boolean(st.locked) })
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
    const defId = canonicalizeStageId(def.id) || def.id
    const existing = storedById.get(defId)
    result.push({
      id: defId,
      label: existing?.label || def.label,
      locked: Boolean(def.locked || existing?.locked),
    })
  }

  // Append any custom stages that are not part of defaults (keep their relative order).
  const defaultIds = new Set(defaultStages.map((s) => s.id))
  for (const st of storedStages) {
    const id = canonicalizeStageId(st?.id) || null
    if (!id) continue
    if (defaultIds.has(id)) continue
    const label = typeof st.label === 'string' ? st.label : String(st.label ?? '')
    if (!label.trim()) continue
    result.push({ id, label, locked: Boolean((st as any).locked) })
  }

  return ensurePrimaryStage(dedupeStages(result), primaryLabel)
}

export function loadSupportFunnelStages(defaultStages: SupportFunnelStage[]): SupportFunnelStage[] {
  const defaultPrimaryLabel =
    defaultStages.find((s) => s.id === PRIMARY_STAGE_ID)?.label || 'Primary contact'

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.stages)
    let stages: SupportFunnelStage[] = []

    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        stages = parsed
          .filter((s: any) => s && typeof s.id === 'string' && typeof s.label === 'string')
          .map((s: any) => ({
            id: canonicalizeStageId(String(s.id)) || String(s.id),
            label: String(s.label),
            locked: Boolean(s.locked),
          }))
      }
    }

    const base = stages.length ? stages : defaultStages
    const normalized = normalizeAndMigrateStages(dedupeStages(base), dedupeStages(defaultStages), defaultPrimaryLabel)

    // Deduplicate duplicate columns by identical labels.
    const dedupedDefaults = dedupeStages(defaultStages)
    const { stages: labelDeduped, aliases: labelAliases, changed: stagesChanged } = dedupeStagesByLabel(normalized, dedupedDefaults)

    const filteredStages = labelDeduped.filter((s) => !isLegacyPendingDepositStage(s))
    const removedLegacyPending = filteredStages.length !== labelDeduped.length

    // Always keep implicit aliases for defaults so DB stage ids like "deposit" or "first-touch"
    // collapse into the stable default ids.
    const implicitAliases = buildImplicitAliasesFromDefaults(dedupedDefaults)

    const prevAliases = loadSupportStageAliases()
    const mergedAliases = mergeStageAliases(prevAliases, { ...implicitAliases, ...labelAliases })
    const aliasesChanged = !areAliasMapsEqual(prevAliases, mergedAliases)
    if (aliasesChanged) {
      // Silent write to avoid event recursion during initial load.
      setLocalStorageJsonSilently(STORAGE_KEYS.stageAliases, mergedAliases)
    }

    // Migrate local per-chat stage map (used for drag-and-drop + accept flow).
    const map = loadSupportChatStageMap()
    let mapChanged = false
    const nextMap: Record<string, string> = {}
    for (const [chatId, stageId] of Object.entries(map)) {
      const sid = canonicalizeStageId(stageId)
      if (!sid) continue
      const resolved = resolveAlias(sid, mergedAliases)
      nextMap[String(chatId)] = resolved
      if (resolved !== sid) mapChanged = true
    }
    if (mapChanged) {
      // Silent write to avoid event recursion during initial load.
      setLocalStorageJsonSilently(STORAGE_KEYS.chatStageMap, nextMap)
    }

    if (stagesChanged || removedLegacyPending) {
      // Persist fixed stages.
      // Silent write to avoid event recursion during initial load.
      const primaryLabel = filteredStages.find((s) => s.id === PRIMARY_STAGE_ID)?.label || defaultPrimaryLabel
      const normalizedToStore = dedupeStages(
        ensurePrimaryStage(
          filteredStages.map((s) => ({ ...s, id: canonicalizeStageId(s.id) || s.id })),
          primaryLabel,
        ),
      )
      setLocalStorageJsonSilently(STORAGE_KEYS.stages, normalizedToStore)
    }

    return filteredStages
  } catch {
    const dedupedDefaults = dedupeStages(defaultStages)
    const normalized = normalizeAndMigrateStages(dedupedDefaults, dedupedDefaults, defaultPrimaryLabel)
    const { stages: labelDeduped } = dedupeStagesByLabel(normalized, dedupedDefaults)
    const filteredStages = labelDeduped.filter((s) => !isLegacyPendingDepositStage(s))

    const implicitAliases = buildImplicitAliasesFromDefaults(dedupedDefaults)
    const prevAliases = loadSupportStageAliases()
    const mergedAliases = mergeStageAliases(prevAliases, implicitAliases)
    if (!areAliasMapsEqual(prevAliases, mergedAliases)) {
      setLocalStorageJsonSilently(STORAGE_KEYS.stageAliases, mergedAliases)
    }

    const map = loadSupportChatStageMap()
    let mapChanged = false
    const nextMap: Record<string, string> = {}
    for (const [chatId, stageId] of Object.entries(map)) {
      const sid = canonicalizeStageId(stageId)
      if (!sid) continue
      const resolved = resolveAlias(sid, mergedAliases)
      nextMap[String(chatId)] = resolved
      if (resolved !== sid) mapChanged = true
    }
    if (mapChanged) {
      setLocalStorageJsonSilently(STORAGE_KEYS.chatStageMap, nextMap)
    }

    return filteredStages
  }
}

export function saveSupportFunnelStages(stages: SupportFunnelStage[]) {
  const primaryLabel = stages.find((s) => s.id === PRIMARY_STAGE_ID)?.label || 'Primary contact'
  const normalized = dedupeStages(
    ensurePrimaryStage(
      stages.filter((s) => !isLegacyPendingDepositStage(s)).map((s) => ({ ...s, id: canonicalizeStageId(s.id) || s.id })),
      primaryLabel,
    ),
  )
  localStorage.setItem(STORAGE_KEYS.stages, JSON.stringify(normalized))
  emitSupportFunnelUpdate('stages')
}

export function loadSupportStageAliases(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.stageAliases)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}

    const obj = parsed as Record<string, string>
    const normalized: Record<string, string> = {}
    for (const [fromRaw, toRaw] of Object.entries(obj)) {
      const from = canonicalizeStageId(fromRaw)
      const to = canonicalizeStageId(toRaw)
      if (!from || !to) continue
      if (from === to) continue
      normalized[from] = to
    }

    return mergeStageAliases({}, normalized)
  } catch {
    return {}
  }
}

export function saveSupportStageAliases(map: Record<string, string>) {
  localStorage.setItem(STORAGE_KEYS.stageAliases, JSON.stringify(map))
  emitSupportFunnelUpdate('stageAliases')
}

export function loadSupportChatStageMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.chatStageMap)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    const map = parsed as Record<string, string>
    const normalized: Record<string, string> = {}
    for (const [chatId, stageId] of Object.entries(map)) {
      const sid = canonicalizeStageId(stageId)
      if (!sid) continue
      normalized[String(chatId)] = sid
    }
    return normalized
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
