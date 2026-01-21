/**
 * Автоматическая миграция для исправления дублирующихся стейджей воронки
 * Запускается один раз при загрузке приложения
 */

import { fixDuplicateStages } from './fix-duplicate-stages'
import { getPrimaryStageId, type SupportFunnelStage } from './support-funnel'

const MIGRATION_KEY = 'crm.support.duplicatesMigrationDone.v1'

// Дефолтные стейджи
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

/**
 * Автоматически исправляет дубликаты при первой загрузке
 * Запускается только один раз
 */
export function runAutoMigration() {
  try {
    // Проверяем, была ли уже выполнена миграция
    const migrationDone = localStorage.getItem(MIGRATION_KEY)
    if (migrationDone === 'true') {
      return // Миграция уже выполнена
    }

    console.log('[Auto-Migration] Проверка дублирующихся колонок воронки...')

    const result = fixDuplicateStages(DEFAULT_STAGES)

    if (result.fixed) {
      console.log('[Auto-Migration] ✅ Дубликаты исправлены автоматически!')
      console.log(result.message)
      
      // Помечаем миграцию как выполненную
      localStorage.setItem(MIGRATION_KEY, 'true')
      
      // Уведомляем пользователя (опционально)
      // Можно показать toast уведомление
    } else {
      console.log('[Auto-Migration] ℹ️ Дубликаты не найдены')
      
      // Помечаем миграцию как выполненную даже если дублей нет
      localStorage.setItem(MIGRATION_KEY, 'true')
    }
  } catch (error) {
    console.error('[Auto-Migration] ❌ Ошибка при автоматическом исправлении дублей:', error)
    // Не помечаем как выполненную, чтобы попробовать снова при следующей загрузке
  }
}

/**
 * Сбрасывает флаг миграции (для тестирования или повторного запуска)
 */
export function resetAutoMigration() {
  localStorage.removeItem(MIGRATION_KEY)
  console.log('[Auto-Migration] Флаг миграции сброшен. Перезагрузите страницу для повторного запуска.')
}

// Добавляем функцию сброса в window для доступа из консоли
declare global {
  interface Window {
    resetDuplicatesMigration: () => void
  }
}

window.resetDuplicatesMigration = resetAutoMigration
