# Deposit & Withdrawal System - OxaPay Integration

## Overview
Syntrix Bot now includes a complete deposit and withdrawal system integrated with OxaPay payment gateway.

## Features

### 1. Deposit System
- **Minimum Deposit**: $10 USD
- **Supported Cryptocurrencies**:
  - USDT (Tether)
  - USDC (USD Coin)
  - BTC (Bitcoin)
  - ETH (Ethereum)
  - SOL (Solana)

#### Deposit Flow:
1. User selects cryptocurrency
2. User enters amount (minimum $10)
3. System generates payment invoice via OxaPay API
4. User receives:
   - QR code for payment
   - Payment address
   - Payment link
5. Payment expires in 30 minutes
6. Status: PENDING → COMPLETED (when paid)

### 2. Withdrawal System
- **Minimum Withdrawal**: $10 USD
- **Supported Networks**:
  - TRC20 (Tron)
  - BEP20 (Binance Smart Chain)
  - ERC20 (Ethereum)
  - Polygon
  - Arbitrum
  - Solana

#### Withdrawal Flow:

**For amounts < $100 (Automatic):**
1. User selects currency and network
2. User enters wallet address and amount
3. System validates balance
4. Withdrawal processed automatically via OxaPay
5. Balance deducted immediately
6. Status: PENDING → PROCESSING → COMPLETED

**For amounts >= $100 (Manual):**
1. User submits withdrawal request
2. System notifies admin via Telegram
3. Admin manually approves/processes
4. Balance NOT deducted until admin confirmation
5. Status: PENDING → (admin action required)

### 3. Transaction History
- Shows all deposits and withdrawals
- Real-time status updates
- Color-coded by type:
  - Green: Deposits (↓)
  - Red: Withdrawals (↑)
- Status badges:
  - PENDING (yellow)
  - PROCESSING (blue)
  - COMPLETED (green)
  - FAILED (red)

## OxaPay Integration

### API Configuration
```typescript
const OXAPAY_API_KEY = 'HB7C0E-DIYI2B-P97EK0-YHMVBS'
const OXAPAY_BASE_URL = 'https://api.oxapay.com'
```

### Create Invoice (Deposit)
```typescript
POST https://api.oxapay.com/merchants/request
{
  "merchant": "API_KEY",
  "amount": 100,
  "currency": "USDT",
  "callbackUrl": "",
  "description": "Syntrix Deposit",
  "lifeTime": 30,
  "feePaidByPayer": 0,
  "underPaidCover": 2
}

Response:
{
  "result": 100,
  "trackId": "xxx",
  "payLink": "https://...",
  "address": "wallet_address",
  "amount": 100
}
```

### Create Payout (Withdrawal)
```typescript
POST https://api.oxapay.com/merchants/payout
{
  "merchant": "API_KEY",
  "address": "user_wallet_address",
  "amount": 50,
  "currency": "USDT",
  "network": "TRC20",
  "callbackUrl": ""
}

Response:
{
  "result": 100,
  "trackId": "yyy",
  "status": "Processing",
  "amount": 50
}
```

## API Endpoints

### Create Deposit Invoice
```
POST /api/user/:telegramId/create-deposit

Body:
{
  "amount": 100,
  "currency": "USDT"
}

Response:
{
  "success": true,
  "depositId": 1,
  "trackId": "xxx",
  "payLink": "https://...",
  "qrCode": "https://...",
  "address": "wallet_address",
  "amount": 100
}
```

### Create Withdrawal Request
```
POST /api/user/:telegramId/create-withdrawal

Body:
{
  "amount": 50,
  "currency": "USDT",
  "address": "user_wallet_address",
  "network": "TRC20"
}

Response (amount < 100):
{
  "success": true,
  "withdrawalId": 1,
  "trackId": "yyy",
  "status": "PROCESSING",
  "message": "Withdrawal is being processed automatically"
}

Response (amount >= 100):
{
  "success": true,
  "withdrawalId": 1,
  "status": "PENDING",
  "message": "Withdrawal request sent to admin for approval"
}
```

### Get Transaction History
```
GET /api/user/:telegramId/transactions

Response:
{
  "transactions": [
    {
      "id": "deposit_1",
      "type": "DEPOSIT",
      "amount": 100,
      "currency": "USDT",
      "status": "COMPLETED",
      "address": "track_id",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "withdrawal_1",
      "type": "WITHDRAWAL",
      "amount": 50,
      "currency": "USDT",
      "status": "PROCESSING",
      "address": "user_wallet",
      "createdAt": "2024-01-15T11:00:00Z"
    }
  ]
}
```

## Database Schema

### Deposit Table
```prisma
model Deposit {
  id          Int      @id @default(autoincrement())
  userId      Int
  user        User     @relation(fields: [userId], references: [id])
  amount      Float
  status      String   @default("PENDING") // PENDING, COMPLETED, FAILED
  currency    String   @default("USDT")
  network     String?
  txHash      String?  // OxaPay trackId
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Withdrawal Table
```prisma
model Withdrawal {
  id          Int      @id @default(autoincrement())
  userId      Int
  user        User     @relation(fields: [userId], references: [id])
  amount      Float
  status      String   @default("PENDING") // PENDING, PROCESSING, COMPLETED, FAILED
  currency    String   @default("USDT")
  network     String?
  address     String   // User's wallet address
  txHash      String?  // OxaPay trackId
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Admin Notifications

When withdrawal amount >= $100, admin receives:
```
🔔 Withdrawal Request

👤 User: @username
💰 Amount: $150.00
💎 Currency: USDT
🌐 Network: TRC20
📍 Address: `TXxx...xxx`

⚠️ Manual approval required (amount >= $100)
```

## Security Considerations

1. **Balance Validation**: System checks user balance before processing withdrawal
2. **Minimum Amounts**: $10 minimum for both deposits and withdrawals
3. **Network Validation**: Only allows supported networks
4. **Address Validation**: User must provide valid wallet address
5. **Manual Review**: Large withdrawals (>= $100) require admin approval
6. **Expiration**: Deposit invoices expire after 30 minutes

## Error Handling

### Common Errors:
- **Insufficient Balance**: `amount > user.balance`
- **Below Minimum**: `amount < $10`
- **Missing Fields**: Currency, network, or address not provided
- **OxaPay API Error**: Network issues or invalid parameters
- **User Not Found**: Invalid telegram ID

## Testing

### Test Deposit:
1. Open Wallet tab
2. Click "DEPOSIT"
3. Select USDT
4. Enter $10
5. Click "CONTINUE"
6. Verify QR code and address appear

### Test Withdrawal (< $100):
1. Open Wallet tab
2. Click "WITHDRAW"
3. Select USDT + TRC20
4. Enter valid address
5. Enter $50
6. Click "CONFIRM WITHDRAW"
7. Verify automatic processing

### Test Withdrawal (>= $100):
1. Follow steps above with $100+
2. Verify admin receives Telegram notification
3. Verify status stays PENDING

## Future Enhancements

- [ ] Webhook support for payment confirmations
- [ ] Email notifications for transactions
- [ ] Transaction receipts/invoices
- [ ] Multiple payment methods
- [ ] Fiat currency support
- [ ] Withdrawal approval interface in bot
- [ ] Transaction analytics dashboard
