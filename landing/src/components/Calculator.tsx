import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { TrendUp, CurrencyDollar } from "@phosphor-icons/react"
import { motion } from "framer-motion"

const profitRates = {
  "1": 0.08,
  "3": 0.25,
  "6": 0.55,
  "12": 1.2
}

export function Calculator() {
  const [investment, setInvestment] = useState<string>("1000")
  const [period, setPeriod] = useState<string>("3")
  
  const investmentNum = parseFloat(investment) || 0
  const rate = profitRates[period as keyof typeof profitRates] || 0
  const profit = investmentNum * rate
  const total = investmentNum + profit

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const periodLabels: Record<string, string> = {
    "1": "1 месяц",
    "3": "3 месяца",
    "6": "6 месяцев",
    "12": "1 год"
  }

  return (
    <section className="relative py-20 lg:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <motion.div 
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-4 text-3xl font-semibold tracking-tight text-foreground lg:text-5xl">
            Рассчитайте потенциальную прибыль
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Узнайте, сколько вы можете заработать с помощью нашего торгового бота
          </p>
        </motion.div>

        <motion.div 
          className="mx-auto max-w-4xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="relative overflow-hidden border-border/50 shadow-xl">
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"
              initial={false}
            />
            <CardHeader className="relative text-center">
              <CardTitle className="text-2xl">Калькулятор прибыли</CardTitle>
              <CardDescription>
                Введите сумму инвестиций и период для расчета потенциальной прибыли
              </CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <motion.div 
                  className="space-y-3"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Label htmlFor="investment" className="text-base">
                    Сумма инвестиций
                  </Label>
                  <div className="relative">
                    <CurrencyDollar 
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
                      size={20} 
                    />
                    <Input
                      id="investment"
                      type="number"
                      min="0"
                      step="100"
                      value={investment}
                      onChange={(e) => setInvestment(e.target.value)}
                      className="pl-10 text-lg h-12"
                      placeholder="1000"
                    />
                  </div>
                </motion.div>

                <motion.div 
                  className="space-y-3"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Label htmlFor="period" className="text-base">
                    Период инвестирования
                  </Label>
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger id="period" className="h-12 text-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 месяц</SelectItem>
                      <SelectItem value="3">3 месяца</SelectItem>
                      <SelectItem value="6">6 месяцев</SelectItem>
                      <SelectItem value="12">1 год</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              </div>

              <motion.div
                key={`${investment}-${period}`}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="rounded-xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 p-8 space-y-6 shadow-lg"
              >
                <div className="grid gap-6 md:grid-cols-3">
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <p className="text-sm text-muted-foreground mb-2">Инвестиция</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(investmentNum)}
                    </p>
                  </motion.div>

                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    whileHover={{ scale: 1.1 }}
                  >
                    <p className="text-sm text-muted-foreground mb-2">Прибыль</p>
                    <p className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <TrendUp weight="bold" />
                      </motion.div>
                      {formatCurrency(profit)}
                    </p>
                  </motion.div>

                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p className="text-sm text-muted-foreground mb-2">Итого</p>
                    <p className="text-2xl font-bold text-accent">
                      {formatCurrency(total)}
                    </p>
                  </motion.div>
                </div>

                <div className="text-center pt-4 border-t border-border/30">
                  <p className="text-sm text-muted-foreground">
                    За <span className="font-semibold text-foreground">{periodLabels[period]}</span> вы можете заработать{" "}
                    <span className="font-semibold text-primary">
                      {formatCurrency(profit)}
                    </span>
                    {" "}(+{(rate * 100).toFixed(0)}%)
                  </p>
                </div>
              </motion.div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" className="group relative overflow-hidden px-8 shadow-lg">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                  <span className="relative">Начать зарабатывать</span>
                </Button>
                <Button size="lg" variant="outline" className="px-8">
                  Узнать подробнее
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground pt-4">
                * Расчеты основаны на средней доходности. Прошлые результаты не гарантируют будущую прибыль. 
                Криптовалютная торговля несет риски.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
