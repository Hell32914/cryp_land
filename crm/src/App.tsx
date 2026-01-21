import { useEffect, useMemo, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from '@/lib/auth'
import { decodeJwtClaims, normalizeCrmRole } from '@/lib/jwt'
import { LoginPage } from '@/components/LoginPage'
import { Layout } from '@/components/Layout'
import { Dashboard } from '@/components/pages/Dashboard'
import { Users } from '@/components/pages/Users'
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
import { FixDuplicateStages } from '@/components/pages/FixDuplicateStages'
import '@/lib/i18n'
import '@/lib/window-fix-duplicates'
// Раскомментируйте следующую строку для автоматического исправления дублей при загрузке:
// import { runAutoMigration } from '@/lib/auto-fix-duplicates'

const queryClient = new QueryClient()

function AppContent() {
  const { isAuthenticated, token } = useAuth()
  const [currentPage, setCurrentPage] = useState('dashboard')

  const role = useMemo(() => normalizeCrmRole(decodeJwtClaims(token).role), [token])
  const allowedPages = useMemo(() => {
    if (role !== 'support') return null
    return new Set(['support', 'support-funnel', 'support-analytics'])
  }, [role])

  // Автоматическая миграция дублей (раскомментируйте для включения)
  // useEffect(() => {
  //   if (isAuthenticated) {
  //     runAutoMigration()
  //   }
  // }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return
    if (role === 'support' && !allowedPages?.has(currentPage)) {
      setCurrentPage('support')
    }
  }, [allowedPages, currentPage, isAuthenticated, role])

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

      if (allowedPages && !allowedPages.has(page)) {
        setCurrentPage('support')
        return
      }

      setCurrentPage(page)
    }

    window.addEventListener('crm:navigate', onNavigateEvent)
    return () => window.removeEventListener('crm:navigate', onNavigateEvent)
  }, [allowedPages])

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'users':
        return <Users />
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
      case 'support-fix-duplicates':
        return <FixDuplicateStages />
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
        if (allowedPages && !allowedPages.has(page)) {
          setCurrentPage('support')
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