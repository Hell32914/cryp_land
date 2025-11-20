import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkle, Lightning } from "@phosphor-icons/react"
import { motion } from "framer-motion"
import { useLanguage } from "@/lib/LanguageContext"
import { Logo } from "@/components/Logo"

export function Hero() {
  const { t } = useLanguage()
  
  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      <div className="container mx-auto max-w-6xl px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center"
        >
          <motion.div 
            className="relative mb-12"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 150, damping: 15 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 blur-3xl"
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.4, 0.7, 0.4]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <div className="relative">
              <motion.div
                animate={{
                  y: [0, -8, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Logo className="h-32 w-auto text-gradient-to-r from-primary via-accent to-primary drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
              </motion.div>
              <motion.div
                className="absolute -right-2 -top-2"
                animate={{
                  scale: [1, 1.3, 1],
                  rotate: [0, 15, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Sparkle size={24} weight="fill" className="text-accent drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
              </motion.div>
            </div>
          </motion.div>
          
          <motion.h1 
            className="mb-6 text-4xl font-bold tracking-tight text-foreground lg:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {t.hero.title} <br />
            <motion.span 
              className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto]"
              animate={{
                backgroundPosition: ["0% center", "200% center"]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              {t.hero.subtitle}
            </motion.span>
          </motion.h1>
          
          <motion.p 
            className="mb-8 max-w-2xl text-lg text-muted-foreground lg:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            {t.hero.description}
          </motion.p>
          
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <Button size="lg" className="group relative overflow-hidden px-8 py-6 text-base shadow-lg transition-all hover:shadow-xl" asChild>
              <a href="https://t.me/AiSyntrixTrade_bot" target="_blank" rel="noopener noreferrer">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                />
                <span className="relative flex items-center">
                  {t.hero.startTrading}
                  <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" weight="bold" />
                </span>
              </a>
            </Button>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground"
          >
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <motion.div 
                className="h-2 w-2 rounded-full bg-primary"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <span>{t.hero.users}</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <motion.div 
                className="h-2 w-2 rounded-full bg-accent"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.3
                }}
              />
              <span>{t.hero.support}</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <motion.div 
                className="h-2 w-2 rounded-full bg-primary"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.6
                }}
              />
              <span>{t.hero.uptime}</span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}