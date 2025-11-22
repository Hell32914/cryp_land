# Marketing Links & Referral Tracking

## Overview
The system now supports tracking users from different marketing sources using custom links created in the CRM.

## Features

### 1. Link Builder (CRM)
- Create custom marketing links for different sources (Telegram, Instagram, Facebook, etc.)
- Add custom UTM parameters for detailed tracking
- Track clicks and conversions
- Enable/disable links
- View all created links and their performance

### 2. Referral Links (CRM)
- View performance by marketing source
- See total users, deposits, and revenue per source
- Calculate average revenue per user
- Overview cards with key metrics

## How It Works

### Creating a Marketing Link

1. Go to **Link Builder** in CRM
2. Select a source (Instagram, Facebook, etc.)
3. (Optional) Add custom parameters:
   - Example: campaign=summer2024, ad_id=123
4. Click "Generate"
5. Copy the generated link: `https://t.me/syntrix_bot?start=mk_instagram_xxx`

### Link Format

Generated links use format: `https://t.me/syntrix_bot?start=mk_<source>_<timestamp>`

Example: `https://t.me/syntrix_bot?start=mk_instagram_lx9k2p4`

### Tracking Flow

1. User clicks marketing link
2. Opens Telegram bot
3. Bot parses `start` parameter
4. Records marketing source and UTM params
5. Tracks click in database
6. When user registers → conversion tracked
7. When user deposits → revenue tracked

### User Referral Links

Users can still share referral links in format: `https://t.me/syntrix_bot?start=ref5<userId>`

These work independently from marketing links.

## Database Schema

### User Fields
```prisma
model User {
  marketingSource String?  // Source name (instagram, facebook, etc.)
  utmParams       String?  // JSON string of custom parameters
  // ... other fields
}
```

### MarketingLink Table
```prisma
model MarketingLink {
  id          Int
  linkId      String   @unique    // mk_instagram_xxx
  source      String               // instagram, facebook, etc.
  utmParams   String?              // JSON of custom params
  clicks      Int                  // Total clicks
  conversions Int                  // Users registered
  revenue     Float                // Total deposit amount
  isActive    Boolean              // Can be disabled
  createdAt   DateTime
  updatedAt   DateTime
}
```

## API Endpoints

### Create Marketing Link
```
POST /api/admin/marketing-links
Authorization: Bearer <token>

Body:
{
  "source": "instagram",
  "utmParams": {
    "campaign": "summer2024",
    "ad_id": "123"
  }
}
```

### Get All Marketing Links
```
GET /api/admin/marketing-links
Authorization: Bearer <token>
```

### Get Marketing Stats
```
GET /api/admin/marketing-stats
Authorization: Bearer <token>

Returns:
{
  "sources": [
    {
      "source": "instagram",
      "users": 50,
      "deposits": 30,
      "revenue": 15000.00
    }
  ],
  "links": [
    {
      "linkId": "mk_instagram_xxx",
      "source": "instagram",
      "clicks": 100,
      "conversions": 50,
      "conversionRate": "50.00",
      "isActive": true
    }
  ]
}
```

### Toggle Link Status
```
PATCH /api/admin/marketing-links/:linkId
Authorization: Bearer <token>

Body:
{
  "isActive": false
}
```

### Delete Link
```
DELETE /api/admin/marketing-links/:linkId
Authorization: Bearer <token>
```

## Usage Examples

### Instagram Campaign
1. Create link with source="instagram"
2. Add params: campaign=crypto_ad, ad_set=1
3. Share link in Instagram bio/stories
4. Track conversions in CRM

### Email Campaign
1. Create link with source="email"
2. Add params: campaign=newsletter_june, list=vip
3. Include in email
4. Monitor performance

### Influencer Tracking
1. Create link with source="youtube"
2. Add params: influencer=john_crypto, video=btc_review
3. Give to influencer
4. Track revenue generated

## Metrics Available

- **Clicks**: How many times link was clicked
- **Conversions**: How many users registered
- **Conversion Rate**: % of clicks that registered
- **Revenue**: Total deposits from this source
- **Avg per User**: Revenue / Users

## Best Practices

1. Use descriptive source names
2. Add campaign params for detailed tracking
3. Create separate links for each campaign
4. Disable inactive links to avoid confusion
5. Monitor conversion rates to optimize campaigns
6. Compare sources to allocate marketing budget

## Notes

- Marketing links work alongside user referral system
- One user can only have one marketing source (first touch)
- Revenue is calculated from completed deposits only
- Links can be disabled but not deleted (keeps historical data)
