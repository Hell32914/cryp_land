import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import { useEffect, useRef } from "react"
import { Cpu, Lightning, TrendUp, ArrowRight } from "@phosphor-icons/react"
import { useLanguage } from "@/lib/LanguageContext"

export function MatrixHero() {
  const { t } = useLanguage()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const setCanvasSize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    setCanvasSize()

    const chars = "01"
    const fontSize = 14
    const columns = Math.floor(canvas.width / fontSize)
    
    const drops: number[] = []
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100
    }

    let animationId: number

    const animate = () => {
      ctx.fillStyle = "rgba(18, 22, 45, 0.05)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = "rgba(94, 127, 255, 0.6)"
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)]
        const x = i * fontSize
        const y = drops[i] * fontSize

        ctx.fillText(char, x, y)

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }

        drops[i]++
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      setCanvasSize()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center space-y-8"
          >
            <motion.div 
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 w-fit"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Cpu size={20} weight="duotone" className="text-primary" />
              </motion.div>
              <span className="text-sm font-medium text-primary">{t.matrixHero.badge}</span>
            </motion.div>

            <motion.h2 
              className="text-3xl font-bold tracking-tight text-foreground lg:text-5xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              {t.matrixHero.title}{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                {t.matrixHero.titleBrand}
              </span>
            </motion.h2>

            <motion.p 
              className="text-lg text-muted-foreground leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              {t.matrixHero.description}
            </motion.p>

            <motion.div 
              className="flex flex-wrap gap-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Lightning size={24} weight="duotone" className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t.matrixHero.instantResponse}</p>
                  <p className="text-xs text-muted-foreground">{t.matrixHero.instantResponseDesc}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-accent/10 p-2">
                  <TrendUp size={24} weight="duotone" className="text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t.matrixHero.highAccuracy}</p>
                  <p className="text-xs text-muted-foreground">{t.matrixHero.highAccuracyDesc}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <Button 
                size="lg" 
                className="group relative overflow-hidden px-8 py-6 text-base shadow-lg transition-all hover:shadow-xl"
                asChild
              >
                <a href="https://t.me/AiSyntrixTrade_bot" target="_blank" rel="noopener noreferrer">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                  <span className="relative flex items-center">
                    {t.matrixHero.startNow}
                    <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" weight="bold" />
                  </span>
                </a>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="relative"
          >
            <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl">
              <div className="relative min-h-[400px] lg:min-h-[500px]">
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 h-full w-full opacity-40"
                />
                
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10"
                  initial={false}
                />

                <div className="relative z-10 flex h-full flex-col items-center justify-center p-8 text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="space-y-6"
                  >
                    <motion.div
                      className="inline-flex rounded-full bg-primary/20 p-6"
                      animate={{
                        boxShadow: [
                          "0 0 20px rgba(94, 127, 255, 0.3)",
                          "0 0 60px rgba(94, 127, 255, 0.6)",
                          "0 0 20px rgba(94, 127, 255, 0.3)"
                        ]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Cpu size={80} weight="duotone" className="text-primary" />
                    </motion.div>

                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.7 }}
                    >
                      <h3 className="text-3xl font-bold text-foreground lg:text-4xl">
                        {t.matrixHero.aiTitle}
                      </h3>
                      <p className="text-sm text-muted-foreground lg:text-base">
                        {t.matrixHero.aiSubtitle}
                      </p>
                    </motion.div>

                    <motion.div
                      className="flex items-center justify-center gap-2"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.9 }}
                    >
                      <motion.div 
                        className="h-2 w-2 rounded-full bg-primary"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      <span className="text-xs font-medium text-primary">{t.matrixHero.realTime}</span>
                    </motion.div>
                  </motion.div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-card to-transparent" />
              </div>
            </Card>

            <motion.div
              className="absolute -right-4 -top-4 -z-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
