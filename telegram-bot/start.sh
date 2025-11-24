#!/bin/sh
echo "🔄 Initializing database..."
npx prisma db push --accept-data-loss --skip-generate
echo "✅ Database initialized"
echo "🔄 Running migrations..."
node add-role-field.cjs
echo "✅ Migrations completed"
echo "🚀 Starting bot..."
node dist/index.js
