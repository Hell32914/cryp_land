#!/bin/bash

# PayPal Auto-Confirm Deployment Script
# Run this on the server after git pull

echo "🚀 Deploying PayPal auto-confirm feature..."
echo ""

# Check if we're in the right directory
if [ ! -d "telegram-bot" ]; then
    echo "❌ Error: telegram-bot directory not found"
    echo "Please run this script from the cryp_land root directory"
    exit 1
fi

# Update backend
echo "📦 Building backend..."
cd telegram-bot
npm install
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Backend build failed!"
    exit 1
fi

echo "✅ Backend built successfully"
echo ""

# Restart PM2
echo "🔄 Restarting PM2..."
pm2 restart syntrix

if [ $? -ne 0 ]; then
    echo "⚠️  PM2 restart failed. Try manually: pm2 restart syntrix"
fi

echo "✅ Backend deployed"
echo ""

# Check if frontend needs update
echo "📱 Frontend update needed:"
echo "  1. Apply changes in telegram-app/src/App.tsx (see PAYPAL_AUTO_WEBHOOK.md)"
echo "  2. Build: cd telegram-app && npm run build"
echo "  3. Deploy to your hosting (Vercel/Netlify will auto-deploy on git push)"
echo ""

# Show next steps
echo "📋 Next steps:"
echo ""
echo "1️⃣  Configure PayPal Webhook:"
echo "   - Go to: https://developer.paypal.com/dashboard/"
echo "   - Add webhook URL: https://api.syntrix.website/api/paypal-webhook"
echo "   - Select events: CHECKOUT.ORDER.APPROVED, PAYMENT.CAPTURE.COMPLETED"
echo ""
echo "2️⃣  Test the webhook:"
echo "   - Make a test deposit through the bot"
echo "   - Check logs: pm2 logs syntrix | grep -i webhook"
echo ""
echo "3️⃣  Update frontend (if not auto-deployed):"
echo "   - cd telegram-app"
echo "   - npm run build"
echo "   - Deploy dist/ to your hosting"
echo ""
echo "📖 Full documentation: telegram-bot/PAYPAL_AUTO_WEBHOOK.md"
echo ""
echo "✅ Deployment complete!"
