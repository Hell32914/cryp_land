import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { ArrowRight } from "@phosphor-icons/react"
import { useLanguage } from "@/lib/LanguageContext"

const tariffPlans = [
  { name: "Bronze", percentage: "1%", range: "$10 - 100", min: 10, max: 100 },
  { name: "Silver", percentage: "2.5%", range: "$100 - 500", min: 100, max: 500 },
  { name: "Gold", percentage: "3.5%", range: "$500 - 1000", min: 500, max: 1000 },
  { name: "Platinum", percentage: "5%", range: "$1000 - 5000", min: 1000, max: 5000 },
  { name: "Diamond", percentage: "7.5%", range: "$5000 - 20000", min: 5000, max: 20000 }
]

const depositAmounts = [10, 27000, 45000, 63000, 100000]
const timePeriods = [
  { label: "7 Day", value: 7 },
  { label: "125 Day", value: 125 },
  { label: "240 Day", value: 240 },
  { label: "365 Day", value: 365 }
]

export function TariffPlans() {
  const [depositValue, setDepositValue] = useState([10])
  const [timeValue, setTimeValue] = useState([7])
  const { t } = useLanguage()

  return (
    <section className="relative py-20 lg:py-28">
      <div className="container mx-auto max-w-7xl px-4">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-4 text-3xl font-semibold tracking-tight text-foreground lg:text-5xl font-mono uppercase">
            {t.tariffPlans.title}
            <br />
            {t.tariffPlans.subtitle}
          </h2>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-8 space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono text-muted-foreground">{t.tariffPlans.depositAmount}</span>
                  </div>

                  <div className="relative pb-8">
                    <div className="flex justify-between text-xs text-muted-foreground mb-4">
                      {depositAmounts.map((amount, idx) => (
                        <span key={idx} className="font-mono">
                          {amount >= 1000 ? `$${(amount / 1000).toFixed(0)}k` : `$${amount}`}
                          {idx === depositAmounts.length - 1 && '+'}
                        </span>
                      ))}
                    </div>
                    <Slider
                      value={depositValue}
                      onValueChange={setDepositValue}
                      min={10}
                      max={100000}
                      step={10}
                      className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
                    />
                  </div>

                  <motion.div
                    key={depositValue[0]}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border-2 border-border bg-background/80 p-6"
                  >
                    <div className="font-mono text-3xl text-foreground">
                      $ {depositValue[0].toFixed(2)}
                    </div>
                  </motion.div>
                </div>

                <div className="space-y-6 pt-6 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono text-muted-foreground">{t.tariffPlans.timePeriod}</span>
                  </div>

                  <div className="relative pb-8">
                    <div className="flex justify-between text-xs text-muted-foreground mb-4">
                      {timePeriods.map((period, idx) => (
                        <span key={idx} className="font-mono">{period.label}</span>
                      ))}
                    </div>
                    <Slider
                      value={timeValue}
                      onValueChange={setTimeValue}
                      min={7}
                      max={365}
                      step={1}
                      className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
                    />
                  </div>

                  <motion.div
                    key={timeValue[0]}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border-2 border-border bg-background/80 p-6"
                  >
                    <div className="font-mono text-3xl text-foreground">
                      {timeValue[0]} {t.tariffPlans.day}
                    </div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm h-full">
              <CardContent className="p-8">
                <div className="mb-6">
                  <h3 className="text-lg font-mono text-foreground">{t.tariffPlans.tariffPlansTitle}</h3>
                </div>

                <div className="space-y-3">
                  {tariffPlans.map((plan, idx) => (
                    <motion.div
                      key={plan.name}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: idx * 0.1 }}
                      whileHover={{ x: 5 }}
                      className="group relative"
                    >
                      <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 px-6 py-4 transition-all hover:border-primary/50 hover:bg-background/80">
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-foreground font-medium">
                            {plan.name} ({plan.percentage})
                          </span>
                          <motion.div
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ArrowRight size={20} className="text-primary" weight="bold" />
                          </motion.div>
                        </div>
                        <span className="font-mono text-muted-foreground">
                          {plan.range}
                        </span>
                      </div>

                      {depositValue[0] >= plan.min && depositValue[0] <= plan.max && (
                        <motion.div
                          layoutId="active-plan"
                          className="absolute inset-0 rounded-lg border-2 border-primary pointer-events-none"
                          initial={false}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  className="mt-8 p-6 rounded-lg bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 border border-border/50"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t.tariffPlans.selectedPlan}</span>
                      <span className="font-mono text-foreground font-medium">
                        {tariffPlans.find(p => depositValue[0] >= p.min && depositValue[0] <= p.max)?.name || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{t.tariffPlans.dailyProfit}</span>
                      <span className="font-mono text-primary font-semibold">
                        {tariffPlans.find(p => depositValue[0] >= p.min && depositValue[0] <= p.max)?.percentage || "0%"}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-border/30">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t.tariffPlans.estimatedProfit}</span>
                        <span className="font-mono text-xl text-foreground font-bold">
                          ${(() => {
                            const plan = tariffPlans.find(p => depositValue[0] >= p.min && depositValue[0] <= p.max)
                            const rate = plan ? parseFloat(plan.percentage) / 100 : 0
                            return (depositValue[0] * rate * timeValue[0]).toFixed(2)
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
