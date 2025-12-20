# PayPal Integration Setup Guide

## Проблема

При попытке пополнения через PayPal возникает ошибка **422 (Unprocessable Entity)**, и PayPal показывает сообщение: "Не удается обработать ваш платеж с помощью счета PayPal в данный момент."

## Основные причины ошибок

### 1. **Не настроены PayPal Credentials** ❌
В файле `.env` отсутствуют обязательные параметры:
```env
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
```

### 2. **Неверная структура API запроса** ✅ (Исправлено)
Был удален неподдерживаемый параметр `payment_method` из `application_context`.

## Решение

### Шаг 1: Получить PayPal API Credentials

#### Для тестирования (Sandbox):
1. Перейдите на [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Войдите в свой аккаунт PayPal
3. Перейдите в **Apps & Credentials**
4. Выберите **Sandbox** в верхнем меню
5. Нажмите **Create App**
6. Укажите название приложения (например, "Syntrix Deposits")
7. Скопируйте **Client ID** и **Secret**

#### Для продакшена (Live):
1. Перейдите на [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Перейдите в **Apps & Credentials**
3. Выберите **Live** в верхнем меню
4. Нажмите **Create App**
5. Укажите название приложения
6. **ВАЖНО**: Ваш PayPal аккаунт должен быть Business Account с включенными возможностями приема платежей
7. Скопируйте **Client ID** и **Secret**

### Шаг 2: Обновить .env файл

Откройте файл `telegram-bot/.env` и заполните:

```env
# PayPal Configuration
PAYPAL_ENV=sandbox  # Измените на 'live' для продакшена
PAYPAL_CLIENT_ID=ваш_client_id_здесь
PAYPAL_CLIENT_SECRET=ваш_secret_здесь
PAYPAL_RETURN_URL=https://ваш-telegram-miniapp-url
PAYPAL_CANCEL_URL=https://ваш-telegram-miniapp-url
```

### Шаг 3: Перезапустить сервер

После изменения `.env`:

```bash
# Если используете PM2
pm2 restart syntrix

# Если используете npm
npm run dev

# Или через docker-compose
docker-compose restart
```

### Шаг 4: Настроить Webhook (опционально, для автоматических уведомлений)

1. В PayPal Developer Dashboard перейдите в ваше приложение
2. Найдите раздел **Webhooks**
3. Нажмите **Add Webhook**
4. Введите URL: `https://ваш-домен.com/api/paypal-webhook`
5. Выберите события:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `CHECKOUT.ORDER.APPROVED`
   - `CHECKOUT.ORDER.COMPLETED`

## Требования PayPal Business Account

⚠️ **Важно для продакшена**: 

Для приема платежей в реальном режиме (live) необходим **PayPal Business Account** с подтвержденным:
- Банковским счетом
- Документами компании (если требуется для вашей страны)
- Активированными возможностями приема платежей

## Проверка интеграции

После настройки credentials протестируйте:

1. Откройте Telegram бот
2. Выберите "Deposit" → "PayPal"
3. Введите сумму (например, $10)
4. Нажмите "Continue"
5. Вы должны быть перенаправлены на PayPal для оплаты

### Тестовые данные для Sandbox

PayPal предоставляет тестовые аккаунты в Sandbox:
- Логин: `buyer@personal.example.com`
- Пароль: доступен в разделе "Sandbox Accounts"

## Распространенные ошибки

### Ошибка 422 "Invalid request" или "Unable to process payment"

Если credentials установлены, но все равно ошибка 422, это обычно означает:

#### 1. **Проблемы с PayPal Business Account** (самая частая причина)
- ✅ Убедитесь, что используете **Business Account**, не Personal
- ✅ Аккаунт должен быть **полностью верифицирован**:
  - Подтвержден email
  - Привязан банковский счет или карта
  - Пройдена верификация документов (если требуется)
- ✅ В настройках аккаунта включено **"Payment receiving"**
- ✅ Нет ограничений на прием платежей

**Проверка:** Зайдите в PayPal → Settings → Account Settings → Business Information
- Статус должен быть "Verified" или "Active"

#### 2. **Неверные Return URLs**
- ✅ `PAYPAL_RETURN_URL` должен быть валидный HTTPS URL
- ✅ URL должен вести на ваш Telegram Mini App
- ❌ НЕ используйте `https://t.me` как return URL - это вызывает ошибки!

**Правильный пример:**
```env
PAYPAL_RETURN_URL=https://your-telegram-miniapp.vercel.app
PAYPAL_CANCEL_URL=https://your-telegram-miniapp.vercel.app
```

#### 3. **Sandbox vs Live путаница**
- ✅ Для sandbox используйте sandbox credentials
- ✅ Для live используйте live credentials
- ❌ НЕ смешивайте sandbox credentials с live режимом!

#### 4. **Лимиты аккаунта**
- Новые Business Accounts могут иметь лимиты на прием платежей
- Проверьте лимиты в PayPal Dashboard → Account → Limits

### Диагностика проблемы

Запустите диагностический скрипт на сервере:

```bash
cd telegram-bot
node test-paypal-integration.cjs
```

Этот скрипт проверит:
- ✅ Наличие и валидность credentials
- ✅ Возможность авторизации в PayPal API
- ✅ Создание тестового платежа
- ✅ Выведет детальные ошибки от PayPal

### Таймауты
- ✅ Проверьте подключение к интернету сервера
- ✅ Убедитесь, что PayPal API доступен (проверьте статус на status.paypal.com)

### Ошибка "credentials not configured"
- ✅ Убедитесь, что .env файл находится в папке `telegram-bot/`
- ✅ После изменения .env перезапустите сервер
- ✅ Проверьте, что переменные окружения загружаются (нет опечаток в именах)

## Структура платежа

Каждый платеж через PayPal создает:
1. Запись в таблице `deposits` со статусом `PENDING`
2. PayPal Order ID сохраняется в поле `txHash`
3. После подтверждения оплаты статус меняется на `COMPLETED`
4. Баланс пользователя автоматически пополняется

## Логирование

При ошибках проверьте логи сервера:

```bash
# PM2
pm2 logs syntrix

# Docker
docker-compose logs -f telegram-bot
```

В логах будут детали от PayPal API:
```
PayPal Error Details: {
  name: 'INVALID_REQUEST',
  message: 'Request is not well-formed...',
  debug_id: 'xxxxx',
  details: [...]
}
```

## Безопасность

- ⚠️ **НИКОГДА** не коммитьте файл `.env` с реальными credentials в Git
- ✅ Используйте переменные окружения в продакшене
- ✅ Регулярно меняйте `PAYPAL_CLIENT_SECRET`
- ✅ Ограничьте доступ к PayPal аккаунту только необходимым сотрудникам

## Поддержка

При проблемах с PayPal интеграцией:
1. Проверьте [PayPal API Status](https://www.paypal-status.com/)
2. Изучите [PayPal Orders API v2 документацию](https://developer.paypal.com/docs/api/orders/v2/)
3. Обратитесь в [PayPal Developer Support](https://developer.paypal.com/support/)
