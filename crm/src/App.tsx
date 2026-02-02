import { useEffect, useMemo, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from '@/lib/auth'
import { decodeJwtClaims, normalizeCrmRole } from '@/lib/jwt'
import { LoginPage } from '@/components/LoginPage'
import { Layout } from '@/components/Layout'
import { Dashboard } from '@/components/pages/Dashboard'
import { Users } from '@/components/pages/Users'
import { DepositUsers } from '@/components/pages/DepositUsers'
import { GeoData } from '@/components/pages/GeoData'
import { Deposits } from '@/components/pages/Deposits'
import { Withdrawals } from '@/components/pages/Withdrawals'
import { Expenses } from '@/components/pages/Expenses'
import { RefLinks } from '@/components/pages/RefLinks'
import { LinkBuilder } from '@/components/pages/LinkBuilder'
import { Support } from '@/components/pages/Support'
import { SupportFunnel } from '@/components/pages/SupportFunnel'
import { SupportFunnelBoard } from '@/components/pages/SupportFunnelBoard'
import { SupportOperators } from '@/components/pages/SupportOperators'
import { SupportBroadcasts } from '@/components/pages/SupportBroadcasts'
import { SupportAnalytics } from '@/components/pages/SupportAnalytics'
import '@/lib/i18n'

const queryClient = new QueryClient()

function AppContent() {
  const { isAuthenticated, token } = useAuth()
  const [currentPage, setCurrentPage] = useState('dashboard')

  const role = useMemo(() => normalizeCrmRole(decodeJwtClaims(token).role), [token])
  const access = useMemo(() => {
    if (role === 'support') {
      return {
        allowedPages: new Set(['support', 'support-funnel', 'support-analytics']),
        fallbackPage: 'support',
      }
    }
    if (role === 'tester') {
      return {
        allowedPages: new Set([
          'dashboard',
          'geo',
          'deposit-users',
          'deposits',
          'withdrawals',
          'expenses',
          'reflinks',
          'linkbuilder',
          'support',
          'support-funnel',
          'support-funnel-settings',
          'support-broadcasts',
          'support-operators',
          'support-analytics',
        ]),
        fallbackPage: 'dashboard',
      }
    }
    return { allowedPages: null, fallbackPage: 'dashboard' }
  }, [role])

  useEffect(() => {
    if (!isAuthenticated) return
    if (access.allowedPages && !access.allowedPages.has(currentPage)) {
      setCurrentPage(access.fallbackPage)
    }
  }, [access.allowedPages, access.fallbackPage, currentPage, isAuthenticated])

  useEffect(() => {
    const onNavigateEvent = (ev: Event) => {
      const ce = ev as CustomEvent<any>
      const page = String(ce?.detail?.page || '')
      const supportChatId = ce?.detail?.supportChatId

      if (!page) return

      if (supportChatId) {
        try {
          sessionStorage.setItem('crm.support.openChatId', String(supportChatId))
          window.dispatchEvent(new CustomEvent('crm:support.openChat', { detail: { chatId: String(supportChatId) } }))
        } catch {
          // ignore
        }
      }

      if (access.allowedPages && !access.allowedPages.has(page)) {
        setCurrentPage(access.fallbackPage)
        return
      }

      setCurrentPage(page)
    }

    window.addEventListener('crm:navigate', onNavigateEvent)
    return () => window.removeEventListener('crm:navigate', onNavigateEvent)
  }, [access.allowedPages, access.fallbackPage])

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'users':
        return role === 'tester' ? <Dashboard /> : <Users />
      case 'deposit-users':
        return <DepositUsers />
      case 'geo':
        return <GeoData />
      case 'deposits':
        return <Deposits />
      case 'withdrawals':
        return <Withdrawals />
      case 'expenses':
        return <Expenses />
      case 'reflinks':
        return <RefLinks />
      case 'linkbuilder':
        return <LinkBuilder />
      case 'support':
        return <Support />
      case 'support-funnel':
        return <SupportFunnelBoard />
      case 'support-funnel-settings':
        return <SupportFunnel />
      case 'support-operators':
        return <SupportOperators />
      case 'support-broadcasts':
        return <SupportBroadcasts />
      case 'support-analytics':
        return <SupportAnalytics />
      default:
        return role === 'support' ? <Support /> : <Dashboard />
    }
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => {}} />
  }

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={(page) => {
        if (access.allowedPages && !access.allowedPages.has(page)) {
          setCurrentPage(access.fallbackPage)
          return
        }
        setCurrentPage(page)
      }}
    >
      {renderPage()}
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
        <Toaster position="top-right" theme="dark" />
      </QueryClientProvider>
    </AuthProvider>
  )
}