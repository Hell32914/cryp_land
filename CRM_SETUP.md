# CRM Подключение к реальным данным

## ✅ Завершено

CRM теперь подключена к реальным данным из бота и мини-приложения. Mock данные удалены.

---

## 🔧 Конфигурация

### Файлы конфигурации

#### 1. **telegram-bot/.env**
```env
# CRM Admin Portal (обязательно)
CRM_ADMIN_USERNAME=admin
CRM_ADMIN_PASSWORD=your-secure-password-here
CRM_JWT_SECRET=your-random-jwt-secret-key-here
```

#### 2. **crm/.env**
```env
# API Configuration
# Backend API URL (telegram bot API endpoint)
VITE_API_URL=http://localhost:3001
```

---

## 🚀 Запуск

### Режим разработки

1. **Запустить бот с API:**
   ```bash
   cd telegram-bot
   npm start
   ```
   API будет доступен на: `http://localhost:3001`

2. **Запустить CRM:**
   ```bash
   cd crm
   npm run dev
   ```
   CRM будет доступна на: `http://localhost:5173`

3. **Войти в CRM:**
   - URL: `http://localhost:5173`
   - Username: `admin`
   - Password: (тот, что указан в `telegram-bot/.env`)

### Production режим

#### Вариант 1: Деплой на Railway/Render

1. Бот уже развернут на Render: `https://syntrix-bot.onrender.com`
2. CRM развернуть на Vercel/Netlify
3. В CRM настроить `.env`:
   ```env
   VITE_API_URL=https://syntrix-bot.onrender.com
   ```

#### Вариант 2: Локальный production build

```bash
# Build CRM
cd crm
npm run build
npm run preview  # Preview на порту 4173
```

---

## 📊 Доступные данные в CRM

### 1. **Dashboard (Overview)**
- **KPIs:**
  - Общее количество пользователей
  - Общий баланс
  - Депозиты сегодня
  - Выводы сегодня
  - Профит за период

- **Графики:**
  - Финансовые данные за 7 дней (депозиты, выводы, профит)
  - Географическое распределение пользователей

### 2. **Users (Пользователи)**
- Список всех пользователей
- Поиск по Telegram ID, username, имени
- Информация:
  - Баланс
  - Профит
  - Общая сумма депозитов
  - Общая сумма выводов
  - Тарифный план
  - Статус (ACTIVE/INACTIVE)
  - Страна
  - KYC статус

### 3. **Deposits (Депозиты)**
- Список всех депозитов
- Фильтрация по статусу
- Информация:
  - Сумма
  - Валюта (USDT, BTC, etc.)
  - Сеть (TRC20, ERC20, etc.)
  - Track ID / TX Hash
  - Пользователь
  - Статус (PENDING, COMPLETED, FAILED)
  - Дата создания

### 4. **Withdrawals (Выводы)**
- Список всех выводов
- Фильтрация по статусу
- Информация:
  - Сумма
  - Валюта
  - Сеть
  - Адрес получателя
  - Track ID / TX Hash
  - Пользователь
  - Статус (PENDING, PROCESSING, COMPLETED, FAILED)
  - Дата создания

### 5. **Expenses (Расходы)**
- Список всех расходов
- Добавление новых расходов
- Информация:
  - Категория
  - Комментарий
  - Сумма
  - Дата
- Общая сумма расходов

### 6. **Referrals (Рефералы)**
- Список всех реферальных связей
- Информация:
  - Реферер (кто пригласил)
  - Приглашенный пользователь
  - Уровень реферала (1, 2, 3)
  - Заработок с реферала
  - Дата регистрации

---

## 🔐 Безопасность

### Важные рекомендации:

1. **Изменить пароли в production:**
   ```env
   CRM_ADMIN_PASSWORD=сильный-уникальный-пароль
   CRM_JWT_SECRET=случайная-строка-минимум-32-символа
   ```

2. **Генерация безопасного JWT Secret:**
   ```bash
   # Linux/Mac
   openssl rand -hex 32
   
   # Windows PowerShell
   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
   ```

