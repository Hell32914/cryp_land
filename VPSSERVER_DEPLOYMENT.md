# 🚀 Деплой Syntrix на VPSServer.com

## 📋 Информация о сервере

- **Хостинг**: VPSServer.com
- **IP**: 45.147.248.134
- **Hostname**: cloud-vip.com
- **ОС**: Linux 2.6 - 6.x (судя по панели)
- **Зона**: EU-FR (Франкфурт, Германия, Европа)
- **RAM**: 3072MB (3GB)
- **Диск**: 20GB
- **CPU**: 2 ядра

## 🎯 Что будем делать

1. Подключиться к серверу по SSH
2. Установить необходимое ПО
3. Клонировать проект
4. Настроить переменные окружения
5. Запустить проект
6. Настроить Nginx
7. Настроить SSL
8. Привязать домен syntrix.cc

---

## 📝 Шаг 1: Подключение к серверу

### Получение SSH данных

1. В панели VPSServer зайди в раздел **"Сеть"** или **"SSH"**
2. Найди:
   - SSH логин (обычно `root`)
   - SSH пароль
   - SSH порт (обычно `22`)

### Подключение

**Windows (PowerShell):**
```powershell
ssh root@45.147.248.134
# Введи пароль когда попросит
```

**Windows (PuTTY):**
- Host: `45.147.248.134`
- Port: `22`
- Connection type: SSH
- Нажми Open, введи логин `root` и пароль

**macOS/Linux:**
```bash
ssh root@45.147.248.134
```

---

## 🔧 Шаг 2: Установка необходимого ПО

После подключения выполни команды:

```bash
# Обновление системы
apt update && apt upgrade -y

# Установка Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Проверка установки
node -v  # Должно показать v20.x.x
npm -v   # Должно показать 10.x.x

# Установка Git
apt install -y git

# Установка Nginx
apt install -y nginx

# Установка Certbot для SSL
apt install -y certbot python3-certbot-nginx

# Установка PM2 (для управления процессами)
npm install -g pm2
```

---

## 📦 Шаг 3: Клонирование проекта

```bash
# Переход в домашнюю директорию
cd /root

# Клонирование репозитория
git clone https://github.com/Hell32914/cryp_land.git

# Переход в папку проекта
cd cryp_land

# Проверка содержимого
ls -la
```

---

## 🔑 Шаг 4: Настройка переменных окружения

```bash
# Копирование шаблона
cp .env.example telegram-bot/.env

# Редактирование файла
nano telegram-bot/.env
```

**Заполни следующие данные:**

```env
# Telegram Bot
BOT_TOKEN=8450436953:AAEwpSor3yHkPR5uTZEibGcwQbKTeqXKRSg
ADMIN_IDS=503856039,1450570156
CHANNEL_ID=503856039

# Database
DATABASE_URL="file:./dev.db"

# Service URLs (временно используем IP)
WEBAPP_URL=http://45.147.248.134:3004
WEBHOOK_URL=http://45.147.248.134:3001
LANDING_URL=http://45.147.248.134:3003

# API
API_PORT=3001

# Payment Gateway
OXAPAY_API_KEY=S59NKI-VVNQEK-HGOFQH-1RDFWB
OXAPAY_PAYOUT_API_KEY=TXP9GS-9DIBHU-XPZJN2-YFM4LQ

# Trading Cards
CARDS_MIN_PER_DAY=4
CARDS_MAX_PER_DAY=16
CARDS_START_TIME=07:49
CARDS_END_TIME=22:30

# CRM Admin Portal
CRM_ADMIN_USERNAME=admin
CRM_ADMIN_PASSWORD=r0rl8v_+QG64$A
CRM_JWT_SECRET=syntrix-jwt-secret-key-change-in-production-1492827344
```

**Сохранение:**
- Нажми `Ctrl + O` (сохранить)
- Нажми `Enter` (подтвердить)
- Нажми `Ctrl + X` (выход)

---

## 🚀 Шаг 5: Запуск проекта

