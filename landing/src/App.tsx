import { lazy, Suspense, useEffect, useState } from "react"
import { MotionConfig } from "framer-motion"
import { Header } from "@/components/Header"
import { Hero } from "@/components/Hero"
import { AnimatedBackground } from "@/components/AnimatedBackground"

// Lazy load heavy components for better initial load
const MatrixHero = lazy(() => import("@/components/MatrixHero").then(m => ({ default: m.MatrixHero })))
const WhyChoose = lazy(() => import("@/components/WhyChoose").then(m => ({ default: m.WhyChoose })))
const TariffPlans = lazy(() => import("@/components/TariffPlans").then(m => ({ default: m.TariffPlans })))
const ReferralSystem = lazy(() => import("@/components/ReferralSystem").then(m => ({ default: m.ReferralSystem })))
const Statistics = lazy(() => import("@/components/Statistics").then(m => ({ default: m.Statistics })))
const Leaderboard = lazy(() => import("@/components/Leaderboard").then(m => ({ default: m.Leaderboard })))
const FAQ = lazy(() => import("@/components/FAQ").then(m => ({ default: m.FAQ })))
const FinalCTA = lazy(() => import("@/components/FinalCTA").then(m => ({ default: m.FinalCTA })))

function App() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  return (
    <MotionConfig reducedMotion={isMobile ? "always" : "never"}>
      <div className="min-h-screen">
        <AnimatedBackground />
        <Header />
        <main>
        <Hero />
        <Suspense fallback={<div className="min-h-[400px]" />}>
          <MatrixHero />
        </Suspense>
        <Suspense fallback={<div className="min-h-[200px]" />}>
          <WhyChoose />
        </Suspense>
        <div id="tariff-plans">
          <Suspense fallback={<div className="min-h-[600px]" />}>
            <TariffPlans />
          </Suspense>
        </div>
        <Suspense fallback={<div className="min-h-[400px]" />}>
          <ReferralSystem />
        </Suspense>
        <Suspense fallback={<div className="min-h-[300px]" />}>
          <Statistics />
        </Suspense>
        <Suspense fallback={<div className="min-h-[400px]" />}>
          <Leaderboard />
        </Suspense>
        <div id="faq">
          <Suspense fallback={<div className="min-h-[400px]" />}>
            <FAQ />
          </Suspense>
        </div>
      </main>
      <Suspense fallback={<div className="min-h-[200px]" />}>
        <FinalCTA />
      </Suspense>
      </div>
    </MotionConfig>
  )
}

export default App