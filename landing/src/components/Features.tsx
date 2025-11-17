import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, ChartLine, Clock, Lightning, Gear, Users } from "@phosphor-icons/react"
import { motion } from "framer-motion"

const features = [
  {
    icon: ChartLine,
    title: "Smart Trading",
    description: "Machine learning algorithms analyze the market and make decisions in milliseconds"
  },
  {
    icon: Shield,
    title: "Security",
    description: "Bank-level encryption and protection of your funds at all stages"
  },
  {
    icon: Clock,
    title: "24/7 Monitoring",
    description: "The bot works around the clock, never missing profitable market opportunities"
  },
  {
    icon: Lightning,
    title: "Lightning Speed",
    description: "Trade execution in fractions of a second thanks to direct exchange connections"
  },
  {
    icon: Gear,
    title: "Flexible Settings",
    description: "Configure trading strategies according to your goals and risk level"
  },
  {
    icon: Users,
    title: "Community",
    description: "Join thousands of traders and share experiences"
  }
]

export function Features() {
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
            Why Choose Us
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Advanced technologies and reliability for your success in cryptocurrency trading
          </p>
        </motion.div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -8 }}
            >
              <Card className="group relative h-full overflow-hidden border-border/50 transition-all hover:border-primary/50 hover:shadow-xl">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 transition-opacity group-hover:opacity-100"
                  initial={false}
                />
                <CardHeader className="relative">
                  <motion.div 
                    className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 transition-colors group-hover:bg-primary/20"
                    whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <feature.icon size={32} weight="duotone" className="text-primary" />
                  </motion.div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}