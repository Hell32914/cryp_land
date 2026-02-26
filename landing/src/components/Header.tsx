import { Button } from "@/components/ui/button"
import { List, X } from "@phosphor-icons/react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LanguageSelector } from "@/components/LanguageSelector"
import { useLanguage } from "@/lib/LanguageContext"
import { WhitepaperDialog } from "@/components/WhitepaperDialog"

function getTelegramChannelTrackingUrl() {
  if (typeof window === 'undefined') return 'https://t.me/SyntrixAI'

  const host = window.location.hostname.toLowerCase()
  const map: Record<string, string> = {
    'info.syntrixxx.site': 'https://t.me/+ETuBMJ9s2Js1NmIy',
    'ss.syntrixxx.space': 'https://t.me/+YmFilnI8DbFjNWEy',
    'ss.syntrixxx.website': 'https://t.me/+YmFilnI8DbFjNWEy',
    'road.syntrixxx.space': 'https://t.me/+TLo5_JI7r0wxODky',
    'road.syntrixxx.website': 'https://t.me/+TLo5_JI7r0wxODky',
    'invest.syntrixxx.space': 'https://t.me/+6w-QvvLfkt9iNzg6',
  }

  return map[host] || 'https://t.me/SyntrixAI'
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { t } = useLanguage()

  const navItems = [
    { label: t.header.telegramChannel, href: getTelegramChannelTrackingUrl(), external: true }
  ]

  return (
    <motion.header 
      className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <nav className="container mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between">
          <motion.a
            href="#"
            className="flex items-center"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <svg
              viewBox="0 0 400 100"
              className="h-7 w-auto"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="oklch(0.55 0.25 240)" />
                  <stop offset="100%" stopColor="oklch(0.62 0.28 235)" />
                </linearGradient>
              </defs>
              <text
                x="10"
                y="70"
                fontFamily="Inter, sans-serif"
                fontSize="72"
                fontWeight="800"
                letterSpacing="-2"
                fill="url(#logoGradient)"
                style={{ textTransform: 'uppercase' }}
              >
                SYNTRIX
              </text>
            </svg>
          </motion.a>

          <div className="hidden items-center gap-8 md:flex">
            {navItems.map((item, index) => (
              <motion.a
                key={item.label}
                href={item.href}
                {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="relative text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                {item.label}
                <motion.span
                  className="absolute inset-x-0 -bottom-1 h-0.5 bg-primary"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.2 }}
                />
              </motion.a>
            ))}
            <motion.div
              className="relative text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: navItems.length * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <WhitepaperDialog />
            </motion.div>
          </div>

          <motion.div 
            className="hidden items-center gap-4 md:flex"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <LanguageSelector />
            <Button className="group relative overflow-hidden" asChild>
              <a href="https://t.me/AiSyntrixTrade_bot" target="_blank" rel="noopener noreferrer">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                />
                <span className="relative">{t.header.getStarted}</span>
              </a>
            </Button>
          </motion.div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <List size={24} />}
          </Button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden md:hidden"
            >
              <div className="flex flex-col gap-4 py-6">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
                <div className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                  <WhitepaperDialog />
                </div>
                <div className="flex flex-col gap-2 pt-4">
                  <LanguageSelector />
                  <Button className="w-full" asChild>
                    <a href="https://t.me/AiSyntrixTrade_bot" target="_blank" rel="noopener noreferrer">
                      {t.header.getStarted}
                    </a>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  )
}