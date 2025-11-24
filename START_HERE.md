# 🎯 SYNTRIX PLATFORM - ГОТОВ К ДЕПЛОЮ

## ✅ Что сделано

Весь проект полностью подготовлен для деплоя на любом сервере **одной командой**.

### 📦 Структура проекта

```
cryp_land/
├── 📱 telegram-bot/       - Backend + Telegram Bot
├── 👨‍💼 crm/                - Admin панель
├── 🌐 landing/            - Главный сайт syntrix.cc
├── 📲 telegram-app/       - Telegram Mini App
│
├── 🚀 deploy.sh           - Главный скрипт деплоя (Linux/macOS)
├── 🚀 deploy.bat          - Главный скрипт деплоя (Windows)
├── ⚡ start-pm2.sh        - Запуск через PM2
├── 🔧 server-setup.sh     - Настройка сервера
│
├── 📄 package.json        - Главный package.json с командами
├── 🐳 Dockerfile          - Для Docker деплоя
├── 🐳 docker-compose.yml  - Docker Compose конфиг
├── 🔄 ecosystem.config.json - PM2 конфигурация
├── 🌐 nginx.conf          - Nginx конфигурация
├── 🔧 syntrix.service     - Systemd service файл
│
└── 📚 Документация:
    ├── QUICKSTART.md      - 🚀 Быстрый старт (НАЧНИ ЗДЕСЬ!)
    ├── DEPLOYMENT.md      - 📖 Полная документация
    ├── COMMANDS.md        - ⌨️ Все команды
    ├── CHECKLIST.md       - ✅ Чеклист деплоя
    └── README.md          - 📘 Обзор проекта
```

## 🎯 ГЛАВНОЕ: КАК ЗАПУСТИТЬ

### На сервере (Linux):

```bash
# 1. Клонируй репозиторий
git clone https://github.com/Hell32914/cryp_land.git
cd cryp_land

# 2. Настрой .env
cp .env.example telegram-bot/.env
nano telegram-bot/.env

# 3. ЗАПУСТИ ОДНОЙ КОМАНДОЙ
chmod +x deploy.sh
./deploy.sh
```

**ВСЁ! 🎉 Все сервисы запущены!**

### На Windows (для разработки):

```bash
# 1. Клонируй репозиторий
git clone https://github.com/Hell32914/cryp_land.git
cd cryp_land

# 2. Настрой .env
copy .env.example telegram-bot\.env
notepad telegram-bot\.env

# 3. ЗАПУСТИ ОДНОЙ КОМАНДОЙ
deploy.bat
```

## 🚀 Варианты запуска

### 1️⃣ Простой (для теста/разработки)
```bash
./deploy.sh
```
- ✅ Быстро
- ✅ Просто
- ❌ Не автозапуск
- ❌ Нет мониторинга

### 2️⃣ PM2 (рекомендуется для production)
```bash
npm install -g pm2
./deploy.sh
./start-pm2.sh
```
- ✅ Автозапуск
- ✅ Мониторинг
- ✅ Логи
- ✅ Auto-restart

### 3️⃣ Systemd (стандартный Linux способ)
```bash
./deploy.sh
sudo cp syntrix.service /etc/systemd/system/
sudo systemctl enable syntrix
sudo systemctl start syntrix
```
- ✅ Автозапуск
- ✅ Интеграция с системой
- ✅ Journalctl логи

### 4️⃣ Docker (изоляция)
```bash
docker-compose up -d
```
- ✅ Изоляция
- ✅ Простой перенос
- ✅ Не нужен Node.js на хосте

## 🌐 Сервисы и порты

После запуска доступны:

| Сервис | Порт | URL | Описание |
|--------|------|-----|----------|
| **Bot API** | 3001 | http://localhost:3001 | Backend + Webhook |
| **CRM** | 3002 | http://localhost:3002 | Админ панель |
| **Landing** | 3003 | http://localhost:3003 | Главный сайт |
| **Telegram App** | 3004 | http://localhost:3004 | Mini App |

## 🌍 Домены (после настройки Nginx)

| Сервис | Production URL |
|--------|----------------|
| **Landing** | https://syntrix.cc |
| **CRM** | https://admin.syntrix.cc |
| **Bot API** | https://api.syntrix.cc |
| **Telegram App** | https://app.syntrix.cc |

## 📋 Что нужно настроить

### Обязательно (в telegram-bot/.env):

1. **BOT_TOKEN** - от @BotFather
2. **ADMIN_IDS** - твой Telegram ID
3. **OXAPAY_API_KEY** - от OxaPay
4. **OXAPAY_PAYOUT_API_KEY** - от OxaPay
5. **CRM_ADMIN_PASSWORD** - смени дефолтный!
6. **CRM_JWT_SECRET** - случайная строка

### Для production (в telegram-bot/.env):

7. **WEBHOOK_URL** = https://api.syntrix.cc
8. **WEBAPP_URL** = https://app.syntrix.cc
9. **LANDING_URL** = https://syntrix.cc

### На сервере:

