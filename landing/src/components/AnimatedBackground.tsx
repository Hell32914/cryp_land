import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { usePerformanceMode } from "@/hooks/use-reduced-motion"

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isLowPerformance = usePerformanceMode()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Completely disable canvas animation on mobile for best performance
    const isMobile = window.innerWidth < 768
    if (isMobile) {
      console.log('Mobile detected - canvas animation disabled')
      return
    }

    const ctx = canvas.getContext("2d", { alpha: false })
    if (!ctx) return

    // Detect low-end devices
    const isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4
    const shouldReduceEffects = isLowEnd

    const setCanvasSize = () => {
      // Reduce canvas resolution on mobile for better performance
      const scale = shouldReduceEffects ? 0.5 : 1
      canvas.width = window.innerWidth * scale
      canvas.height = window.innerHeight * scale
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.scale(scale, scale)
    }
    setCanvasSize()
    
    // Debounce resize for better performance
    let resizeTimeout: number
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = window.setTimeout(setCanvasSize, 150)
    }
    window.addEventListener("resize", handleResize)

    const chars = "01"
    const fontSize = shouldReduceEffects ? 16 : 14
    const columns = Math.floor(canvas.width / fontSize / (shouldReduceEffects ? 2 : 1))
    
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

    // Reduce particles on mobile/low-end devices
    const particleCount = shouldReduceEffects ? 15 : 40
    for (let i = 0; i < particleCount; i++) {
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

      // Skip expensive particle connections on mobile
      if (!shouldReduceEffects) {
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
      }

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", handleResize)
      clearTimeout(resizeTimeout)
    }
  }, [])

  return (
    <>
      {/* Canvas animation - hidden on mobile */}
      <canvas
        ref={canvasRef}
        className="hidden md:block fixed inset-0 -z-10 opacity-50"
        style={{ mixBlendMode: "screen" }}
      />
      
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Static blur effects on mobile, animated on desktop */}
        <div className="md:hidden">
          {/* Static blurs for mobile - no animation */}
          <div className="absolute left-[5%] top-[15%] h-[300px] w-[300px] rounded-full bg-primary/15 blur-2xl" />
          <div className="absolute right-[8%] top-[25%] h-[250px] w-[250px] rounded-full bg-accent/10 blur-2xl" />
        </div>
        
        {/* Animated blurs for desktop only */}
        <motion.div
          className="hidden md:block absolute left-[5%] top-[15%] h-[600px] w-[600px] rounded-full bg-primary/30 blur-3xl"
          animate={{
            x: [0, 40, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="hidden md:block absolute right-[8%] top-[25%] h-[500px] w-[500px] rounded-full bg-accent/25 blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 40, 0],
            scale: [1, 1.08, 1]
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        {/* Show fewer blur elements on mobile */}
        <motion.div
          className="hidden md:block absolute left-[45%] bottom-[10%] h-[550px] w-[550px] rounded-full bg-primary/20 blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -40, 0],
            scale: [1, 1.15, 1]
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Flying particles - only on desktop for performance */}
        <motion.div
          className="hidden lg:block absolute left-[25%] top-[60%] h-2 w-2 rounded-full bg-primary"
          animate={{
            x: [0, 300, 600],
            y: [0, -50, 0],
            scale: [0, 1, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear",
            delay: 0
          }}
        />
        <motion.div
          className="hidden lg:block absolute right-[30%] top-[40%] h-2 w-2 rounded-full bg-accent"
          animate={{
            x: [0, -200, -400],
            y: [0, 60, 0],
            scale: [0, 1, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear",
            delay: 3
          }}
        />
      </div>
    </>
  )
}