```bash
# Делаем скрипт исполняемым
chmod +x deploy.sh start-pm2.sh server-setup.sh

# Запускаем деплой (установка зависимостей и сборка)
./deploy.sh
```

Это займёт 5-10 минут. Если успешно завершилось:

```bash
# Запускаем через PM2
./start-pm2.sh

# Проверяем статус
pm2 list
```

Должны быть запущены 4 процесса:
- syntrix-bot (порт 3001)
- syntrix-crm (порт 3002)
- syntrix-landing (порт 3003)
- syntrix-telegram-app (порт 3004)

---

## 🔥 Шаг 6: Настройка Firewall

```bash
# Разрешаем необходимые порты
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw allow 3001/tcp # Bot API (временно)
ufw allow 3002/tcp # CRM (временно)
ufw allow 3003/tcp # Landing (временно)
ufw allow 3004/tcp # Telegram App (временно)

# Включаем firewall
ufw --force enable

# Проверяем статус
ufw status
```

---

## 🌐 Шаг 7: Настройка DNS для домена syntrix.cc

### В панели управления доменом (где купил syntrix.cc):

Добавь следующие A-записи:

```
Тип    | Имя              | Значение        | TTL
-------|------------------|-----------------|------
A      | @                | 45.147.248.134  | 3600
A      | www              | 45.147.248.134  | 3600
A      | api              | 45.147.248.134  | 3600
A      | admin            | 45.147.248.134  | 3600
A      | app              | 45.147.248.134  | 3600
```

**Что это значит:**
- `@` → `syntrix.cc` → 45.147.248.134
- `www` → `www.syntrix.cc` → 45.147.248.134
- `api` → `api.syntrix.cc` → 45.147.248.134
- `admin` → `admin.syntrix.cc` → 45.147.248.134
- `app` → `app.syntrix.cc` → 45.147.248.134

**Проверка DNS (подожди 5-10 минут):**
```bash
nslookup syntrix.cc
nslookup api.syntrix.cc
nslookup admin.syntrix.cc
nslookup app.syntrix.cc
```

---

## 🌍 Шаг 8: Настройка Nginx

```bash
# Копируем конфигурацию
cp /root/cryp_land/nginx.conf /etc/nginx/sites-available/syntrix

# Создаём симлинк
ln -s /etc/nginx/sites-available/syntrix /etc/nginx/sites-enabled/

# Удаляем дефолтную конфигурацию
rm /etc/nginx/sites-enabled/default

# Проверяем конфигурацию
nginx -t

# Перезагружаем Nginx
systemctl reload nginx
```

---

## 🔒 Шаг 9: Получение SSL сертификатов

**Подожди пока DNS записи распространятся (5-30 минут), затем:**

```bash
# Получаем сертификаты для всех доменов
certbot --nginx -d syntrix.cc -d www.syntrix.cc
certbot --nginx -d api.syntrix.cc
certbot --nginx -d admin.syntrix.cc
certbot --nginx -d app.syntrix.cc
```

При первом запуске Certbot спросит:
- Email для уведомлений (введи свой email)
- Согласие с Terms of Service (введи `Y`)
- Разрешение на рассылку (можно `N`)

**Тест автообновления:**
```bash
certbot renew --dry-run
```

---

## 🔄 Шаг 10: Обновление .env с доменами

```bash
nano /root/cryp_land/telegram-bot/.env
```

**Измени URLs на доменные:**
```env
WEBAPP_URL=https://app.syntrix.cc
WEBHOOK_URL=https://api.syntrix.cc
LANDING_URL=https://syntrix.cc
```

**Сохрани и перезапусти:**
```bash
pm2 restart all
```

---

## 📱 Шаг 11: Настройка Telegram Webhook

