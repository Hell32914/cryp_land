import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const setCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    setCanvasSize()
    window.addEventListener("resize", setCanvasSize)

    const chars = "01"
    const fontSize = 14
    const columns = Math.floor(canvas.width / fontSize)
    
    const drops: Array<{
      y: number
      speed: number
      opacity: number
    }> = []

    for (let i = 0; i < columns; i++) {
      drops[i] = {
        y: Math.random() * canvas.height,
        speed: Math.random() * 0.5 + 0.3,
        opacity: Math.random() * 0.5 + 0.5
      }
    }

    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      opacity: number
      hue: number
    }> = []

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.2,
        hue: Math.random() * 20 + 230
      })
    }

    let time = 0

    const animate = () => {
      ctx.fillStyle = "rgba(18, 20, 35, 0.1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      time += 0.015

      ctx.font = `${fontSize}px monospace`
      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)]
        const x = i * fontSize
        
        const gradient = ctx.createLinearGradient(x, drops[i].y - 20, x, drops[i].y + 20)
        gradient.addColorStop(0, `hsla(235, 85%, 60%, 0)`)
        gradient.addColorStop(0.5, `hsla(235, 85%, 60%, ${drops[i].opacity * 0.8})`)
        gradient.addColorStop(1, `hsla(235, 85%, 60%, 0)`)
        ctx.fillStyle = gradient
        ctx.fillText(char, x, drops[i].y)

        drops[i].y += drops[i].speed
        
        if (drops[i].y > canvas.height && Math.random() > 0.99) {
          drops[i].y = 0
          drops[i].speed = Math.random() * 0.5 + 0.3
          drops[i].opacity = Math.random() * 0.5 + 0.5
        }
      }

      particles.forEach((particle) => {
        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

        const pulse = Math.sin(time * 2 + particle.x * 0.01) * 0.3 + 0.7

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * pulse, 0, Math.PI * 2)
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * pulse * 2
        )
        gradient.addColorStop(0, `hsla(${particle.hue}, 90%, 65%, ${particle.opacity * pulse})`)
        gradient.addColorStop(1, `hsla(${particle.hue}, 90%, 65%, 0)`)
        ctx.fillStyle = gradient
        ctx.fill()
      })

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 150) {
            ctx.beginPath()
            const avgHue = (particles[i].hue + particles[j].hue) / 2
            ctx.strokeStyle = `hsla(${avgHue}, 85%, 60%, ${0.15 * (1 - distance / 150)})`
            ctx.lineWidth = 0.6
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", setCanvasSize)
    }
  }, [])

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 -z-10 opacity-50"
        style={{ mixBlendMode: "screen" }}
      />
      
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute left-[5%] top-[15%] h-[600px] w-[600px] rounded-full bg-primary/30 blur-3xl"
          animate={{
            x: [0, 80, -40, 0],
            y: [0, 50, -30, 0],
            scale: [1, 1.2, 0.95, 1],
            rotate: [0, 90, 180, 270, 360]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute right-[8%] top-[25%] h-[500px] w-[500px] rounded-full bg-accent/25 blur-3xl"
          animate={{
            x: [0, -60, 40, 0],
            y: [0, 70, -50, 0],
            scale: [1, 1.15, 1.05, 1],
            rotate: [360, 270, 180, 90, 0]
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute left-[45%] bottom-[10%] h-[550px] w-[550px] rounded-full bg-primary/20 blur-3xl"
          animate={{
            x: [0, 50, -30, 0],
            y: [0, -60, 40, 0],
            scale: [1, 1.25, 0.9, 1],
            rotate: [0, 120, 240, 360]
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute right-[35%] top-[50%] h-[400px] w-[400px] rounded-full bg-accent/15 blur-3xl"
          animate={{
            x: [0, -50, 30, 0],
            y: [0, 60, -40, 0],
            scale: [1, 1.1, 1.2, 1]
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.div
          className="absolute left-[25%] top-[60%] h-2 w-2 rounded-full bg-primary"
          animate={{
            x: [0, 200, 400, 600, 800],
            y: [0, -100, 50, -80, 0],
            scale: [0, 1, 1, 1, 0],
            opacity: [0, 1, 1, 1, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
            delay: 0
          }}
        />
        <motion.div
          className="absolute right-[30%] top-[40%] h-2 w-2 rounded-full bg-accent"
          animate={{
            x: [0, -150, -300, -450, -600],
            y: [0, 80, -60, 90, 0],
            scale: [0, 1, 1, 1, 0],
            opacity: [0, 1, 1, 1, 0]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear",
            delay: 2
          }}
        />
        <motion.div
          className="absolute left-[60%] top-[30%] h-2 w-2 rounded-full bg-primary"
          animate={{
            x: [0, -100, -200, -300, -400],
            y: [0, 120, -40, 100, 0],
            scale: [0, 1, 1, 1, 0],
            opacity: [0, 1, 1, 1, 0]
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "linear",
            delay: 4
          }}
        />
      </div>
    </>
  )
}
