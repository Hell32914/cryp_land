import { useState, useEffect } from 'react'
import { Wallet, UserPlus, House, Calculator, User, DotsThreeVertical, X, Copy, Info, TelegramLogo, ChatCircleDots, ShareNetwork, ArrowLeft } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast, Toaster } from 'sonner'
import { useKV } from '@github/spark/hooks'
import { translations, type Language } from '@/lib/translations'
import { AnimatedBackground } from '@/components/AnimatedBackground'
import { useUserData } from '@/hooks/useUserData'

type TabType = 'wallet' | 'invite' | 'home' | 'calculator' | 'profile'

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home')
  const [depositAmount, setDepositAmount] = useState('100')
  const [timePeriod, setTimePeriod] = useState('7')
  const [reinvest, setReinvest] = useState(false)
  const [incomePlansOpen, setIncomePlansOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const [depositOpen, setDepositOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [faqOpen, setFaqOpen] = useState(false)
  const [whitepaperOpen, setWhitepaperOpen] = useState(false)
  const [securityOpen, setSecurityOpen] = useState(false)
  const [advantagesOpen, setAdvantagesOpen] = useState(false)
  const [howToDepositOpen, setHowToDepositOpen] = useState(false)
  const [howToWithdrawOpen, setHowToWithdrawOpen] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState('')
  const [selectedNetwork, setSelectedNetwork] = useState('')
  const [depositAmountInput, setDepositAmountInput] = useState('')
  const [withdrawWalletAddress, setWithdrawWalletAddress] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useKV<Language>('app-language', 'ENGLISH')
  const [referrals, setReferrals] = useState<any[]>([])
  const [loadingReferrals, setLoadingReferrals] = useState(false)
  const [dailyUpdates, setDailyUpdates] = useState<any[]>([])
  const [loadingDailyUpdates, setLoadingDailyUpdates] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [depositQrCode, setDepositQrCode] = useState<string>('')
  const [depositAddress, setDepositAddress] = useState<string>('')
  const [depositPaymentUrl, setDepositPaymentUrl] = useState<string>('')
  
  const t = translations[selectedLanguage || 'ENGLISH']

  // Get Telegram user ID (fallback to 503856039 for local testing)
  const telegramUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString() || '503856039'
  
  // Fetch real user data from bot API
  const { userData, loading, error, refreshData } = useUserData(telegramUserId)

  // Fetch referrals
  const fetchReferrals = async () => {
    if (!telegramUserId) return

    setLoadingReferrals(true)
    try {
      const API_URL = 'https://api.syntrix.website'
      const response = await fetch(`${API_URL}/api/user/${telegramUserId}/referrals`)
      
      if (response.ok) {
        const data = await response.json()
        setReferrals(data.referrals || [])
      }
    } catch (error) {
      console.error('Error fetching referrals:', error)
    } finally {
      setLoadingReferrals(false)
    }
  }

  // Reinvest referral earnings to balance
  const handleReferralReinvest = async () => {
    if (!userData || userData.referralEarnings <= 0) return

    try {
      const API_URL = 'https://api.syntrix.website'
      const response = await fetch(`${API_URL}/api/user/${telegramUserId}/referral-reinvest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Successfully reinvested $${data.reinvestedAmount.toFixed(2)} referral earnings!`)
        await refreshData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to reinvest referral earnings')
      }
    } catch (error) {
      console.error('Error reinvesting referral earnings:', error)
      toast.error('Network error')
    }
  }

  // Fetch daily updates
  const fetchDailyUpdates = async () => {
    if (!telegramUserId) return

    setLoadingDailyUpdates(true)
    try {
      const API_URL = 'https://api.syntrix.website'
      const response = await fetch(`${API_URL}/api/user/${telegramUserId}/daily-updates`)
      
      if (response.ok) {
        const data = await response.json()
        setDailyUpdates(data.updates || [])
      }
    } catch (error) {
      console.error('Error fetching daily updates:', error)
    } finally {
      setLoadingDailyUpdates(false)
    }
  }

  // Fetch referrals when invite tab is opened
  useEffect(() => {
    if (activeTab === 'invite') {
      fetchReferrals()
    }
  }, [activeTab])

  // Fetch transactions
  const fetchTransactions = async () => {
    if (!telegramUserId) return

    setLoadingTransactions(true)
    try {
      const API_URL = 'https://api.syntrix.website'
      const response = await fetch(`${API_URL}/api/user/${telegramUserId}/transactions`)
      
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoadingTransactions(false)
    }
  }

  // Handle deposit
  const handleDepositSubmit = async () => {
    if (!selectedCurrency || !depositAmountInput) {
      toast.error('Please select currency and enter amount')
      return
    }

    const amount = parseFloat(depositAmountInput)
    if (isNaN(amount) || amount < 10) {
      toast.error('Minimum deposit amount is $10')
      return
    }

    try {
      const API_URL = 'https://api.syntrix.website'
      const response = await fetch(`${API_URL}/api/user/${telegramUserId}/create-deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          currency: selectedCurrency
        })
      })

      if (response.ok) {
        const data = await response.json()
        setDepositQrCode(data.qrCode)
        setDepositAddress(data.address)
        setDepositPaymentUrl(data.paymentUrl)
        toast.success('Deposit invoice created! Please scan QR code or use the address.')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create deposit')
      }
    } catch (error) {
      console.error('Error creating deposit:', error)
      toast.error('Network error')
    }
  }

  // Handle withdrawal
  const handleWithdrawalSubmit = async () => {
    if (!selectedCurrency || !selectedNetwork || !withdrawWalletAddress || !withdrawAmount) {
      toast.error('Please fill all fields')
      return
    }

    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount < 10) {
      toast.error('Minimum withdrawal amount is $10')
      return
    }

    if (!userData || amount > userData.totalDeposit) {
      toast.error('Insufficient balance')
      return
    }

    try {
      const API_URL = 'https://api.syntrix.website'
      const response = await fetch(`${API_URL}/api/user/${telegramUserId}/create-withdrawal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          currency: selectedCurrency,
          address: withdrawWalletAddress,
          network: selectedNetwork
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Show different messages based on withdrawal status
        if (data.status === 'PENDING') {
          toast.success('⏳ Your withdrawal request has been submitted and is awaiting approval. We will notify you shortly!')
        } else if (data.status === 'PROCESSING') {
          toast.success('⏳ Your withdrawal is currently being processed. You will receive a notification once it is complete.')
        } else if (data.status === 'COMPLETED') {
          toast.success('✅ Withdrawal completed successfully!')
        } else {
          toast.success(data.message || 'Withdrawal request created!')
        }
        
        setWithdrawOpen(false)
        setWithdrawWalletAddress('')
        setWithdrawAmount('')
        await refreshData()
        await fetchTransactions()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create withdrawal')
      }
    } catch (error) {
      console.error('Error creating withdrawal:', error)
      toast.error('Network error')
    }
  }

  // Fetch daily updates when home tab is opened and refresh every minute
  useEffect(() => {
    if (activeTab === 'home') {
      fetchDailyUpdates()
      const interval = setInterval(fetchDailyUpdates, 60000) // Update every minute
      return () => clearInterval(interval)
    }
  }, [activeTab])

  // Fetch transactions when wallet tab is opened
  useEffect(() => {
    if (activeTab === 'wallet') {
      fetchTransactions()
    }
  }, [activeTab])

  // Reinvest profit to balance
  const handleReinvest = async () => {
    if (!userData || userData.profit <= 0) return

    try {
      const API_URL = 'https://api.syntrix.website'
      const response = await fetch(`${API_URL}/api/user/${telegramUserId}/reinvest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Reinvest success:', result)
        // Refresh user data to show updated balance and profit
        await refreshData()
      } else {
        const error = await response.json()
        console.error('Reinvest error:', error)
      }
    } catch (err) {
      console.error('Reinvest network error:', err)
    }
  }

  useEffect(() => {
    document.title = t.appTitle
  }, [t.appTitle])

  useEffect(() => {
    // Fix for Telegram Mini App input focus
    const handleFocus = () => {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.expand()
      }
      // Scroll input into view
      setTimeout(() => {
        const activeElement = document.activeElement as HTMLInputElement
        if (activeElement?.tagName === 'INPUT') {
          activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }

    document.addEventListener('focusin', handleFocus)
    return () => document.removeEventListener('focusin', handleFocus)
  }, [])

  // User profile with real data from bot API
  const userProfile = {
    id: userData?.id || telegramUserId || '503856039',
    nickname: userData?.nickname || window.Telegram?.WebApp?.initDataUnsafe?.user?.username || 'User',
    plan: userData?.plan || 'Bronze',
    status: userData?.status || 'INACTIVE',
    // Total Balance = totalDeposit + profit + referralEarnings
    balance: (userData?.totalDeposit || 0) + (userData?.profit || 0) + (userData?.referralEarnings || 0),
    totalDeposit: userData?.totalDeposit || 0,
    totalWithdraw: userData?.totalWithdraw || 0,
    isBlocked: userData?.isBlocked || false,
    kycRequired: userData?.kycRequired || false
  }

  const tariffPlans = [
    { name: 'Bronze', minDeposit: 10, maxDeposit: 99, dailyPercent: 0.5 },
    { name: 'Silver', minDeposit: 100, maxDeposit: 499, dailyPercent: 1.0 },
    { name: 'Gold', minDeposit: 500, maxDeposit: 999, dailyPercent: 2.0 },
    { name: 'Platinum', minDeposit: 1000, maxDeposit: 4999, dailyPercent: 3.0 },
    { name: 'Diamond', minDeposit: 5000, maxDeposit: 19999, dailyPercent: 5.0 },
    { name: 'Black', minDeposit: 20000, maxDeposit: Infinity, dailyPercent: 7.0 }
  ]

  const getPlanByDeposit = (amount: number) => {
    return tariffPlans.find(plan => amount >= plan.minDeposit && amount <= plan.maxDeposit) || tariffPlans[0]
  }

  const calculateProfit = () => {
    const deposit = parseFloat(depositAmount) || 0
    const days = parseInt(timePeriod) || 0
    const plan = getPlanByDeposit(deposit)
    const dailyRate = plan.dailyPercent / 100
    
    if (reinvest) {
      const result = deposit * Math.pow(1 + dailyRate, days)
      return result.toFixed(2)
    } else {
      const result = deposit + (deposit * dailyRate * days)
      return result.toFixed(2)
    }
  }

  const quickAmounts = [10, 100, 500, 1000, 35000, 100000]
  const timePeriods = [
    { value: '7', label: '7 Day' },
    { value: '30', label: '30 Day' },
    { value: '90', label: '90 Day' },
    { value: '365', label: '365 Day' }
  ]

  const handleCopyId = () => {
    navigator.clipboard.writeText(userProfile.id)
    toast.success(t.idCopied, {
      style: {
        background: 'oklch(0.16 0.05 250)',
        color: 'oklch(0.70 0.20 230)',
        border: '1px solid oklch(0.65 0.22 230)',
        fontFamily: 'Inter, sans-serif'
      }
    })
  }

  const referralLink = `https://t.me/AiSyntrixTrade_bot?start?startapp=ref5${userProfile.id}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink)
    toast.success(t.linkCopied, {
      style: {
        background: 'oklch(0.16 0.05 250)',
        color: 'oklch(0.70 0.20 230)',
        border: '1px solid oklch(0.65 0.22 230)',
        fontFamily: 'Inter, sans-serif'
      }
    })
  }

  const handleShareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Syntrix',
        text: 'Join Syntrix',
        url: referralLink
      }).catch(() => {})
    } else {
      handleCopyLink()
    }
  }

  const tabs = [
    { id: 'wallet' as TabType, icon: Wallet, label: t.wallet },
    { id: 'invite' as TabType, icon: UserPlus, label: t.invite },
    { id: 'home' as TabType, icon: House, label: t.home },
    { id: 'calculator' as TabType, icon: Calculator, label: t.calculator },
    { id: 'profile' as TabType, icon: User, label: t.profile }
  ]

  const handleTabClick = (tabId: TabType) => {
    setActiveTab(tabId)
  }

  const incomePlans = [
    { name: 'Bronze', minAmount: '$10-$99', dailyPercent: '0.5%' },
    { name: 'Silver', minAmount: '$100-$499', dailyPercent: '1%' },
    { name: 'Gold', minAmount: '$500-$999', dailyPercent: '2%' },
    { name: 'Platinum', minAmount: '$1000-$4999', dailyPercent: '3%' },
    { name: 'Diamond', minAmount: '$5000-$19999', dailyPercent: '5%' },
    { name: 'Black', minAmount: '$20000+', dailyPercent: '7%' }
  ]

  const languages: Language[] = ['ENGLISH']

  const getLanguageDisplayName = (lang: Language): string => {
    const names: Record<Language, string> = {
      'ENGLISH': 'English'
    }
    return names[lang]
  }

  // Show loading state
  if (loading) {
    return (
      <>
        <AnimatedBackground />
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-foreground/70">Loading user data...</p>
          </div>
        </div>
      </>
    )
  }

  // Show error state
  if (error) {
    return (
      <>
        <AnimatedBackground />
        <Toaster />
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-destructive text-5xl">⚠️</div>
            <h2 className="text-xl font-bold text-foreground">Connection Error</h2>
            <p className="text-foreground/70">{error}</p>
            <Button onClick={refreshData} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Retry
            </Button>
          </div>
        </div>
      </>
    )
  }

  // Show blocked state
  if (userProfile.isBlocked) {
    return (
      <>
        <AnimatedBackground />
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-destructive text-6xl">⛔️</div>
            <h2 className="text-2xl font-bold text-foreground">You are blocked</h2>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <AnimatedBackground />
      <Toaster />
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="bg-card border-2 border-primary/30 w-[calc(100vw-2rem)] sm:max-w-2xl p-0 gap-0 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto rounded-xl">
          <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-border/50 bg-card/50 backdrop-blur-sm">
            <Button
              variant="outline"
              className="border-border text-foreground hover:bg-muted/50 gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4 rounded-lg"
              onClick={() => setWithdrawOpen(false)}
            >
              <ArrowLeft size={16} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">{t.back}</span>
            </Button>
          </div>

          <div className="px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
            <h2 className="text-lg sm:text-2xl font-bold tracking-wider text-primary uppercase">
              {t.withdrawTitle}
            </h2>

            <p className="text-foreground text-sm sm:text-base">
              {t.availableBalance} <span className="font-bold text-primary">${(userData?.totalDeposit || 0).toFixed(2)}</span>
            </p>

            <div className="space-y-2">
              <label className="text-xs sm:text-sm text-muted-foreground font-medium">
                Select Currency
              </label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger className="w-full h-11 sm:h-12 bg-background/50 border-border/50 text-foreground text-sm sm:text-base rounded-lg">
                  <SelectValue placeholder="Select Currency" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/50 rounded-lg">
                  <SelectItem value="usdt">USDT</SelectItem>
                  <SelectItem value="usdc">USDC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs sm:text-sm text-muted-foreground font-medium">
                Select Network
              </label>
              <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                <SelectTrigger className="w-full h-11 sm:h-12 bg-background/50 border-border/50 text-foreground text-sm sm:text-base rounded-lg">
                  <SelectValue placeholder="Select Network" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/50 rounded-lg">
                  <SelectItem value="bep20">BEP20 (BSC)</SelectItem>
                  <SelectItem value="erc20">ERC20 (Ethereum)</SelectItem>
                  <SelectItem value="trc20">TRC20 (Tron)</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="arbitrum">Arbitrum</SelectItem>
                  <SelectItem value="solana">Solana</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-secondary/30 rounded-xl p-3 sm:p-5 space-y-3 sm:space-y-4 border border-border/30">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm text-muted-foreground font-medium">
                  Wallet Address
                </label>
                <Input
                  id="wallet-address"
                  type="text"
                  value={withdrawWalletAddress}
                  onChange={(e) => setWithdrawWalletAddress(e.target.value)}
                  placeholder="Enter wallet address"
                  className="h-10 sm:h-12 bg-background/50 border-border/50 text-foreground text-sm sm:text-base rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm text-muted-foreground font-medium">
                  Amount
                </label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="h-10 sm:h-12 bg-background/50 border-border/50 text-foreground text-sm sm:text-base rounded-lg"
                />
              </div>

              <Button
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold py-4 sm:py-5 text-sm sm:text-base rounded-lg shadow-lg shadow-accent/20 transition-all"
                disabled={!selectedCurrency || !selectedNetwork || !withdrawWalletAddress || !withdrawAmount}
                onClick={handleWithdrawalSubmit}
              >
                CONFIRM WITHDRAW
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Min withdrawal: $10
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="bg-card border-2 border-primary/30 w-[calc(100vw-2rem)] sm:max-w-2xl p-0 gap-0 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto rounded-xl">
          <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-border/50 bg-card/50 backdrop-blur-sm">
            <Button
              variant="outline"
              className="border-border text-foreground hover:bg-muted/50 gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4 rounded-lg"
              onClick={() => setDepositOpen(false)}
            >
              <ArrowLeft size={16} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">{t.back}</span>
            </Button>
          </div>

          <div className="px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
            <h2 className="text-lg sm:text-2xl font-bold tracking-wider text-primary uppercase">
              DEPOSIT
            </h2>

            <div className="space-y-2">
              <label className="text-xs sm:text-sm text-muted-foreground font-medium">
                {t.selectCurrency}
              </label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger className="w-full h-11 sm:h-12 bg-background/50 border-border/50 text-foreground text-sm sm:text-base rounded-lg">
                  <SelectValue placeholder={t.selectCurrency} />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/50 rounded-lg">
                  <SelectItem value="usdt">USDT</SelectItem>
                  <SelectItem value="usdc">USDC</SelectItem>
                  <SelectItem value="btc">Bitcoin</SelectItem>
                  <SelectItem value="eth">Ethereum</SelectItem>
                  <SelectItem value="sol">Solana</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs sm:text-sm text-muted-foreground font-medium">
                {t.enterAmountDollar}
              </label>
              <Input
                id="deposit-amount-input"
                type="number"
                value={depositAmountInput}
                onChange={(e) => setDepositAmountInput(e.target.value)}
                placeholder="Enter amount"
                className="h-11 sm:h-12 bg-background/50 border-border/50 text-foreground text-sm sm:text-base rounded-lg"
              />
            </div>

            <Button
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold py-4 sm:py-5 text-sm sm:text-base rounded-lg shadow-lg shadow-accent/20 transition-all"
              disabled={!selectedCurrency || !depositAmountInput}
              onClick={handleDepositSubmit}
            >
              {t.continue}
            </Button>

            {depositQrCode && (
              <div className="mt-6 p-4 bg-background/50 rounded-lg border border-border space-y-4">
                <h3 className="text-sm font-bold text-foreground">Scan QR Code to Pay</h3>
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <img src={depositQrCode} alt="Payment QR Code" className="w-48 h-48" />
                </div>
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  onClick={() => {
                    if (depositPaymentUrl) {
                      window.open(depositPaymentUrl, '_blank')
                    }
                  }}
                >
                  Open Payment Link
                </Button>
                {depositAddress && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Or send to address:</p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={depositAddress}
                        readOnly
                        className="flex-1 bg-background text-xs"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(depositAddress)
                          toast.success('Address copied!')
                        }}
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground text-center">
                  Payment expires in 30 minutes
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={incomePlansOpen} onOpenChange={setIncomePlansOpen}>
        <DialogContent className="bg-card border-2 border-primary/30 w-[calc(100vw-2rem)] sm:max-w-2xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-wider text-primary uppercase">
              {t.incomePlans}
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-foreground font-bold">{t.plan}</th>
                  <th className="text-left py-3 px-2 text-foreground font-bold">{t.minAmount}</th>
                  <th className="text-left py-3 px-2 text-foreground font-bold">{t.dailyPercent}</th>
                </tr>
              </thead>
              <tbody>
                {incomePlans.map((plan, index) => (
                  <tr key={plan.name} className={index !== incomePlans.length - 1 ? 'border-b border-dashed border-border' : ''}>
                    <td className="py-4 px-2 text-muted-foreground">{plan.name}</td>
                    <td className="py-4 px-2 text-muted-foreground">{plan.minAmount}</td>
                    <td className="py-4 px-2 text-muted-foreground">{plan.dailyPercent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button 
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold py-6 text-base mt-4"
            onClick={() => setIncomePlansOpen(false)}
          >
            {t.close}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={languageOpen} onOpenChange={setLanguageOpen}>
        <DialogContent className="bg-card border-2 border-primary/30 w-[calc(100vw-2rem)] sm:max-w-2xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-wider text-primary uppercase">
              {t.selectLanguage}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            {languages.map((language) => (
              <Button
                key={language}
                variant="outline"
                className={`w-full py-8 text-lg font-bold tracking-wider border-2 transition-all ${
                  selectedLanguage === language
                    ? 'bg-accent/20 border-accent text-accent hover:bg-accent/30'
                    : 'bg-background border-border text-foreground hover:bg-accent/10 hover:border-accent hover:text-accent'
                }`}
                onClick={() => {
                  setSelectedLanguage(language)
                  toast.success(`${t.languageChanged} ${getLanguageDisplayName(language)}`, {
                    style: {
                      background: 'oklch(0.16 0.05 250)',
                      color: 'oklch(0.70 0.20 230)',
                      border: '1px solid oklch(0.65 0.22 230)',
                      fontFamily: 'Inter, sans-serif'
                    }
                  })
                  setLanguageOpen(false)
                }}
              >
                {getLanguageDisplayName(language)}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={faqOpen} onOpenChange={setFaqOpen}>
        <DialogContent className="bg-card border-2 border-primary/30 w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-wider text-primary uppercase">
              Syntrix Bot — FAQ
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-foreground text-sm">
            <p className="text-accent font-semibold">Frequently Asked Questions - Get answers to common questions about Syntrix Bot</p>

            <div>
              <h3 className="font-bold text-accent mb-2">1. General Information</h3>
              
              <p className="text-muted-foreground font-semibold mt-2">Q: What is Syntrix Bot and how does it work?</p>
              <p className="text-muted-foreground ml-2">Syntrix Bot is not just another trading tool — it's a professional algorithm developed by a team of former Wall Street traders with over 20 years of real market experience. All their knowledge and insider understanding of financial markets have been encoded into a simple product: you deposit funds, and the bot trades automatically on your behalf, generating profits of up to 7% per day.</p>

              <p className="text-muted-foreground font-semibold mt-2">Q: Who can use Syntrix Bot?</p>
              <p className="text-muted-foreground ml-2">Anyone over 18 can join. The platform is designed to be simple and accessible for everyday users.</p>

              <p className="text-muted-foreground font-semibold mt-2">Q: What is the minimum deposit required?</p>
              <p className="text-muted-foreground ml-2">You can get started with as little as $10 — a true entry point for everyone.</p>

              <p className="text-muted-foreground font-semibold mt-2">Q: Do I need trading knowledge or experience?</p>
              <p className="text-muted-foreground ml-2">No. The entire process is automated. All you need is a basic ability to use a crypto wallet. Syntrix Bot takes care of the rest.</p>

              <p className="text-muted-foreground font-semibold mt-2">Q: Is it available worldwide?</p>
              <p className="text-muted-foreground ml-2">Yes, Syntrix Bot works everywhere crypto is legally supported. Our client base is global, with users from dozens of countries.</p>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-2">2. Deposits & Withdrawals</h3>
              
              <p className="text-muted-foreground font-semibold mt-2">Q: How do I deposit funds?</p>
              <p className="text-muted-foreground ml-2">Depositing is seamless — simply use the bot's internal payment system, which is fast and intuitive.</p>

              <p className="text-muted-foreground font-semibold mt-2">Q: How do I withdraw money?</p>
              <p className="text-muted-foreground ml-2">Withdrawals work exactly the same way. Funds usually arrive within minutes, depending on blockchain network speed.</p>

              <p className="text-muted-foreground font-semibold mt-2">Q: Are there any fees?</p>
              <p className="text-muted-foreground ml-2">Syntrix Bot does not charge any internal fees. The only cost is the standard blockchain transaction fee charged by the network you choose.</p>

              <p className="text-muted-foreground font-semibold mt-2">Q: Which currencies and networks are supported?</p>
              <p className="text-muted-foreground ml-2">We support 100+ cryptocurrencies across 7 major blockchains, giving you full flexibility to use the assets you already own.</p>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-2">3. Profitability & Risks</h3>
              
              <p className="text-muted-foreground font-semibold mt-2">Q: How much profit can I expect?</p>
              <p className="text-muted-foreground ml-2">Your daily profit depends on your chosen plan and can reach up to 7% per day. With compounding and reinvestment, results can grow significantly over time.</p>

              <p className="text-muted-foreground font-semibold mt-2">Q: Is the profit guaranteed?</p>
              <p className="text-muted-foreground ml-2">Yes. Our strategies have been backtested on decades of market data, showing consistent, stable returns regardless of market cycles.</p>

              <p className="text-muted-foreground font-semibold mt-2">Q: How is risk managed?</p>
              <p className="text-muted-foreground ml-2">Every trade is capped at a maximum of 3% risk, supported by a high win rate. This disciplined risk management is the backbone of our stability.</p>

              <p className="text-muted-foreground font-semibold mt-2">Q: How and when is profit credited?</p>
              <p className="text-muted-foreground ml-2">Profits are distributed several times throughout the day, depending on trading activity. You'll see them instantly reflected in the "Profit" tab inside the bot.</p>

              <p className="text-muted-foreground font-semibold mt-2">Q: Can I lose my initial deposit?</p>
              <p className="text-muted-foreground ml-2">No. Syntrix Bot protects all clients with a Deposit Guarantee Fund. Even in the unlikely event of a failed trade sequence, your initial deposit is secured.</p>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-2">4. Security & Reliability</h3>
              
              <p className="text-muted-foreground font-semibold mt-2">Q: Is my money safe with Syntrix Bot?</p>
              <p className="text-muted-foreground ml-2">Yes. Each client is provided with a dedicated wallet. Funds remain under your control, while the trading bot connects via API to major crypto exchanges to execute trades. We cannot access your funds directly.</p>

              <p className="text-muted-foreground font-semibold mt-2">Q: Can I stop trading anytime?</p>
              <p className="text-muted-foreground ml-2">Yes, after an initial 7-day period. This short time frame ensures the bot can demonstrate consistent results before you decide whether to continue.</p>

              <p className="text-muted-foreground font-semibold mt-2">Q: Who manages the algorithm?</p>
              <p className="text-muted-foreground ml-2">The strategy was built by a professional team of traders and developers, but the trading process itself is fully automated — no human emotions, no mistakes.</p>

              <p className="text-muted-foreground font-semibold mt-2">Q: Is my personal information secure?</p>
              <p className="text-muted-foreground ml-2">Absolutely. All client data is protected with advanced encryption, and we never share or sell information to third parties. Your privacy is a core principle.</p>

              <p className="text-muted-foreground font-semibold mt-2">Q: How transparent is the trading process?</p>
              <p className="text-muted-foreground ml-2">You can track every step inside the bot. From deposits and withdrawals to daily profits — everything is displayed in real time for maximum clarity.</p>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-2">5. Account & Support</h3>
              
              <p className="text-muted-foreground font-semibold mt-2">Q: How do I create an account?</p>
              <p className="text-muted-foreground ml-2">Simply launch Syntrix Bot in Telegram, make a minimum deposit of $10, and you'll unlock the Bronze plan with returns starting at 0.5% per day.</p>

              <p className="text-muted-foreground font-semibold mt-2">Q: What if I have issues with my account?</p>
              <p className="text-muted-foreground ml-2">Our 24/7 support team is always available to resolve any questions, no matter how big or small.</p>

              <p className="text-muted-foreground font-semibold mt-2">Q: How can I contact support?</p>
              <p className="text-muted-foreground ml-2">Just press the "Support" button inside the app, and you'll be instantly connected with our specialists.</p>

              <p className="text-muted-foreground font-semibold mt-2">Q: How do I upgrade my plan?</p>
              <p className="text-muted-foreground ml-2">Choose your desired plan, add the required funds to your balance, and the system will automatically upgrade you.</p>

              <p className="text-muted-foreground font-semibold mt-2">Q: Where can I find tutorials?</p>
              <p className="text-muted-foreground ml-2">We've prepared detailed step-by-step video guides available inside the bot and on our official YouTube channel.</p>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-2">6. How To…</h3>
              
              <p className="text-muted-foreground font-semibold mt-2">Q: How to activate my account?</p>
              <p className="text-muted-foreground ml-2">Your account activates automatically after a minimum deposit of $10, unlocking the Bronze plan with daily returns.</p>

              <p className="text-muted-foreground font-semibold mt-2">Q: How to deposit funds?</p>
              <p className="text-muted-foreground ml-2">Open Syntrix Bot in Telegram, tap Deposit, choose your cryptocurrency and network, then follow the wallet instructions. Funds usually appear in minutes.</p>

              <p className="text-muted-foreground font-semibold mt-2">Q: How to withdraw money?</p>
              <p className="text-muted-foreground ml-2">Go to Withdraw, pick your currency, enter your wallet address, and confirm. Most withdrawals are processed within 5 minutes.</p>

              <p className="text-muted-foreground font-semibold mt-2">Q: How to upgrade my plan?</p>
              <p className="text-muted-foreground ml-2">Select a higher plan in the bot, add the required funds, and the system will automatically switch you to it.</p>

              <p className="text-muted-foreground font-semibold mt-2">Q: How to contact support?</p>
              <p className="text-muted-foreground ml-2">Simply tap the Support button in the bot to connect with our 24/7 support team.</p>

              <p className="text-muted-foreground font-semibold mt-2">Q: How much profit can I earn with Syntrix Bot?</p>
              <p className="text-muted-foreground ml-2 mb-2">Earnings depend on your plan and activity. Returns can reach up to 7% per day, with reinvestment boosting results even further, you can find our income plans list below.</p>
              
              <div className="text-muted-foreground space-y-0.5 ml-2">
                <p><strong>Bronze:</strong> $10-$99 (0.5% daily)</p>
                <p><strong>Silver:</strong> $100-$499 (1% daily)</p>
                <p><strong>Gold:</strong> $500-$999 (2% daily)</p>
                <p><strong>Platinum:</strong> $1000-$4999 (3% daily)</p>
                <p><strong>Diamond:</strong> $5000-$19999 (5% daily)</p>
                <p><strong>Black:</strong> $20000-$100000 (7% daily)</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={whitepaperOpen} onOpenChange={setWhitepaperOpen}>
        <DialogContent className="bg-card border-2 border-primary/30 w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-wider text-primary uppercase">
              Syntrix WhitePaper
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-foreground text-sm">
            <div>
              <h3 className="font-bold text-accent mb-1">1. Introduction</h3>
              <p className="text-muted-foreground mb-2">Syntrix is a next-generation trading algorithm bot, built on Smart Money Concepts (SMC), liquidity analysis, order book analysis, and institutional risk management strategies. Syntrix delivers consistent performance in an unpredictable market through a proven and continuously optimized algorithm.</p>
              <p className="text-muted-foreground mb-1">Syntrix can also be used as a wallet with passive income:</p>
              <ul className="text-muted-foreground ml-4 list-disc space-y-0.5">
                <li>Assets are accessible unless it's margin used in opened trade</li>
                <li>Withdrawal speed: processed by the bot in up to 3 seconds, plus network transaction time</li>
                <li>Secure storage and transparency: blockchain-level verification of transactions</li>
              </ul>
              <p className="text-muted-foreground mt-1">Syntrix combines bank-level reliability, scalper-level speed, and blockchain transparency.</p>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-1">2. Problems in Traditional Trading</h3>
              <p className="text-muted-foreground mb-1">Traditional trading challenges:</p>
              <ul className="text-muted-foreground ml-4 list-disc space-y-0.5">
                <li>Requires years of market experience to generate stable income</li>
                <li>Requires 24/7 monitoring to avoid missed opportunities</li>
                <li>Emotions often lead to poor decisions</li>
                <li>Mistakes can result in capital loss</li>
              </ul>
              <p className="text-muted-foreground mt-2 mb-1">Syntrix solutions:</p>
              <ul className="text-muted-foreground ml-4 list-disc space-y-0.5">
                <li>Fully automated passive income</li>
                <li>Strategies are backtested for 5–10 years, win-rate above 90%</li>
                <li>Strict risk management: maximum 1% risk per trade</li>
              </ul>
              <p className="text-muted-foreground mt-2 mb-1">Example calculation:</p>
              <ul className="text-muted-foreground ml-4 list-disc space-y-0.5">
                <li>Bot capital: $1,000,000</li>
                <li>Risk per trade: $10,000 (1%)</li>
                <li>Risk/Reward ratio: 1:5</li>
                <li>A $10,000 loss is covered by the next profitable trade of $50,000</li>
                <li>Maximum consecutive losses: 2</li>
                <li>Maximum consecutive wins: up to 17</li>
              </ul>
              <p className="text-muted-foreground mt-2 mb-1">Trading specifics:</p>
              <ul className="text-muted-foreground ml-4 list-disc space-y-0.5">
                <li>Trades only cryptocurrency pairs</li>
                <li>Trade duration: 30–60 minutes</li>
                <li>Trades per day: 17–30</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-1">3. Security and Liquidity Pool</h3>
              <p className="text-muted-foreground mb-1">Syntrix provides investor protection through a three-level security system:</p>
              <p className="text-muted-foreground font-semibold mt-2">1. 50% of profits — client payouts</p>
              <ul className="text-muted-foreground ml-4 list-disc space-y-0.5">
                <li>Half of daily profits are distributed to investors</li>
                <li>Syntrix delivers consistent performance through proven and continuously optimized algorithms</li>
              </ul>
              <p className="text-muted-foreground font-semibold mt-2">2. 25% of profits — liquidity reserve pool</p>
              <ul className="text-muted-foreground ml-4 list-disc space-y-0.5">
                <li>Funds stored in an encrypted wallet, inaccessible to the team</li>
                <li>Current reserve pool exceeds investments: $53M vs $48M</li>
              </ul>
              <p className="text-muted-foreground font-semibold mt-2">3. 25% of profits — team and development</p>
              <ul className="text-muted-foreground ml-4 list-disc space-y-0.5">
                <li>25% of net profit after all investor payouts is retained</li>
                <li>Funds allocated to salaries, dividends, bot development, and ecosystem growth</li>
                <li>Creates a win-win scenario for both investors and the team</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-1">4. Who Developed Syntrix</h3>
              <p className="text-muted-foreground mb-1">Syntrix is developed by a team of 40+ specialists, including developers, cybersecurity experts, and support staff. The core leadership consists of former employees of major market-making firms and crypto exchanges such as Binance, OKX, and MEX.</p>
              <p className="text-muted-foreground mb-1">Market makers are professionals managing exchange liquidity:</p>
              <ul className="text-muted-foreground ml-4 list-disc space-y-0.5">
                <li>Create and balance orders to match supply and demand</li>
                <li>Maintain order book depth and trading stability</li>
                <li>Develop internal protocols and ensure platform security</li>
              </ul>
              <p className="text-muted-foreground mt-1">Syntrix leverages 5–10 years of experience in trading, IT, and cybersecurity. The compact team (~50 people) includes C-level experts who built the infrastructure for major exchanges.</p>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-1">5. Registration and Jurisdiction</h3>
              <p className="text-muted-foreground mb-1">Syntrix is registered in Dubai as Syntrix Algo Systems LLC.</p>
              <p className="text-muted-foreground mb-1">Reasons for Dubai registration:</p>
              <ul className="text-muted-foreground ml-4 list-disc space-y-0.5">
                <li>Zero taxation for cryptocurrency businesses</li>
                <li>High security and legal stability</li>
              </ul>
              <p className="text-muted-foreground mt-1">Approximately 80% of the team is based in Dubai, the rest work remotely worldwide.</p>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-1">6. Operating Period and Open Beta</h3>
              <p className="text-muted-foreground"><strong>Closed beta:</strong> 6 years, generating stable profits for the team and private partners</p>
              <p className="text-muted-foreground"><strong>Open beta:</strong> 9+ months, allowing ordinary users with small capital to participate and earn</p>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-1">7. Supported Currencies</h3>
              <ul className="text-muted-foreground ml-4 list-disc space-y-0.5">
                <li>Supports all major cryptocurrencies: USDT, USDC, ETH, Solana, Bitcoin</li>
                <li>Deposits are automatically converted to USDT for internal trading</li>
                <li>Profit is credited in stablecoins, protecting against market volatility</li>
                <li>Withdrawals available only in USDT or USDC</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-1">8. Withdrawal Processing Time</h3>
              <p className="text-muted-foreground"><strong>Bot processing:</strong> 3 seconds</p>
              <p className="text-muted-foreground"><strong>Network time:</strong></p>
              <ul className="text-muted-foreground ml-4 list-disc space-y-0.5">
                <li>USDT BEP20 — up to 20 seconds</li>
                <li>Ethereum — slightly longer</li>
              </ul>
              <p className="text-muted-foreground mt-1"><strong>Total withdrawal:</strong> under 1 minute</p>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-1">9. Risk of Losing Funds</h3>
              <ul className="text-muted-foreground ml-4 list-disc space-y-0.5">
                <li>Maximum risk per trade: 1% of deposit</li>
                <li>25% of profits retained in liquidity reserve to protect against "black swan" events</li>
                <li>Client funds are encrypted and inaccessible to the team</li>
                <li>Multi-layered security implemented by experts from Binance and other exchanges</li>
                <li>Even during consecutive losing trades, investor capital is protected</li>
                <li>Withdrawals exceeding 10% of the account balance without prior notice may negatively affect the trading process and trigger liquidation of certain positions</li>
                <li>All trading operations are carried out at the full discretion and responsibility of the user</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-1">10. Liquidity Reserve Pool</h3>
              <ul className="text-muted-foreground ml-4 list-disc space-y-0.5">
                <li>25% of profits are set aside daily</li>
                <li>Pool exceeds current investments: $53M vs $48M</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-1">11. Trading Strategies</h3>
              <p className="text-muted-foreground mb-1">Syntrix uses:</p>
              <ul className="text-muted-foreground ml-4 list-disc space-y-0.5">
                <li>Smart Money Concepts (SMC)</li>
                <li>ICT strategies</li>
                <li>Liquidity and order book analysis</li>
                <li>Elliott Wave analysis</li>
                <li>Combined technical analysis</li>
              </ul>
              <p className="text-muted-foreground mt-1">Strategies are continuously monitored, improved, or excluded if performance drops.</p>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-1">12. Trade Frequency and Win Rate</h3>
              <ul className="text-muted-foreground ml-4 list-disc space-y-0.5">
                <li><strong>Trade duration:</strong> 30–60 minutes</li>
                <li><strong>Average trades:</strong> ~1 per hour</li>
                <li><strong>Win rate:</strong> 90%+</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-1">13. Risk of Consecutive Losses</h3>
              <ul className="text-muted-foreground ml-4 list-disc space-y-0.5">
                <li>Maximum consecutive losses: 2 stop-losses</li>
                <li>After 3 consecutive losing trades, bot halts trading and reviews strategies</li>
                <li>Liquidity reserve ensures clients still receive profits even during short-term drawdowns</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-1">14. Market Volatility</h3>
              <ul className="text-muted-foreground ml-4 list-disc space-y-0.5">
                <li>Volatility accelerates trades and increases profitability</li>
                <li>Crypto markets are ideal for scalping and short-term trades</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-1">15. Using Syntrix as a Wallet</h3>
              <ul className="text-muted-foreground ml-4 list-disc space-y-0.5">
                <li>Deposit and withdrawal: under 1 minute</li>
                <li>Funds available at any time</li>
                <li>Passive daily income according to chosen plan</li>
                <li>Full security and accessibility of assets</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-1">16. Risk Per Trade</h3>
              <p className="text-muted-foreground mb-1"><strong>Risk Management:</strong></p>
              <ul className="text-muted-foreground ml-4 list-disc space-y-0.5">
                <li>Always 1% risk per trade</li>
                <li>Minimum Risk/Reward: 1:5</li>
              </ul>
              <p className="text-muted-foreground mt-2 mb-1"><strong>Profit Potential:</strong></p>
              <ul className="text-muted-foreground ml-4 list-disc space-y-0.5">
                <li>Potential profit per trade: 5–17%</li>
                <li>Win rate: 90%+</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-1">17. Referral Program</h3>
              <ul className="text-muted-foreground ml-4 list-disc space-y-0.5">
                <li>Three-level program: 4% / 3% / 2% from referral earnings</li>
                <li>Total passive income from three levels: 9%</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-1">18. Pricing Plans</h3>
              <div className="text-muted-foreground space-y-0.5">
                <p><strong>Bronze:</strong> $10–$99 (0.5% daily)</p>
                <p><strong>Silver:</strong> $100–$499 (1% daily)</p>
                <p><strong>Gold:</strong> $500–$999 (2% daily)</p>
                <p><strong>Platinum:</strong> $1000–$4999 (3% daily)</p>
                <p><strong>Diamond:</strong> $5000–$19999 (5% daily)</p>
                <p><strong>Black:</strong> $20000–$100000 (7% daily)</p>
                <p className="mt-1"><strong>Custom plans:</strong> deposits &gt; $100,000 (8%+ daily profit)</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-1">19. Additional Questions</h3>
              <p className="text-muted-foreground font-semibold mt-2">General Information:</p>
              <ul className="text-muted-foreground ml-4 list-disc space-y-0.5">
                <li>Closing a deposit: Investor can withdraw all funds; deposit closes; bot stops generating profit</li>
                <li>Fees: Only network transaction fees apply</li>
                <li>Exchanges: Binance and Bybit, trades via bot API; connecting personal API is prohibited</li>
              </ul>
              <p className="text-muted-foreground font-semibold mt-2">Security system:</p>
              <ul className="text-muted-foreground ml-4 list-disc space-y-0.5">
                <li>Encryption: AES-256, RSA-4096, SHA-512 hashing</li>
                <li>DDoS protection, global backup servers, multi-level authentication</li>
                <li>Bot failure: Liquidity reserve automatically returns all investments and profits</li>
              </ul>
              <p className="text-muted-foreground font-semibold mt-2">Legal & Compliance:</p>
              <ul className="text-muted-foreground ml-4 list-disc space-y-0.5">
                <li>License: Syntrix Algo Systems LLC, Dubai; licensed for algorithmic crypto trading bots</li>
                <li>Not a financial pyramid: Fully transparent transactions, guaranteed percentages, trackable trades</li>
                <li>Difference from staking and mining: Funds never locked, passive income, no mining or electricity fees</li>
              </ul>
              <p className="text-muted-foreground font-semibold mt-2">Terms of Use and Restrictions:</p>
              <p className="text-muted-foreground ml-4">Any form of abuse, exploitation, or manipulation of the Syntrix system or its referral program is strictly prohibited. If detected, the user's account may be permanently suspended without prior notice.</p>
              <p className="text-muted-foreground font-semibold mt-2">Telegram security:</p>
              <ul className="text-muted-foreground ml-4 list-disc space-y-0.5">
                <li>Enable 2FA</li>
                <li>Use a registered SIM card</li>
                <li>Set secret question/answer during registration — allows account recovery if phone/SIM is lost</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={securityOpen} onOpenChange={setSecurityOpen}>
        <DialogContent className="bg-card border-2 border-primary/30 w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-wider text-primary uppercase">
              Security - Syntrix Safety
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-foreground text-sm">
            <p className="text-accent font-semibold">Multi-level protection for your investments and peace of mind</p>
            
            <div>
              <h3 className="font-bold text-accent mb-2">1. Encryption and Fund Protection</h3>
              <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                <li>All client funds are encrypted and stored in a secure liquidity pool. The Syntrix team has no access to your funds</li>
                <li>To secure data and assets, Syntrix uses industry-standard encryption both on the server and inside Telegram:</li>
                <li className="ml-4">• AES-256 – symmetric encryption for data storage and transfer</li>
                <li className="ml-4">• RSA-4096 – asymmetric encryption for secure key exchange and authentication</li>
                <li className="ml-4">• SHA-512 – cryptographic hashing for data integrity and verification</li>
                <li>All bot operations are conducted in a fully encrypted environment, making hacks or fund theft impossible</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-2">2. Liquidity Reserve Pool</h3>
              <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                <li>25% of daily profits are allocated to a reserve liquidity pool, ensuring protection of all investments</li>
                <li>The reserve pool exceeds current investor deposits ($53M vs $48M)</li>
                <li>In case of technical failures, "black swan" events, or unforeseen circumstances, the pool automatically returns all client funds to their wallets</li>
                <li>This system guarantees complete capital safety, even if individual trades result in losses</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-2">3. Risk Management and Trading Safety</h3>
              <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Maximum risk per trade is limited to 1% of the deposit</li>
                <li>Risk/Reward per trade is always at least 1:5, ensuring steady growth even during losing trades</li>
                <li>Maximum consecutive losses are 2 trades. If the bot detects 3 consecutive losses, trading pauses, and strategies are reviewed</li>
                <li>Even under extreme conditions, client capital remains protected thanks to the reserve pool and strict risk management</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-2">4. Security Within Telegram</h3>
              <p className="text-muted-foreground mb-1">To maximize account safety and secure access to Syntrix, users should:</p>
              <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Enable 2FA (two-factor authentication) in Telegram</li>
                <li>Use a registered SIM card to prevent unauthorized account recovery</li>
                <li>Set up a secret question and answer during registration:</li>
                <li className="ml-4">• If a phone or SIM card is lost, access can be restored by confirming the balance and secret question</li>
                <li className="ml-4">• This acts as a third security layer for the account and funds</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-2">5. Server Protection and DDoS Mitigation</h3>
              <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Syntrix servers are protected against DDoS attacks and distributed across multiple regions worldwide</li>
                <li>All servers implement multi-level authentication to minimize hacking risks</li>
                <li>Critical operations are executed within a secure infrastructure inaccessible to external parties</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-2">6. Transparency and Verification</h3>
              <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                <li>All Syntrix trades are trackable via referral codes and PNL screenshots</li>
                <li>Users can request transaction verification through support</li>
                <li>Full transparency ensures the platform is not a financial pyramid and avoids risky or opaque schemes</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-2">7. Backup and Contingency Mechanisms</h3>
              <p className="text-muted-foreground mb-1">In the event of any technical failure or temporary bot downtime:</p>
              <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                <li>The reserve pool automatically returns all investments and profits to clients</li>
                <li>Even under critical events (server outage, network failure), users will not lose funds</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={advantagesOpen} onOpenChange={setAdvantagesOpen}>
        <DialogContent className="bg-card border-2 border-primary/30 w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-wider text-primary uppercase">
              Advantages - Why Choose Syntrix
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-foreground text-sm">
            <p className="text-accent font-semibold">Discover the unique benefits that make Syntrix the best choice for crypto investors</p>
            
            <div>
              <h3 className="font-bold text-accent mb-2">1. Fully Automated Trading</h3>
              <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Trades cryptocurrency pairs 24/7 without user intervention</li>
                <li>Uses Smart Money Concepts (SMC), liquidity analysis, order book reading, and institutional risk management strategies</li>
                <li>No need to monitor charts or make manual decisions</li>
                <li>Generates passive income reliably with minimal effort</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-2">2. High Win Rate and Profitability</h3>
              <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Win-rate of 90%+, based on backtested strategies over 5–10 years</li>
                <li>Risk/Reward ratio is always at least 1:5</li>
                <li>Potential daily profit ranges from 1% to 11%, depending on your subscription plan</li>
                <li>Advanced algorithms allow consistent gains even in volatile markets</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-2">3. Maximum Safety and Capital Protection</h3>
              <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Client funds are encrypted and inaccessible to the team</li>
                <li>Liquidity reserve pool (25% of profits) ensures that all deposits and profits are protected against losses</li>
                <li>Maximum risk per trade is 1% of your deposit</li>
                <li>Multi-layered security implemented on servers and inside Telegram</li>
                <li>Even in rare technical failures or "black swan" events, capital is fully safeguarded</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-2">4. Instant Withdrawals</h3>
              <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Withdrawals processed by the bot in 3 seconds, plus network time</li>
                <li>Funds are always available; no lockups or waiting periods</li>
                <li>Supports withdrawals in USDT or USDC, ensuring stability against market volatility</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-2">5. Complete Transparency</h3>
              <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                <li>All trades and profits are trackable using referral codes and PNL screenshots</li>
                <li>Full visibility ensures no hidden operations and confirms Syntrix is not a financial pyramid</li>
                <li>Users can request transaction verification through support</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-2">6. Licensed and Regulated</h3>
              <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Operates under Syntrix Algo Systems LLC, Dubai</li>
                <li>Licensed for algorithmic crypto trading bots</li>
                <li>Legal and regulatory compliance ensures trustworthiness and long-term reliability</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-2">7. Flexible Wallet Functionality</h3>
              <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Syntrix can be used as a high-yield crypto wallet</li>
                <li>Deposits and withdrawals can be done in under a minute</li>
                <li>Funds remain fully accessible at all times, while generating passive daily income</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-2">8. No Technical Hassle</h3>
              <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Users do not need mining equipment, staking, or electricity costs</li>
                <li>All operations are handled automatically inside the bot</li>
                <li>The bot's algorithms manage market volatility, liquidity, and risk without user involvement</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-2">9. Multi-Level Referral Program</h3>
              <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Earn passive income through a 3-level referral system: 4% / 3% / 2%</li>
                <li>Maximum passive income from referrals: 9%</li>
                <li>Encourages organic growth without compromising your personal investments</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-2">10. Telegram Security Integration</h3>
              <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Optional 2FA protection for user accounts</li>
                <li>Secret question/answer system for account recovery</li>
                <li>Ensures that funds and account access remain completely secure, even if a user loses their phone or SIM card</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-accent mb-2">11. Ideal for Both Beginners and Professionals</h3>
              <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                <li>No prior trading experience needed; Syntrix handles all technical and analytical tasks</li>
                <li>Professionals can leverage advanced trading algorithms without dedicating hours to charts or research</li>
                <li>Perfect solution for those seeking reliable, stress-free crypto income</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={howToDepositOpen} onOpenChange={setHowToDepositOpen}>
        <DialogContent className="bg-card border-2 border-primary/30 w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-wider text-primary uppercase">
              How to Deposit
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-foreground text-sm">
            <ol className="space-y-3 ml-4 list-decimal">
              <li className="text-muted-foreground">
                Click <span className="font-bold text-accent">Deposit</span> on the main wallet screen.
              </li>
              <li className="text-muted-foreground">
                Select the currency (e.g., USDT) and choose the network (e.g., Ethereum).
              </li>
              <li className="text-muted-foreground">
                Enter the amount you want to deposit (minimum $10) and press <span className="font-bold text-accent">Continue</span>.
              </li>
              <li className="text-muted-foreground">
                A deposit page will open with the amount, wallet address, and QR code.
              </li>
              <li className="text-muted-foreground">
                Send the exact amount to the given wallet address within the time limit.
              </li>
              <li className="text-muted-foreground">
                After network confirmation, the funds will appear in your balance.
              </li>
            </ol>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={howToWithdrawOpen} onOpenChange={setHowToWithdrawOpen}>
        <DialogContent className="bg-card border-2 border-primary/30 w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-wider text-primary uppercase">
              How to Withdraw
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-foreground text-sm">
            <ol className="space-y-3 ml-4 list-decimal">
              <li className="text-muted-foreground">
                Click <span className="font-bold text-accent">Withdraw</span> on the main wallet screen.
              </li>
              <li className="text-muted-foreground">
                Select the currency and network.
              </li>
              <li className="text-muted-foreground">
                Enter the recipient's wallet address and the withdrawal amount.
              </li>
              <li className="text-muted-foreground">
                Double-check the details and confirm.
              </li>
              <li className="text-muted-foreground">
                Once processed and confirmed by the network, the funds will arrive in your wallet.
              </li>
            </ol>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border backdrop-blur-sm bg-background/80 sticky top-0 z-40">
        <h1 className="text-lg sm:text-xl font-bold tracking-wider text-primary uppercase">SYNTRIX</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-foreground hover:text-accent transition-colors">
            <DotsThreeVertical size={24} weight="bold" />
          </Button>
          <Button variant="ghost" size="icon" className="text-foreground hover:text-accent transition-colors">
            <X size={24} weight="bold" />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 pb-20">
        <div className="max-w-2xl mx-auto">
          {activeTab === 'home' && (
            <div className="space-y-5 pb-4">
              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-5 sm:p-6 space-y-4 border border-border/50 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <User size={22} weight="duotone" className="text-primary sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-base sm:text-lg font-bold text-foreground">{userProfile.nickname}</span>
                  </div>
                  <div className="flex gap-2">
                    <a 
                      href="https://t.me/+T-daFo58lL4yNDY6" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-all border border-primary/20 cursor-pointer"
                    >
                      <TelegramLogo size={20} weight="fill" className="text-primary sm:w-6 sm:h-6" />
                    </a>
                    <a 
                      href="https://t.me/SyntrixSupport" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-all border border-primary/20 cursor-pointer"
                    >
                      <ChatCircleDots size={20} weight="fill" className="text-primary sm:w-6 sm:h-6" />
                    </a>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start justify-between pb-3 border-b border-dashed border-border/50">
                    <div>
                      <p className="text-muted-foreground text-xs sm:text-sm mb-1">{t.totalBalance}</p>
                      <p className="text-xl sm:text-2xl font-bold text-foreground">$ {((userData?.totalDeposit || 0) + (userData?.profit || 0) + (userData?.referralEarnings || 0)).toFixed(2)}</p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={userProfile.status === 'ACTIVE' ? 'border-green-500 text-green-500 bg-green-500/10 px-3 py-1 rounded-lg text-xs' : 'border-destructive text-destructive bg-destructive/10 px-3 py-1 rounded-lg text-xs'}
                    >
                      • {userProfile.status === 'ACTIVE' ? 'Active' : userProfile.status === 'BLOCKED' ? 'Blocked' : userProfile.status === 'KYC_REQUIRED' ? 'KYC Required' : t.inactive}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pb-3 border-b border-dashed border-border/50">
                    <div>
                      <p className="text-muted-foreground text-xs sm:text-sm mb-1">{t.profit}</p>
                      <p className="text-lg sm:text-xl font-bold text-foreground">${(userData?.profit || 0).toFixed(2)}</p>
                    </div>
                    <Button 
                      className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base rounded-lg shadow-lg shadow-accent/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleReinvest}
                      disabled={!userData || userData.profit <= 0}
                    >
                      {t.reinvest}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pb-3">
                    <div>
                      <p className="text-muted-foreground text-xs sm:text-sm mb-1">{t.deposit}</p>
                      <p className="text-lg sm:text-xl font-bold text-foreground">${(userData?.totalDeposit || 0).toFixed(2)}</p>
                    </div>
                    <Button 
                      className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base rounded-lg shadow-lg shadow-accent/20 transition-all"
                      onClick={() => setDepositOpen(true)}
                    >
                      {t.depositBtn}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg p-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                  <svg className="w-full h-full">
                    <pattern id="circuit-home" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                      <path d="M10 10h20M30 10v20M30 30h20M50 30v20M50 50h20" stroke="currentColor" strokeWidth="1" fill="none" className="text-primary"/>
                      <circle cx="30" cy="10" r="2" fill="currentColor" className="text-primary"/>
                      <circle cx="30" cy="30" r="2" fill="currentColor" className="text-primary"/>
                      <circle cx="50" cy="30" r="2" fill="currentColor" className="text-primary"/>
                      <circle cx="50" cy="50" r="2" fill="currentColor" className="text-primary"/>
                    </pattern>
                    <rect x="0" y="0" width="100%" height="100%" fill="url(#circuit-home)"/>
                  </svg>
                </div>

                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-foreground font-bold">
                      {userData?.planProgress?.nextPlan 
                        ? `$${userData.planProgress.leftUntilNext.toFixed(2)} left until ${userData.planProgress.nextPlan}`
                        : '🏆 Highest plan achieved!'}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => setIncomePlansOpen(true)}
                    >
                      <Info size={20} />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="h-12 rounded border-2 border-accent overflow-hidden bg-background relative">
                      <div 
                        className="h-full bg-accent/20 transition-all duration-500"
                        style={{ width: `${userData?.planProgress?.progress || 0}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-foreground font-bold">
                        {userData?.planProgress?.progress?.toFixed(0) || 0}%
                      </span>
                    </div>
                    <p className="text-center text-foreground font-semibold">
                      {userData?.planProgress?.currentPlan || userProfile.plan} ({userData?.planProgress?.dailyPercent || 0}% daily)
                    </p>
                  </div>

                  <Button 
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold py-6 text-base"
                    onClick={() => setIncomePlansOpen(true)}
                  >
                    {t.incomePlans}
                  </Button>
                </div>
              </div>

              <div className="bg-card rounded-lg p-6">
                <h3 className="text-lg font-bold text-foreground mb-4 tracking-wide uppercase">{t.dailyUpdate}</h3>
                {loadingDailyUpdates ? (
                  <p className="text-center text-muted-foreground py-8">Loading updates...</p>
                ) : dailyUpdates.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">{t.noEarningsData}</p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {dailyUpdates.map((update, index) => (
                      <div 
                        key={update.id}
                        className="flex items-center justify-between p-3 bg-accent/5 hover:bg-accent/10 rounded-lg border border-accent/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-accent">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              +${update.amount.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(update.timestamp).toLocaleTimeString('en-US', { 
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {userData?.planProgress?.currentPlan}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-muted-foreground">Total Daily Profit</p>
                        <p className="text-lg font-bold text-accent">
                          +${dailyUpdates.length > 0 ? dailyUpdates[0].dailyTotal.toFixed(2) : '0.00'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">Updates shown</p>
                        <p className="text-xs font-semibold text-foreground">
                          {dailyUpdates.length} updates today
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'wallet' && (
            <div className="space-y-6 pb-4">
              <div className="relative overflow-hidden rounded-lg bg-card border border-border p-6">
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                  <svg className="w-full h-full">
                    <pattern id="circuit-wallet" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                      <path d="M10 10h20M30 10v20M30 30h20M50 30v20M50 50h20" stroke="currentColor" strokeWidth="1" fill="none" className="text-primary"/>
                      <circle cx="30" cy="10" r="2" fill="currentColor" className="text-primary"/>
                      <circle cx="30" cy="30" r="2" fill="currentColor" className="text-primary"/>
                      <circle cx="50" cy="30" r="2" fill="currentColor" className="text-primary"/>
                      <circle cx="50" cy="50" r="2" fill="currentColor" className="text-primary"/>
                    </pattern>
                    <rect x="0" y="0" width="100%" height="100%" fill="url(#circuit-wallet)"/>
                  </svg>
                </div>

                <div className="relative space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center">
                        <User size={24} weight="duotone" className="text-primary" />
                      </div>
                      <span className="text-lg font-bold text-foreground">{userProfile.nickname}</span>
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href="https://t.me/+T-daFo58lL4yNDY6" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer"
                      >
                        <TelegramLogo size={24} weight="fill" className="text-primary" />
                      </a>
                      <a 
                        href="https://t.me/SyntrixSupport" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer"
                      >
                        <ChatCircleDots size={24} weight="fill" className="text-primary" />
                      </a>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold tracking-wider text-foreground">
                    {t.manageYourBalance}
                  </h2>

                  <div className="space-y-4">
                    <p className="text-foreground text-lg">{t.availableBalance} <span className="font-bold">${(userData?.totalDeposit || 0).toFixed(2)}</span></p>
                    
                    <Button 
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold py-6 text-base"
                      onClick={() => setDepositOpen(true)}
                    >
                      {t.depositBtn}
                    </Button>
                    
                    <button 
                      className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors py-2"
                      onClick={() => setHowToDepositOpen(true)}
                    >
                      <span className="text-sm">{t.howToDeposit}</span>
                      <Info size={16} />
                    </button>

                    <Button 
                      variant="outline"
                      className="w-full border-2 border-accent text-accent hover:bg-accent/10 font-bold py-6 text-base"
                      onClick={() => setWithdrawOpen(true)}
                    >
                      {t.withdraw}
                    </Button>
                    
                    <button 
                      className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors py-2"
                      onClick={() => setHowToWithdrawOpen(true)}
                    >
                      <span className="text-sm">{t.howToWithdraw}</span>
                      <Info size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg p-6 border border-border">
                <h3 className="text-lg font-bold text-foreground mb-4 tracking-wider">{t.transactionsHistory}</h3>
                {loadingTransactions ? (
                  <p className="text-center text-muted-foreground py-8">Loading transactions...</p>
                ) : transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">{t.noTransactionsYet}</p>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border/30 hover:border-accent/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            tx.type === 'DEPOSIT' ? 'bg-green-500/20' : 'bg-red-500/20'
                          }`}>
                            <span className="text-sm font-bold">
                              {tx.type === 'DEPOSIT' ? '↓' : '↑'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {tx.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {tx.currency} • {new Date(tx.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${
                            tx.type === 'DEPOSIT' ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {tx.type === 'DEPOSIT' ? '+' : '-'}${tx.amount.toFixed(2)}
                          </p>
                          <p className="text-xs">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                              tx.status === 'COMPLETED' ? 'bg-green-500/20 text-green-500' :
                              tx.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500' :
                              tx.status === 'PROCESSING' ? 'bg-blue-500/20 text-blue-500' :
                              'bg-red-500/20 text-red-500'
                            }`}>
                              {tx.status}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'invite' && (
            <div className="space-y-6 pb-4">
              <div className="bg-white rounded-lg p-6 space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded bg-black flex items-center justify-center">
                      <User size={24} weight="duotone" className="text-white" />
                    </div>
                    <span className="text-lg font-bold text-black">{userProfile.nickname}</span>
                  </div>
                  <div className="flex gap-2">
                    <a 
                      href="https://t.me/+T-daFo58lL4yNDY6" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded bg-black flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
                    >
                      <TelegramLogo size={24} weight="fill" className="text-white" />
                    </a>
                    <a 
                      href="https://t.me/SyntrixSupport" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded bg-black flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
                    >
                      <ChatCircleDots size={24} weight="fill" className="text-white" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">{t.referralBalance}</p>
                    <p className="text-2xl font-bold text-black">$ {(userData?.referralEarnings || 0).toFixed(2)}</p>
                  </div>
                  <Button 
                    className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-8 py-6 text-base"
                    disabled={!userData || userData.referralEarnings <= 0}
                    onClick={handleReferralReinvest}
                  >
                    {t.reinvest}
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-bold text-black tracking-wider">{t.yourReferralLink}</h3>
                
                <div className="flex items-center gap-2">
                  <Input
                    value={referralLink}
                    readOnly
                    className="flex-1 bg-gray-100 border-gray-300 text-black text-sm h-12"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-12 w-12 text-black hover:text-accent hover:bg-gray-100 shrink-0"
                    onClick={handleCopyLink}
                  >
                    <Copy size={24} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-12 w-12 text-black hover:text-accent hover:bg-gray-100 shrink-0"
                    onClick={handleShareLink}
                  >
                    <ShareNetwork size={24} />
                  </Button>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-lg bg-background border border-border p-6">
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                  <svg className="w-full h-full">
                    <pattern id="circuit-invite" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                      <path d="M10 10h20M30 10v20M30 30h20M50 30v20M50 50h20" stroke="currentColor" strokeWidth="1" fill="none" className="text-primary"/>
                      <circle cx="30" cy="10" r="2" fill="currentColor" className="text-primary"/>
                      <circle cx="30" cy="30" r="2" fill="currentColor" className="text-primary"/>
                      <circle cx="50" cy="30" r="2" fill="currentColor" className="text-primary"/>
                      <circle cx="50" cy="50" r="2" fill="currentColor" className="text-primary"/>
                    </pattern>
                    <rect x="0" y="0" width="100%" height="100%" fill="url(#circuit-invite)"/>
                  </svg>
                </div>

                <div className="relative space-y-4">
                  <h3 className="text-lg font-bold text-foreground tracking-wider">{t.termsOfTheProgram}</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-3 border-b border-dashed border-border">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          <div className="w-2 h-2 rounded-full bg-accent"></div>
                          <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                          <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                        </div>
                        <span className="text-foreground text-sm">{t.friendDeposit}</span>
                      </div>
                      <span className="text-foreground font-bold">- {t.earnings} 4%</span>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-dashed border-border">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          <div className="w-2 h-2 rounded-full bg-accent"></div>
                          <div className="w-2 h-2 rounded-full bg-accent"></div>
                          <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                        </div>
                        <span className="text-foreground text-sm">{t.friendOfAFriend}</span>
                      </div>
                      <span className="text-foreground font-bold">- {t.earnings} 3%</span>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          <div className="w-2 h-2 rounded-full bg-accent"></div>
                          <div className="w-2 h-2 rounded-full bg-accent"></div>
                          <div className="w-2 h-2 rounded-full bg-accent"></div>
                        </div>
                        <span className="text-foreground text-sm">{t.thirdLevel}</span>
                      </div>
                      <span className="text-foreground font-bold">- {t.earnings} 2%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-background rounded-lg p-6 border border-border">
                <h3 className="text-lg font-bold text-foreground mb-4 tracking-wider">{t.yourReferrals}</h3>
                
                {loadingReferrals ? (
                  <p className="text-center text-muted-foreground py-8">Loading referrals...</p>
                ) : referrals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">{t.noReferralsYet}</p>
                ) : (
                  <div className="space-y-3">
                    {referrals.map((referral) => (
                      <div 
                        key={referral.id}
                        className="flex items-center justify-between p-4 bg-card rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                            <User size={20} weight="duotone" className="text-accent-foreground" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">@{referral.referredUsername}</p>
                            <p className="text-xs text-muted-foreground">
                              Level {referral.level} • {new Date(referral.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-accent">+${referral.earnings.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            {referral.level === 1 ? '4%' : referral.level === 2 ? '3%' : '2%'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'calculator' && (
            <div className="space-y-6 pb-4">
              <div className="relative overflow-hidden rounded-lg bg-card border border-border p-4 sm:p-6">
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                  <svg className="w-full h-full">
                    <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                      <path d="M10 10h20M30 10v20M30 30h20M50 30v20M50 50h20" stroke="currentColor" strokeWidth="1" fill="none" className="text-primary"/>
                      <circle cx="30" cy="10" r="2" fill="currentColor" className="text-primary"/>
                      <circle cx="30" cy="30" r="2" fill="currentColor" className="text-primary"/>
                      <circle cx="50" cy="30" r="2" fill="currentColor" className="text-primary"/>
                      <circle cx="50" cy="50" r="2" fill="currentColor" className="text-primary"/>
                    </pattern>
                    <rect x="0" y="0" width="100%" height="100%" fill="url(#circuit)"/>
                  </svg>
                </div>
                
                <div className="relative flex items-center justify-between mb-6 sm:mb-8">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <User size={20} weight="duotone" className="text-primary sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-base sm:text-lg font-bold text-foreground truncate">{userProfile.nickname}</span>
                  </div>
                  <div className="flex gap-1.5 sm:gap-2 shrink-0">
                    <a 
                      href="https://t.me/+T-daFo58lL4yNDY6" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                      <TelegramLogo size={24} weight="fill" className="text-primary" />
                    </a>
                    <a 
                      href="https://t.me/SyntrixSupport" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                      <ChatCircleDots size={24} weight="fill" className="text-primary" />
                    </a>
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold tracking-wider text-foreground mb-4 sm:mb-6">
                  {t.calculateYourProfit}
                </h2>

                <div className="space-y-5 sm:space-y-6">
                  <div className="space-y-2 sm:space-y-3">
                    <label className="text-sm sm:text-base font-medium text-foreground" htmlFor="deposit-amount">{t.depositAmount}</label>
                    <Input
                      id="deposit-amount"
                      type="number"
                      inputMode="decimal"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder={t.enterAmount}
                      className="bg-background border-border text-foreground text-base sm:text-lg h-12 sm:h-14"
                      autoComplete="off"
                      readOnly={false}
                    />
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
                      {quickAmounts.map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          onClick={() => setDepositAmount(amount.toString())}
                          className="border-border text-foreground hover:bg-accent hover:text-accent-foreground text-xs sm:text-sm px-1 sm:px-4 h-9 sm:h-10 whitespace-nowrap"
                        >
                          {amount >= 1000 ? `$${(amount / 1000).toFixed(0)}K` : `$${amount}`}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <label className="text-sm sm:text-base font-medium text-foreground" htmlFor="time-period">{t.timePeriodSelection}</label>
                    <Input
                      id="time-period"
                      type="number"
                      inputMode="numeric"
                      value={timePeriod}
                      onChange={(e) => setTimePeriod(e.target.value)}
                      placeholder={t.enterDays}
                      className="bg-background border-border text-foreground text-base sm:text-lg h-12 sm:h-14"
                      autoComplete="off"
                      readOnly={false}
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                      {timePeriods.map((period) => (
                        <Button
                          key={period.value}
                          variant="outline"
                          onClick={() => setTimePeriod(period.value)}
                          className="border-border text-foreground hover:bg-accent hover:text-accent-foreground text-xs sm:text-sm h-9 sm:h-10"
                        >
                          {period.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 sm:py-4">
                    <label className="text-sm sm:text-base font-medium text-foreground">{t.reinvestToggle}</label>
                    <Switch
                      checked={reinvest}
                      onCheckedChange={setReinvest}
                      className="data-[state=checked]:bg-accent"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-accent/20 border border-accent rounded-lg p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base sm:text-lg font-bold text-foreground">{t.approximateCalculation}</h3>
                  <div className="flex items-center gap-2 px-3 py-1 bg-accent/30 rounded-full">
                    <span className="text-xs sm:text-sm font-bold text-accent">{getPlanByDeposit(parseFloat(depositAmount || '0')).name}</span>
                    <span className="text-xs sm:text-sm text-foreground">·</span>
                    <span className="text-xs sm:text-sm font-bold text-accent">{getPlanByDeposit(parseFloat(depositAmount || '0')).dailyPercent}%/day</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-lg sm:text-2xl font-bold">
                  <span className="text-foreground break-all">${parseFloat(depositAmount || '0').toLocaleString()}</span>
                  <span className="text-muted-foreground">+</span>
                  <span className="text-foreground whitespace-nowrap">{timePeriod || '0'} {t.day}</span>
                  <span className="text-muted-foreground">=</span>
                  <span className="text-accent break-all">${parseFloat(calculateProfit()).toLocaleString()}</span>
                </div>
                <div className="text-center text-sm text-muted-foreground pt-2">
                  {t.profitText} ${(parseFloat(calculateProfit()) - parseFloat(depositAmount || '0')).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6 pb-4">
              <div className="bg-white rounded-t-xl p-6 space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded bg-black flex items-center justify-center">
                      <User size={24} weight="duotone" className="text-white" />
                    </div>
                    <span className="text-lg font-bold text-black">{userProfile.nickname}</span>
                  </div>
                  <div className="flex gap-2">
                    <a 
                      href="https://t.me/+T-daFo58lL4yNDY6" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded bg-black flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
                    >
                      <TelegramLogo size={24} weight="fill" className="text-white" />
                    </a>
                    <a 
                      href="https://t.me/SyntrixSupport" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded bg-black flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
                    >
                      <ChatCircleDots size={24} weight="fill" className="text-white" />
                    </a>
                  </div>
                </div>

                <h2 className="text-2xl font-bold tracking-wider text-black">
                  {t.profileTitle}
                </h2>

                <div className="space-y-0">
                  <div className="flex items-center justify-between py-4 border-b border-dashed border-gray-300">
                    <span className="text-gray-600 text-sm">{t.id}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-black font-medium">{userProfile.id}</span>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-gray-600 hover:text-black hover:bg-gray-100"
                        onClick={handleCopyId}
                      >
                        <Copy size={18} />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-dashed border-gray-300">
                    <span className="text-gray-600 text-sm">{t.nickname}</span>
                    <span className="text-black font-medium">{userProfile.nickname}</span>
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-dashed border-gray-300">
                    <span className="text-gray-600 text-sm">{t.currentPlan}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-black font-medium">{userProfile.plan}</span>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-gray-600 hover:text-black hover:bg-gray-100"
                        onClick={() => setIncomePlansOpen(true)}
                      >
                        <Info size={18} />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-4">
                    <span className="text-gray-600 text-sm">{t.status}</span>
                    <span className="text-black font-medium">{userProfile.status}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Button 
                  className="w-full bg-transparent border-2 border-accent text-accent hover:bg-accent/10 font-bold py-6 text-base uppercase"
                  onClick={() => setLanguageOpen(true)}
                >
                  {t.language}
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    className="w-full bg-transparent border-2 border-accent text-accent hover:bg-accent/10 font-bold py-6 text-base uppercase"
                    onClick={() => window.open('https://t.me/SyntrixSupport', '_blank')}
                  >
                    {t.support}
                  </Button>
                  <Button 
                    className="w-full bg-transparent border-2 border-accent text-accent hover:bg-accent/10 font-bold py-6 text-base uppercase"
                    onClick={() => window.open('https://syntrix.website', '_blank')}
                  >
                    {t.website}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    className="w-full bg-transparent border-2 border-accent text-accent hover:bg-accent/10 font-bold py-6 text-base uppercase"
                    onClick={() => setFaqOpen(true)}
                  >
                    FAQ
                  </Button>
                  <Button 
                    className="w-full bg-transparent border-2 border-accent text-accent hover:bg-accent/10 font-bold py-6 text-base uppercase"
                    onClick={() => setWhitepaperOpen(true)}
                  >
                    Whitepaper
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    className="w-full bg-transparent border-2 border-accent text-accent hover:bg-accent/10 font-bold py-6 text-base uppercase"
                    onClick={() => setSecurityOpen(true)}
                  >
                    Security
                  </Button>
                  <Button 
                    className="w-full bg-transparent border-2 border-accent text-accent hover:bg-accent/10 font-bold py-6 text-base uppercase"
                    onClick={() => setAdvantagesOpen(true)}
                  >
                    Advantages
                  </Button>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-lg bg-black p-8 mt-6">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <svg className="w-full h-full">
                    <pattern id="circuit-profile" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                      <path d="M10 10h20M30 10v20M30 30h20M50 30v20M50 50h20" stroke="currentColor" strokeWidth="1" fill="none" className="text-primary"/>
                      <circle cx="30" cy="10" r="2" fill="currentColor" className="text-primary"/>
                      <circle cx="30" cy="30" r="2" fill="currentColor" className="text-primary"/>
                      <circle cx="50" cy="30" r="2" fill="currentColor" className="text-primary"/>
                      <circle cx="50" cy="50" r="2" fill="currentColor" className="text-primary"/>
                    </pattern>
                    <rect x="0" y="0" width="100%" height="100%" fill="url(#circuit-profile)"/>
                  </svg>
                </div>
                <div className="relative text-center space-y-2">
                  <p className="text-gray-400 text-sm uppercase tracking-wider">{t.welcomeMatrix}</p>
                  <p className="text-gray-400 text-sm uppercase tracking-wider">{t.profitsNotRandom}</p>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-center text-sm text-muted-foreground">@AiSyntrixTrade_bot</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-border/50 bg-card/80 backdrop-blur-md z-50 shadow-lg">
        <div className="flex items-center justify-around px-2 safe-bottom">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 transition-all relative ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b-full" />
                )}
                <Icon size={24} weight={isActive ? 'fill' : 'regular'} className="transition-all" />
                <span className={`text-xs font-medium transition-all ${isActive ? 'font-semibold' : ''}`}>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
      </div>
    </>
  )
}

export default App



