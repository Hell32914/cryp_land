# Global Contact Support - Deployment Guide

## Изменения
- Переход от per-user к global системе Contact Support
- Админ настраивает параметры один раз для всех пользователей
- Автоматический показ новым пользователям
- Возможность показать активным пользователям или отключить глобально

## Команды для деплоя на сервере

1. Обновить код:
```bash
cd /path/to/telegram-bot
git pull
```

2. Применить изменения схемы БД:
```bash
npx prisma db push
```

3. Запустить миграцию (опционально):
```bash
node migrate-contact-support.cjs
```

4. Перезапустить бота:
```bash
pm2 restart telegram-bot
```

## Использование в боте

1. Админ заходит в админ панель `/admin`
2. Нажимает "📞 Global Contact Support"
3. Настраивает:
   - Bonus Amount (например, 50)
   - Timer в минутах (например, 4320 = 3 дня)
4. Действия:
   - **"Show to Active Users"** - показать модалку всем пользователям при следующем запуске
   - **"Disable Globally"** - отключить показ модалки

## API Endpoints (созданы)

- `GET /api/settings/contact-support` - получить глобальные настройки
- `POST /api/admin/settings/contact-support` - обновить настройки
- `POST /api/admin/contact-support/show-to-active` - показать всем
- `POST /api/admin/contact-support/disable` - отключить
- `POST /api/users/:telegramId/contact-support-seen` - пометить как просмотренное

## Изменения в БД

### User model:
- Удалено: `contactSupportActive`, `contactSupportBonusAmount`, `contactSupportTimerMinutes`, `contactSupportActivatedAt`
- Добавлено: `contactSupportSeen` (Boolean)

### Новая модель GlobalSettings:
- `contactSupportEnabled` (Boolean)
- `contactSupportBonusAmount` (Float)
- `contactSupportTimerMinutes` (Int)
- `contactSupportActivatedAt` (DateTime)
