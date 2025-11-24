# Syntrix Platform - Production Deployment Guide

## 🚀 Быстрый старт

### Вариант 1: Нативная установка (рекомендуется)

#### Для Linux/macOS:
```bash
chmod +x deploy.sh
./deploy.sh
```

#### Для Windows:
```bash
deploy.bat
```

Эта команда:
1. ✅ Проверит установку Node.js и npm
2. 📥 Установит все зависимости
3. 🔨 Соберёт все проекты
4. 🚀 Запустит все сервисы

### Вариант 2: Docker (простой деплой)

```bash
# Скопируйте .env
cp .env.example telegram-bot/.env

# Отредактируйте переменные окружения
nano telegram-bot/.env

# Запустите через Docker Compose
docker-compose up -d
```

### Вариант 3: PM2 (production-ready)

```bash
# Установите PM2 глобально
npm install -g pm2

# Сборка проекта
./deploy.sh

# Запуск через PM2
chmod +x start-pm2.sh
./start-pm2.sh
```

## 📦 Что включено

Платформа состоит из 4 компонентов:

1. **Telegram Bot** (порт 3001)
   - Backend API
   - Webhook для бота
   - База данных SQLite
   - Prisma ORM

2. **CRM Admin Panel** (порт 3002)
   - Панель администратора
   - Управление пользователями
   - Управление ролями
   - Статистика и аналитика

3. **Landing Page** (порт 3003)
   - Главный сайт syntrix.cc
   - Тарифные планы
   - Калькулятор прибыли
   - FAQ

4. **Telegram Mini App** (порт 3004)
   - Web-приложение внутри Telegram
   - Интерфейс для пользователей

## 🔧 Настройка переменных окружения

### Telegram Bot (.env)

Файл: `telegram-bot/.env`

```env
# Telegram Bot
BOT_TOKEN=your_bot_token
ADMIN_IDS=503856039,1450570156
DATABASE_URL="file:./dev.db"

# URLs
WEBAPP_URL=https://telegram-app.syntrix.cc
WEBHOOK_URL=https://api.syntrix.cc
LANDING_URL=https://syntrix.cc

# API
API_PORT=3001

# Payment Gateway
OXAPAY_API_KEY=your_api_key
OXAPAY_PAYOUT_API_KEY=your_payout_key

# Trading Cards
CARDS_MIN_PER_DAY=4
CARDS_MAX_PER_DAY=16
CARDS_START_TIME=07:49
CARDS_END_TIME=22:30

# CRM
CRM_ADMIN_USERNAME=admin
CRM_ADMIN_PASSWORD=your_secure_password
CRM_JWT_SECRET=your_jwt_secret_key
```

## 🌐 Настройка Nginx (рекомендуется)

Создайте конфигурацию Nginx для проксирования:

```nginx
# API Bot
server {
    listen 80;
    server_name api.syntrix.cc;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# CRM
server {
    listen 80;
    server_name admin.syntrix.cc;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Landing
server {
    listen 80;
    server_name syntrix.cc www.syntrix.cc;

    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Telegram App
server {
    listen 80;
    server_name app.syntrix.cc;

    location / {
        proxy_pass http://localhost:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔒 SSL сертификаты (Let's Encrypt)

```bash
# Установка certbot
sudo apt install certbot python3-certbot-nginx

# Получение сертификатов
sudo certbot --nginx -d syntrix.cc -d www.syntrix.cc
sudo certbot --nginx -d api.syntrix.cc
sudo certbot --nginx -d admin.syntrix.cc
sudo certbot --nginx -d app.syntrix.cc
```

## 🔄 Systemd Service (автозапуск)

Создайте файл `/etc/systemd/system/syntrix.service`:

```ini
[Unit]
Description=Syntrix Platform
After=network.target

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/cryp_land
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=syntrix

Environment=NODE_ENV=production
Environment=PATH=/usr/bin:/usr/local/bin

[Install]
WantedBy=multi-user.target
```

Активация:
```bash
sudo systemctl daemon-reload
sudo systemctl enable syntrix
sudo systemctl start syntrix
sudo systemctl status syntrix
```

## 📊 Мониторинг логов

```bash
# Все логи
sudo journalctl -u syntrix -f

# Только ошибки
sudo journalctl -u syntrix -p err -f