```bash
# Замени <TOKEN> на твой токен бота
curl -X POST "https://api.telegram.org/bot8450436953:AAEwpSor3yHkPR5uTZEibGcwQbKTeqXKRSg/setWebhook" \
  -d "url=https://api.syntrix.cc/webhook/8450436953:AAEwpSor3yHkPR5uTZEibGcwQbKTeqXKRSg"

# Проверь статус webhook
curl "https://api.telegram.org/bot8450436953:AAEwpSor3yHkPR5uTZEibGcwQbKTeqXKRSg/getWebhookInfo"
```

---

## ✅ Шаг 12: Проверка работы

### Проверка сервисов:
```bash
pm2 list
pm2 logs
```

### Проверка доменов в браузере:
- https://syntrix.cc - Landing page
- https://admin.syntrix.cc - CRM (логин: admin, пароль: r0rl8v_+QG64$A)
- https://api.syntrix.cc/api/health - Bot API
- https://app.syntrix.cc - Telegram Mini App

### Проверка бота:
Открой бота в Telegram и отправь `/start`

---

## 🔄 Настройка автозапуска

```bash
# Сохраняем текущую конфигурацию PM2
pm2 save

# Настраиваем автозапуск при старте системы
pm2 startup

# PM2 выдаст команду, скопируй и выполни её
# Обычно это что-то вроде:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root

# После выполнения команды, снова:
pm2 save
```

Теперь при перезагрузке сервера всё запустится автоматически!

---

## 📊 Полезные команды

### PM2:
```bash
pm2 list                    # Список процессов
pm2 logs                    # Все логи
pm2 logs syntrix-bot        # Логи бота
pm2 restart all             # Перезапуск всех
pm2 stop all                # Остановка всех
pm2 monit                   # Мониторинг ресурсов
```

### Nginx:
```bash
systemctl status nginx      # Статус
systemctl restart nginx     # Перезапуск
nginx -t                    # Проверка конфига
tail -f /var/log/nginx/error.log  # Логи ошибок
```

### Система:
```bash
htop                        # Мониторинг ресурсов
df -h                       # Использование диска
free -m                     # Использование RAM
netstat -tulpn              # Открытые порты
```

---

## 🔄 Обновление проекта

```bash
cd /root/cryp_land
git pull
./deploy.sh
pm2 restart all
```

---

## 🆘 Решение проблем

### Если сервисы не запускаются:
```bash
pm2 logs                    # Смотрим ошибки
pm2 delete all              # Удаляем все процессы
cd /root/cryp_land
./start-pm2.sh              # Запускаем заново
```

### Если Nginx не работает:
```bash
nginx -t                    # Проверка конфигурации
systemctl status nginx      # Статус
journalctl -xe              # Логи системы
```

### Если SSL не работает:
```bash
certbot certificates        # Список сертификатов
certbot renew --dry-run     # Тест обновления
```

### Если бот не отвечает:
```bash
pm2 logs syntrix-bot        # Логи бота
# Проверь webhook:
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

---

## 💾 Backup базы данных

```bash
# Создать backup
cp /root/cryp_land/telegram-bot/dev.db /root/backups/db_$(date +%Y%m%d_%H%M%S).db

# Автоматический backup (добавь в crontab)
crontab -e
# Добавь строку:
0 2 * * * cp /root/cryp_land/telegram-bot/dev.db /root/backups/db_$(date +\%Y\%m\%d).db
```

---

## 🎉 Готово!

Твой Syntrix платформа теперь работает на:
- 🌐 **Landing**: https://syntrix.cc
- 👨‍💼 **CRM**: https://admin.syntrix.cc
- 🤖 **Bot API**: https://api.syntrix.cc
- 📱 **Telegram App**: https://app.syntrix.cc

---

## 📞 Поддержка

Если возникли проблемы:
1. Проверь логи: `pm2 logs`
2. Проверь статус: `pm2 list`
3. Проверь Nginx: `nginx -t`
4. Проверь DNS: `nslookup syntrix.cc`
5. Проверь firewall: `ufw status`

---

**VPSServer Console**: https://console.vpsserver.com
**Server IP**: 45.147.248.134
**Domain**: syntrix.cc
