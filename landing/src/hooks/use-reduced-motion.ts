import { useEffect, useState } from 'react'

export function useReducedMotion() {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false)

  useEffect(() => {
    // Check for user's motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setShouldReduceMotion(mediaQuery.matches)

    const handleChange = () => {
      setShouldReduceMotion(mediaQuery.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return shouldReduceMotion
}

export function usePerformanceMode() {
  const [isLowPerformance, setIsLowPerformance] = useState(false)

  useEffect(() => {
    const isMobile = window.innerWidth < 768
    const isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4
    const hasLowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    setIsLowPerformance(isMobile || isLowEnd || hasLowMemory || prefersReducedMotion)
  }, [])

  return isLowPerformance
}

// Helper to get animation config based on performance mode
export function useAnimationConfig() {
  const isLowPerformance = usePerformanceMode()
  
  return {
    // Disable complex animations on low-performance devices
    enabled: !isLowPerformance,
    // Reduced durations for better performance
    duration: isLowPerformance ? 0.2 : 0.6,
    // Simpler easing
    ease: isLowPerformance ? "linear" : "easeInOut",
    // Disable viewport animations on mobile to prevent re-renders
    viewport: isLowPerformance ? false : { once: true, amount: 0.3 }
  }
}
