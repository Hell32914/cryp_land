import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { useEffect, useRef } from "react"
import { useLanguage } from "@/lib/LanguageContext"

interface StatItemProps {
  value: number
  label: string
  suffix?: string
  prefix?: string
}

function StatItem({ value, label, suffix = "", prefix = "" }: StatItemProps) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => Math.round(latest))
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const controls = animate(count, value, { duration: 2 })
          return () => controls.stop()
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [count, value])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      whileHover={{ scale: 1.1, y: -5 }}
      className="relative text-center"
    >
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 blur-xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <div className="relative rounded-2xl bg-background/50 p-6 backdrop-blur-sm">
        <motion.div 
          className="mb-2 text-4xl font-bold text-primary lg:text-5xl"
          whileHover={{
            textShadow: "0 0 20px rgba(var(--primary), 0.5)"
          }}
        >
          {prefix}
          <motion.span>{rounded}</motion.span>
          {suffix}
        </motion.div>
        <div className="text-sm text-muted-foreground lg:text-base">{label}</div>
      </div>
    </motion.div>
  )
}

export function Statistics() {
  const { t } = useLanguage()
  
  return (
    <section className="relative py-20 lg:py-28">
      <div className="container relative mx-auto max-w-6xl px-4">
        <motion.div 
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-4 text-3xl font-semibold tracking-tight text-foreground lg:text-5xl">
            {t.statistics.title}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {t.statistics.description}
          </p>
        </motion.div>
        
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-12">
          <StatItem value={50000} label={t.statistics.activeUsers} suffix="+" />
          <StatItem value={500} label={t.statistics.tradingVolume} suffix="M" prefix="$" />
          <StatItem value={99} label={t.statistics.successfulTrades} suffix="%" />
          <StatItem value={24} label={t.statistics.support} suffix="/7" />
        </div>
      </div>
    </section>
  )
}