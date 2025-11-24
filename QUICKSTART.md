# 🚀 БЫСТРЫЙ СТАРТ НА СЕРВЕРЕ

## Что у тебя есть:
✅ Весь проект в одной папке
✅ Один скрипт для деплоя
✅ Автоматическая настройка окружения

## 📋 Шаг 1: Перенос проекта на сервер

```bash
# На локальной машине (если нужно)
git clone https://github.com/Hell32914/cryp_land.git
cd cryp_land

# Или на сервере напрямую:
cd /root
git clone https://github.com/Hell32914/cryp_land.git
cd cryp_land
```

## 🔧 Шаг 2: Настройка переменных окружения

```bash
# Скопируй шаблон
cp .env.example telegram-bot/.env

# Отредактируй файл (укажи свои данные)
nano telegram-bot/.env
```

**Что нужно изменить в .env:**
- `BOT_TOKEN` - токен от @BotFather
- `ADMIN_IDS` - твой Telegram ID
- `WEBHOOK_URL` - домен для бота API (https://api.syntrix.cc)
- `WEBAPP_URL` - домен для telegram app (https://app.syntrix.cc)
- `LANDING_URL` - главный домен (https://syntrix.cc)
- `OXAPAY_API_KEY` - ключ от OxaPay
- `OXAPAY_PAYOUT_API_KEY` - ключ выплат OxaPay
- `CRM_ADMIN_PASSWORD` - смени на надёжный пароль!
- `CRM_JWT_SECRET` - смени на случайную строку!

## ⚡ Шаг 3: ЗАПУСК ОДНОЙ КОМАНДОЙ!

### Вариант A: Простой запуск (для теста)

```bash
chmod +x deploy.sh
./deploy.sh
```

Всё! Сервисы запустятся на:
- Bot API: http://localhost:3001
- CRM: http://localhost:3002
- Landing: http://localhost:3003
- Telegram App: http://localhost:3004

### Вариант B: Production с PM2 (рекомендуется)

```bash
# 1. Установить PM2
npm install -g pm2

# 2. Запустить
chmod +x deploy.sh start-pm2.sh
./deploy.sh
./start-pm2.sh

# 3. Настроить автозапуск
pm2 startup
pm2 save
```

### Вариант C: Docker

```bash
docker-compose up -d
```

## 🌐 Шаг 4: Настройка Nginx (для доменов)

```bash
# Установить Nginx (если ещё не установлен)
sudo apt update
sudo apt install -y nginx

# Скопировать конфигурацию
sudo cp nginx.conf /etc/nginx/sites-available/syntrix
sudo ln -s /etc/nginx/sites-available/syntrix /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Проверить и перезагрузить
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 Шаг 5: SSL сертификаты

```bash
# Установить Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получить сертификаты для всех доменов
sudo certbot --nginx -d syntrix.cc -d www.syntrix.cc
sudo certbot --nginx -d api.syntrix.cc
sudo certbot --nginx -d admin.syntrix.cc
sudo certbot --nginx -d app.syntrix.cc
```

## 🔥 Шаг 6: Настройка Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## ✅ Готово!

Твои сервисы доступны на:
- 🌐 **Landing**: https://syntrix.cc
- 👨‍💼 **CRM**: https://admin.syntrix.cc
- 🤖 **Bot API**: https://api.syntrix.cc
- 📱 **Telegram App**: https://app.syntrix.cc

## 🔍 Проверка работы

```bash
# Через PM2
pm2 list
pm2 logs

# Через systemd
sudo systemctl status syntrix

# Проверка портов
curl http://localhost:3001/api/health
curl http://localhost:3002
curl http://localhost:3003
curl http://localhost:3004
```

## 📱 Настройка Telegram Webhook

```bash
# Замени <TOKEN> на свой токен бота
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://api.syntrix.cc/webhook/<TOKEN>"

# Проверь статус
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

## 🆘 Если что-то не работает

### Смотрим логи:
```bash
# PM2
pm2 logs

# Systemd
sudo journalctl -u syntrix -f

# Docker
docker-compose logs -f
```

### Перезапускаем:
```bash
# PM2
pm2 restart all

# Systemd
sudo systemctl restart syntrix

# Docker
docker-compose restart
```

### Проверяем порты:
```bash
netstat -tulpn | grep -E '3001|3002|3003|3004'
```

## 🎉 Готово к production!

Теперь у тебя:
- ✅ Все сервисы запущены
- ✅ Домены настроены
- ✅ SSL работает
- ✅ Firewall настроен
- ✅ Автозапуск включен
- ✅ Логи доступны

## 📚 Дополнительная документация

- `DEPLOYMENT.md` - Подробная документация деплоя
- `COMMANDS.md` - Все полезные команды
- `README.md` - Общая информация о проекте

## 💡 Полезные команды

```bash
# Обновление проекта
cd /root/cryp_land
git pull
pm2 restart all

# Просмотр логов
pm2 logs syntrix-bot
pm2 logs syntrix-crm

# Мониторинг ресурсов
pm2 monit

# Backup базы данных
cp telegram-bot/dev.db telegram-bot/dev.db.backup.$(date +%Y%m%d)
```

---

**Нужна помощь?** Проверь `DEPLOYMENT.md` или `COMMANDS.md` для подробных инструкций.
