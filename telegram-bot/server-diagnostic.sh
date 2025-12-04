#!/bin/bash

# Server diagnostic script for daily updates issue

echo "🔍 Syntrix Bot - Daily Updates Diagnostic"
echo "========================================"
echo ""

cd ~/cryp_land/telegram-bot || exit 1

echo "📋 Step 1: Check if bot is running"
echo "-----------------------------------"
pm2 status syntrix
echo ""

echo "📋 Step 2: Check admin configuration"
echo "-----------------------------------"
node check-admins.cjs
echo ""

echo "📋 Step 3: Check daily updates in database"
echo "-----------------------------------"
node check-updates-simple.cjs
echo ""

echo "📋 Step 4: Check recent bot logs"
echo "-----------------------------------"
echo "Last 30 lines from bot:"
pm2 logs syntrix --lines 30 --nostream
echo ""

echo "✅ Diagnostic complete!"
echo ""
echo "📊 Next steps:"
echo "   1. If updates are old (from November) - run profit accrual manually"
echo "   2. If notifications not sent (📭) - check notification scheduler"
echo "   3. If app shows different count - check API response"
