# 🚀 Quick Deployment Guide (Security Update)

## Prerequisites
All security vulnerabilities have been fixed. Follow these steps to deploy safely.

---

## 1️⃣ Install Dependencies

```bash
cd telegram-bot
npm install
```

This will install the new `express-rate-limit` package.

---

## 2️⃣ Update Environment Variables

### Required in Production

Create/update your `.env` file with these **mandatory** variables:

```bash
# Generate secrets (run in terminal):
openssl rand -hex 32  # for WEBHOOK_SECRET_TOKEN
openssl rand -hex 32  # for USER_JWT_SECRET
openssl rand -hex 32  # for CRM_JWT_SECRET
```

**Example `.env`:**
```env
NODE_ENV=production
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
ADMIN_IDS=123456789,987654321
WEBHOOK_URL=https://syntrix-bot.onrender.com
WEBHOOK_SECRET_TOKEN=a1b2c3d4e5f6...  # 64-char hex
USER_JWT_SECRET=f6e5d4c3b2a1...      # 64-char hex
CRM_JWT_SECRET=9876543210abcd...     # 64-char hex
CRM_ADMIN_USERNAME=admin
CRM_ADMIN_PASSWORD=YourSecurePassword123!
OXAPAY_API_KEY=your_oxapay_key
OXAPAY_PAYOUT_API_KEY=your_payout_key
```

---

## 3️⃣ Update CORS Origins (Optional)

If you have custom frontend domains, edit `src/api.ts`:

```typescript
const allowedOrigins = [
  'https://syntrix.website',
  'https://syntrix-crm.onrender.com',
  'https://your-custom-domain.com', // Add here
  'http://localhost:5173',
  'http://localhost:3000'
]
```

---

## 4️⃣ Build & Deploy

```bash
npm run build
npm start
```

---

## 5️⃣ Verify Security Features

### ✅ Check Rate Limiting
Try logging in with wrong password 6 times - should be blocked after 5 attempts.

### ✅ Check IDOR Protection
Try accessing `/api/user/123456/referrals` without JWT token - should get 401 Unauthorized.

### ✅ Check CORS
API should reject requests from unauthorized domains.

### ✅ Check Webhook
Telegram webhooks should work with secret token validation.

---

## 6️⃣ Frontend Updates (Important!)

Your Telegram Mini App needs to send `initData` for authentication:

```javascript
// In your Telegram Mini App
const initData = window.Telegram.WebApp.initData

fetch('https://your-api.com/api/user/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    telegramId: userId,
    initData: initData  // ← Add this!
  })
})
```

**Note:** In development, `initData` validation is skipped. It only runs in production (`NODE_ENV=production`).

---

## 🔍 Monitoring

After deployment, monitor for:

1. **Blocked requests:** Check logs for CORS warnings
2. **Rate limit hits:** Watch for "Too many requests" errors
3. **Invalid auth:** Look for Telegram initData validation failures

```bash
# Check logs
tail -f /path/to/logs/app.log | grep -E "CORS|rate|initData"
```

---

## 🐛 Troubleshooting

### Issue: "WEBHOOK_SECRET_TOKEN must be set"
**Solution:** Add it to `.env` file in production

### Issue: Frontend can't connect (CORS error)
**Solution:** Add your domain to `allowedOrigins` array

### Issue: "Too many requests"
**Solution:** Rate limits may be too strict, adjust in `src/api.ts`:
```typescript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Increase from 5 to 10
  // ...
})
```

### Issue: Auth not working in production
**Solution:** Make sure frontend sends `initData` parameter

---

## 📋 Deployment Checklist

- [ ] All environment variables set
- [ ] `express-rate-limit` installed
- [ ] Secrets generated and stored securely
- [ ] CORS origins configured
- [ ] Frontend updated to send `initData`
- [ ] Build completed without errors
- [ ] Webhook tested
- [ ] Rate limiting tested
- [ ] Production mode enabled (`NODE_ENV=production`)

---

## 🔐 Security Features Enabled

✅ IDOR protection on user endpoints  
✅ Telegram initData validation  
✅ Rate limiting on critical endpoints  
✅ CORS whitelist  
✅ Secure secret management  
✅ Production environment checks  

---

## 📞 Need Help?

Check `SECURITY_FIXES.md` for detailed documentation on all security improvements.

---

**Last Updated:** December 11, 2025  
**Version:** 1.0.1 (Security Hardened)
