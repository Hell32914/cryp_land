import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cpu, ShieldCheck, ChartLineUp, ChartBar, CurrencyDollar, Eye } from "@phosphor-icons/react"
import { motion } from "framer-motion"
import { useLanguage } from "@/lib/LanguageContext"

export function WhyChoose() {
  const { t } = useLanguage()
  
  const reasons = [
    {
      icon: Cpu,
      title: t.whyChoose.automation.title,
      description: t.whyChoose.automation.description
    },
    {
      icon: ShieldCheck,
      title: t.whyChoose.safety.title,
      description: t.whyChoose.safety.description
    },
    {
      icon: ChartLineUp,
      title: t.whyChoose.logic.title,
      description: t.whyChoose.logic.description
    },
    {
      icon: ChartBar,
      title: t.whyChoose.liquidity.title,
      description: t.whyChoose.liquidity.description
    },
    {
      icon: CurrencyDollar,
      title: t.whyChoose.withdrawals.title,
      description: t.whyChoose.withdrawals.description
    },
    {
      icon: Eye,
      title: t.whyChoose.transparency.title,
      description: t.whyChoose.transparency.description
    }
  ]
  return (
    <section className="relative py-20 lg:py-28">
      <div className="container mx-auto max-w-7xl px-4">
        <motion.div 
          className="mb-16 text-left"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-2 text-4xl font-bold tracking-tight text-foreground lg:text-5xl" style={{ fontFamily: 'monospace', letterSpacing: '0.02em' }}>
            {t.whyChoose.title}<br />{t.whyChoose.subtitle}
          </h2>
        </motion.div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reasons.map((reason, index) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card className="group relative h-full overflow-hidden border-border/30 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-xl corner-card">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 transition-opacity group-hover:opacity-100"
                  initial={false}
                />
                
                <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-border/60 group-hover:border-primary/60 transition-colors" />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-border/60 group-hover:border-primary/60 transition-colors" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-border/60 group-hover:border-primary/60 transition-colors" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-border/60 group-hover:border-primary/60 transition-colors" />
                
                <CardHeader className="relative pb-4">
                  <motion.div 
                    className="mb-4 inline-flex rounded-lg bg-background/80 p-3 backdrop-blur-sm border border-border/40"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    <reason.icon size={28} weight="duotone" className="text-primary" />
                  </motion.div>
                  <CardTitle className="text-base font-bold tracking-wide" style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                    {reason.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative pt-0">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {reason.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
