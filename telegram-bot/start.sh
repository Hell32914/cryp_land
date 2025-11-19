#!/bin/sh
echo "🔄 Initializing database..."
npx prisma db push --accept-data-loss --skip-generate
echo "✅ Database initialized"
echo "🚀 Starting bot..."
node dist/index.js
