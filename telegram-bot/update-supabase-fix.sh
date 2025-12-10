#!/bin/bash

# Script to update the bot with Supabase connection fix
# Run this on your production server

echo "🔧 Updating Syntrix Bot with Supabase connection fix..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set!"
    echo "Please set it to your Supabase connection string:"
    echo 'export DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"'
    exit 1
fi

# Check if DATABASE_URL contains "file:" (SQLite)
if [[ "$DATABASE_URL" == *"file:"* ]]; then
    echo "❌ ERROR: DATABASE_URL is still pointing to SQLite!"
    echo "Current value: $DATABASE_URL"
    echo "Please update it to your Supabase PostgreSQL connection string"
    exit 1
fi

echo "✅ DATABASE_URL is set correctly (PostgreSQL)"
echo ""

# Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo ""

# Run Prisma migrations
echo "🗄️  Running database migrations..."
npx prisma generate
npx prisma migrate deploy || echo "⚠️  Migration failed or no new migrations"
echo ""

# Build the project
echo "🔨 Building project..."
npm run build
echo ""

# Check database connection
echo "🔍 Checking database connection..."
npm run db:check || echo "⚠️  Database check failed, but continuing..."
echo ""

# Restart the bot with PM2
if command -v pm2 &> /dev/null; then
    echo "🔄 Restarting bot with PM2..."
    pm2 restart telegram-bot || pm2 restart all
    echo ""
    echo "📊 Bot status:"
    pm2 status
    echo ""
    echo "📝 Recent logs:"
    pm2 logs telegram-bot --lines 20 --nostream
else
    echo "⚠️  PM2 not found, please restart the bot manually"
fi

echo ""
echo "✅ Update completed!"
echo ""
echo "📝 Next steps:"
echo "1. Monitor logs: pm2 logs telegram-bot"
echo "2. Check database connection: npm run db:check"
echo "3. Test by sending a message to the bot"
echo ""
