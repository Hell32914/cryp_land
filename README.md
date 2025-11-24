# Syntrix Platform

Unified trading platform with Telegram Bot, CRM, Landing Page, and Mini App.

## 🎯 [👉 START HERE - Полная инструкция деплоя](./START_HERE.md)

## 🚀 Quick Deploy

**Choose your deployment method:**

### Option 1: Native (Recommended)

#### Linux/macOS:
```bash
chmod +x deploy.sh
./deploy.sh
```

#### Windows:
```bash
deploy.bat
```

### Option 2: Docker
```bash
cp .env.example telegram-bot/.env
# Edit .env with your credentials
docker-compose up -d
```

### Option 3: PM2 (Production)
```bash
npm install -g pm2
./deploy.sh
chmod +x start-pm2.sh
./start-pm2.sh
```

All methods will:
- ✅ Install all dependencies
- 🔨 Build all projects  
- 🚀 Start all services

## 📦 What's Included

- **Telegram Bot** - Trading bot with admin panel (Port 3001)
- **CRM** - Admin dashboard for user management (Port 3002)
- **Landing** - Main marketing website (Port 3003)
- **Telegram App** - Mini app for users (Port 3004)

## 🔧 Configuration

1. Copy environment variables:
```bash
cp .env.example telegram-bot/.env
```

2. Edit `telegram-bot/.env` with your credentials:
- Bot token
- Admin IDs
- API keys
- Domain URLs

## 📚 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - 🚀 Быстрый старт на сервере (начни здесь!)
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - 📖 Полная документация деплоя
- **[COMMANDS.md](./COMMANDS.md)** - ⌨️ Все полезные команды
- **[CHECKLIST.md](./CHECKLIST.md)** - ✅ Чеклист для деплоя

## 🛠️ Development

```bash
npm run dev
```

Runs all services in development mode with hot-reload.

## 📊 Services

| Service | Port | URL |
|---------|------|-----|
| Bot API | 3001 | http://localhost:3001 |
| CRM | 3002 | http://localhost:3002 |
| Landing | 3003 | http://localhost:3003 |
| Telegram App | 3004 | http://localhost:3004 |

## 🔄 Updates

```bash
git pull
./deploy.sh
```

## 📝 License

MIT
