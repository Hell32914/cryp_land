# Cryp Land Project

Полноценная криптовалютная платформа Syntrix для автоматического трейдинга.

## 📁 Структура проекта

```
cryp_land/
├── landing/              # Лендинг проекта (Vite + React + TypeScript)
├── telegram-app/         # Telegram Mini App - Syntrix Bot
│   ├── 5 основных экранов (Home, Wallet, Invite, Calculator, Profile)
│   ├── Мультиязычность (EN, ES, DE)
│   ├── Анимированный фон
│   └── Полный функционал бота
└── [Часть 3]/           # Готовится к разработке
```

## 🚀 Быстрый старт

### Landing
```bash
cd landing
npm install
npm run dev
```
Откроется на **http://localhost:5000**

### Telegram Mini App (Syntrix Bot)
```bash
cd telegram-app
npm install
npm run dev
```
Откроется на **http://localhost:5173**

### Тестирование в Telegram

1. Установите ngrok:
```bash
npm install -g ngrok
```

2. Запустите приложение и ngrok в разных терминалах:
```bash
# Терминал 1
cd telegram-app
npm run dev

# Терминал 2
ngrok http 5173
```

3. Используйте HTTPS URL от ngrok в @BotFather

## 🌐 Деплой на Vercel

### Landing
```bash
cd landing
vercel --prod
```

### Telegram Mini App
```bash
cd telegram-app
vercel --prod
```

## ✨ Возможности

### 🌐 Landing
- Современный адаптивный дизайн
- Информация о проекте и команде
- Калькулятор доходности
- Реферальная программа
- Планы инвестирования

### 📱 Telegram Mini App (Syntrix Bot)

#### Основной функционал
- **Home (Главная)**
  - Баланс и статус аккаунта
  - Прогресс до следующего плана
  - Ежедневные обновления
  - Депозит и реинвестирование

- **Wallet (Кошелек)**
  - Депозит в криптовалюте (USDT, USDC, BTC, ETH, SOL)
  - Вывод средств
  - История транзакций
  - Мгновенные переводы

- **Invite (Приглашения)**
  - Реферальная ссылка
  - 3-уровневая система (4% / 3% / 2%)
  - Список рефералов
  - Баланс рефералов

- **Calculator (Калькулятор)**
  - Расчет прибыли
  - Режим реинвестирования
  - Выбор периода (7/30/90/365 дней)
  - Быстрый выбор суммы

- **Profile (Профиль)**
  - Данные пользователя
  - Смена языка (EN/ES/DE)
  - FAQ, Whitepaper, Security
  - Advantages и поддержка

#### Планы доходности
| План     | Депозит          | Дневной доход |
|----------|------------------|---------------|
| Bronze   | $10-$99          | 0.5%          |
| Silver   | $100-$499        | 1%            |
| Gold     | $500-$999        | 2%            |
| Platinum | $1000-$4999      | 3%            |
| Diamond  | $5000-$19999     | 5%            |
| Black    | $20000+          | 7%            |

## 🛠️ Технологии

### Frontend
- **React 19** - последняя версия
- **TypeScript** - типобезопасность
- **Vite** - быстрая сборка
- **Tailwind CSS v4** - современные стили

### UI Компоненты
- **Radix UI** - доступные примитивы
- **Phosphor Icons** - красивые иконки
- **Sonner** - уведомления
- **Framer Motion** - анимации

### Telegram
- **Telegram WebApp API** - нативная интеграция
- **GitHub Spark** - key-value хранилище

### Deploy
- **Vercel** - автоматический деплой

## 📝 Документация

- [Landing README](./landing/README.md)
- [Telegram App README](./telegram-app/README.md)

## 🔒 Безопасность

- Шифрование AES-256, RSA-4096
- Резервный пул ликвидности (25% прибыли)
- Максимальный риск 1% на сделку
- DDoS защита
- 2FA для аккаунтов

## 🌍 Языки

- 🇬🇧 English
- 🇪🇸 Español
- 🇩🇪 Deutsch

## 📄 Лицензия

MIT License
