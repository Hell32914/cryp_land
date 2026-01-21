/**
 * Утилита для исправления дублирующихся колонок воронки
 * Объединяет чаты из дублирующихся стейджей и удаляет дубли
 */

import {
  canonicalizeStageId,
  loadSupportFunnelStages,
  saveSupportFunnelStages,
  loadSupportChatStageMap,
  saveSupportChatStageMap,
  type SupportFunnelStage,
} from './support-funnel'

export type DuplicateStageInfo = {
  canonicalId: string
  label: string
  duplicateIds: string[]
  affectedChatIds: string[]
}

/**
 * Находит дублирующиеся стейджи (с одинаковым канонизированным ID)
 */
export function findDuplicateStages(defaultStages: SupportFunnelStage[]): DuplicateStageInfo[] {
  const stages = loadSupportFunnelStages(defaultStages)
  const chatStageMap = loadSupportChatStageMap()

  // Группируем стейджи по каноническому ID
  const groupedById = new Map<string, SupportFunnelStage[]>()
  
  for (const stage of stages) {
    const canonical = canonicalizeStageId(stage.id)
    if (!canonical) continue
    
    if (!groupedById.has(canonical)) {
      groupedById.set(canonical, [])
    }
    groupedById.get(canonical)!.push(stage)
  }

  // Находим только те группы, где есть дубли
  const duplicates: DuplicateStageInfo[] = []

  for (const [canonicalId, stageGroup] of groupedById) {
    if (stageGroup.length <= 1) continue // Нет дублей

    // Собираем все ID, которые относятся к этому каноническому ID
    const allIds = stageGroup.map(s => s.id)
    
    // Находим чаты, которые привязаны к любому из этих ID
    const affectedChatIds: string[] = []
    for (const [chatId, stageId] of Object.entries(chatStageMap)) {
      if (allIds.includes(stageId) || canonicalizeStageId(stageId) === canonicalId) {
        affectedChatIds.push(chatId)
      }
    }

    duplicates.push({
      canonicalId,
      label: stageGroup[0].label, // Берем лейбл первого стейджа
      duplicateIds: allIds,
      affectedChatIds,
    })
  }

  return duplicates
}

/**
 * Исправляет дублирующиеся стейджи:
 * 1. Объединяет чаты из всех дублирующихся колонок в одну (с каноническим ID)
 * 2. Удаляет дублирующиеся колонки
 */
export function fixDuplicateStages(defaultStages: SupportFunnelStage[]): {
  fixed: boolean
  duplicatesFound: DuplicateStageInfo[]
  message: string
} {
  const duplicates = findDuplicateStages(defaultStages)
  
  if (duplicates.length === 0) {
    return {
      fixed: false,
      duplicatesFound: [],
      message: 'Дублирующихся колонок не найдено',
    }
  }

  const stages = loadSupportFunnelStages(defaultStages)
  const chatStageMap = loadSupportChatStageMap()

  // Удаляем дубликаты из списка стейджей
  const seenCanonical = new Set<string>()
  const uniqueStages: SupportFunnelStage[] = []

  for (const stage of stages) {
    const canonical = canonicalizeStageId(stage.id)
    if (!canonical) continue
    
    if (seenCanonical.has(canonical)) {
      // Это дубликат, пропускаем
      continue
    }
    
    seenCanonical.add(canonical)
    // Используем канонический ID для стейджа
    uniqueStages.push({
      ...stage,
      id: canonical,
    })
  }

  // Обновляем chatStageMap: все чаты из дублирующихся колонок переводим на канонический ID
  const updatedChatStageMap: Record<string, string> = {}
  
  for (const [chatId, stageId] of Object.entries(chatStageMap)) {
    const canonical = canonicalizeStageId(stageId)
    if (canonical) {
      updatedChatStageMap[chatId] = canonical
    }
  }

  // Сохраняем исправленные данные
  saveSupportFunnelStages(uniqueStages)
  saveSupportChatStageMap(updatedChatStageMap)

  const message = `Исправлено ${duplicates.length} дублирующихся колонок:\n` +
    duplicates.map(d => 
      `- "${d.label}" (${d.duplicateIds.length} дублей, ${d.affectedChatIds.length} чатов объединено)`
    ).join('\n')

  return {
    fixed: true,
    duplicatesFound: duplicates,
    message,
  }
}

/**
 * Показывает отчет о дублирующихся стейджах без исправления
 */
export function reportDuplicateStages(defaultStages: SupportFunnelStage[]): string {
  const duplicates = findDuplicateStages(defaultStages)
  
  if (duplicates.length === 0) {
    return 'Дублирующихся колонок не найдено ✓'
  }

  let report = `Найдено ${duplicates.length} дублирующихся колонок:\n\n`
  
  for (const dup of duplicates) {
    report += `📋 Колонка: "${dup.label}" (канонический ID: ${dup.canonicalId})\n`
    report += `   Дубликаты: ${dup.duplicateIds.join(', ')}\n`
    report += `   Затронуто чатов: ${dup.affectedChatIds.length}\n`
    if (dup.affectedChatIds.length > 0 && dup.affectedChatIds.length <= 10) {
      report += `   ID чатов: ${dup.affectedChatIds.join(', ')}\n`
    }
    report += '\n'
  }

  return report
}
