import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useEffect, useRef } from "react"
import { TelegramLogo } from "@phosphor-icons/react"

export function MatrixBanner() {
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

    const drawCircuitBoard = () => {
      ctx.strokeStyle = "rgba(94, 127, 255, 0.15)"
      ctx.lineWidth = 1

      const gridSize = 40
      const rows = Math.ceil(canvas.height / gridSize)
      const cols = Math.ceil(canvas.width / gridSize)

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * gridSize
          const y = row * gridSize
          
          if (Math.random() > 0.6) {
            ctx.beginPath()
            
            const directions = [
              [0, 0, gridSize, 0],
              [0, 0, 0, gridSize],
              [gridSize, 0, gridSize, gridSize],
              [0, gridSize, gridSize, gridSize],
              [0, 0, gridSize / 2, 0],
              [gridSize / 2, 0, gridSize / 2, gridSize / 2],
            ]
            
            const dir = directions[Math.floor(Math.random() * directions.length)]
            ctx.moveTo(x + dir[0], y + dir[1])
            ctx.lineTo(x + dir[2], y + dir[3])
            ctx.stroke()
            
            if (Math.random() > 0.8) {
              ctx.fillStyle = "rgba(94, 127, 255, 0.3)"
              ctx.beginPath()
              ctx.arc(x + dir[2], y + dir[3], 2, 0, Math.PI * 2)
              ctx.fill()
            }
          }
        }
      }
    }

    drawCircuitBoard()

    const handleResize = () => {
      setCanvasSize()
      drawCircuitBoard()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <section className="relative overflow-hidden bg-black py-24 lg:py-32">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-transparent" />

      <div className="container relative z-10 mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative"
          >
            <motion.h2 
              className="text-7xl font-black tracking-tighter text-white md:text-8xl lg:text-9xl"
              style={{
                textShadow: "0 0 40px rgba(94, 127, 255, 0.5), 0 0 80px rgba(94, 127, 255, 0.3)"
              }}
              animate={{
                textShadow: [
                  "0 0 40px rgba(94, 127, 255, 0.5), 0 0 80px rgba(94, 127, 255, 0.3)",
                  "0 0 60px rgba(94, 127, 255, 0.7), 0 0 100px rgba(94, 127, 255, 0.4)",
                  "0 0 40px rgba(94, 127, 255, 0.5), 0 0 80px rgba(94, 127, 255, 0.3)"
                ]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              SYNTRIX
            </motion.h2>

            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <Button
                size="lg"
                className="group relative bg-[#00ff41] text-black font-bold text-lg px-10 py-7 hover:bg-[#00ff41] hover:brightness-110 shadow-[0_0_30px_rgba(0,255,65,0.6)] transition-all duration-300"
                style={{
                  backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)"
                }}
              >
                <motion.span
                  className="relative flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  JOIN BOT
                </motion.span>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            className="mt-16 flex items-center gap-6 text-sm text-white/60"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono">[SYNTRIX BOT]</span>
            </div>

            <div className="h-1 w-1 rounded-full bg-white/40" />

            <div className="flex items-center gap-2">
              <span>© 2025 Syntrix Bot. All rights reserved.</span>
            </div>

            <div className="h-1 w-1 rounded-full bg-white/40" />

            <button className="flex items-center gap-2 transition-colors hover:text-white">
              <TelegramLogo size={16} weight="fill" />
              <span>Telegram</span>
            </button>
          </motion.div>
        </div>
      </div>

      <motion.div
        className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/20 blur-[120px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2]
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div
        className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-accent/20 blur-[120px]"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.3, 0.2]
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2.5
        }}
      />
    </section>
  )
}
