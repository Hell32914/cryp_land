import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from '@/lib/auth'
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
import '@/lib/i18n'

const queryClient = new QueryClient()

function AppContent() {
  const { isAuthenticated } = useAuth()
  const [currentPage, setCurrentPage] = useState('dashboard')

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
      case 'support-operators':
        return <SupportOperators />
      case 'support-broadcasts':
        return <SupportBroadcasts />
      default:
        return <Dashboard />
    }
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setCurrentPage('dashboard')} />
  }

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  )
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
        <Toaster position="top-right" theme="dark" />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App