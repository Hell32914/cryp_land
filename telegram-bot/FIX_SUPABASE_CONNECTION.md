# Исправление проблемы с профитами и карточками после перехода на Supabase

## Проблема
После перехода на Supabase профиты и карточки генерируются (видно в логах), но не отправляются пользователям в бот.

## Причина
В коде было несколько экземпляров `PrismaClient`, созданных локально в разных модулях:
- `cardGenerator.ts` 
- `tradingCardScheduler.ts`
- `api.ts`
- `payoutStatusChecker.ts`

Каждый из них создавал своё подключение к базе данных, которое могло быть не синхронизировано или использовало старые настройки (SQLite вместо PostgreSQL).

## Решение
✅ Создан централизованный модуль `db.ts` с единым экземпляром PrismaClient
✅ Все файлы обновлены для использования централизованного экземпляра
✅ Добавлен скрипт проверки подключения к БД

## Что было изменено

### 1. Создан новый файл `src/db.ts`
```typescript
import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
})

process.on('beforeExit', async () => {
  await prisma.$disconnect()
})
```

### 2. Обновлены импорты в файлах:
- ✅ `src/index.ts` - убран `new PrismaClient()`, импортирован из `db.ts`
- ✅ `src/cardGenerator.ts` - убран `new PrismaClient()`, импортирован из `db.ts`
- ✅ `src/tradingCardScheduler.ts` - убран `new PrismaClient()`, импортирован из `db.ts`
- ✅ `src/api.ts` - убран `new PrismaClient()`, импортирован из `db.ts`
- ✅ `src/payoutStatusChecker.ts` - убран `new PrismaClient()`, импортирован из `db.ts`

### 3. Добавлен скрипт проверки БД
`check-db-connection.js` - проверяет подключение и показывает статистику

## Проверка DATABASE_URL

⚠️ **ВАЖНО**: Убедитесь, что в `.env` файле (особенно на сервере) используется правильный `DATABASE_URL` для Supabase:

```env
# ❌ НЕПРАВИЛЬНО (SQLite - локальная БД):
DATABASE_URL="file:./dev.db"

# ✅ ПРАВИЛЬНО (PostgreSQL Supabase):
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

Строку подключения можно найти в панели Supabase:
1. Зайдите в ваш проект Supabase
2. Settings → Database
3. Connection string → Connection pooling (режим Transaction)
4. Скопируйте строку и замените `[YOUR-PASSWORD]` на реальный пароль

## Шаги для деплоя

### Локально (разработка):
```bash
# 1. Обновите .env с Supabase DATABASE_URL
# 2. Пересоберите проект
npm run build

# 3. Проверьте подключение к БД
node check-db-connection.js

# 4. Запустите бота
npm start
```

### На сервере (Railway/production):
```bash
# 1. Убедитесь, что переменная окружения DATABASE_URL установлена на Supabase URL
# 2. Выполните миграции (если нужно)
npx prisma migrate deploy

# 3. Пересоберите и перезапустите
npm run build
pm2 restart all

# 4. Проверьте логи
pm2 logs

# 5. Проверьте подключение к БД
node check-db-connection.js
```

## Проверка работы

После исправления проверьте:

1. **Профиты генерируются и отправляются**:
   ```bash
   node check-db-connection.js
   ```
   Должно показать количество pending notifications

2. **Карточки отправляются пользователям**:
   - Проверьте логи: должны быть сообщения `"✅ Trading card #X sent to Y/Z users"`
   - Проверьте, что пользователи получают карточки в боте

3. **Логи сервера**:
   ```bash
   pm2 logs telegram-bot --lines 100
   ```
   Ищите:
   - ✅ "Database connection successful"
   - ✅ "Trading card scheduler initialized"
   - ✅ "Sent profit notification to user..."

## Если проблема остаётся

1. Проверьте, что DATABASE_URL на сервере указывает на Supabase
2. Проверьте логи на наличие ошибок подключения к БД
3. Убедитесь, что у бота есть права отправлять сообщения пользователям
4. Проверьте, что таблицы существуют в Supabase БД:
   ```bash
   npx prisma db push
   ```

## Контакты для отладки

Если нужна помощь, предоставьте:
- Логи из `pm2 logs`
- Вывод `node check-db-connection.js`
- Скриншот переменных окружения (без паролей!)
