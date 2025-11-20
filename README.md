# Syntrix Trading Bot

Автоматизированная торговая платформа с Telegram ботом, мини-приложением и лендингом.

## 📁 Структура проекта

Проект разделен на 3 независимых модуля для удобного деплоя:

### 🤖 telegram-bot/
**Backend сервис** - Telegram бот + Express API + База данных

- Grammy bot с webhook
- Prisma ORM + SQLite
- OxaPay интеграция для платежей
- Генератор торговых карточек
- Система рефералов и начислений

**Деплой:** Railway.app (root directory: `telegram-bot`)

### 📱 telegram-app/
**Telegram Mini App** - React интерфейс внутри бота

- React 19 + TypeScript + Vite + Tailwind CSS
- Интеграция с Telegram WebApp API
- Личный кабинет, депозиты, выводы
- 5 основных экранов (Home, Wallet, Invite, Calculator, Profile)

**Деплой:** Railway.app (root directory: `telegram-app`)

### 🌐 landing/
**Landing Page** - Публичный сайт проекта

- React 19 + TypeScript + Vite + Tailwind CSS
- Многоязычность (RU/EN/CN)
- Калькулятор доходности, FAQ, тарифы
- Адаптивный дизайн

**Деплой:** Railway.app (root directory: `landing`)

## 🚀 Быстрый старт

### Локальная разработка

#### Bot Backend:
```bash
cd telegram-bot
npm install
npx prisma generate
npm run dev
```

#### Telegram Mini App:
```bash
cd telegram-app
npm install
npm run dev  # http://localhost:5173
```

#### Landing:
```bash
cd landing
npm install
npm run dev  # http://localhost:5000
```

## 🌐 Деплой на Railway

### 1. Bot Backend:
1. New Project → Deploy from GitHub
2. Root Directory: `telegram-bot`
3. Build Command: `npm install && npx prisma generate && npm run build`
4. Start Command: `node dist/index.js`
5. Environment Variables:
   ```
   BOT_TOKEN=
   ADMIN_ID=
   WEBAPP_URL=
   WEBHOOK_URL=
   DATABASE_URL=file:./dev.db
   OXAPAY_API_KEY=
   OXAPAY_PAYOUT_API_KEY=
   CHANNEL_ID=
   ```

### 2. Telegram Mini App:
1. New Project → Deploy from GitHub  
2. Root Directory: `telegram-app`
3. Environment: `VITE_API_URL=https://your-bot-backend.railway.app`

### 3. Landing:
1. New Project → Deploy from GitHub
2. Root Directory: `landing`

## ✨ Возможности

### 📱 Telegram Mini App

#### Основной функционал
- **Home** - Баланс, прогресс, ежедневные обновления
- **Wallet** - Депозиты, выводы, история транзакций
- **Invite** - Реферальная программа (4%/3%/2%)
- **Calculator** - Расчет прибыли с реинвестированием
- **Profile** - Настройки, FAQ, поддержка

#### Планы доходности
| План     | Депозит          | Дневной доход |
|----------|------------------|---------------|
| Bronze   | $10-$99          | 0.5%          |
| Silver   | $100-$499        | 1%            |
| Gold     | $500-$999        | 2%            |
| Platinum | $1000-$4999      | 3%            |
| Diamond  | $5000-$19999     | 5%            |
| Black    | $20000+          | 7%            |

### 🤖 Bot Features

- Автоматическая генерация торговых карточек (4-16/день)
- Ежедневное начисление прибыли
- Реферальная система с 3 уровнями
- OxaPay интеграция (депозиты/выводы)
- Мультиадминистративная панель
- Webhook уведомления

### 👥 Admin панель

Доступна через `/admin` в боте:
- 📊 Статистика пользователей
- 💰 Управление депозитами/выводами >$100
- 👥 Добавление администраторов
- 📸 Настройка торговых карточек
- 📢 Рассылки уведомлений

## 🛠️ Технологии

### Backend
- Node.js 22, Grammy ^1.30.0
- Express ^4.21.1, Prisma ^5.22.0
- Canvas ^2.11.2, Node-cron ^3.0.3
- Axios ^1.7.9

### Frontend
- React 19, TypeScript
- Vite ^6.3.5, Tailwind CSS ^4.1.11
- Radix UI, Phosphor Icons
- Framer Motion, Sonner

## 📝 Документация

- [PAYMENT_SYSTEM.md](./PAYMENT_SYSTEM.md) - Система платежей OxaPay
- [REFERRAL_SYSTEM.md](./REFERRAL_SYSTEM.md) - Реферальная программа
- [Landing README](./landing/README.md)
- [Telegram App README](./telegram-app/README.md)

## 🔒 Безопасность

- API ключи только в environment variables
- CORS защита
- Webhook верификация Telegram
- Раздельные ключи для депозитов и выводов
- Валидация всех входных данных

## 🌍 Языки

- 🇷🇺 Русский
- 🇬🇧 English
- 🇨🇳 中文
- 🇪🇸 Español
- 🇩🇪 Deutsch

## 📄 Лицензия

Proprietary - все права защищены.
