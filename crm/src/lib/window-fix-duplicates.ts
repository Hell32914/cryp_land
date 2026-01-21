/**
 * Утилита для консоли браузера: быстрое исправление дублирующихся колонок воронки
 * 
 * Использование в консоли браузера:
 * 1. Проверить дубли: window.checkFunnelDuplicates()
 * 2. Исправить дубли: window.fixFunnelDuplicates()
 */

import { findDuplicateStages, fixDuplicateStages, reportDuplicateStages } from './fix-duplicate-stages'
import { getPrimaryStageId, type SupportFunnelStage } from './support-funnel'

// Дефолтные стейджи (должны совпадать с теми, что используются в приложении)
const DEFAULT_STAGES: SupportFunnelStage[] = [
  { id: getPrimaryStageId(), label: 'Primary contact', locked: true },
  { id: 'secondary', label: 'In Process' },
  { id: 'decision', label: 'First touch' },
  { id: 'success', label: 'Deposit' },
  { id: 'fail', label: 'Not active 1' },
  { id: 'not-active-2', label: 'Not active 2' },
  { id: 'not-active-3', label: 'Not active 3' },
  { id: 'never-answer', label: 'Never answer' },
  { id: 'not-interesting', label: 'Not interesting' },
  { id: 'troll', label: 'Troll' },
  { id: 'spam', label: 'Spam' },
]

// Добавляем функции в window для доступа из консоли
declare global {
  interface Window {
    checkFunnelDuplicates: () => void
    fixFunnelDuplicates: () => void
  }
}

window.checkFunnelDuplicates = () => {
  console.log('🔍 Проверка дублирующихся колонок воронки...\n')
  
  const duplicates = findDuplicateStages(DEFAULT_STAGES)
  
  if (duplicates.length === 0) {
    console.log('✅ Дублирующихся колонок не найдено!')
    return
  }

  console.log(`⚠️ Найдено ${duplicates.length} дублирующихся колонок:\n`)
  const report = reportDuplicateStages(DEFAULT_STAGES)
  console.log(report)
  console.log('\n💡 Для исправления выполните: window.fixFunnelDuplicates()')
}

window.fixFunnelDuplicates = () => {
  console.log('🔧 Исправление дублирующихся колонок воронки...\n')
  
  const result = fixDuplicateStages(DEFAULT_STAGES)
  
  if (!result.fixed) {
    console.log('ℹ️ ' + result.message)
    return
  }

  console.log('✅ Дубликаты успешно исправлены!\n')
  console.log(result.message)
  console.log('\n🔄 Перезагрузите страницу, чтобы увидеть изменения')
  
  // Автоматически перезагружаем через 2 секунды
  setTimeout(() => {
    console.log('🔄 Перезагрузка страницы...')
    window.location.reload()
  }, 2000)
}

// Показываем справку при загрузке
console.log(
  '%c🛠️ Утилиты для исправления воронки',
  'font-size: 16px; font-weight: bold; color: #3b82f6;'
)
console.log(
  '%cДоступные команды:\n' +
  '  • window.checkFunnelDuplicates() - проверить дубли\n' +
  '  • window.fixFunnelDuplicates() - исправить дубли',
  'color: #6b7280;'
)
