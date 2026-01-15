import { ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChartLine,
  Users,
  Globe,
  ArrowCircleDown,
  ArrowCircleUp,
  Receipt,
  Link,
  PencilRuler,
  ChatCenteredText,
  Funnel,
  List,
  SignOut,
  Translate,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

interface LayoutProps {
  children: ReactNode
  currentPage: string
  onNavigate: (page: string) => void
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { t, i18n } = useTranslation()
  const { logout } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const menuSections = [
    {
      title: t('nav.analyticsData'),
      items: [
        { id: 'dashboard', label: t('nav.analytics'), icon: ChartLine },
        { id: 'users', label: t('nav.users'), icon: Users },
        { id: 'geo', label: t('nav.geoData'), icon: Globe },
      ],
    },
    {
      title: t('nav.finance'),
      items: [
           { id: 'support-operators', label: t('nav.supportOperators'), icon: Users },
        { id: 'withdrawals', label: t('nav.withdrawals'), icon: ArrowCircleUp },
        { id: 'expenses', label: t('nav.expenses'), icon: Receipt },
      ],
    },
    {
      title: t('nav.marketing'),
      items: [
        { id: 'reflinks', label: t('nav.refLinks'), icon: Link },
        { id: 'linkbuilder', label: t('nav.linkBuilder'), icon: PencilRuler },
      ],
    },
    {
      title: t('nav.support'),
      items: [
        { id: 'support', label: t('nav.supportChats'), icon: ChatCenteredText },
        { id: 'support-funnel', label: t('nav.supportFunnel'), icon: Funnel },
      ],
    },
  ]

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside
        className={cn(
          'bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col',
          isSidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          {isSidebarOpen && (
            <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Syntrix CRM
            </h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="h-8 w-8"
          >
            <List weight="bold" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-6">
          {menuSections.map((section) => (
            <div key={section.title}>
              {isSidebarOpen && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = currentPage === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
                      {isSidebarOpen && <span>{item.label}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-2 border-t border-sidebar-border space-y-2">
          {isSidebarOpen && (
            <div className="px-3 pb-2">
              <Select value={i18n.language} onValueChange={changeLanguage}>
                <SelectTrigger className="w-full bg-sidebar-accent">
                  <div className="flex items-center gap-2">
                    <Translate size={16} />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">🇬🇧 EN</SelectItem>
                  <SelectItem value="ru">🇷🇺 RU</SelectItem>
                  <SelectItem value="ua">🇺🇦 UA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={logout}
            className={cn(
              'w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10',
              !isSidebarOpen && 'justify-center'
            )}
          >
            <SignOut size={20} />
            {isSidebarOpen && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
