import { useState, useEffect, useRef, useCallback } from 'react'
import { Wallet, UserPlus, House, Calculator, User, DotsThreeVertical, X, Copy, Info, TelegramLogo, ChatCircleDots, ShareNetwork, ArrowLeft, ChartLineUp, Gift, ArrowsLeftRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast, Toaster } from 'sonner'
import { useKV } from '@github/spark/hooks'
import { translations, type Language } from '@/lib/translations'
import { type WhitepaperParagraph, type WhitepaperListItem } from '@/lib/whitepaperContent'
import { AnimatedBackground } from '@/components/AnimatedBackground'
import { useUserData } from '@/hooks/useUserData'
import { AiAnalyticsTab } from '@/components/AiAnalyticsTab'
import { GameTab } from '@/components/GameTab'
import { TradeTab } from '@/components/TradeTab'

type TabType = 'wallet' | 'invite' | 'home' | 'calculator' | 'trade' | 'game' | 'ai' | 'profile'

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
  const [storedLanguage, setStoredLanguage] = useKV<Language>('app-language', 'ENGLISH')
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(storedLanguage || 'ENGLISH')
  const didApplyRefLanguage = useRef(false)
  const [referrals, setReferrals] = useState<any[]>([])
  const [loadingReferrals, setLoadingReferrals] = useState(false)
  const [dailyUpdates, setDailyUpdates] = useState<any[]>([])
  const [dailyProfitTotal, setDailyProfitTotal] = useState(0)
  const [loadingDailyUpdates, setLoadingDailyUpdates] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [depositQrCode, setDepositQrCode] = useState<string>('')
  const [depositAddress, setDepositAddress] = useState<string>('')
  const [depositPaymentUrl, setDepositPaymentUrl] = useState<string>('')
  const [depositMethod, setDepositMethod] = useState<'OXAPAY' | 'PAYPAL'>('OXAPAY')
  const [withdrawMethod, setWithdrawMethod] = useState<'OXAPAY' | 'PAYPAL'>('OXAPAY')
  const [withdrawPaypalEmail, setWithdrawPaypalEmail] = useState<string>('')
  const [contactSupportOpen, setContactSupportOpen] = useState(false)
  const [contactSupportTimeLeft, setContactSupportTimeLeft] = useState(0)
  const [contactSupportBonusAmount, setContactSupportBonusAmount] = useState(25)
  const [syntrixTokenInfoOpen, setSyntrixTokenInfoOpen] = useState(false)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Additional gate: user must press Start in the Support bot.
  const requiredSupportBotLink = 'https://t.me/syntrix_support_bot?start=activate'
  const [supportChecked, setSupportChecked] = useState(false)
  const [supportBotStarted, setSupportBotStarted] = useState<boolean | null>(null)
  const [supportError, setSupportError] = useState<string | null>(null)
  const [supportBotLink, setSupportBotLink] = useState<string>(requiredSupportBotLink)

  // Mini app: hide PayPal deposit option (UI) while keeping code paths intact.
  const enablePayPalDeposit = false

  // Sync local language from persisted storage (useKV can be async depending on environment).
  useEffect(() => {
    if (!storedLanguage) return
    if (storedLanguage !== selectedLanguage) {
      setSelectedLanguage(storedLanguage)
    }
  }, [storedLanguage])

  // Safety: if PayPal deposits are disabled, force back to crypto.
  useEffect(() => {
    if (enablePayPalDeposit) return
    if (depositMethod !== 'PAYPAL') return
    setDepositMethod('OXAPAY')
    setDepositQrCode('')
    setDepositAddress('')
    setDepositPaymentUrl('')
  }, [depositMethod])
  
  const t = translations[selectedLanguage || 'ENGLISH']

  const formatUsd = (value: number) => {
    const safe = Number.isFinite(value) ? value : 0
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safe)
  }

  const mapLanguageCodeToAppLanguage = (code?: string | null): Language => {
    if (!code) return 'ENGLISH'
    const normalized = code.toString().trim().toLowerCase().split(/[-_]/)[0]
    switch (normalized) {
      case 'en':
        return 'ENGLISH'
      case 'de':
        return 'GERMAN'
      case 'es':
        return 'SPANISH'
      case 'fr':
        return 'FRENCH'
      case 'it':
        return 'ITALIAN'
      case 'nl':
        return 'DUTCH'
      default:
        // Also accept 2-letter codes stored as uppercase (e.g. EN, DE, FR...)
        switch (code.toString().trim().toUpperCase()) {
          case 'EN':
            return 'ENGLISH'
          case 'DE':
            return 'GERMAN'
          case 'ES':
            return 'SPANISH'
          case 'FR':
            return 'FRENCH'
          case 'IT':
            return 'ITALIAN'
          case 'NL':
            return 'DUTCH'
          default:
            return 'ENGLISH'
        }
    }
  }

  const faqSections = t.faqSections ?? []
  const faqPlans = t.faqPlans ?? []
  const whitepaperContent = t.whitepaperContent
  const securitySections = t.securitySections ?? []
  const advantagesSections = t.advantagesSections ?? []

  // Get Telegram user ID (fallback to 503856039 for local testing)
  const telegramUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString() || '503856039'

  const authenticateUser = useCallback(async () => {
    if (!telegramUserId) return
    setAuthLoading(true)
    setAuthError(null)

    const API_URL = import.meta.env.VITE_API_URL || 'https://api.syntrix.website'
    const initData = window.Telegram?.WebApp?.initData || ''
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 20000)

    try {
      const response = await fetch(`${API_URL}/api/user/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegramId: telegramUserId,
          initData,
        }),
        signal: controller.signal,
      })

      if (response.ok) {
        const data = await response.json()
        setAuthToken(data.token)
        console.log('✅ User authenticated successfully')
      } else {
        const text = await response.text().catch(() => '')
        console.error('❌ Authentication failed:', text)
        setAuthError('Authentication failed. Please try again.')
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        setAuthError('Authentication timed out. Please try again.')
      } else {
        console.error('❌ Authentication error:', error)
        setAuthError('Authentication error. Please try again.')
      }
    } finally {
      window.clearTimeout(timeoutId)
      setAuthLoading(false)
    }
  }, [telegramUserId])

  // Authenticate user and get JWT token
  useEffect(() => {
    void authenticateUser()
  }, [authenticateUser])

  // Handle PayPal return after payment - automatic confirmation
  useEffect(() => {
    const handlePayPalReturn = async () => {
      // Check if we have PayPal return parameters in URL
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get('token') // PayPal order token
      
      if (!token || !authToken) return
      
      console.log('PayPal return detected with token:', token)
      toast.loading('Processing your PayPal payment...')
      
      // Auto-check payment status first
      try {
        const completed = await checkPayPalDepositStatus(token)
        if (completed) {
          // Payment already captured, success!
          return
        }
      } catch (error) {
        console.error('Error checking PayPal status:', error)
      }
      
      // If not completed, capture it automatically
      try {
        const API_URL = 'https://api.syntrix.website'
        const response = await fetch(`${API_URL}/api/user/${telegramUserId}/paypal-capture`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            orderId: token
          })
        })

        if (response.ok) {
          const data = await response.json()
          if (data.status === 'COMPLETED') {
            toast.dismiss()
            toast.success('✅ Payment successful! Your balance has been updated.')
            await refreshData()
            await fetchTransactions()
          } else {
            toast.dismiss()
            toast.info('Payment is being processed. Please wait...')
          }
        } else {
          const error = await response.json()
          toast.dismiss()
          toast.error(error.error || 'Payment verification failed. Please contact support.')
        }
      } catch (error) {
        console.error('Error capturing PayPal order:', error)
        toast.dismiss()
        toast.error('Network error. Please contact support if payment was deducted.')
      }
      
      // Clean URL parameters
      const cleanUrl = window.location.pathname + window.location.hash
      window.history.replaceState({}, document.title, cleanUrl)
    }
    
    // Wait for auth token before handling return
    if (authToken) {
      handlePayPalReturn()
    }
  }, [authToken])

  const renderWhitepaperParagraph = (paragraph: WhitepaperParagraph, key: string) => {
    const classes = ['text-muted-foreground', 'mb-1']
    if (typeof paragraph !== 'string') {
      if (paragraph.semibold) {
        classes.push('font-semibold', 'mt-2')
      }
      if (paragraph.indent) {
        classes.push('ml-4')
      }
    }

    return (
      <p key={key} className={classes.join(' ')}>
        {typeof paragraph === 'string' ? (
          paragraph
        ) : (
          <>
            {paragraph.boldPrefix && (
              <>
                <strong>{paragraph.boldPrefix}</strong>
                {paragraph.text ? ' ' : ''}
              </>
            )}
            {paragraph.text}
          </>
        )}
      </p>
    )
  }

  const renderWhitepaperListItem = (item: WhitepaperListItem, key: string) => (
    <li key={key} className="text-muted-foreground">
      {typeof item === 'string' ? (
        item
      ) : (
        <>
          <strong>{item.boldPrefix}</strong>
          {item.text ? ` ${item.text}` : ''}
        </>
      )}
    </li>
  )

  const renderFAQAnswer = (answer: string | string[], key: string) =>
    Array.isArray(answer) ? (
      answer.map((line, index) => (
        <p key={`${key}-${index}`} className="text-muted-foreground ml-2">
          {line}
        </p>
      ))
    ) : (
      <p key={key} className="text-muted-foreground ml-2">
        {answer}
      </p>
    )

  // Fetch real user data from bot API
  const { userData, loading, error, refreshData } = useUserData(telegramUserId, authToken)

  // If the user arrived via a marketing/ref link with a forced language, the bot stores it in user.languageCode.
  // Apply it only when the app is still on default language (don't override user's manual choice).
  useEffect(() => {
    if (didApplyRefLanguage.current) return
    if (!userData?.languageCode) return

    // If user has ever manually selected a language, don't override.
    try {
      if (localStorage.getItem('app-language-manual') === '1') return
    } catch {
      // ignore
    }

    // Apply only when persisted language is still default.
    if ((storedLanguage || 'ENGLISH') !== 'ENGLISH') return

    const mapped = mapLanguageCodeToAppLanguage(userData.languageCode)
    if (mapped !== 'ENGLISH') {
      setSelectedLanguage(mapped)
      setStoredLanguage(mapped)
      didApplyRefLanguage.current = true
    }
  }, [userData?.languageCode, storedLanguage, setStoredLanguage])

  // Helper function to create authenticated headers
  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`
    }
    return headers
  }

  const runAccessGateChecks = async () => {
    if (!telegramUserId || !authToken) return

    setSupportError(null)
    setSupportChecked(false)
    setSupportBotStarted(null)

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://api.syntrix.website'

      const supportRes = await fetch(`${API_URL}/api/user/${telegramUserId}/support-bot-started`, {
        headers: getAuthHeaders(),
      })

      // Support bot started
      try {
        const data = await supportRes.json().catch(() => ({} as any))
        const effectiveLink = (data?.supportBotLink as string) || requiredSupportBotLink
        setSupportBotLink(effectiveLink)

        if (!supportRes.ok) {
          setSupportError(data?.error || 'Failed to check support bot status')
          setSupportBotStarted(false)
        } else {
          setSupportBotStarted(Boolean(data?.started))
        }
      } catch (e) {
        console.error('Support bot check parse error:', e)
        setSupportError('Failed to check support bot status. Please try again.')
        setSupportBotStarted(false)
      } finally {
        setSupportChecked(true)
      }
    } catch (error) {
      console.error('Access gate checks error:', error)
      setSupportError('Failed to check support bot status. Please try again.')
      setSupportBotStarted(false)
      setSupportChecked(true)
    }
  }

  // Check access gates before allowing use of the mini-app.
  useEffect(() => {
    void runAccessGateChecks()
  }, [telegramUserId, authToken])

  // Fetch referrals
  const fetchReferrals = async () => {
    if (!telegramUserId || !authToken) return

    setLoadingReferrals(true)
    try {
      const API_URL = 'https://api.syntrix.website'
      const response = await fetch(`${API_URL}/api/user/${telegramUserId}/referrals`, {
        headers: getAuthHeaders()
      })
      
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
    if (!userData || userData.referralEarnings <= 0 || !authToken) return

    try {
      const API_URL = 'https://api.syntrix.website'
      const response = await fetch(`${API_URL}/api/user/${telegramUserId}/referral-reinvest`, {
        method: 'POST',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Successfully reinvested $${formatUsd(data.reinvestedAmount)} referral earnings!`)
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
    if (!telegramUserId || !authToken) return

    setLoadingDailyUpdates(true)
    try {
      const API_URL = 'https://api.syntrix.website'
      const response = await fetch(`${API_URL}/api/user/${telegramUserId}/daily-updates`, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        setDailyUpdates(data.updates || [])
        setDailyProfitTotal((data.accruedProfit ?? data.totalProfit) || 0)
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
  }, [activeTab, authToken, telegramUserId])

  // Fetch transactions
  const fetchTransactions = async () => {
    if (!telegramUserId || !authToken) return

    setLoadingTransactions(true)
    try {
      const API_URL = 'https://api.syntrix.website'
      const response = await fetch(`${API_URL}/api/user/${telegramUserId}/transactions`, {
        headers: getAuthHeaders()
      })
      
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
    if (!depositAmountInput) {
      toast.error('Please enter amount')
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
        headers: getAuthHeaders(),
        body: JSON.stringify({
          amount,
          ...(depositMethod === 'OXAPAY' ? { currency: selectedCurrency } : {}),
          method: depositMethod
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Reset previous UI artifacts
        setDepositQrCode('')
        setDepositAddress('')

        setDepositPaymentUrl(data.paymentUrl || '')

        if ((data.method || '').toString().toUpperCase() === 'PAYPAL') {
          toast.success('PayPal payment created. Continue to PayPal to complete payment.')
        } else {
          setDepositQrCode(data.qrCode)
          setDepositAddress(data.address)
          toast.success('Deposit invoice created! Please scan QR code or use the address.')
        }
      } else {
        const error = await response.json()
        const errorMessage = error.error || 'Failed to create deposit'
        
        // Show specific message if PayPal is not configured
        if (error.code === 'PAYPAL_NOT_CONFIGURED') {
          toast.error('PayPal is temporarily unavailable. Please use crypto payment.')
        } else {
          toast.error(errorMessage)
        }
      }
    } catch (error) {
      console.error('Error creating deposit:', error)
      toast.error('Network error')
    }
  }

  // Auto-check PayPal deposit status
  const checkPayPalDepositStatus = async (orderId: string) => {
    try {
      const API_URL = 'https://api.syntrix.website'
      const response = await fetch(`${API_URL}/api/user/${telegramUserId}/deposits`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const deposits = await response.json()
        const deposit = deposits.find((d: any) => d.txHash === orderId)
        
        if (deposit && deposit.status === 'COMPLETED') {
          toast.success('✅ Payment received! Your balance has been updated.')
          await refreshData()
          await fetchTransactions()
          setDepositPaymentUrl('')
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Error checking deposit status:', error)
      return false
    }
  }

  // Handle withdrawal
  const handleWithdrawalSubmit = async () => {
    if (!withdrawAmount) {
      toast.error('Please enter amount')
      return
    }

    if (withdrawMethod === 'OXAPAY') {
      if (!selectedCurrency || !selectedNetwork || !withdrawWalletAddress) {
        toast.error('Please fill all fields')
        return
      }
    } else {
      if (!withdrawPaypalEmail) {
        toast.error('Please enter your PayPal email')
        return
      }
    }

    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount < 10) {
      toast.error('Minimum withdrawal amount is $10')
      return
    }

    const availableBalance = (userData?.totalDeposit || 0) + (userData?.profit || 0)
    if (!userData || amount > availableBalance) {
      toast.error('Insufficient balance. Bonus tokens cannot be withdrawn.')
      return
    }

    try {
      const API_URL = 'https://api.syntrix.website'
      const response = await fetch(`${API_URL}/api/user/${telegramUserId}/create-withdrawal`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          amount,
          method: withdrawMethod,
          ...(withdrawMethod === 'OXAPAY'
            ? {
                currency: selectedCurrency,
                address: withdrawWalletAddress,
                network: selectedNetwork
              }
            : {
                paypalEmail: withdrawPaypalEmail
              })
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
        setWithdrawPaypalEmail('')
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
  }, [activeTab, authToken, telegramUserId])

  // Fetch transactions when wallet tab is opened
  useEffect(() => {
    if (activeTab === 'wallet') {
      fetchTransactions()
    }
  }, [activeTab, authToken, telegramUserId])

  // Reinvest profit to balance
  const handleReinvest = async () => {
    if (!userData || userData.profit <= 0) return

    try {
      const API_URL = 'https://api.syntrix.website'
      const response = await fetch(`${API_URL}/api/user/${telegramUserId}/reinvest`, {
        method: 'POST',
        headers: getAuthHeaders()
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

  const CONTACT_SUPPORT_MODAL_ENABLED = import.meta.env.VITE_ENABLE_CONTACT_SUPPORT_MODAL === 'true'

  // Check and show Contact Support modal
  useEffect(() => {
    if (!CONTACT_SUPPORT_MODAL_ENABLED) {
      setContactSupportOpen(false)
      return
    }
    let intervalId: ReturnType<typeof setInterval> | null = null
    
    const checkContactSupport = async () => {
      console.log('Contact Support Check:', 'userData exists:', !!userData, 'contactSupportSeen:', userData?.contactSupportSeen)
      if (!userData) {
        console.log('Skipping contact support - userData not loaded yet')
        return
      }

      // Do not show this promo modal to brand-new users.
      // Activation + bonus is handled via the support bot /start flow.
      if (userData.status !== 'ACTIVE') {
        console.log('Skipping contact support - user not ACTIVE')
        return
      }
      
      // Show modal every time if timer is active, unless user clicked SEND button
      if (userData.contactSupportSeen) {
        console.log('Skipping contact support - user already contacted support')
        return
      }
      
      console.log('Proceeding to fetch contact support settings...')
      
      try {
        // Fetch global settings
        const API_URL = import.meta.env.VITE_API_URL || 'https://api.syntrix.website'
        const response = await fetch(`${API_URL}/api/settings/contact-support`)
        const settings = await response.json()
        console.log('Contact Support Settings:', settings)
        
        if (!settings.contactSupportEnabled || !settings.contactSupportTimerMinutes) {
          console.log('Contact support not enabled or invalid settings')
          return
        }

        // Timer is per-user: starts when the user first created their account
        // (New users get a 2-day window by default)
        const activatedAt = userData.createdAt ? new Date(userData.createdAt).getTime() : Date.now()
        const now = Date.now()
        const timerDuration = settings.contactSupportTimerMinutes * 60 * 1000 // minutes to milliseconds
        const timeLeft = Math.max(0, timerDuration - (now - activatedAt))
        console.log('Timer check:', { activatedAt, now, timerDuration, timeLeft })
        
        if (timeLeft > 0) {
          console.log('Opening contact support modal!')
          setContactSupportBonusAmount(settings.contactSupportBonusAmount || 25)
          setContactSupportTimeLeft(Math.floor(timeLeft / 1000)) // convert to seconds
          setContactSupportOpen(true)
          
          // Update timer every second
          intervalId = setInterval(() => {
            const newTimeLeft = Math.max(0, timerDuration - (Date.now() - activatedAt))
            if (newTimeLeft <= 0) {
              if (intervalId) clearInterval(intervalId)
              setContactSupportOpen(false)
            } else {
              setContactSupportTimeLeft(Math.floor(newTimeLeft / 1000))
            }
          }, 1000)
        }
      } catch (error) {
        console.error('Error fetching contact support settings:', error)
      }
    }
    
    checkContactSupport()
    
    // Cleanup function
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [userData, CONTACT_SUPPORT_MODAL_ENABLED])

  // User profile with real data from bot API
  const userProfile = {
    id: userData?.id || telegramUserId || '503856039',
    nickname: userData?.nickname || window.Telegram?.WebApp?.initDataUnsafe?.user?.username || 'User',
    plan: userData?.plan || 'Bronze',
    status: userData?.status || 'INACTIVE',
    // Total Balance = totalDeposit + profit + referralEarnings (bonusTokens NOT included)
    balance: (userData?.totalDeposit || 0) + (userData?.profit || 0) + (userData?.referralEarnings || 0),
    totalDeposit: userData?.totalDeposit || 0,
    totalWithdraw: userData?.totalWithdraw || 0,
    bonusTokens: userData?.bonusTokens || 0,
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

  // Feature flag: hide Game tab in production when disabled.
  const GAME_ENABLED = import.meta.env.VITE_ENABLE_GAME === 'true'

  const tabs = [
    { id: 'wallet' as TabType, icon: Wallet, label: t.wallet },
    { id: 'invite' as TabType, icon: UserPlus, label: t.invite },
    { id: 'home' as TabType, icon: House, label: t.home },
    { id: 'calculator' as TabType, icon: Calculator, label: t.calculator },
    ...(userData?.arbitrageTradeEnabled ? [{ id: 'trade' as TabType, icon: ArrowsLeftRight, label: (t as any).trade ?? 'Trade' }] : []),
    ...(GAME_ENABLED ? [{ id: 'game' as TabType, icon: Gift, label: (t as any).game ?? 'Game' }] : []),
    { id: 'ai' as TabType, icon: ChartLineUp, label: (t as any).ai ?? 'AI' },
    { id: 'profile' as TabType, icon: User, label: t.profile }
  ]

  const handleTabClick = (tabId: TabType) => {
    if (tabId === 'game' && !GAME_ENABLED) return
    setActiveTab(tabId)
  }

  // Safety: if something persisted or forces Game, bounce back.
  useEffect(() => {
    if (!GAME_ENABLED && activeTab === 'game') {
      setActiveTab('home')
    }
  }, [GAME_ENABLED, activeTab])

  // Safety: if Trade is disabled server-side while open, bounce back.
  useEffect(() => {
    if (activeTab !== 'trade') return
    if (userData?.arbitrageTradeEnabled) return
    setActiveTab('home')
  }, [activeTab, userData?.arbitrageTradeEnabled])

  const incomePlans = [
    { name: 'Bronze', minAmount: '$10-$99', dailyPercent: '0.5%' },
    { name: 'Silver', minAmount: '$100-$499', dailyPercent: '1%' },
    { name: 'Gold', minAmount: '$500-$999', dailyPercent: '2%' },
    { name: 'Platinum', minAmount: '$1000-$4999', dailyPercent: '3%' },
    { name: 'Diamond', minAmount: '$5000-$19999', dailyPercent: '5%' },
    { name: 'Black', minAmount: '$20000+', dailyPercent: '7%' }
  ]

  const languages: Language[] = ['ENGLISH', 'GERMAN', 'SPANISH', 'FRENCH', 'ITALIAN', 'DUTCH']

  const getLanguageDisplayName = (lang: Language): string => {
    const names: Record<Language, string> = {
      ENGLISH: 'English',
      GERMAN: 'Deutsch',
      SPANISH: 'Español',
      FRENCH: 'Français',
      ITALIAN: 'Italiano',
      DUTCH: 'Nederlands'
    }
    return names[lang]
  }

  // Show loading state (initial load only). Avoid unmounting the whole UI on background refreshes.
  if (loading && !userData) {
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

  // Show error state (only if initial load failed). During background refreshes,
  // keep the last known UI instead of hard-failing the entire Mini App.
  if (error && !userData) {
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

  const isTelegramWebApp = Boolean(window.Telegram?.WebApp)

  // Access gates (require auth, so they won't block local unauthenticated dev flows)
  if (isTelegramWebApp && (!authToken || !supportChecked)) {
    return (
      <>
        <AnimatedBackground />
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
          <div className="text-center space-y-4">
            {authError && !authToken ? (
              <>
                <div className="text-destructive text-4xl">⚠️</div>
                <p className="text-foreground/70">{authError}</p>
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => {
                    void authenticateUser()
                  }}
                >
                  Retry
                </Button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-foreground/70">
                  {authLoading || !authToken ? 'Authenticating…' : 'Checking access…'}
                </p>
              </>
            )}
          </div>
        </div>
      </>
    )
  }

  const needsSupportBot = supportBotStarted !== true
  const accessBlocked = isTelegramWebApp && supportChecked && needsSupportBot

  if (accessBlocked) {
    return (
      <>
        <AnimatedBackground />
        <Toaster />
        <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4 overflow-hidden">
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative z-10 text-center space-y-4 max-w-md">
            <div className="text-destructive text-6xl">⚠️</div>
            <h2 className="text-xl font-bold text-foreground">Access restricted</h2>
            <p className="text-foreground/70">Next step: activate the support bot to continue.</p>
            {supportError && <p className="text-foreground/60 text-sm">{supportError}</p>}
            <div className="flex flex-col gap-2">
              {needsSupportBot && (
                <>
                  <p className="text-foreground/70 text-sm">
                    Activate the support bot to activate your account and receive 25 Syntrix tokens.
                  </p>
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => {
                      const url = supportBotLink || requiredSupportBotLink
                      const tg = (window as any).Telegram?.WebApp
                      if (tg?.openTelegramLink) {
                        tg.openTelegramLink(url)
                      } else {
                        window.open(url, '_blank')
                      }
                    }}
                  >
                    Open support bot
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-muted/50"
                onClick={() => {
                  void runAccessGateChecks()
                }}
              >
                Check again
              </Button>
            </div>
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
              {t.availableBalance}{' '}
              <span className="font-bold text-primary">${formatUsd(((userData?.totalDeposit || 0) + (userData?.profit || 0)) || 0)}</span>
            </p>

            <div className="space-y-2">
              <label className="text-xs sm:text-sm text-muted-foreground font-medium">
                Withdrawal Method
              </label>
              <Select value={withdrawMethod} onValueChange={(v) => setWithdrawMethod(v as any)}>
                <SelectTrigger className="w-full h-11 sm:h-12 bg-background/50 border-border/50 text-foreground text-sm sm:text-base rounded-lg">
                  <SelectValue placeholder="Select Method" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/50 rounded-lg">
                  <SelectItem value="OXAPAY">Crypto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {withdrawMethod === 'OXAPAY' && (
              <>
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
              </>
            )}

            <div className="bg-secondary/30 rounded-xl p-3 sm:p-5 space-y-3 sm:space-y-4 border border-border/30">
              {withdrawMethod === 'PAYPAL' ? (
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm text-muted-foreground font-medium">
                    PayPal Email
                  </label>
                  <Input
                    id="paypal-email"
                    type="email"
                    value={withdrawPaypalEmail}
                    onChange={(e) => setWithdrawPaypalEmail(e.target.value)}
                    placeholder="Enter your PayPal email"
                    className="h-10 sm:h-12 bg-background/50 border-border/50 text-foreground text-sm sm:text-base rounded-lg"
                  />
                </div>
              ) : (
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
              )}

              <div className="space-y-2">
                <label className="text-xs sm:text-sm text-muted-foreground font-medium">
                  Amount
                </label>
                <Input
                  id="withdraw-amount"
                  type="text"
                  inputMode="decimal"
                  value={withdrawAmount}
                  onChange={(e) => {
                    const value = e.target.value
                    // Allow only numbers and decimal point
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setWithdrawAmount(value)
                    }
                  }}
                  placeholder="Enter amount"
                  className="h-10 sm:h-12 bg-background/50 border-border/50 text-foreground text-sm sm:text-base rounded-lg"
                />
              </div>

              <Button
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold py-4 sm:py-5 text-sm sm:text-base rounded-lg shadow-lg shadow-accent/20 transition-all"
                disabled={
                  !withdrawAmount ||
                  (withdrawMethod === 'OXAPAY'
                    ? !selectedCurrency || !selectedNetwork || !withdrawWalletAddress
                    : !withdrawPaypalEmail)
                }
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
                Payment Method
              </label>
              <Select
                value={depositMethod}
                onValueChange={(v) => {
                  setDepositMethod(v as any)
                  // Clear previous results when switching method
                  setDepositQrCode('')
                  setDepositAddress('')
                  setDepositPaymentUrl('')
                }}
              >
                <SelectTrigger className="w-full h-11 sm:h-12 bg-background/50 border-border/50 text-foreground text-sm sm:text-base rounded-lg">
                  <SelectValue placeholder="Select Method" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/50 rounded-lg">
                  <SelectItem value="OXAPAY">Crypto</SelectItem>
                    {enablePayPalDeposit && <SelectItem value="PAYPAL">PayPal</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {depositMethod === 'OXAPAY' && (
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
            )}

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
              disabled={
                !depositAmountInput ||
                (depositMethod === 'OXAPAY' ? !selectedCurrency : false)
              }
              onClick={handleDepositSubmit}
            >
              {t.continue}
            </Button>

            {enablePayPalDeposit && depositMethod === 'PAYPAL' && depositPaymentUrl && (
              <div className="mt-6 p-4 bg-background/50 rounded-lg border border-border space-y-3">
                <h3 className="text-sm font-bold text-foreground">PayPal Payment</h3>
                <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                    onClick={() => window.open(depositPaymentUrl, '_blank')}
                  >
                    Continue to PayPal
                  </Button>                <p className="text-xs text-muted-foreground text-center">
                  You will be redirected to PayPal. After payment, you will be automatically returned and your balance will be updated.
                </p>
              </div>
            )}

            {depositMethod === 'OXAPAY' && depositQrCode && (
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
                  setStoredLanguage(language)
                  try {
                    localStorage.setItem('app-language-manual', '1')
                  } catch {
                    // ignore
                  }
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
              {t.faqTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-foreground text-sm">
            <p className="text-accent font-semibold">{t.faqIntro}</p>
            {faqSections.map((section, sectionIndex) => (
              <div key={`faq-section-${sectionIndex}-${section.title}`}>
                <h3 className="font-bold text-accent mb-2">{section.title}</h3>
                <div className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <div key={`faq-item-${sectionIndex}-${itemIndex}`} className="space-y-1">
                      <p className="text-muted-foreground font-semibold mt-2">{item.question}</p>
                      {renderFAQAnswer(item.answer, `faq-answer-${sectionIndex}-${itemIndex}`)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {faqPlans.length > 0 && (
              <div>
                <h3 className="font-bold text-accent mb-2">{t.faqPlansTitle}</h3>
                <div className="text-muted-foreground space-y-0.5 ml-2">
                  {faqPlans.map((plan) => (
                    <p key={plan}>{plan}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={whitepaperOpen} onOpenChange={setWhitepaperOpen}>
        <DialogContent className="bg-card border-2 border-primary/30 w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-wider text-primary uppercase">
              {whitepaperContent?.title ?? t.whitepaperTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-foreground text-sm">
            {whitepaperContent?.sections.map((section, sectionIndex) => (
              <div key={`wp-section-${sectionIndex}-${section.title}`}>
                <h3 className="font-bold text-accent mb-1">{section.title}</h3>
                {section.paragraphs?.map((paragraph, paragraphIndex) =>
                  renderWhitepaperParagraph(paragraph, `wp-paragraph-${sectionIndex}-${paragraphIndex}`)
                )}
                {section.lists?.map((list, listIndex) => (
                  <ul
                    key={`wp-list-${sectionIndex}-${listIndex}`}
                    className="text-muted-foreground ml-4 list-disc space-y-0.5"
                  >
                    {list.map((item, itemIndex) =>
                      renderWhitepaperListItem(
                        item,
                        `wp-list-${sectionIndex}-${listIndex}-${itemIndex}`
                      )
                    )}
                  </ul>
                ))}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>



      <Dialog open={securityOpen} onOpenChange={setSecurityOpen}>
        <DialogContent className="bg-card border-2 border-primary/30 w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-wider text-primary uppercase">
              {t.securityTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-foreground text-sm">
            <p className="text-accent font-semibold">{t.securityDescription}</p>
            {securitySections.map((section, sectionIndex) => (
              <div key={`security-section-${sectionIndex}-${section.title}`}>
                <h3 className="font-bold text-accent mb-2">{section.title}</h3>
                {section.paragraphs?.map((paragraph, paragraphIndex) =>
                  renderWhitepaperParagraph(
                    paragraph,
                    `security-paragraph-${sectionIndex}-${paragraphIndex}`
                  )
                )}
                {section.lists?.map((list, listIndex) => (
                  <ul
                    key={`security-list-${sectionIndex}-${listIndex}`}
                    className="text-muted-foreground space-y-1 ml-4 list-disc"
                  >
                    {list.map((item, itemIndex) =>
                      renderWhitepaperListItem(
                        item,
                        `security-list-${sectionIndex}-${listIndex}-${itemIndex}`
                      )
                    )}
                  </ul>
                ))}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>


      <Dialog open={advantagesOpen} onOpenChange={setAdvantagesOpen}>
        <DialogContent className="bg-card border-2 border-primary/30 w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-wider text-primary uppercase">
              {t.advantagesTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-foreground text-sm">
            <p className="text-accent font-semibold">{t.advantagesDescription}</p>
            {advantagesSections.map((section, sectionIndex) => (
              <div key={`advantage-section-${sectionIndex}-${section.title}`}>
                <h3 className="font-bold text-accent mb-2">{section.title}</h3>
                {section.paragraphs?.map((paragraph, paragraphIndex) =>
                  renderWhitepaperParagraph(
                    paragraph,
                    `advantage-paragraph-${sectionIndex}-${paragraphIndex}`
                  )
                )}
                {section.lists?.map((list, listIndex) => (
                  <ul
                    key={`advantage-list-${sectionIndex}-${listIndex}`}
                    className="text-muted-foreground space-y-1 ml-4 list-disc"
                  >
                    {list.map((item, itemIndex) =>
                      renderWhitepaperListItem(
                        item,
                        `advantage-list-${sectionIndex}-${listIndex}-${itemIndex}`
                      )
                    )}
                  </ul>
                ))}
              </div>
            ))}
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
                      href={requiredSupportBotLink}
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
                      <p className="text-xl sm:text-2xl font-bold text-foreground">$ {formatUsd((userData?.totalDeposit || 0) + (userData?.profit || 0) + (userData?.referralEarnings || 0))}</p>
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
                      <p className="text-lg sm:text-xl font-bold text-foreground">${formatUsd(userData?.profit || 0)}</p>
                    </div>
                    <Button 
                      className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base rounded-lg shadow-lg shadow-accent/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleReinvest}
                      disabled={!userData || userData.profit <= 0}
                    >
                      {t.reinvest}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pb-3 border-b border-dashed border-border/50">
                    <div>
                      <p className="text-muted-foreground text-xs sm:text-sm mb-1">{t.deposit}</p>
                      <p className="text-lg sm:text-xl font-bold text-foreground">${formatUsd(userData?.totalDeposit || 0)}</p>
                    </div>
                    <Button 
                      className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base rounded-lg shadow-lg shadow-accent/20 transition-all"
                      onClick={() => setDepositOpen(true)}
                    >
                      {t.depositBtn}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pb-3">
                    <div>
                      <p className="text-muted-foreground text-xs sm:text-sm mb-1 flex items-center gap-2">
                        Syntrix Token
                        <span className="text-xs opacity-70">(0.1% daily)</span>
                      </p>
                      <p className="text-lg sm:text-xl font-bold text-primary">${formatUsd(userData?.bonusTokens || 0)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-primary hover:text-primary/80 hover:bg-primary/10"
                      onClick={() => setSyntrixTokenInfoOpen(true)}
                    >
                      <Info size={20} weight="fill" />
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
                        ? `$${formatUsd(userData.planProgress.leftUntilNext)} left until ${userData.planProgress.nextPlan}`
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
                    {[...dailyUpdates].reverse().map((update, index) => (
                      <div 
                        key={update.id}
                        className="flex items-center justify-between p-3 bg-accent/5 hover:bg-accent/10 rounded-lg border border-accent/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                            <span className="text-xs font-bold text-accent">#{dailyUpdates.length - index}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              +${formatUsd(update.amount)}
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
                            {update.source === 'TOKEN'
                              ? 'Syntrix Token (0.1%)'
                              : userData?.planProgress?.currentPlan}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-muted-foreground">Total Daily Profit</p>
                        <p className="text-lg font-bold text-accent">
                          +${formatUsd(dailyProfitTotal)}
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

          {activeTab === 'ai' && (
            <AiAnalyticsTab
              telegramUserId={telegramUserId}
              authToken={authToken}
              getAuthHeaders={getAuthHeaders}
              strings={{
                title: (t as any).aiAnalyticsTitle ?? 'AI Analytics',
                simulated: (t as any).simulated ?? 'IMITATION',
                update: (t as any).update ?? 'Update',
                howItWorks: (t as any).aiAnalyticsHowItWorks ?? (t as any).aiAnalyticsInfo ?? 'How it works',
                howItWorksTitle: (t as any).aiAnalyticsHowItWorksTitle ?? (t as any).aiAnalyticsInfoTitle ?? 'How it works',
                howItWorksIntro:
                  (t as any).aiAnalyticsHowItWorksIntro ??
                  'Syntrix AI is a multi-model analytics system that uses competitive AI analysis to form trading decisions.',
                howItWorksParallelTitle:
                  (t as any).aiAnalyticsHowItWorksParallelTitle ??
                  'Parallel AI market analysis',
                howItWorksModels:
                  (t as any).aiAnalyticsHowItWorksModels ??
                  ['DeepSeek Chat v3.1', 'Claude Sonnet 4.5', 'Qwen3 Max', 'Gemini 2.5 Pro'],
                howItWorksHypothesesTitle:
                  (t as any).aiAnalyticsHowItWorksHypothesesTitle ??
                  'Each model forms its own strategic hypothesis:',
                howItWorksHypotheses:
                  (t as any).aiAnalyticsHowItWorksHypotheses ??
                  ['Possible entry points', 'Risk management', 'Volatility expectations', 'Market behavior patterns'],
                howItWorksCompetitionTitle:
                  (t as any).aiAnalyticsHowItWorksCompetitionTitle ??
                  'AI competition and crypto analysis',
                howItWorksCompetitionIntro:
                  (t as any).aiAnalyticsHowItWorksCompetitionIntro ??
                  'All hypotheses are cross-checked and validated via crypto-analytic consistency checks:',
                howItWorksCompetitionBullets:
                  (t as any).aiAnalyticsHowItWorksCompetitionBullets ??
                  ['Scenario comparison', 'Divergence detection', 'Logical and statistical conflict analysis', 'Filtering noisy and emotional decisions'],
                howItWorksCompetitionOutro:
                  (t as any).aiAnalyticsHowItWorksCompetitionOutro ??
                  'It works like an AI tournament where every model defends its viewpoint.',
                howItWorksMetaTitle:
                  (t as any).aiAnalyticsHowItWorksMetaTitle ??
                  'Syntrix intelligence (Meta-AI layer)',
                howItWorksMetaIntro:
                  (t as any).aiAnalyticsHowItWorksMetaIntro ??
                  'After that, Syntrix AI applies:',
                howItWorksMetaBullets:
                  (t as any).aiAnalyticsHowItWorksMetaBullets ??
                  ['Proprietary mathematical models', 'Probabilistic analysis algorithms', 'Elements of cryptography and secure decision logic', 'Risk management based on aggregated data'],
                howItWorksMetaOutro:
                  (t as any).aiAnalyticsHowItWorksMetaOutro ??
                  "Syntrix doesn't copy others' outputs. It makes the final decision independently, using AI competition as a signal source — not an instruction.",
                howItWorksExecutionTitle:
                  (t as any).aiAnalyticsHowItWorksExecutionTitle ??
                  'Execution',
                howItWorksExecutionIntro:
                  (t as any).aiAnalyticsHowItWorksExecutionIntro ??
                  'Only after multi-level verification can a strategy be allowed into execution. All actions are logged and additionally checked for:',
                howItWorksExecutionBullets:
                  (t as any).aiAnalyticsHowItWorksExecutionBullets ??
                  ['Risk parameter compliance', 'Capital protection', 'Resilience to market anomalies'],
                howItWorksCta: (t as any).aiAnalyticsHowItWorksCta ?? 'Got it!',
                loading: (t as any).loading ?? 'Loading…',
                error: (t as any).errorGeneric ?? 'Unable to load',
              }}
            />
          )}

          {GAME_ENABLED && activeTab === 'game' && (
            <GameTab
              t={t}
              telegramUserId={telegramUserId}
              getAuthHeaders={getAuthHeaders}
              bonusTokens={userData?.bonusTokens || 0}
              refreshData={refreshData}
            />
          )}

          {activeTab === 'trade' && userData?.arbitrageTradeEnabled && (
            <TradeTab title={(t as any).trade ?? 'Trade'} />
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
                        href={requiredSupportBotLink}
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
                    <p className="text-foreground text-lg">
                      {t.availableBalance}{' '}
                      <span className="font-bold">${formatUsd(((userData?.totalDeposit || 0) + (userData?.profit || 0)) || 0)}</span>
                    </p>
                    
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
                    {transactions.map((tx) => {
                      // Determine blockchain explorer URL based on currency and network
                      const getExplorerUrl = () => {
                        // For deposits, trackId always exists from OxaPay
                        // For withdrawals, txHash exists after blockchain confirmation
                        const hash = tx.txHash || tx.trackId
                        
                        if (!hash) {
                          return null
                        }
                        
                        // Only create explorer link for deposits (always have trackId)
                        // or withdrawals with 64-char blockchain hash
                        if (tx.type === 'DEPOSIT' && tx.trackId) {
                          const currency = tx.currency?.toUpperCase()
                          const network = tx.network?.toUpperCase()
                          
                          // For deposits, use OxaPay tracking (but it doesn't work, so use blockchain)
                          // Actually, deposits from OxaPay have blockchain hashes too
                          if (tx.txHash && tx.txHash.length === 64) {
                            // USDT TRC20 (Tron)
                            if (currency === 'USDT' && network === 'TRC20') {
                              return `https://tronscan.org/#/transaction/${tx.txHash}`
                            }
                            // USDT ERC20 (Ethereum)
                            if (currency === 'USDT' && network === 'ERC20') {
                              return `https://etherscan.io/tx/${tx.txHash}`
                            }
                            // BTC
                            if (currency === 'BTC') {
                              return `https://blockchair.com/bitcoin/transaction/${tx.txHash}`
                            }
                            // ETH
                            if (currency === 'ETH') {
                              return `https://etherscan.io/tx/${tx.txHash}`
                            }
                          }
                          return null
                        }
                        
                        // For withdrawals, only show link if we have blockchain confirmation
                        if (tx.type === 'WITHDRAWAL' && tx.txHash && tx.txHash.length === 64) {
                          const currency = tx.currency?.toUpperCase()
                          const network = tx.network?.toUpperCase()
                          
                          // USDT TRC20 (Tron)
                          if (currency === 'USDT' && network === 'TRC20') {
                            return `https://tronscan.org/#/transaction/${tx.txHash}`
                          }
                          // USDT ERC20 (Ethereum)
                          if (currency === 'USDT' && network === 'ERC20') {
                            return `https://etherscan.io/tx/${tx.txHash}`
                          }
                          // BTC
                          if (currency === 'BTC') {
                            return `https://blockchair.com/bitcoin/transaction/${tx.txHash}`
                          }
                          // ETH
                          if (currency === 'ETH') {
                            return `https://etherscan.io/tx/${tx.txHash}`
                          }
                          // LTC
                          if (currency === 'LTC') {
                            return `https://blockchair.com/litecoin/transaction/${tx.txHash}`
                          }
                        }
                        
                        return null
                      }
                      
                      const explorerUrl = getExplorerUrl()
                      
                      return (
                        <div
                          key={tx.id}
                          onClick={() => explorerUrl && window.open(explorerUrl, '_blank')}
                          className={`flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border/30 transition-colors ${
                            explorerUrl ? 'cursor-pointer hover:border-accent/30 hover:bg-secondary/50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              tx.currency === 'PROFIT' ? 'bg-purple-500/20' : 
                              tx.type === 'DEPOSIT' ? 'bg-green-500/20' : 'bg-red-500/20'
                            }`}>
                              <span className="text-sm font-bold">
                                {tx.currency === 'PROFIT' ? '📈' : (tx.type === 'DEPOSIT' ? '↓' : '↑')}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {tx.currency === 'PROFIT' ? 'Profit Added' : (tx.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {tx.currency === 'PROFIT' ? 'Manual' : tx.currency} • {new Date(tx.createdAt).toLocaleDateString()}
                                {explorerUrl && <span className="ml-1">🔗</span>}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${
                              tx.currency === 'PROFIT' ? 'text-purple-500' : 
                              tx.type === 'DEPOSIT' ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {tx.currency === 'PROFIT' || tx.type === 'DEPOSIT' ? '+' : '-'}${formatUsd(tx.amount)}
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
                      )
                    })}
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
                      href={requiredSupportBotLink}
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
                    <p className="text-2xl font-bold text-black">$ {formatUsd(userData?.referralEarnings || 0)}</p>
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

              <div className="bg-background rounded-lg p-6 border border-border space-y-3">
                <h3 className="text-lg font-bold text-foreground tracking-wider">{t.referralHowItWorksTitle}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{t.referralHowItWorksBody}</p>
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
                          <p className="font-bold text-accent">+${formatUsd(referral.earnings)}</p>
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
                      href={requiredSupportBotLink}
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
                      href={requiredSupportBotLink}
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
                    onClick={() => window.open(requiredSupportBotLink, '_blank')}
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
                    {t.faq}
                  </Button>
                  <Button 
                    className="w-full bg-transparent border-2 border-accent text-accent hover:bg-accent/10 font-bold py-6 text-base uppercase"
                    onClick={() => setWhitepaperOpen(true)}
                  >
                    {t.whitepaperLabel}
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

      {/* Contact Support Modal */}
      <Dialog open={CONTACT_SUPPORT_MODAL_ENABLED && contactSupportOpen} onOpenChange={(open) => {
        // Do not allow dismissing this modal (only closes after SEND or when timer expires)
        if (CONTACT_SUPPORT_MODAL_ENABLED && open) setContactSupportOpen(true)
      }}>
        <DialogContent
          hideClose
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="bg-card border-2 border-primary/30 w-[calc(100vw-2rem)] max-w-[400px] p-0 gap-0 overflow-hidden rounded-2xl"
        >
          <div className="relative p-3 space-y-3">
            {/* Bonus Card */}
            <div className="relative bg-gradient-to-br from-primary to-accent rounded-2xl p-6 shadow-2xl border-4 border-dashed border-primary/40">
              {/* Bonus Amount */}
              <div className="text-center mb-4">
                <div className="text-6xl font-black text-white drop-shadow-2xl tracking-tight">
                  {contactSupportBonusAmount}$
                </div>
              </div>

              {/* Timer */}
              <div className="bg-white/25 backdrop-blur-md rounded-xl p-3 shadow-inner">
                <div className="flex justify-center items-center gap-1.5 text-white">
                  {(() => {
                    const days = Math.floor(contactSupportTimeLeft / 86400)
                    const hours = Math.floor((contactSupportTimeLeft % 86400) / 3600)
                    const minutes = Math.floor((contactSupportTimeLeft % 3600) / 60)
                    const seconds = contactSupportTimeLeft % 60

                    return (
                      <>
                        <div className="text-center min-w-[38px]">
                          <div className="text-3xl font-black leading-none">{days}</div>
                          <div className="text-[9px] uppercase mt-0.5 font-medium opacity-90">days</div>
                        </div>
                        <div className="text-2xl font-black pb-2">:</div>
                        <div className="text-center min-w-[38px]">
                          <div className="text-3xl font-black leading-none">{hours}</div>
                          <div className="text-[9px] uppercase mt-0.5 font-medium opacity-90">hours</div>
                        </div>
                        <div className="text-2xl font-black pb-2">:</div>
                        <div className="text-center min-w-[42px]">
                          <div className="text-3xl font-black leading-none">{minutes}</div>
                          <div className="text-[9px] uppercase mt-0.5 font-medium opacity-90">minutes</div>
                        </div>
                        <div className="text-2xl font-black pb-2">:</div>
                        <div className="text-center min-w-[42px]">
                          <div className="text-3xl font-black leading-none">{seconds}</div>
                          <div className="text-[9px] uppercase mt-0.5 font-medium opacity-90">seconds</div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>

            {/* Support Message */}
            <div className="relative bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-3 shadow-xl">
              <p className="text-white text-center font-semibold text-xs leading-snug">
                Contact support to activate the bot and get a bonus deposit
              </p>
            </div>

            {/* Send Button */}
            <Button 
              className="relative w-full bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary text-white font-black py-4 text-lg uppercase rounded-2xl shadow-2xl transition-all tracking-wider"
              onClick={async () => {
                if (!telegramUserId || !authToken) {
                  toast.error('Please wait for authentication to complete')
                  return
                }

                // Claim bonus + mark as seen (requires auth)
                try {
                  const API_URL = import.meta.env.VITE_API_URL || 'https://api.syntrix.website'
                  const response = await fetch(`${API_URL}/api/users/${telegramUserId}/contact-support-claim`, {
                    method: 'POST',
                    headers: getAuthHeaders()
                  })

                  if (!response.ok) {
                    const text = await response.text()
                    throw new Error(text || `Request failed with status ${response.status}`)
                  }
                  setContactSupportOpen(false)

                  // Best-effort: refresh state, but don't block UX on it
                  void refreshData()

                  // Open support chat AFTER successful claim
                  const url = requiredSupportBotLink
                  const tg = (window as any).Telegram?.WebApp
                  if (tg?.openTelegramLink) {
                    tg.openTelegramLink(url)
                  } else {
                    window.open(url, '_blank')
                  }
                } catch (error) {
                  console.error('Error claiming contact support bonus:', error)
                  toast.error('Failed to claim bonus. Please try again.')
                }
              }}
            >
              SEND
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Syntrix Token Info Dialog */}
      <Dialog open={syntrixTokenInfoOpen} onOpenChange={setSyntrixTokenInfoOpen}>
        <DialogContent className="bg-card border-2 border-primary/30 w-[calc(100vw-2rem)] max-w-[400px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary flex items-center gap-2">
              <Info size={24} weight="fill" className="text-primary" />
              Syntrix Token Info
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <p className="text-lg font-bold text-primary mb-2">💡 How it works:</p>
              <ul className="space-y-2 text-sm text-foreground/90">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>It's given as a reward.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>You receive REAL profit from this token and can withdraw it to your USDT wallet.</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-accent/5 rounded-lg border border-accent/20">
                <span className="text-accent text-xl">✓</span>
                <div>
                  <p className="font-semibold text-foreground">Can be reinvested</p>
                  <p className="text-xs text-muted-foreground">Add to your balance to increase daily profit</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                <span className="text-green-500 text-xl">📈</span>
                <div>
                  <p className="font-semibold text-foreground">Earns 0.1% daily profit</p>
                  <p className="text-xs text-muted-foreground">Fixed Syntrix Token rate</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-orange-500/5 rounded-lg border border-orange-500/20">
                <span className="text-orange-500 text-xl">⚠️</span>
                <div>
                  <p className="font-semibold text-foreground">Token amount cannot be withdrawn as cash</p>
                  <p className="text-xs text-muted-foreground">Only the profit can be withdrawn</p>
                </div>
              </div>
            </div>

            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3"
              onClick={() => setSyntrixTokenInfoOpen(false)}
            >
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </>
  )
}

export default App



