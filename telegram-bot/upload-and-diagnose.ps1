# Upload diagnostic files to server and run diagnosis

$SERVER = "root@45.147.248.134"
$REMOTE_PATH = "/root/cryp_land/telegram-bot"
$LOCAL_PATH = "d:\my_repo\cryp_land\telegram-bot"

Write-Host "🚀 Uploading diagnostic files to server..." -ForegroundColor Cyan

# Upload files via SCP
scp "$LOCAL_PATH\check-paypal-issue.cjs" "${SERVER}:${REMOTE_PATH}/"
scp "$LOCAL_PATH\manual-paypal-capture.cjs" "${SERVER}:${REMOTE_PATH}/"
scp "$LOCAL_PATH\diagnose-paypal.sh" "${SERVER}:${REMOTE_PATH}/"
scp "$LOCAL_PATH\PAYPAL_ISSUE_FIX.md" "${SERVER}:${REMOTE_PATH}/"

Write-Host "✅ Files uploaded!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Now run on server:" -ForegroundColor Yellow
Write-Host "  ssh root@45.147.248.134" -ForegroundColor White
Write-Host "  cd /root/cryp_land/telegram-bot" -ForegroundColor White
Write-Host "  chmod +x diagnose-paypal.sh" -ForegroundColor White
Write-Host "  ./diagnose-paypal.sh" -ForegroundColor White
Write-Host ""
Write-Host "Or run directly:" -ForegroundColor Yellow
Write-Host '  ssh root@45.147.248.134 "cd /root/cryp_land/telegram-bot && chmod +x diagnose-paypal.sh && ./diagnose-paypal.sh"' -ForegroundColor White
