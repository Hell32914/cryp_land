import { motion } from "framer-motion"

interface LogoProps {
  className?: string
  animated?: boolean
}

export function Logo({ className = "", animated = false }: LogoProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  const Component = animated ? motion.div : 'div'

  return (
    <Component
      className={`flex items-center gap-0 ${className}`}
      initial={animated ? "hidden" : undefined}
      animate={animated ? "visible" : undefined}
      variants={animated ? containerVariants : undefined}
    >
      <span className="text-6xl font-bold tracking-wider text-white">
        SYNTRIX
      </span>
    </Component>
  )
}
