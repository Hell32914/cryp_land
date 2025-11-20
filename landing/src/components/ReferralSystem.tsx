import { Users, ArrowRight } from "@phosphor-icons/react"
import { useLanguage } from "@/lib/LanguageContext"

export function ReferralSystem() {
  const { t } = useLanguage()
  
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 tracking-tight">
            {t.referral.title}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t.referral.description}
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-16 items-center max-w-6xl mx-auto">
          <div className="space-y-6">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 relative">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <Users weight="fill" className="text-primary w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t.referral.level1}</div>
                  <div className="font-bold text-xl">{t.referral.level1Title}</div>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary">{t.referral.level1Percent}</span>
                <span className="text-muted-foreground">{t.referral.dailyFromDeposits}</span>
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 relative">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-accent/10 p-3 rounded-xl">
                  <Users weight="fill" className="text-accent w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t.referral.level2}</div>
                  <div className="font-bold text-xl">{t.referral.level2Title}</div>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-accent">{t.referral.level2Percent}</span>
                <span className="text-muted-foreground">{t.referral.dailyFromDeposits}</span>
              </div>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 relative">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl" style={{backgroundColor: 'oklch(0.68 0.20 210 / 0.15)'}}>
                  <Users weight="fill" className="w-6 h-6" style={{color: 'oklch(0.68 0.20 210)'}} />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t.referral.level3}</div>
                  <div className="font-bold text-xl">{t.referral.level3Title}</div>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold" style={{color: 'oklch(0.68 0.20 210)'}}>{t.referral.level3Percent}</span>
                <span className="text-muted-foreground">{t.referral.dailyFromDeposits}</span>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex flex-col items-center justify-center">
            <div className="relative h-96">
              <svg 
                className="w-48 h-full" 
                viewBox="0 0 180 380"
              >
                <defs>
                  <linearGradient id="line-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="oklch(0.55 0.25 240)" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="oklch(0.55 0.25 240)" stopOpacity="0.2" />
                  </linearGradient>
                  <linearGradient id="line-gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="oklch(0.62 0.28 235)" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="oklch(0.62 0.28 235)" stopOpacity="0.2" />
                  </linearGradient>
                  <linearGradient id="line-gradient-3" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="oklch(0.68 0.20 210)" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="oklch(0.68 0.20 210)" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                
                <path 
                  d="M 10 60 Q 90 80 170 190" 
                  stroke="url(#line-gradient-1)" 
                  strokeWidth="2" 
                  fill="none"
                  strokeDasharray="4 4"
                  className="animate-[dash_3s_linear_infinite]"
                />
                
                <path 
                  d="M 10 190 Q 90 190 170 190" 
                  stroke="url(#line-gradient-2)" 
                  strokeWidth="2" 
                  fill="none"
                  strokeDasharray="4 4"
                  className="animate-[dash_3s_linear_infinite]"
                  style={{animationDelay: '0.5s'}}
                />
                
                <path 
                  d="M 10 320 Q 90 300 170 190" 
                  stroke="url(#line-gradient-3)" 
                  strokeWidth="2" 
                  fill="none"
                  strokeDasharray="4 4"
                  className="animate-[dash_3s_linear_infinite]"
                  style={{animationDelay: '1s'}}
                />
                
                <circle cx="10" cy="60" r="4" fill="oklch(0.55 0.25 240)" opacity="0.8"/>
                <circle cx="10" cy="190" r="4" fill="oklch(0.62 0.28 235)" opacity="0.8"/>
                <circle cx="10" cy="320" r="4" fill="oklch(0.68 0.20 210)" opacity="0.8"/>
                
                <circle cx="170" cy="190" r="5" fill="oklch(0.55 0.25 240)" opacity="0.9"/>
              </svg>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-3xl" />
              
              <div className="relative bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-sm border-2 border-primary/50 rounded-3xl p-10 min-w-[300px]">
                <div className="absolute top-3 left-3 w-3 h-3 bg-accent rounded-full animate-pulse" />
                <div className="absolute top-3 right-3 w-3 h-3 bg-accent rounded-full animate-pulse" style={{animationDelay: '0.5s'}} />
                <div className="absolute bottom-3 left-3 w-3 h-3 bg-accent rounded-full animate-pulse" style={{animationDelay: '1s'}} />
                <div className="absolute bottom-3 right-3 w-3 h-3 bg-accent rounded-full animate-pulse" style={{animationDelay: '1.5s'}} />
                
                <div className="flex flex-col items-center gap-6">
                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="w-2.5 h-2.5 bg-accent/60 rounded-sm"
                        style={{
                          animation: `pulse ${1 + Math.random()}s ease-in-out infinite`,
                          animationDelay: `${Math.random() * 2}s`
                        }}
                      />
                    ))}
                  </div>
                  
                  <div className="text-center space-y-2">
                    <div className="text-2xl font-bold text-foreground">{t.referral.you}</div>
                    <div className="h-px w-16 bg-border mx-auto" />
                  </div>

                  <div className="text-center space-y-2 pt-4 border-t border-border/50 w-full">
                    <div className="text-sm text-muted-foreground">{t.referral.totalEarnings}</div>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">9%</span>
                      <span className="text-xl text-muted-foreground">{t.referral.dailyRate}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{t.referral.passiveIncome}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 bg-accent/10 border border-accent/30 rounded-full px-6 py-3">
            <span className="text-sm text-muted-foreground">{t.referral.example}</span>
            <span className="font-bold">{t.referral.exampleAmount}</span>
            <ArrowRight weight="bold" className="text-accent" />
            <span className="text-xl font-bold text-primary">{t.referral.exampleResult}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
