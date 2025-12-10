# PowerShell script to update the bot with Supabase connection fix

Write-Host "🔧 Updating Syntrix Bot with Supabase connection fix..." -ForegroundColor Cyan
Write-Host ""

# Check if DATABASE_URL is set in .env
$envFile = ".env"
if (Test-Path $envFile) {
    $databaseUrl = Select-String -Path $envFile -Pattern "DATABASE_URL" | Select-Object -First 1
    
    if ($databaseUrl) {
        Write-Host "📝 Current DATABASE_URL in .env:" -ForegroundColor Yellow
        Write-Host $databaseUrl.Line
        Write-Host ""
        
        if ($databaseUrl.Line -match "file:") {
            Write-Host "❌ WARNING: DATABASE_URL is still pointing to SQLite!" -ForegroundColor Red
            Write-Host "Please update .env with your Supabase PostgreSQL connection string:" -ForegroundColor Red
            Write-Host 'DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"' -ForegroundColor Yellow
            Write-Host ""
            $continue = Read-Host "Do you want to continue anyway? (y/n)"
            if ($continue -ne "y") {
                exit 1
            }
        } else {
            Write-Host "✅ DATABASE_URL looks correct (PostgreSQL)" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️  DATABASE_URL not found in .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  .env file not found" -ForegroundColor Yellow
}
Write-Host ""

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install
Write-Host ""

# Run Prisma generate
Write-Host "🗄️  Generating Prisma client..." -ForegroundColor Cyan
npx prisma generate
Write-Host ""

# Build the project
Write-Host "🔨 Building project..." -ForegroundColor Cyan
npm run build
Write-Host ""

# Check database connection
Write-Host "🔍 Checking database connection..." -ForegroundColor Cyan
npm run db:check
Write-Host ""

Write-Host "✅ Update completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Make sure DATABASE_URL in .env points to Supabase"
Write-Host "2. Start the bot: npm start"
Write-Host "3. Test by sending a message to the bot"
Write-Host ""
