import { Header } from "@/components/Header"
import { Hero } from "@/components/Hero"
import { MatrixHero } from "@/components/MatrixHero"
import { Features } from "@/components/Features"
import { WhyChoose } from "@/components/WhyChoose"
import { TariffPlans } from "@/components/TariffPlans"
import { ReferralSystem } from "@/components/ReferralSystem"
import { Statistics } from "@/components/Statistics"
import { Leaderboard } from "@/components/Leaderboard"
import { FAQ } from "@/components/FAQ"
import { FinalCTA } from "@/components/FinalCTA"
import { AnimatedBackground } from "@/components/AnimatedBackground"

function App() {
  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      <Header />
      <main>
        <Hero />
        <MatrixHero />
        <WhyChoose />
        <div id="tariff-plans">
          <TariffPlans />
        </div>
        <ReferralSystem />
        <Statistics />
        <Leaderboard />
        <div id="faq">
          <FAQ />
        </div>
      </main>
      <FinalCTA />
    </div>
  )
}

export default App