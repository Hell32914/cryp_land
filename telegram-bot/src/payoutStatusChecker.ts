import { PrismaClient } from '@prisma/client'
import { checkPayoutStatus } from './oxapay.js'

const prisma = new PrismaClient()

// Check status of pending withdrawals and update with blockchain hash
export async function checkPendingPayouts() {
  try {
    // Find all completed withdrawals that have no txHash or fake txHash
    const pendingWithdrawals = await prisma.withdrawal.findMany({
      where: {
        status: 'COMPLETED',
        OR: [
          { txHash: null },
          { txHash: { not: { contains: '0x' } } } // Filter out real blockchain hashes
        ]
      },
      include: { user: true },
      take: 20 // Check max 20 at a time
    })

    if (pendingWithdrawals.length === 0) {
      return
    }

    console.log(`🔍 Checking status of ${pendingWithdrawals.length} withdrawals for blockchain hash...`)

    for (const withdrawal of pendingWithdrawals) {
      try {
        // Skip if no txHash to check
        if (!withdrawal.txHash) {
          continue
        }
        
        const statusData = await checkPayoutStatus(withdrawal.txHash)
        
        // Check if we got a blockchain transaction hash
        const txID = statusData.data?.txID || statusData.txID
        
        if (txID && txID.length === 64) {
          // Update withdrawal with real blockchain hash
          await prisma.withdrawal.update({
            where: { id: withdrawal.id },
            data: { txHash: txID }
          })
          
          console.log(`✅ Updated withdrawal ${withdrawal.id} with blockchain hash: ${txID}`)
          
          // Notify user
          try {
            const { bot } = await import('./index.js')
            await bot.api.sendMessage(
              withdrawal.user.telegramId,
              `✅ *Withdrawal Confirmed in Blockchain!*\n\n` +
              `💰 Amount: $${withdrawal.amount.toFixed(2)}\n` +
              `💎 Currency: ${withdrawal.currency}\n` +
              `🌐 Network: ${withdrawal.network}\n` +
              `🔗 TX Hash: \`${txID}\`\n\n` +
              `You can now track your transaction in blockchain explorer.`,
              { parse_mode: 'Markdown' }
            )
          } catch (err) {
            console.error('Failed to notify user about blockchain confirmation:', err)
          }
        }
      } catch (error: any) {
        console.error(`Failed to check status for withdrawal ${withdrawal.id}:`, error.message)
      }
      
      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  } catch (error) {
    console.error('Error in checkPendingPayouts:', error)
  }
}

// Start periodic checking (every 5 minutes)
export function startPayoutStatusChecker() {
  console.log('🔄 Payout status checker started (checking every 5 minutes)')
  
  // Check immediately on start
  checkPendingPayouts()
  
  // Then check every 5 minutes
  setInterval(() => {
    checkPendingPayouts()
  }, 5 * 60 * 1000) // 5 minutes
}
