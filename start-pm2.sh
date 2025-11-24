#!/bin/bash

echo "🚀 Starting Syntrix Platform with PM2"
echo "====================================="
echo ""

# Создание папки для логов
mkdir -p logs

# Установка зависимостей и сборка (если еще не сделано)
if [ ! -d "telegram-bot/node_modules" ] || [ ! -d "telegram-bot/dist" ]; then
    echo "📦 Building project first..."
    ./deploy.sh
fi

# Запуск через PM2
echo "🚀 Starting services with PM2..."
pm2 start ecosystem.config.json

# Сохранение конфигурации для автозапуска
pm2 save

# Настройка автозапуска при старте системы
pm2 startup

echo ""
echo "✅ All services started!"
echo ""
echo "📊 Useful PM2 commands:"
echo "  pm2 list                    - Show all services"
echo "  pm2 logs                    - Show all logs"
echo "  pm2 logs syntrix-bot        - Show bot logs"
echo "  pm2 restart all             - Restart all services"
echo "  pm2 stop all                - Stop all services"
echo "  pm2 delete all              - Remove all services"
echo "  pm2 monit                   - Monitor services"
echo ""

# Показать статус
pm2 list
