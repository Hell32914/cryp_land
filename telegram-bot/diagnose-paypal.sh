#!/bin/bash

echo "🔍 PayPal Deposit Diagnosis Script"
echo "=================================="
echo ""

# 1. Check PM2 logs for webhook activity
echo "1️⃣ Checking PM2 logs for webhook activity..."
echo "---"
pm2 logs syntrix --lines 500 --nostream | grep -i "paypal\|webhook" | tail -30
echo ""

# 2. Check recent PayPal deposits in database
echo "2️⃣ Checking recent PayPal deposits..."
echo "---"
cd /root/cryp_land/telegram-bot
node check-paypal-issue.cjs
echo ""

# 3. Check environment variables
echo "3️⃣ Checking PayPal configuration..."
echo "---"
if [ -f .env ]; then
    echo "PAYPAL_CLIENT_ID: $(grep PAYPAL_CLIENT_ID .env | cut -d'=' -f2 | cut -c1-20)..."
    echo "PAYPAL_CLIENT_SECRET: $(grep PAYPAL_CLIENT_SECRET .env | cut -d'=' -f2 | cut -c1-10)..."
    echo "PAYPAL_ENV: $(grep PAYPAL_ENV .env | cut -d'=' -f2)"
    echo "WEBHOOK_URL: $(grep WEBHOOK_URL .env | cut -d'=' -f2)"
else
    echo "❌ .env file not found"
fi
echo ""

# 4. Test webhook endpoint
echo "4️⃣ Testing webhook endpoint..."
echo "---"
curl -X POST https://api.syntrix.website/api/paypal-webhook \
  -H "Content-Type: application/json" \
  -d '{"test":"connection"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s
echo ""

# 5. Check if API server is running
echo "5️⃣ Checking if API server is running..."
echo "---"
pm2 list | grep syntrix
echo ""

# 6. Check recent error logs
echo "6️⃣ Recent error logs..."
echo "---"
pm2 logs syntrix --err --lines 50 --nostream | tail -20
echo ""

echo "=================================="
echo "✅ Diagnosis complete"
