# Referral System Implementation

## Overview
Syntrix Bot now includes a fully functional 3-level referral system with cascade earnings distribution.

## Features

### 1. Referral Tracking
- **Referral Link Format**: `https://t.me/AiSyntrixTrade_bot?start?startapp=ref5{userId}`
- **One-Time Tracking**: Each user can only be referred once (referredBy field is immutable)
- **Activation Threshold**: Referral chain is created only when referred user reaches **$1000 total deposit**
- **Multi-Level Chain**: Automatically creates referral records for up to 3 levels when threshold is met

### 2. Daily Profit Updates (4-11 Random Parts)
Each day's profit is split into **4-11 random parts** and displayed throughout the day:
- Random number of updates generated: 4-11 parts
- Each update has a random amount (percentages normalized to sum to 100%)
- Updates are timestamped at random times throughout the 24-hour period
- Frontend shows only updates that have "occurred" (timestamp <= current time)
- Updates refresh every minute to reveal new ones as time passes

**Example**: $100 daily profit split into 7 updates:
- 08:23 AM: +$8.45
- 10:47 AM: +$22.10
- 01:15 PM: +$5.32
- 03:08 PM: +$18.76
- 05:44 PM: +$31.22
- 08:19 PM: +$9.87
- 11:03 PM: +$4.28
- **Total**: $100.00

