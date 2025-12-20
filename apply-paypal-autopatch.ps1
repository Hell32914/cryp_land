# PayPal Auto-Confirm Patch Script
# This script updates the frontend to remove the "I paid - Confirm" button
# and enables automatic payment status checking

Write-Host "🔧 Applying PayPal auto-confirm patch..." -ForegroundColor Cyan

$appFile = "telegram-app\src\App.tsx"

# Read the file
$content = Get-Content $appFile -Raw

# Replace the PayPal payment UI
$oldPayPalUI = @'
                >
                  Continue to PayPal
                </Button>
                <Button
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
                  disabled={!depositPaypalOrderId}
                  onClick={handlePayPalDepositConfirm}
                >
                  I paid — Confirm
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  After payment, tap "Confirm" to finalize your balance update.
                </p>
'@

$newPayPalUI = @'
                  onClick={async () => {
                    window.open(depositPaymentUrl, '_blank')
                    // Start auto-checking status after redirect
                    setTimeout(() => {
                      let attempts = 0
                      const maxAttempts = 20 // Check for 2 minutes
                      const checkInterval = setInterval(async () => {
                        attempts++
                        const completed = await checkPayPalDepositStatus(depositPaypalOrderId)
                        if (completed || attempts >= maxAttempts) {
                          clearInterval(checkInterval)
                          if (!completed && attempts >= maxAttempts) {
                            toast.info('⏳ Payment processing. Refresh to check.')
                          }
                        }
                      }, 6000) // Check every 6 seconds
                    }, 5000)
                  }}
                >
                  Pay with PayPal 👉
                </Button>
                <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <span className="text-lg">ℹ️</span>
                  <p className="text-xs text-foreground">
                    After payment on PayPal, return here. Balance updates automatically within 1-2 minutes.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={async () => {
                    const completed = await checkPayPalDepositStatus(depositPaypalOrderId)
                    if (!completed) {
                      toast.info('⏳ Payment still processing...')
                    }
                  }}
                >
                  🔄 Check Status Now
                </Button>
'@

if ($content -match [regex]::Escape($oldPayPalUI)) {
    $content = $content.Replace($oldPayPalUI, $newPayPalUI)
    Set-Content $appFile -Value $content -NoNewline
    Write-Host "✅ PayPal UI updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Changes:" -ForegroundColor Yellow
    Write-Host "  ❌ Removed: 'I paid — Confirm' button" -ForegroundColor Red
    Write-Host "  ✅ Added: Auto-check payment status" -ForegroundColor Green
    Write-Host "  ✅ Added: Manual 'Check Status Now' button" -ForegroundColor Green
} else {
    Write-Host "⚠️  Pattern not found. File may already be patched or structure changed." -ForegroundColor Yellow
    Write-Host "Please manually update the file following PAYPAL_AUTO_WEBHOOK.md" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Build frontend: cd telegram-app && npm run build"
Write-Host "  2. Deploy updated frontend"
Write-Host "  3. Configure PayPal webhook (see PAYPAL_AUTO_WEBHOOK.md)"
