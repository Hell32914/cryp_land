import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { TrendUp, CurrencyDollar } from "@phosphor-icons/react"
import { motion } from "framer-motion"

const tariffPlans = [
  { name: 'Bronze', minDeposit: 10, maxDeposit: 99, dailyPercent: 0.5 },
  { name: 'Silver', minDeposit: 100, maxDeposit: 499, dailyPercent: 1.0 },
  { name: 'Gold', minDeposit: 500, maxDeposit: 999, dailyPercent: 2.0 },
  { name: 'Platinum', minDeposit: 1000, maxDeposit: 4999, dailyPercent: 3.0 },
  { name: 'Diamond', minDeposit: 5000, maxDeposit: 19999, dailyPercent: 5.0 },
  { name: 'Black', minDeposit: 20000, maxDeposit: Infinity, dailyPercent: 7.0 }
]

const quickAmounts = [10, 100, 500, 1000, 5000, 10000]

const timePeriods = [
  { value: 7, label: '7 дней' },
  { value: 30, label: '30 дней' },
  { value: 90, label: '90 дней' },
  { value: 365, label: '365 дней' }
]

export function Calculator() {
  const [investment, setInvestment] = useState<string>("1000")
  const [days, setDays] = useState<string>("30")
  const [reinvest, setReinvest] = useState<boolean>(false)
  
  const investmentNum = parseFloat(investment) || 0
  const daysNum = parseInt(days) || 0
  
  const getPlanByDeposit = (amount: number) => {
    return tariffPlans.find(plan => amount >= plan.minDeposit && amount <= plan.maxDeposit) || tariffPlans[0]
  }

  const plan = getPlanByDeposit(investmentNum)
  const dailyRate = plan.dailyPercent / 100

  const calculateProfit = () => {
    if (reinvest) {
      return investmentNum * Math.pow(1 + dailyRate, daysNum)
    } else {
      return investmentNum + (investmentNum * dailyRate * daysNum)
    }
  }

  const total = calculateProfit()
  const profit = total - investmentNum

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
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
                Введите сумму депозита и количество дней для расчета прибыли
              </CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-8">
              <div className="space-y-6">
                <motion.div 
                  className="space-y-3"
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Label htmlFor="investment" className="text-base">
                    Сумма депозита
                  </Label>
                  <div className="relative">
                    <CurrencyDollar 
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
                      size={20} 
                    />
                    <Input
                      id="investment"
                      type="number"
                      min="10"
                      step="10"
                      value={investment}
                      onChange={(e) => setInvestment(e.target.value)}
                      className="pl-10 text-lg h-12"
                      placeholder="1000"
                    />
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {quickAmounts.map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => setInvestment(amount.toString())}
                        className="text-xs"
                      >
                        ${amount >= 1000 ? `${(amount / 1000)}K` : amount}
                      </Button>
                    ))}
                  </div>
                </motion.div>

                <motion.div 
                  className="space-y-3"
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Label htmlFor="days" className="text-base">
                    Количество дней
                  </Label>
                  <Input
                    id="days"
                    type="number"
                    min="1"
                    step="1"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className="text-lg h-12"
                    placeholder="30"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {timePeriods.map((period) => (
                      <Button
                        key={period.value}
                        variant="outline"
                        size="sm"
                        onClick={() => setDays(period.value.toString())}
                        className="text-xs"
                      >
                        {period.label}
                      </Button>
                    ))}
                  </div>
                </motion.div>

                <div className="flex items-center justify-between py-3 px-4 bg-secondary/30 rounded-lg">
                  <Label htmlFor="reinvest" className="text-base font-medium cursor-pointer">
                    Реинвестирование прибыли
                  </Label>
                  <Switch
                    id="reinvest"
                    checked={reinvest}
                    onCheckedChange={setReinvest}
                  />
                </div>
              </div>

              <motion.div
                key={`${investment}-${days}-${reinvest}`}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="rounded-xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 p-8 space-y-6 shadow-lg"
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="px-4 py-2 bg-accent/20 rounded-full border border-accent">
                    <span className="text-sm font-bold text-accent">{plan.name}</span>
                  </div>
                  <div className="px-4 py-2 bg-primary/20 rounded-full border border-primary">
                    <span className="text-sm font-bold text-primary">{plan.dailyPercent}% / день</span>
                  </div>
                </div>

                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-3 text-2xl font-bold flex-wrap">
                    <span className="text-foreground">{formatCurrency(investmentNum)}</span>
                    <span className="text-muted-foreground">+</span>
                    <span className="text-foreground">{daysNum} дн.</span>
                    <span className="text-muted-foreground">=</span>
                    <span className="text-accent">{formatCurrency(total)}</span>
                  </div>
                  
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <p className="text-sm text-muted-foreground mb-2">Чистая прибыль</p>
                    <p className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <TrendUp weight="bold" />
                      </motion.div>
                      {formatCurrency(profit)}
                    </p>
                  </motion.div>
                </div>

                <div className="text-center pt-4 border-t border-border/30">
                  <p className="text-sm text-muted-foreground">
                    {reinvest ? 'С реинвестированием' : 'Без реинвестирования'} за{" "}
                    <span className="font-semibold text-foreground">{daysNum} дней</span> прибыль составит{" "}
                    <span className="font-semibold text-primary">
                      {formatCurrency(profit)}
                    </span>
                    {" "}(+{((profit / investmentNum) * 100).toFixed(1)}%)
                  </p>
                </div>
              </motion.div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" className="group relative overflow-hidden px-8 shadow-lg" asChild>
                  <a href="https://t.me/AiSyntrixTrade_bot" target="_blank" rel="noopener noreferrer">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.6 }}
                    />
                    <span className="relative">Начать зарабатывать</span>
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="px-8" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  Узнать подробнее
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground pt-4">
                * Расчеты основаны на тарифных планах Syntrix. Процент доходности зависит от выбранного плана. 
                {reinvest && ' При реинвестировании используется сложный процент (компаундинг).'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
