import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Calculator } from "@phosphor-icons/react"

export function ProfitCalculator() {
  const [investment, setInvestment] = useState(1000)
  const [months, setMonths] = useState(6)
  
  const averageMonthlyReturn = 0.15
  const totalReturn = investment * Math.pow(1 + averageMonthlyReturn, months) - investment
  const percentageGain = ((totalReturn / investment) * 100).toFixed(1)
  
  return (
    <section className="relative py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <Calculator className="text-primary" size={32} />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Рассчитайте потенциальную прибыль
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Узнайте, сколько вы можете заработать с помощью нашего торгового бота
          </p>
        </div>
        
        <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-primary/20 p-8 md:p-12">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          
          <div className="relative grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="space-y-4">
                <Label htmlFor="investment" className="text-lg font-semibold">
                  Начальная инвестиция
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">$</span>
                  <Input
                    id="investment"
                    type="number"
                    value={investment}
                    onChange={(e) => setInvestment(Number(e.target.value))}
                    className="text-2xl font-bold pl-10 h-14 bg-background/50"
                    min={100}
                    max={100000}
                    step={100}
                  />
                </div>
                <Slider
                  value={[investment]}
                  onValueChange={(value) => setInvestment(value[0])}
                  min={100}
                  max={100000}
                  step={100}
                  className="py-4"
                />
              </div>
              
              <div className="space-y-4">
                <Label htmlFor="months" className="text-lg font-semibold">
                  Период (месяцы)
                </Label>
                <Input
                  id="months"
                  type="number"
                  value={months}
                  onChange={(e) => setMonths(Number(e.target.value))}
                  className="text-2xl font-bold h-14 bg-background/50"
                  min={1}
                  max={36}
                />
                <Slider
                  value={[months]}
                  onValueChange={(value) => setMonths(value[0])}
                  min={1}
                  max={36}
                  step={1}
                  className="py-4"
                />
              </div>
            </div>
            
            <div className="flex flex-col justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-xl" />
                
                <Card className="relative bg-background/80 backdrop-blur-sm border-2 border-primary/30 p-8">
                  <div className="text-center space-y-6">
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
                        Прогнозируемая прибыль
                      </p>
                      <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                        ${totalReturn.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                    
                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 rounded-xl bg-primary/5">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Рост
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          +{percentageGain}%
                        </p>
                      </div>
                      
                      <div className="text-center p-4 rounded-xl bg-accent/5">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Итого
                        </p>
                        <p className="text-2xl font-bold text-accent">
                          ${(investment + totalReturn).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-4">
                      * Расчет основан на среднем ежемесячном доходе 15%. Фактические результаты могут отличаться.
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