3. **HTTPS обязателен в production:**
   - Используйте SSL сертификат для CRM
   - Используйте HTTPS для API бота

4. **CORS настройки:**
   В `telegram-bot/src/api.ts` уже настроен CORS для всех источников.
   В production рекомендуется ограничить:
   ```typescript
   app.use(cors({
     origin: ['https://your-crm-domain.com']
   }))
   ```

---

## 🧪 Тестирование

### Проверка подключения

1. **API здоровье:**
   ```bash
   curl http://localhost:3001/api/admin/login \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"your-password"}'
   ```

2. **Получить токен и проверить данные:**
   ```bash
   # 1. Login
   TOKEN=$(curl -s http://localhost:3001/api/admin/login \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"your-password"}' | jq -r .token)
   
   # 2. Get overview
   curl http://localhost:3001/api/admin/overview \
     -H "Authorization: Bearer $TOKEN"
   ```

---

## 📝 API Endpoints

Все endpoints требуют авторизацию через Bearer token (кроме login).

### Auth
- `POST /api/admin/login` - Вход в систему

### Data Endpoints
- `GET /api/admin/overview` - Dashboard данные
- `GET /api/admin/users?search=query&limit=100` - Пользователи
- `GET /api/admin/deposits?status=COMPLETED&limit=100` - Депозиты
- `GET /api/admin/withdrawals?status=PENDING&limit=100` - Выводы
- `GET /api/admin/expenses` - Расходы
- `POST /api/admin/expenses` - Добавить расход
- `GET /api/admin/referrals` - Рефералы

---

## 🐛 Troubleshooting

### CRM не может подключиться к API

1. **Проверить, что бот запущен:**
   ```bash
   curl http://localhost:3001/api/admin/login
   # Должен вернуть ошибку 400, а не "connection refused"
   ```

2. **Проверить .env в CRM:**
   ```env
   VITE_API_URL=http://localhost:3001
   # Без слэша в конце!
   ```

3. **Проверить CORS:**
   Откройте DevTools в браузере (F12) → Console
   Если видите ошибку CORS, проверьте настройки в `telegram-bot/src/api.ts`

### Ошибка 401 Unauthorized

1. Проверить credentials в `telegram-bot/.env`:
   ```env
   CRM_ADMIN_USERNAME=admin
   CRM_ADMIN_PASSWORD=your-password
   CRM_JWT_SECRET=your-secret
   ```

2. Перезапустить бот после изменения .env

### Ошибка 503 Service Unavailable

API endpoints отключены, если не настроены CRM credentials.
Добавьте в `telegram-bot/.env`:
```env
CRM_ADMIN_USERNAME=admin
CRM_ADMIN_PASSWORD=password
CRM_JWT_SECRET=secret
```

---

## 📦 Production Deployment

### Railway (бот уже там)

Бот развернут на: `https://syntrix-bot.onrender.com`

### Vercel (для CRM)

1. **Подключить репозиторий к Vercel**

2. **Настроить Build Settings:**
   - Framework Preset: `Vite`
   - Root Directory: `crm`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Environment Variables:**
   ```
   VITE_API_URL=https://syntrix-bot.onrender.com
   ```

4. **Deploy!**

### Netlify (альтернатива для CRM)

1. **Build settings:**
   - Base directory: `crm`
   - Build command: `npm run build`
   - Publish directory: `crm/dist`

2. **Environment variables:**
   ```
   VITE_API_URL=https://syntrix-bot.onrender.com
   ```

---

## ✅ Checklist для production

- [ ] Изменить `CRM_ADMIN_PASSWORD` на сильный пароль
- [ ] Сгенерировать новый `CRM_JWT_SECRET` (минимум 32 символа)
- [ ] Настроить HTTPS для CRM
- [ ] Обновить `VITE_API_URL` на production URL бота
- [ ] Настроить CORS в боте на конкретный домен CRM
- [ ] Проверить все endpoints через curl/Postman
- [ ] Протестировать login в CRM
- [ ] Проверить загрузку всех страниц CRM

---

**Последнее обновление**: 2025-11-22
