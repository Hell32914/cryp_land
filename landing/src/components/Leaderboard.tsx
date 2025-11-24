import { TrendUp, TrendDown, Trophy, Users } from "@phosphor-icons/react"
import { useEffect, useState } from "react"
import { useLanguage } from "@/lib/LanguageContext"

interface LeaderboardEntry {
  rank: number
  id: string
  value1: string
  value2: string
}

const topInvestors: LeaderboardEntry[] = [
  { rank: 1, id: "alex_martinez", value1: "$127,430", value2: "$41,980" },
  { rank: 2, id: "sarah_chen", value1: "$92,750", value2: "$29,830" },
  { rank: 3, id: "mike_johnson", value1: "$68,210", value2: "$20,540" },
  { rank: 4, id: "emma_rodriguez", value1: "$54,890", value2: "$16,100" },
  { rank: 5, id: "david_kim", value1: "$37,320", value2: "$10,870" },
  { rank: 6, id: "lisa_weber", value1: "$29,480", value2: "$8,410" },
  { rank: 7, id: "james_taylor", value1: "$21,930", value2: "$6,120" },
]

const topReferrers: LeaderboardEntry[] = [
  { rank: 1, id: "robert_fischer", value1: "184", value2: "$265,400" },
  { rank: 2, id: "maria_santos", value1: "141", value2: "$198,750" },
  { rank: 3, id: "thomas_meyer", value1: "97", value2: "$139,220" },
  { rank: 4, id: "anna_kowalski", value1: "63", value2: "$92,180" },
  { rank: 5, id: "john_anderson", value1: "46", value2: "$67,540" },
  { rank: 6, id: "sophie_dubois", value1: "38", value2: "$55,260" },
  { rank: 7, id: "carlos_silva", value1: "27", value2: "$39,410" },
]

function LeaderboardTable({ 
  title, 
  icon: Icon,
  headers, 
  data 
}: { 
  title: string
  icon: typeof Trophy
  headers: string[]
  data: LeaderboardEntry[]
}) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)

  return (
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-6">
        <TrendDown weight="bold" className="text-primary w-5 h-5" />
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h3>
      </div>

      <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                {headers.map((header, i) => (
                  <th 
                    key={i}
                    className="px-6 py-4 text-left text-sm font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((entry) => {
                const isTop3 = entry.rank <= 3
                const isHovered = hoveredRow === entry.rank

                return (
                  <tr 
                    key={entry.rank}
                    className={`
                      border-b border-border/30 last:border-0 transition-all duration-300
                      ${isTop3 ? 'bg-gradient-to-r from-primary/20 via-accent/15 to-primary/10' : 'hover:bg-muted/30'}
                      ${isHovered && !isTop3 ? 'bg-muted/50' : ''}
                    `}
                    onMouseEnter={() => setHoveredRow(entry.rank)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td className="px-6 py-4 font-bold text-foreground">
                      <div className="flex items-center gap-3">
                        {isTop3 && (
                          <Trophy 
                            weight="fill" 
                            className={`w-5 h-5 ${
                              entry.rank === 1 ? 'text-yellow-400' :
                              entry.rank === 2 ? 'text-gray-300' :
                              'text-amber-500'
                            }`}
                          />
                        )}
                        {entry.rank}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-foreground">
                      {entry.id}
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground">
                      {entry.value1}
                    </td>
                    <td className="px-6 py-4 font-bold text-primary">
                      {entry.value2}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-3 p-4">
          {data.map((entry) => {
            const isTop3 = entry.rank <= 3

            return (
              <div 
                key={entry.rank}
                className={`
                  p-4 rounded-xl border border-border/50 transition-all duration-300
                  ${isTop3 ? 'bg-gradient-to-r from-primary/20 via-accent/15 to-primary/10' : 'bg-card/30'}
                `}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {isTop3 && (
                      <Trophy 
                        weight="fill" 
                        className={`w-5 h-5 ${
                          entry.rank === 1 ? 'text-yellow-400' :
                          entry.rank === 2 ? 'text-gray-300' :
                          'text-amber-500'
                        }`}
                      />
                    )}
                    <span className="text-2xl font-bold text-foreground">#{entry.rank}</span>
                  </div>
                  <span className="font-mono text-sm font-medium text-foreground bg-muted/50 px-3 py-1 rounded-lg">
                    {entry.id}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      {headers[2]}
                    </div>
                    <div className="text-base font-bold text-foreground">
                      {entry.value1}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      {headers[3]}
                    </div>
                    <div className="text-base font-bold text-primary">
                      {entry.value2}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function Leaderboard() {
  const [animate, setAnimate] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    setAnimate(true)
  }, [])

  return (
    <section className="relative py-12 sm:py-16 md:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <div className={`inline-block transition-all duration-1000 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 tracking-tight">
              {t.leaderboard.title}
            </h2>
          </div>
          <p className={`text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4 transition-all duration-1000 delay-200 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
            {t.leaderboard.description}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
          <LeaderboardTable
            title={t.leaderboard.topInvestors}
            icon={Trophy}
            headers={[t.leaderboard.rank, t.leaderboard.investorId, t.leaderboard.deposit, t.leaderboard.profit]}
            data={topInvestors}
          />

          <LeaderboardTable
            title={t.leaderboard.topReferrals}
            icon={Users}
            headers={[t.leaderboard.rank, t.leaderboard.referrerId, t.leaderboard.referrals, t.leaderboard.networkValue]}
            data={topReferrers}
          />
        </div>

        <div className="mt-8 sm:mt-12 flex justify-center px-4">
          <div className="inline-flex items-center gap-2 sm:gap-3 bg-primary/10 border border-primary/30 rounded-full px-4 sm:px-6 md:px-8 py-3 sm:py-4">
            <TrendUp weight="bold" className="text-primary w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-xs sm:text-sm text-muted-foreground">{t.leaderboard.updatedEvery}</span>
            <span className="font-bold text-sm sm:text-base text-foreground">{t.leaderboard.hours}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