10. DNS записи для всех доменов
11. Nginx конфигурация
12. SSL сертификаты (Let's Encrypt)
13. Firewall (порты 80, 443)

## 📚 Документация по порядку

### Для быстрого старта:
1. 📖 **QUICKSTART.md** - пошаговая инструкция

### Для production деплоя:
1. 📖 **QUICKSTART.md** - быстрый старт
2. ✅ **CHECKLIST.md** - чеклист (не пропусти ничего)
3. 📖 **DEPLOYMENT.md** - подробная документация
4. ⌨️ **COMMANDS.md** - шпаргалка по командам

## 🎓 Примеры команд

### Запуск
```bash
./deploy.sh              # Первый запуск
./start-pm2.sh          # Запуск через PM2
docker-compose up -d    # Запуск через Docker
```

### Мониторинг
```bash
pm2 list                # Список сервисов (PM2)
pm2 logs                # Логи (PM2)
pm2 monit               # Мониторинг ресурсов (PM2)

sudo systemctl status syntrix       # Статус (systemd)
sudo journalctl -u syntrix -f       # Логи (systemd)

docker-compose logs -f  # Логи (Docker)
```

### Обновление
```bash
git pull                # Получить изменения
./deploy.sh            # Пересобрать и перезапустить
pm2 restart all        # Или перезапустить через PM2
```

## 🔥 Самые важные файлы

### Для первого запуска:
- ✅ `telegram-bot/.env` - **ОБЯЗАТЕЛЬНО** настрой это
- ✅ `deploy.sh` или `deploy.bat` - запускай этот

### Для production:
- ✅ `nginx.conf` - скопируй в /etc/nginx/sites-available/
- ✅ `syntrix.service` - скопируй в /etc/systemd/system/
- ✅ `ecosystem.config.json` - конфиг для PM2

## 🎯 Типичный сценарий деплоя

```bash
# 1. На сервере
ssh root@your-server-ip
cd /root

# 2. Клонировать
git clone https://github.com/Hell32914/cryp_land.git
cd cryp_land

# 3. Настроить переменные
cp .env.example telegram-bot/.env
nano telegram-bot/.env
# Заполни BOT_TOKEN, ADMIN_IDS, API ключи, пароли

# 4. Запустить
chmod +x deploy.sh
./deploy.sh

# 5. Настроить Nginx (для доменов)
sudo apt install nginx
sudo cp nginx.conf /etc/nginx/sites-available/syntrix
sudo ln -s /etc/nginx/sites-available/syntrix /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# 6. SSL сертификаты
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d syntrix.cc -d www.syntrix.cc
sudo certbot --nginx -d api.syntrix.cc
sudo certbot --nginx -d admin.syntrix.cc
sudo certbot --nginx -d app.syntrix.cc

# 7. Настроить PM2 для автозапуска
npm install -g pm2
chmod +x start-pm2.sh
./start-pm2.sh
pm2 startup
pm2 save

# 8. Firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 9. Настроить Telegram webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://api.syntrix.cc/webhook/<TOKEN>"

# 10. Готово! 🎉
```

## ✅ Проверка что всё работает

```bash
# Сервисы запущены?
pm2 list

# Порты слушают?
netstat -tulpn | grep -E '3001|3002|3003|3004'

# Сервисы отвечают?
curl http://localhost:3001/api/health
curl http://localhost:3002
curl http://localhost:3003
curl http://localhost:3004

# Домены работают?
curl https://syntrix.cc
curl https://api.syntrix.cc/api/health
curl https://admin.syntrix.cc
curl https://app.syntrix.cc

# Webhook настроен?
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

## 🆘 Если что-то не работает

### Смотри логи:
```bash
pm2 logs                        # PM2
sudo journalctl -u syntrix -f   # Systemd
docker-compose logs -f          # Docker
```

### Проверь .env:
```bash
cat telegram-bot/.env
# Убедись что все переменные заполнены
```

### Проверь порты:
```bash
netstat -tulpn | grep -E '3001|3002|3003|3004'
```

### Перезапусти:
```bash
pm2 restart all                 # PM2
sudo systemctl restart syntrix  # Systemd
docker-compose restart          # Docker
```

## 🎉 Готово!

Теперь у тебя есть:
- ✅ Полностью настроенный проект
- ✅ Деплой одной командой
- ✅ 4 варианта запуска (npm/PM2/systemd/Docker)
- ✅ Полная документация
- ✅ Nginx конфигурация
- ✅ Systemd service
- ✅ Docker конфигурация
- ✅ Чеклист для деплоя

## 📖 Что читать дальше

1. Если первый раз деплоишь → **QUICKSTART.md**
2. Если нужен production → **CHECKLIST.md**
3. Если нужны подробности → **DEPLOYMENT.md**
4. Если забыл команду → **COMMANDS.md**

## 💡 Полезные ссылки

- Repository: https://github.com/Hell32914/cryp_land
- Telegram Bot API: https://core.telegram.org/bots/api
- OxaPay: https://oxapay.com/
- PM2 Docs: https://pm2.keymetrics.io/
- Nginx Docs: https://nginx.org/en/docs/

---

**Всё готово к деплою! Просто следуй QUICKSTART.md 🚀**
