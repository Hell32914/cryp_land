import { useState, useEffect } from 'react'
import { Wallet, UserPlus, House, Calculator, User, DotsThreeVertical, X, Copy, Info, TelegramLogo, ChatCircleDots, ShareNetwork, ArrowLeft, QrCode, ClipboardText } from '@phosphor-icons/react'
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
  const [selectedCurrency, setSelectedCurrency] = useState('')
  const [selectedNetwork, setSelectedNetwork] = useState('')
  const [depositAmountInput, setDepositAmountInput] = useState('')
  const [withdrawWalletAddress, setWithdrawWalletAddress] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useKV<Language>('app-language', 'ENGLISH')
  
  const t = translations[selectedLanguage || 'ENGLISH']

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

  const userProfile = {
    id: '503856039',
    nickname: 'dnscxrbl',
    plan: 'Basic',
    status: 'Inactive'
  }

  const tariffPlans = [
    { name: 'Bronze', minDeposit: 10, maxDeposit: 999, dailyPercent: 0.5 },
    { name: 'Silver', minDeposit: 1000, maxDeposit: 4999, dailyPercent: 1.0 },
    { name: 'Gold', minDeposit: 5000, maxDeposit: 34999, dailyPercent: 1.5 },
    { name: 'Platinum', minDeposit: 35000, maxDeposit: 99999, dailyPercent: 2.0 },
    { name: 'Diamond', minDeposit: 100000, maxDeposit: Infinity, dailyPercent: 2.5 }
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

  const quickAmounts = [10, 1000, 5000, 35000, 100000]
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
            <div className="flex gap-1.5 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 sm:w-10 sm:h-10 border border-border/50 text-foreground hover:bg-muted/50 rounded-lg"
              >
                <QrCode size={18} className="sm:w-5 sm:h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 sm:w-10 sm:h-10 border border-border/50 text-foreground hover:bg-muted/50 rounded-lg"
              >
                <ClipboardText size={18} className="sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>

          <div className="px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
            <h2 className="text-lg sm:text-2xl font-bold tracking-wider text-primary uppercase">
              {t.withdrawTitle}
            </h2>

            <p className="text-foreground text-sm sm:text-base">
              {t.availableBalance} <span className="font-bold text-primary">$0.00</span>
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
              >
                CONFIRM WITHDRAW
              </Button>

              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                FEE: <span className="font-bold text-foreground">$0.00</span>
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
            <div className="flex gap-1.5 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 sm:w-10 sm:h-10 border border-border/50 text-foreground hover:bg-muted/50 rounded-lg"
              >
                <QrCode size={18} className="sm:w-5 sm:h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 sm:w-10 sm:h-10 border border-border/50 text-foreground hover:bg-muted/50 rounded-lg"
              >
                <ClipboardText size={18} className="sm:w-5 sm:h-5" />
              </Button>
            </div>
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
            >
              {t.continue}
            </Button>
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
                      href="https://t.me/AiSyntrixTrade_bot" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-all border border-primary/20 cursor-pointer"
                    >
                      <TelegramLogo size={20} weight="fill" className="text-primary sm:w-6 sm:h-6" />
                    </a>
                    <a 
                      href="https://t.me/SyntrixRBT_support" 
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
                      <p className="text-xl sm:text-2xl font-bold text-foreground">$ 0.00</p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className="border-destructive text-destructive bg-destructive/10 px-3 py-1 rounded-lg text-xs"
                    >
                      • {t.inactive}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pb-3 border-b border-dashed border-border/50">
                    <div>
                      <p className="text-muted-foreground text-xs sm:text-sm mb-1">{t.profit}</p>
                      <p className="text-lg sm:text-xl font-bold text-foreground">$0.00</p>
                    </div>
                    <Button 
                      className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base rounded-lg shadow-lg shadow-accent/20 transition-all"
                    >
                      {t.reinvest}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pb-3">
                    <div>
                      <p className="text-muted-foreground text-xs sm:text-sm mb-1">{t.deposit}</p>
                      <p className="text-lg sm:text-xl font-bold text-foreground">$0.00</p>
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
                    <p className="text-foreground font-bold">$10.00 {t.leftUntilBronze}</p>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                    >
                      <Info size={20} />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="h-12 rounded border-2 border-accent flex items-center justify-center bg-background">
                      <span className="text-foreground font-bold">0%</span>
                    </div>
                    <p className="text-center text-foreground font-bold">$0.00 / $10</p>
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
                <h3 className="text-lg font-bold text-foreground mb-4 tracking-wide">{t.dailyUpdate}</h3>
                <p className="text-center text-muted-foreground py-8">{t.noEarningsData}</p>
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
                        href="https://t.me/AiSyntrixTrade_bot" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer"
                      >
                        <TelegramLogo size={24} weight="fill" className="text-primary" />
                      </a>
                      <a 
                        href="https://t.me/SyntrixRBT_support" 
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
                    <p className="text-foreground text-lg">{t.availableBalance} <span className="font-bold">$0.00</span></p>
                    
                    <Button 
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold py-6 text-base"
                      onClick={() => setDepositOpen(true)}
                    >
                      {t.depositBtn}
                    </Button>
                    
                    <button className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors py-2">
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
                    
                    <button className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors py-2">
                      <span className="text-sm">{t.howToWithdraw}</span>
                      <Info size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg p-6 border border-border">
                <h3 className="text-lg font-bold text-foreground mb-4 tracking-wider">{t.transactionsHistory}</h3>
                <p className="text-center text-muted-foreground py-8">{t.noTransactionsYet}</p>
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
                      href="https://t.me/AiSyntrixTrade_bot" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded bg-black flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
                    >
                      <TelegramLogo size={24} weight="fill" className="text-white" />
                    </a>
                    <a 
                      href="https://t.me/SyntrixRBT_support" 
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
                    <p className="text-2xl font-bold text-black">$ 0.00</p>
                  </div>
                  <Button 
                    className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-8 py-6 text-base"
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
                <p className="text-center text-muted-foreground py-8">{t.noReferralsYet}</p>
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
                      href="https://t.me/AiSyntrixTrade_bot" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                      <TelegramLogo size={24} weight="fill" className="text-primary" />
                    </a>
                    <a 
                      href="https://t.me/SyntrixRBT_support" 
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
                      href="https://t.me/AiSyntrixTrade_bot" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded bg-black flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
                    >
                      <TelegramLogo size={24} weight="fill" className="text-white" />
                    </a>
                    <a 
                      href="https://t.me/SyntrixRBT_support" 
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
                    onClick={() => window.open('https://t.me/SyntrixRBT_support', '_blank')}
                  >
                    {t.support}
                  </Button>
                  <Button 
                    className="w-full bg-transparent border-2 border-accent text-accent hover:bg-accent/10 font-bold py-6 text-base uppercase"
                    onClick={() => window.open('https://landing-5dswbi4l5-hell32914s-projects.vercel.app/', '_blank')}
                  >
                    {t.website}
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

