# Syntrix Platform - Quick Commands Reference

## 🚀 Deployment

### First Time Setup
```bash
# Linux/macOS
chmod +x deploy.sh server-setup.sh start-pm2.sh
./deploy.sh

# Windows
deploy.bat
```

### Docker
```bash
docker-compose up -d              # Start
docker-compose logs -f            # View logs
docker-compose restart            # Restart
docker-compose down               # Stop
```

### PM2
```bash
./start-pm2.sh                    # Start all services
pm2 list                          # Show status
pm2 logs                          # View all logs
pm2 restart all                   # Restart all
pm2 stop all                      # Stop all
```

## 📦 Build Commands

```bash
npm run build                     # Build all projects
npm run build:bot                 # Build bot only
npm run build:crm                 # Build CRM only
npm run build:landing             # Build landing only
npm run build:telegram-app        # Build telegram-app only
```

## 🔧 Development

```bash
npm run dev                       # Start all in dev mode

# Or individually:
cd telegram-bot && npm run dev
cd crm && npm run dev
cd landing && npm run dev
cd telegram-app && npm run dev
```

## 🗄️ Database

```bash
cd telegram-bot

# Push schema changes
npx prisma db push

# Generate Prisma client
npx prisma generate

# Open Prisma Studio
npx prisma studio

# Run migration script
node add-role-field.cjs
```

## 🌐 Server Setup

```bash
# Full server setup (Ubuntu/Debian)
sudo ./server-setup.sh

# Manual steps:
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx
```

## 🔒 SSL Setup

```bash
sudo certbot --nginx -d syntrix.cc -d www.syntrix.cc
sudo certbot --nginx -d api.syntrix.cc
sudo certbot --nginx -d admin.syntrix.cc
sudo certbot --nginx -d app.syntrix.cc

# Auto-renewal test
sudo certbot renew --dry-run
```

## 📊 Monitoring

### Systemd
```bash
sudo systemctl status syntrix     # Status
sudo systemctl start syntrix      # Start
sudo systemctl stop syntrix       # Stop
sudo systemctl restart syntrix    # Restart
sudo journalctl -u syntrix -f     # Logs (real-time)
```

### PM2
```bash
pm2 list                          # All processes
pm2 monit                         # Resource monitor
pm2 logs syntrix-bot              # Bot logs
pm2 logs syntrix-crm              # CRM logs
pm2 flush                         # Clear logs
```

### Docker
```bash
docker ps                         # Running containers
docker stats                      # Resource usage
docker logs syntrix -f            # Follow logs
docker exec -it syntrix sh        # Shell into container
```

## 🔄 Updates

```bash
# Pull latest changes
git pull

# Rebuild and restart
./deploy.sh

# Or with PM2:
pm2 restart all

# Or with systemd:
sudo systemctl restart syntrix

# Or with Docker:
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 🧪 Testing

```bash
# Check if services are running
curl http://localhost:3001/api/health     # Bot API
curl http://localhost:3002                # CRM
curl http://localhost:3003                # Landing
curl http://localhost:3004                # Telegram App

# Test Telegram webhook
curl -X POST http://localhost:3001/webhook/YOUR_BOT_TOKEN \
  -H "Content-Type: application/json" \
  -d '{"update_id": 1, "message": {"chat": {"id": 123}, "text": "/start"}}'
```

## 🔥 Firewall

```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 22/tcp              # SSH
sudo ufw allow 80/tcp              # HTTP
sudo ufw allow 443/tcp             # HTTPS
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 📝 Nginx

```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/access.log
```

## 🗑️ Cleanup

```bash
# Remove node_modules
find . -name "node_modules" -type d -exec rm -rf {} +

# Remove build artifacts
find . -name "dist" -type d -exec rm -rf {} +

# Clear PM2 logs
pm2 flush

# Clear Docker
docker system prune -a
```

## 🆘 Troubleshooting

### Port already in use
```bash
# Find process using port
lsof -i :3001
# or
netstat -tulpn | grep 3001

# Kill process
kill -9 <PID>
```

### Database locked
```bash
cd telegram-bot
rm dev.db-journal
# Restart the application
```

### Memory issues
```bash
# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=4096"
```

### PM2 not restarting
```bash
pm2 delete all
pm2 flush
./start-pm2.sh
```

## 📱 Telegram Bot

```bash
# Set webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://api.syntrix.cc/webhook/<TOKEN>"

# Delete webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/deleteWebhook"

# Get webhook info
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

## 🎯 Quick Fixes

### Restart everything
```bash
# PM2
pm2 restart all

# Systemd
sudo systemctl restart syntrix

# Docker
docker-compose restart

# Manual
pkill -f node; ./deploy.sh
```

### Check all services
```bash
curl http://localhost:3001/api/health && echo "✅ Bot" || echo "❌ Bot"
curl http://localhost:3002 && echo "✅ CRM" || echo "❌ CRM"
curl http://localhost:3003 && echo "✅ Landing" || echo "❌ Landing"
curl http://localhost:3004 && echo "✅ App" || echo "❌ App"
```
