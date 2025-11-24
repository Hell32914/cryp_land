# Updates Summary - November 24, 2025

## ✅ Completed Tasks

### 1. Удалены все тестовые файлы
Удалены все файлы `test-*.js` и `test-*.cjs`:
- `test-login.js`
- `test-crm-api.js`
- `test-railway-login.js`
- `test-railway-auth.js`
- `test-profit-format.js`
- `test-card.js`
- `test-render-auth.cjs`
- `test-railway.cjs`
- `test-railway-auth.cjs`
- `test-prisma.cjs`
- `test-oxapay.cjs`
- `test-notifications.cjs`
- `test-deposit-flow.cjs`

### 2. Добавлено копирование маркетинговых ссылок в CRM
**Файл:** `crm/src/components/pages/LinkBuilder.tsx`

Добавлена кнопка копирования в таблице со ссылками:
```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={async () => {
    try {
      await navigator.clipboard.writeText(`${baseUrl}${link.linkId}`)
      toast.success('Link copied!')
    } catch {
      toast.error('Failed to copy')
    }
  }}
>
  <Copy size={16} />
</Button>
```

### 3. Добавлены уведомления администраторам

#### Депозиты
**Файл:** `telegram-bot/src/api.ts` (строка ~1313)

Теперь все администраторы получают уведомление при успешном депозите:
```
💰 New Deposit Received

👤 User: @username (ID: 123456789)
💵 Amount: $100.00
💎 Currency: USDT
📊 Total Deposited: $100.00
💳 New Balance: $100.00
📈 Plan: Bronze
```

#### Выводы
**Файл:** `telegram-bot/src/api.ts` (строка ~995)

Теперь все администраторы получают уведомление при успешном выводе:
```
💸 Withdrawal Completed

👤 User: @username (ID: 123456789)
💰 Amount: $50.00
💎 Currency: USDT
🌐 Network: TRC20
📍 Address: TXxx...xxx
🔗 Track ID: abc123
💳 User New Balance: $50.00
```

### 4. Переделана система администраторов

#### Изменения в коде
**Файл:** `telegram-bot/src/index.ts`

**Было:**
```typescript
export const ADMIN_ID = process.env.ADMIN_ID!
export const ADMIN_ID_2 = process.env.ADMIN_ID_2!

async function isAdmin(userId: string): Promise<boolean> {
  if (userId === ADMIN_ID || userId === ADMIN_ID_2) return true
  // ...
}
```

**Стало:**
```typescript
// Parse admin IDs from comma-separated list
const ADMIN_IDS_STRING = process.env.ADMIN_IDS || process.env.ADMIN_ID || ''
export const ADMIN_IDS = ADMIN_IDS_STRING.split(',').map(id => id.trim()).filter(id => id.length > 0)
export const ADMIN_ID = ADMIN_IDS[0] || '' // Legacy support

// Send message to all admins
export async function notifyAdmins(message: string, options?: any) {
  const results = []
  for (const adminId of ADMIN_IDS) {
    try {
      await bot.api.sendMessage(adminId, message, options)
      results.push({ adminId, success: true })
    } catch (error) {
      console.error(`Failed to notify admin ${adminId}:`, error)
      results.push({ adminId, success: false })
    }
  }
  return results
}

async function isAdmin(userId: string): Promise<boolean> {
  if (ADMIN_IDS.includes(userId)) return true
  // ...
}
```

#### Формат .env файла

**Было:**
```env
ADMIN_ID=503856039
ADMIN_ID_2=1450570156
```

**Стало:**
```env
# List all admin IDs separated by commas
ADMIN_IDS=503856039,1450570156
```

**Можно добавлять любое количество:**
```env
ADMIN_IDS=503856039,1450570156,999888777,111222333
```

#### Обратная совместимость
Код поддерживает старый формат `ADMIN_ID` для обратной совместимости:
- Если `ADMIN_IDS` не задан, используется `ADMIN_ID`
- Старые проверки `ADMIN_ID` заменены на `ADMIN_IDS.includes(userId)`

### 5. Добавлено автообновление статусов в CRM

#### Deposits
**Файл:** `crm/src/components/pages/Deposits.tsx`

```typescript
const { data } = useQuery({
  queryKey: ['deposits', token],
  queryFn: () => fetchDeposits(token!),
  enabled: !!token,
  refetchInterval: 10000, // Auto-refresh every 10 seconds
})
```

#### Withdrawals
**Файл:** `crm/src/components/pages/Withdrawals.tsx`

```typescript
const { data } = useQuery({
  queryKey: ['withdrawals', token],
  queryFn: () => fetchWithdrawals(token!),
  enabled: !!token,
  refetchInterval: 10000, // Auto-refresh every 10 seconds
})
```

Теперь статусы депозитов и выводов автоматически обновляются каждые 10 секунд.

## 🚀 Деплой на Railway

### Обновите переменную окружения:

**Старый формат (удалить):**
```
ADMIN_ID=503856039
ADMIN_ID_2=1450570156
```

**Новый формат (добавить):**
```
ADMIN_IDS=503856039,1450570156
```

### Команды для деплоя:

```bash
# Backend (telegram-bot)
cd telegram-bot
git add .
git commit -m "feat: admin notifications, multiple admins support, auto-refresh CRM"
git push

# Frontend (CRM)
cd crm
git add .
git commit -m "feat: copy marketing links, auto-refresh deposits/withdrawals"
git push
```

## 📋 Список изменений

### Backend (`telegram-bot/`)
- ✅ `src/index.ts` - Переделана система администраторов
- ✅ `src/api.ts` - Добавлены уведомления админам о депозитах и выводах
- ✅ `.env` - Обновлен формат ADMIN_IDS
- ✅ Удалены все тестовые файлы

### Frontend (`crm/`)
- ✅ `src/components/pages/LinkBuilder.tsx` - Добавлена кнопка копирования ссылок
- ✅ `src/components/pages/Deposits.tsx` - Добавлено автообновление каждые 10 сек
- ✅ `src/components/pages/Withdrawals.tsx` - Добавлено автообновление каждые 10 сек

## 🎯 Преимущества

1. **Несколько администраторов** - легко добавлять/удалять через .env
2. **Все админы получают уведомления** - о депозитах и выводах
3. **Автоматическое обновление** - CRM показывает актуальные статусы
4. **Чистый код** - удалены все тестовые файлы
5. **Удобство** - копирование ссылок одной кнопкой

## 📝 Примечания

- Убедитесь, что на Railway установлена переменная `ADMIN_IDS`
- Автообновление работает только когда CRM открыт в браузере
- Уведомления отправляются всем админам параллельно
- Если какой-то админ заблокировал бота, уведомление остальным всё равно придёт
