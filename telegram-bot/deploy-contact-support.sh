#!/bin/bash

# Contact Support Global Migration Script
# Run this on the server after deploying code

echo "🚀 Starting Contact Support migration..."

# Step 1: Ensure schema is set to postgresql
echo "📝 Checking database provider..."
if grep -q 'provider = "sqlite"' prisma/schema.prisma; then
    echo "⚠️  WARNING: schema.prisma is set to sqlite"
    echo "   On server, it should be 'postgresql'"
    echo "   Please verify DATABASE_URL is set correctly"
fi

# Step 2: Generate Prisma Client
echo "🔄 Generating Prisma Client..."
npx prisma generate

# Step 3: Push schema changes to database
echo "📊 Pushing schema changes to database..."
npx prisma db push --accept-data-loss

# Step 4: Run migration script
echo "🔄 Running data migration..."
node migrate-contact-support.cjs

# Step 5: Restart bot
echo "♻️  Restarting bot..."
pm2 restart telegram-bot

echo "✅ Migration complete!"
echo ""
echo "📞 Global Contact Support is ready!"
echo "   Go to bot: /admin → 📞 Global Contact Support"
