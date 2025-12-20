# Быстрая диагностика PayPal (ошибка 422)

Если PayPal credentials установлены, но пользователи получают ошибку 422, выполните следующее:

## 1. Запустите диагностику на сервере

```bash
cd /path/to/telegram-bot
node test-paypal-integration.cjs
```

Скрипт покажет точную причину ошибки.

## 2. Проверьте логи сервера

```bash
# Если используете PM2
pm2 logs syntrix --lines 100

# Если используете Docker
docker-compose logs -f telegram-bot
```

Найдите строки с `PayPal createOrder Error` - там будут детали.

## 3. Самые частые причины ошибки 422

### ❌ Проблема: PayPal Business Account не верифицирован
**Решение:**
1. Зайдите в PayPal Business Account
2. Settings → Account Settings → Business Information
3. Убедитесь что статус "Verified"
4. Завершите все требуемые шаги верификации

### ❌ Проблема: Неверный PAYPAL_RETURN_URL
**Проверьте в .env:**
```bash
grep PAYPAL_RETURN_URL .env
```

**НЕ ДОЛЖНО быть:**
```env
PAYPAL_RETURN_URL=https://t.me
```

**ДОЛЖНО быть (ваш Telegram Mini App):**
```env
PAYPAL_RETURN_URL=https://your-app.vercel.app
PAYPAL_CANCEL_URL=https://your-app.vercel.app
```

### ❌ Проблема: Используются sandbox credentials в live режиме
**Проверьте:**
```bash
grep PAYPAL_ENV .env
```

Если `PAYPAL_ENV=live`, credentials должны быть от Live App в PayPal Dashboard.
Если `PAYPAL_ENV=sandbox`, credentials должны быть от Sandbox App.

### ❌ Проблема: На аккаунте есть лимиты
1. Зайдите в PayPal Dashboard
2. Account → View Limits
3. Если есть лимиты - снимите их или увеличьте

## 4. Проверка кода ошибки

Если в логах видите конкретную ошибку от PayPal:

| Код ошибки | Причина | Решение |
|------------|---------|---------|
| `INVALID_REQUEST` | Неверный формат запроса | Обновите код (уже исправлено) |
| `PERMISSION_DENIED` | Аккаунт не имеет прав | Проверьте Business Account setup |
| `INVALID_RESOURCE_ID` | Неверный resource | Убедитесь что используете правильный env |
| `PAYEE_ACCOUNT_RESTRICTED` | Аккаунт ограничен | Свяжитесь с PayPal Support |
| `PAYEE_ACCOUNT_LOCKED_OR_CLOSED` | Аккаунт заблокирован | Разблокируйте аккаунт в PayPal |

## 5. Тестирование после исправления

После внесения изменений:

1. Перезапустите сервер:
```bash
pm2 restart syntrix
# или
docker-compose restart telegram-bot
```

2. Снова запустите диагностику:
```bash
node test-paypal-integration.cjs
```

3. Если тест прошел успешно (✅), попробуйте создать депозит через бота

## 6. Если ничего не помогло

Соберите следующую информацию и отправьте разработчику:

```bash
# Проверьте environment (без раскрытия секретов)
echo "PAYPAL_ENV: $(grep PAYPAL_ENV .env | cut -d'=' -f2)"
echo "CLIENT_ID первые 10 символов: $(grep PAYPAL_CLIENT_ID .env | cut -d'=' -f2 | cut -c1-10)"
echo "RETURN_URL: $(grep PAYPAL_RETURN_URL .env | cut -d'=' -f2)"

# Последние логи PayPal ошибок
pm2 logs syntrix --lines 50 | grep -A 10 "PayPal"

# Результат диагностики
node test-paypal-integration.cjs 2>&1 | tee paypal-diagnostic.log
```

## Контакты поддержки PayPal

Если проблема на стороне PayPal аккаунта:
- Developer Support: https://developer.paypal.com/support/
- PayPal Status: https://www.paypal-status.com/
- Business Account Help: https://www.paypal.com/businesshelp/

---

**Важно:** Ошибка 422 почти всегда связана с настройками PayPal Business Account, а не с кодом.