### 3. Earnings Distribution (3-Level Cascade)
When an ACTIVE user earns daily profit, the system automatically distributes earnings to their referrers:
- **Level 1 (Direct Referral)**: 4% of the user's daily profit → added to referrer's `referralEarnings`
- **Level 2 (Referral's Referral)**: 3% of the user's daily profit → added to L2 referrer's `referralEarnings`
- **Level 3 (3rd Generation)**: 2% of the user's daily profit → added to L3 referrer's `referralEarnings`

**Example**: If a user earns $100 daily profit:
- Their direct referrer gets: $4.00 (4%) added to referralEarnings
- Their referrer's referrer gets: $3.00 (3%) added to referralEarnings
- The 3rd level referrer gets: $2.00 (2%) added to referralEarnings
- Total distributed: $9.00 (9% of daily profit)

**Important**: Referral earnings are stored in `referralEarnings` field (separate from main balance). Users can reinvest this amount to their main balance using the "Reinvest" button in the Invite tab.

### 3. Database Schema

#### User Table (Extended)
```prisma
model User {
  // ... existing fields
  referredBy        String?  // Telegram ID of referrer
  referralEarnings  Float @default(0)  // Total earned from referrals
  referrals         Referral[] @relation("UserReferrals")
}
```

#### Referral Table (New)
```prisma
model Referral {
  id                Int      @id @default(autoincrement())
  userId            Int      // The referrer's ID
  referredUserId    Int      // The referred user's ID
  referredUsername  String   // Username for display
  level             Int      // 1, 2, or 3
  earnings          Float @default(0)  // Total earned from this referral
  createdAt         DateTime @default(now())
  user              User @relation("UserReferrals", fields: [userId], references: [id])
}
```

#### DailyProfitUpdate Table (New)
```prisma
model DailyProfitUpdate {
  id          Int      @id @default(autoincrement())
  userId      Int      // User's internal ID
  amount      Float    // Profit amount for this update
  timestamp   DateTime // When this update "occurs"
  dailyTotal  Float    // Total daily profit (for display)
  createdAt   DateTime @default(now())
}
```

## Implementation Details

### Bot Logic (index.ts)

#### 1. New User Registration with Referral
```typescript
// Parse referral code from /start command
const startPayload = ctx.match as string
let referrerId: string | null = null

if (startPayload && startPayload.startsWith('ref5')) {
  referrerId = startPayload.slice(4) // Extract telegram ID
}

// Create user with referredBy field
user = await prisma.user.create({
  data: {
    telegramId,
    username: ctx.from?.username,
    firstName: ctx.from?.first_name,
    lastName: ctx.from?.last_name,
    referredBy: referrerId
  }
})

// Create referral chain entries for 3 levels
// - Level 1: Direct referrer
// - Level 2: Referrer's referrer
// - Level 3: Level 2's referrer
```

#### 2. Daily Profit Accrual with Referral Distribution
```typescript
async function accrueDailyProfit() {
  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE', balance: { gt: 0 } }
  })

  for (const user of users) {
    // Calculate and accrue daily profit
    const dailyProfit = (user.balance * planInfo.dailyPercent) / 100
    
    // Update user profit
    await prisma.user.update({
      where: { id: user.id },
      data: {
        profit: user.profit + dailyProfit,
        lastProfitUpdate: new Date()
      }
    })

    // Distribute referral earnings
    if (user.referredBy) {
      // Level 1: 4%
      const level1Earnings = dailyProfit * 0.04
      await updateReferrerEarnings(level1Referrer, level1Earnings)

      // Level 2: 3%
      if (level1Referrer.referredBy) {
        const level2Earnings = dailyProfit * 0.03
        await updateReferrerEarnings(level2Referrer, level2Earnings)

        // Level 3: 2%
        if (level2Referrer.referredBy) {
          const level3Earnings = dailyProfit * 0.02
          await updateReferrerEarnings(level3Referrer, level3Earnings)
        }
      }
    }
  }
}
```

### API Endpoints (api.ts)

#### 1. Get User Data (Extended)
```
GET /api/user/:telegramId
```
**Response includes**:
```json
{
  "id": "503856039",
  "referralEarnings": 123.45,
  "balance": 21505.35,
  "profit": 1505.35,
  ...
}
```

#### 2. Get User Referrals (New)
```
GET /api/user/:telegramId/referrals
```
**Response**:
```json
{
  "referrals": [
    {
      "id": 1,
      "referredUsername": "john_doe",
      "level": 1,
      "earnings": 45.67,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "totalReferralEarnings": 123.45
}
```

#### 3. Get Daily Profit Updates (New)
```
GET /api/user/:telegramId/daily-updates
```
**Description**: Returns daily profit updates, filtered to show only those with timestamp <= current time.

**Response**:
```json
{
  "updates": [
    {
      "id": 1,
      "userId": 5,
      "amount": 45.67,
      "timestamp": "2024-01-15T08:23:00Z",
      "dailyTotal": 1505.35,
      "createdAt": "2024-01-15T00:00:00Z"
    }
  ],
  "totalUpdates": 7,
  "totalProfit": 1505.35
}
```

#### 4. Reinvest Referral Earnings
```
POST /api/user/:telegramId/referral-reinvest
```
**Description**: Transfers all referral earnings to main balance.

**Response**:
```json
{
  "success": true,
  "reinvestedAmount": 123.45,
  "newBalance": 21628.80,
  "newReferralEarnings": 0,
  "newPlan": "Black"
}
```

### Frontend (App.tsx)

#### Invite Tab Features
1. **Referral Balance Display**: Shows `userData.referralEarnings`
2. **Referral Link**: Automatically generated with user's telegram ID
3. **Copy & Share Buttons**: One-click link sharing
4. **Terms Display**: Visual representation of 3-level earnings (4%, 3%, 2%)
5. **Referrals List**: Shows all referrals with:
   - Username
   - Level (1, 2, or 3)
   - Date joined
   - Total earnings from that referral
   - Percentage rate

## Testing

### Test Scenario 1: New User via Referral Link
1. User A (ID: 123456) shares referral link: `...?start?startapp=ref5123456`
2. User B clicks link and starts bot
3. User B is created with `referredBy = "123456"` (referral pending activation)
4. **No referral records created yet** (waiting for $1000 threshold)
5. Admin adds $1000 to User B's balance
6. System detects `totalDeposit >= 1000` and creates referral chain
7. User A receives notification: "🎉 Referral Activated! @userB reached $1000 deposit!"

### Test Scenario 2: Multi-Level Chain
1. User A refers User B (B has `referredBy = A.telegramId`)
2. User B refers User C (C has `referredBy = B.telegramId`)
3. User C reaches $1000 deposit:
   - Level 1 referral created for User B (direct referrer)
   - Level 2 referral created for User A (B's referrer)
   - Both A and B receive activation notifications

### Test Scenario 3: Earnings Distribution
1. User C has $1000 balance, Black plan (7% daily)
2. Daily accrual runs: User C earns $70
3. Earnings distributed:
   - User B (Level 1): $70 × 0.04 = $2.80
   - User A (Level 2): $70 × 0.03 = $2.10
4. Referral records updated with new earnings
5. Users can see earnings in Invite tab

## Key Constraints

1. **Immutable Referral**: Once `referredBy` is set, it cannot be changed
2. **Activation Threshold**: Referral chain created only when referred user reaches **$1000 total deposit**
3. **Chain Depth**: Maximum 3 levels of referrals
4. **Active Users Only**: Earnings only distributed when referred user is ACTIVE
5. **Daily Accrual**: Earnings calculated once per day during profit accrual
6. **No Self-Referral**: Users cannot refer themselves
7. **One-Time Activation**: Referral chain created only once per user (checked via existing Referral records)

## Future Enhancements

- [ ] Referral bonus on first deposit
- [ ] Leaderboard for top referrers
- [ ] Referral milestones and rewards
- [ ] Withdrawal of referral earnings
- [ ] Real-time notifications for new referrals
- [ ] Analytics dashboard for referral performance