# За последний час
sudo journalctl -u syntrix --since "1 hour ago"
```

## 🔄 Обновление проекта

```bash
# Остановить сервисы
sudo systemctl stop syntrix

# Обновить код
git pull

# Пересобрать и запустить
./deploy.sh

# Или через systemd
sudo systemctl start syntrix
```

## ⚙️ Ручной запуск отдельных компонентов

```bash
# Только бот
cd telegram-bot && npm start

# Только CRM
cd crm && npm run preview -- --port 3002 --host 0.0.0.0

# Только Landing
cd landing && npm run preview -- --port 3003 --host 0.0.0.0

# Только Telegram App
cd telegram-app && npm run preview -- --port 3004 --host 0.0.0.0
```

## 🛠️ Разработка

```bash
# Запуск в режиме разработки
npm run dev
```

Это запустит все проекты с hot-reload.

## 📝 Структура проекта

```
cryp_land/
├── package.json          # Главный package.json с командами
├── deploy.sh            # Скрипт деплоя для Linux/macOS
├── deploy.bat           # Скрипт деплоя для Windows
├── telegram-bot/        # Backend + Bot
│   ├── src/
│   ├── prisma/
│   └── dist/           # Собранные файлы
├── crm/                # Admin Panel
│   ├── src/
│   └── dist/          # Собранные файлы
├── landing/           # Main Website
│   ├── src/
│   └── dist/         # Собранные файлы
└── telegram-app/     # Telegram Mini App
    ├── src/
    └── dist/        # Собранные файлы
```

## 🐛 Решение проблем

### База данных не создаётся
```bash
cd telegram-bot
npx prisma db push
npx prisma generate
```

### Порты заняты
Измените порты в `package.json` в секции `scripts`:
```json
"start:crm": "cd crm && npm run preview -- --port 3002"
```

### Недостаточно памяти
Увеличьте лимит Node.js:
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
```

## 📞 Поддержка

При возникновении проблем проверьте:
1. Версию Node.js (должна быть 18+)
2. Наличие всех .env файлов
3. Доступность портов
4. Логи systemd (если используется)

## 🐳 Docker Deployment

### Преимущества Docker:
- ✅ Изолированное окружение
- ✅ Легкий перенос между серверами
- ✅ Автоматический перезапуск при сбое

### Команды Docker:

```bash
# Сборка и запуск
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down

# Перезапуск после изменений
docker-compose restart

# Полная пересборка
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Docker + Nginx

Используйте Docker только для приложения, Nginx ставьте на хост:

```yaml
# docker-compose.yml - используйте внутренние порты
ports:
  - "127.0.0.1:3001:3001"  # Доступ только с localhost
  - "127.0.0.1:3002:3002"
  - "127.0.0.1:3003:3003"
  - "127.0.0.1:3004:3004"
```

Затем настройте Nginx как описано выше.

## 🔄 PM2 Process Manager

PM2 - альтернатива systemd с дополнительными возможностями:

### Установка:
```bash
npm install -g pm2
```

### Использование:
```bash
# Запуск всех сервисов
./start-pm2.sh

# Просмотр статуса
pm2 list

# Логи в реальном времени
pm2 logs

# Логи конкретного сервиса
pm2 logs syntrix-bot

# Мониторинг ресурсов
pm2 monit

# Перезапуск
pm2 restart all

# Остановка
pm2 stop all

# Удаление из PM2
pm2 delete all
```

### Автозапуск PM2:
```bash
# Создать startup скрипт
pm2 startup

# Сохранить текущую конфигурацию
pm2 save
```

## 📊 Сравнение методов запуска

| Метод | Простота | Production | Мониторинг | Автозапуск |
|-------|----------|------------|------------|------------|
| npm start | ⭐⭐⭐⭐⭐ | ⭐ | ⭐ | ❌ |
| systemd | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ |
| PM2 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ |
| Docker | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ |

**Рекомендация для production**: PM2 или systemd

## ✅ Checklist перед деплоем

- [ ] Node.js 18+ установлен
- [ ] Все .env файлы настроены
- [ ] DNS записи настроены для всех доменов
- [ ] Nginx установлен и настроен
- [ ] SSL сертификаты получены
- [ ] Firewall настроен (открыты нужные порты)
- [ ] База данных SQLite создана
- [ ] Telegram Bot токен валиден
- [ ] Oxapay API ключи актуальны
- [ ] Выбран метод запуска (systemd/PM2/Docker)
