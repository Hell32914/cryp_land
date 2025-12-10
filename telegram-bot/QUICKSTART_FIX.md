# 🚀 Быстрая инструкция по деплою исправления

## На сервере (Railway/VPS с Linux):

```bash
# 1. Подключитесь к серверу по SSH

# 2. Перейдите в директорию бота
cd /path/to/telegram-bot

# 3. Проверьте текущий DATABASE_URL (НЕ публикуйте вывод!)
echo $DATABASE_URL

# 4. Если DATABASE_URL содержит "file:" - обновите его на Supabase:
export DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# 5. Или установите через Railway CLI:
railway variables set DATABASE_URL="postgresql://..."

# 6. Загрузите изменения
git pull origin main

# 7. Запустите скрипт обновления
chmod +x update-supabase-fix.sh
./update-supabase-fix.sh

# 8. Проверьте логи
pm2 logs telegram-bot --lines 50

# 9. Проверьте статус
pm2 status
```

## На локальной машине (Windows):

```powershell
# 1. Откройте PowerShell в директории telegram-bot

# 2. Обновите .env файл:
notepad .env

# Замените строку:
# DATABASE_URL="file:./dev.db"
# На:
# DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# 3. Запустите скрипт обновления
.\update-supabase-fix.ps1

# 4. Запустите бота
npm start
```

## Быстрая проверка:

```bash
# Проверить подключение к БД
npm run db:check

# Проверить pending notifications
node check-db-connection.js

# Посмотреть логи
pm2 logs telegram-bot --lines 20
```

## Ожидаемый результат:

✅ В логах должно быть:
```
✅ Database connection successful!
📊 Trading card scheduler initialized
✅ Trading card #123 sent to 45/50 users
📤 Sent profit notification to user 12345: $1.23
```

✅ Пользователи должны получать:
- 💰 Уведомления о профитах
- 📊 Торговые карточки

## Что делать, если не работает:

1. **Проверьте DATABASE_URL**:
   - Должен содержать `postgresql://`
   - НЕ должен содержать `file:`

2. **Перегенерируйте Prisma**:
   ```bash
   npx prisma generate
   npm run build
   pm2 restart all
   ```

3. **Проверьте таблицы в Supabase**:
   - User
   - DailyProfitUpdate
   - TradingPost

4. **Проверьте логи на ошибки**:
   ```bash
   pm2 logs telegram-bot --err --lines 100
   ```

## Где взять Supabase DATABASE_URL:

1. https://supabase.com → Ваш проект
2. Settings → Database
3. Connection string → **Connection pooling** (Transaction mode)
4. Скопируйте и замените `[YOUR-PASSWORD]`

## Контакты:

- 📖 Подробная документация: `FIX_SUPABASE_CONNECTION.md`
- 📝 Резюме: `SUMMARY.md`
- 🔍 Проверка БД: `npm run db:check`
