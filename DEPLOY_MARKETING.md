# Deploy Instructions - Marketing Links Feature

## What Was Added

✅ **Link Builder** - Create and manage marketing links  
✅ **Referral Links Stats** - Track performance by source  
✅ **Database Schema** - New fields for marketing tracking  
✅ **Bot Handler** - Parse marketing links on /start  
✅ **API Endpoints** - CRUD operations for marketing links

## Files Changed

### Backend (telegram-bot/)
- `prisma/schema.prisma` - Added marketingSource, utmParams to User, new MarketingLink model
- `src/index.ts` - Updated /start command to parse marketing links
- `src/api.ts` - Added 5 new API endpoints for marketing links
- `add-marketing-fields.cjs` - Migration script

### Frontend (crm/)
- `src/lib/api.ts` - Added marketing link API functions
- `src/components/pages/LinkBuilder.tsx` - Fully functional link builder
- `src/components/pages/RefLinks.tsx` - Marketing stats dashboard

## Deployment Steps

### 1. Deploy Backend to Railway

```bash
cd telegram-bot
git add .
git commit -m "Add marketing links tracking system"
git push
```

Railway will automatically:
- Apply database migration (schema changes)
- Regenerate Prisma client
- Restart the bot

### 2. Deploy CRM to Railway

```bash
cd crm
git add .
git commit -m "Add link builder and marketing stats"
git push
```

Make sure Railway CRM has:
- `VITE_API_URL=https://crypland-production.up.railway.app`

### 3. Verify Deployment

1. Open CRM
2. Go to **Link Builder**
3. Create a test link
4. Check **Referral Links** for stats
5. Test link: Share with someone or click yourself

## Railway Environment Variables

No new variables needed! Existing setup works:

### telegram-bot service:
```
CRM_ADMIN_USERNAME=admin
CRM_ADMIN_PASSWORD=admin
CRM_JWT_SECRET=syntrix-jwt-secret-key-change-in-production-1492827344
DATABASE_URL="file:./dev.db"
(+ all your existing vars)
```

### crm service:
```
VITE_API_URL=https://crypland-production.up.railway.app
```

## How to Use

### Creating Marketing Links

1. Login to CRM
2. Navigate to **Link Builder**
3. Select source (Instagram, Facebook, etc.)
4. Add custom parameters (optional):
   - `campaign` = "summer2024"
   - `ad_id` = "123"
5. Click **Generate**
6. Copy link and share

### Example Links

```
https://t.me/syntrix_bot?start=mk_instagram_lx9k2p
https://t.me/syntrix_bot?start=mk_facebook_lx9k3r
https://t.me/syntrix_bot?start=mk_youtube_lx9k4s
```

### Viewing Stats

1. Go to **Referral Links** in CRM
2. See overview cards (Total Users, Deposits, Revenue)
3. View table with per-source breakdown
4. Compare performance across sources

## Testing Locally

1. Start bot: `cd telegram-bot && npm start`
2. Start CRM: `cd crm && npm run dev`
3. Create link in CRM
4. Open link in Telegram (on phone or desktop)
5. Check stats update

## Database Migration

Migration runs automatically on deployment via `init-db.cjs`.

If you need to run manually:
```bash
cd telegram-bot
node add-marketing-fields.cjs
npx prisma generate
```

## API Documentation

See `MARKETING_LINKS.md` for detailed API docs.

## Key Features

✅ Create unlimited marketing links  
✅ Track clicks and conversions  
✅ Enable/disable links  
✅ View revenue per source  
✅ Custom UTM parameters  
✅ Real-time stats updates  
✅ Works alongside user referrals  

## Notes

- Marketing links are separate from user referral codes
- User referrals still work: `https://t.me/syntrix_bot?start=ref5<userId>`
- One user = one marketing source (first touch attribution)
- Revenue tracked from completed deposits only
- Links can be disabled but data is preserved

## Troubleshooting

**Links not tracking:**
- Check bot logs for `[GEO]` and marketing messages
- Verify database has marketingSource field
- Ensure Prisma client regenerated

**CRM not showing stats:**
- Check VITE_API_URL points to correct bot URL
- Verify authentication token valid
- Check browser console for errors

**API errors:**
- Ensure Railway environment variables set
- Check bot is running on Railway
- Verify database migration applied
