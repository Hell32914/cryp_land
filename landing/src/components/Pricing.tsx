import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check } from "@phosphor-icons/react"
import { motion } from "framer-motion"

const plans = [
  {
    name: "Старт",
    price: "29",
    period: "месяц",
    description: "Идеально для начинающих трейдеров",
    features: [
      "Базовые торговые стратегии",
      "1 биржа",
      "Email поддержка",
      "Базовая аналитика",
      "Мобильное приложение"
    ],
    popular: false
  },
  {
    name: "Про",
    price: "79",
    period: "месяц",
    description: "Для опытных трейдеров",
    features: [
      "Все стратегии включены",
      "5 бирж одновременно",
      "Приоритетная поддержка 24/7",
      "Расширенная аналитика",
      "Мобильное приложение",
      "Кастомные стратегии",
      "API доступ"
    ],
    popular: true
  },
  {
    name: "Корпоративный",
    price: "199",
    period: "месяц",
    description: "Для профессионалов и команд",
    features: [
      "Все возможности Про",
      "Неограниченное кол-во бирж",
      "Персональный менеджер",
      "Индивидуальные стратегии",
      "White label решения",
      "Приоритетное исполнение",
      "Расширенный API"
    ],
    popular: false
  }
]

export function Pricing() {
  return (
    <section className="py-20 lg:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-semibold tracking-tight text-foreground lg:text-5xl">
            Выберите свой план
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Прозрачные цены без скрытых платежей. Отмените подписку в любое время
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`relative h-full border-border/50 transition-all hover:shadow-xl ${
                plan.popular ? 'border-primary shadow-lg scale-105' : ''
              }`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground">
                    Популярный
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                  <div className="mt-6">
                    <span className="text-4xl font-bold text-primary">${plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check size={20} weight="bold" className="mt-0.5 flex-shrink-0 text-primary" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    size="lg"
                  >
                    Начать сейчас
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}