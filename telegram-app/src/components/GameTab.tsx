import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Gift } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GAME_BOXES, type GameBoxConfig, type GameBoxId } from '@/lib/gameBoxes'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type BuyBoxResponse = {
  success: true
  boxId: GameBoxId
  cost: number
  maxPrize: number
  outcomes: number[]
  prizeIndex: number
  prize: number
  newBonusTokens: number
  newBalance: number
}

type PersistedGameState = {
  roulette: BuyBoxResponse
  rouletteBalance: number | null
  spinDone: boolean
  idleIndex: number
}

function formatAmount(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

export function GameTab(props: {
  t: any
  telegramUserId: string | undefined
  getAuthHeaders: () => Record<string, string>
  depositBalance: number
  refreshData: () => Promise<void>
  allowPurchases?: boolean
  onExit?: () => void
}) {
  const { t, telegramUserId, getAuthHeaders, depositBalance, refreshData, allowPurchases = true, onExit } = props
  const storageKey = telegramUserId ? `syntrix.game.active.${telegramUserId}` : null
  const hydratedRef = useRef(false)

  const boxes: GameBoxConfig[] = useMemo(() => GAME_BOXES, [])

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingBox, setPendingBox] = useState<GameBox | null>(null)
  const [buying, setBuying] = useState(false)

  const [roulette, setRoulette] = useState<BuyBoxResponse | null>(null)
  const [rouletteBalance, setRouletteBalance] = useState<number | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [spinSequence, setSpinSequence] = useState<number[]>([])
  const [spinPos, setSpinPos] = useState(0)
  const [spinDone, setSpinDone] = useState(false)
  const [idleIndex, setIdleIndex] = useState(0)
  const spinTimer = useRef<number | null>(null)
  const spinRaf = useRef<number | null>(null)

  const REEL_VIEW_HEIGHT = 360
  const REEL_ITEM_HEIGHT = 84

  useEffect(() => {
    if (!storageKey) return

    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) {
        hydratedRef.current = true
        return
      }

      const saved = JSON.parse(raw) as PersistedGameState
      if (!saved?.roulette || !Array.isArray(saved.roulette.outcomes)) {
        window.localStorage.removeItem(storageKey)
        hydratedRef.current = true
        return
      }

      setRoulette(saved.roulette)
      setRouletteBalance(saved.rouletteBalance ?? null)
      setSpinDone(Boolean(saved.spinDone))
      setSpinning(false)
      setSpinSequence([])
      setSpinPos(0)
      setIdleIndex(Number.isFinite(saved.idleIndex) ? saved.idleIndex : 0)
    } catch (error) {
      console.error('Failed to restore game state:', error)
    } finally {
      hydratedRef.current = true
    }
  }, [storageKey])

  useEffect(() => {
    if (!storageKey || !hydratedRef.current) return

    if (!roulette) {
      window.localStorage.removeItem(storageKey)
      return
    }

    const state: PersistedGameState = {
      roulette,
      rouletteBalance,
      // If the mini app closes during animation, restore the purchased case as pending spin.
      spinDone: spinning ? false : spinDone,
      idleIndex,
    }

    window.localStorage.setItem(storageKey, JSON.stringify(state))
  }, [storageKey, roulette, rouletteBalance, spinDone, idleIndex, spinning])

  useEffect(() => {
    return () => {
      if (spinTimer.current) {
        window.clearTimeout(spinTimer.current)
        spinTimer.current = null
      }
      if (spinRaf.current) {
        window.cancelAnimationFrame(spinRaf.current)
        spinRaf.current = null
      }
    }
  }, [])

  const canAfford = (box: GameBoxConfig) => depositBalance >= box.cost

  const openConfirm = (box: GameBoxConfig) => {
    if (!canAfford(box)) {
      toast.error((t as any).gameInsufficientTokens ?? 'Insufficient tokens')
      return
    }
    setPendingBox(box)
    setConfirmOpen(true)
  }

  const goBackToGrid = async () => {
    if (spinning) return
    setRoulette(null)
    setRouletteBalance(null)
    setSpinSequence([])
    setSpinPos(0)
    setSpinDone(false)
    await refreshData()
    if (!allowPurchases) {
      onExit?.()
    }
  }

  const startSpin = async (data: BuyBoxResponse) => {
    if (spinRaf.current) {
      window.cancelAnimationFrame(spinRaf.current)
      spinRaf.current = null
    }

    setSpinning(true)
    setSpinDone(false)

    // Build a reel with buffer items above/below so it never ends abruptly.
    const prefixCount = 8
    const suffixCount = 10
    const mainCount = 54

    const prefix: number[] = []
    const suffix: number[] = []
    for (let i = 0; i < prefixCount; i++) {
      prefix.push(Math.floor(Math.random() * data.outcomes.length))
    }
    for (let i = 0; i < suffixCount; i++) {
      suffix.push(Math.floor(Math.random() * data.outcomes.length))
    }

    const main: number[] = []
    for (let i = 0; i < mainCount; i++) {
      main.push(Math.floor(Math.random() * data.outcomes.length))
    }

    // Prize should land at stopAt (not the end of the list) so items remain visible below.
    const stopAt = prefix.length + main.length
    const seq: number[] = [...prefix, ...main, data.prizeIndex, ...suffix]

    setSpinSequence(seq)
    setSpinPos(prefix.length)

    const start = window.performance.now()
    const durationMs = 5600

    const animate = (now: number) => {
      const tNorm = Math.min(1, Math.max(0, (now - start) / durationMs))
      // Ease-out quint (smoother slowdown)
      const eased = 1 - Math.pow(1 - tNorm, 5)
      const from = prefix.length
      const to = stopAt
      const pos = from + eased * (to - from)
      setSpinPos(pos)

      if (tNorm < 1) {
        spinRaf.current = window.requestAnimationFrame(animate)
        return
      }

      spinRaf.current = null
      setSpinPos(stopAt)
      setSpinning(false)
      setSpinDone(true)
      setRouletteBalance(data.newBalance)
      toast.success(
        `${(t as any).gameYouWon ?? 'You won'} $${formatAmount(data.prize)}`
      )
      refreshData()
    }

    spinRaf.current = window.requestAnimationFrame(animate)
  }

  const handleConfirmBuy = async () => {
    if (!pendingBox) return

    if (!telegramUserId) {
      toast.error((t as any).errorAuth ?? 'Not authenticated')
      return
    }

    const authHeaders = getAuthHeaders()
    if (!authHeaders?.Authorization) {
      toast.error((t as any).errorAuth ?? 'Not authenticated')
      return
    }

    setBuying(true)
    const toastId = toast.loading((t as any).loading ?? 'Loading…')
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://api.syntrix.uno'
      const response = await fetch(`${API_URL}/api/user/${telegramUserId}/game/buy-box`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ boxId: pendingBox.id }),
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type') || ''
        const err = contentType.includes('application/json')
          ? await response.json().catch(() => ({}))
          : await response.text().catch(() => '')

        const message =
          (typeof err === 'object' && err && 'error' in err && (err as any).error) ||
          (typeof err === 'string' && err.trim() ? err.trim() : null) ||
          (t as any).errorGeneric ||
          'Failed'

        toast.error(`${message} (${response.status})`)
        return
      }

      const data = (await response.json()) as BuyBoxResponse

      if (!data?.success || !Array.isArray(data.outcomes) || typeof data.prizeIndex !== 'number') {
        toast.error((t as any).errorGeneric ?? 'Failed')
        return
      }

      setConfirmOpen(false)
      setPendingBox(null)
      setRoulette(data)
      // Show balance after purchase (cost deducted) but before prize reveal.
      // The backend may have already computed/credited the prize; we delay reflecting it in UI until Spin completes.
      setRouletteBalance(Math.max(0, depositBalance - pendingBox.cost))
      setIdleIndex(Math.floor(Math.random() * data.outcomes.length))
      setSpinSequence([])
      setSpinPos(0)
      setSpinDone(false)
      // Do not refresh global data here; it can trigger a full-screen loading state and reset the roulette view.
      // We'll refresh after the spin completes.
    } catch (e) {
      console.error('Buy box error:', e)
      toast.error((t as any).errorNetwork ?? 'Network error')
    } finally {
      toast.dismiss(toastId)
      setBuying(false)
    }
  }

  if (roulette) {
    const isIdle = !spinning && !spinDone && spinSequence.length === 0
    const reelIndices = isIdle
      ? Array.from({ length: Math.max(24, roulette.outcomes.length * 4) }, (_, i) => i % roulette.outcomes.length)
      : spinSequence

    const reelPosRaw = isIdle ? idleIndex : spinPos
    const reelPos = Math.min(Math.max(reelPosRaw, 0), Math.max(0, reelIndices.length - 1))
    const reelTransformY = REEL_VIEW_HEIGHT / 2 - (reelPos * REEL_ITEM_HEIGHT + REEL_ITEM_HEIGHT / 2)

    return (
      <div className="space-y-5 pb-4">
        <div className="bg-card/50 backdrop-blur-sm rounded-xl p-5 sm:p-6 border border-border/50 shadow-lg">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              className="px-2"
              onClick={goBackToGrid}
              disabled={spinning}
              aria-label={(t as any).back ?? 'Back'}
            >
              <ArrowLeft size={20} weight="bold" />
            </Button>
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              {(t as any).gameRouletteTitle ?? 'Roulette'}
            </h2>
            <div className="w-10" />
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur-sm rounded-xl p-5 sm:p-6 border border-border/50 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {(t as any).availableBalance ?? 'Available balance'}
            </p>
            <span className="text-base font-bold text-primary">${formatAmount(rouletteBalance ?? depositBalance)}</span>
          </div>

          <div className="relative rounded-2xl border border-border/50 bg-background/40 overflow-hidden shadow-lg" style={{ height: REEL_VIEW_HEIGHT }}>
            <div
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-primary select-none"
              aria-hidden
            >
              <div className="h-0 w-0 border-y-[16px] border-y-transparent border-r-[22px] border-r-primary/70" />
            </div>
            <div
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-primary select-none"
              aria-hidden
            >
              <div className="h-0 w-0 border-y-[16px] border-y-transparent border-l-[22px] border-l-primary/70" />
            </div>

            <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-[100px] rounded-2xl border-2 border-primary/40 bg-card/30 pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background/80 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />

            <div
              className="will-change-transform"
              style={{ transform: `translateY(${reelTransformY}px)` }}
            >
              {reelIndices.map((idx, i) => {
                const value = roulette.outcomes[idx] ?? 0
                const isCenter = Math.round(reelPos) === i
                return (
                  <div
                    key={`${idx}-${i}`}
                    className={`flex items-center justify-center px-6 ${isCenter ? '' : 'opacity-70'}`}
                    style={{ height: REEL_ITEM_HEIGHT }}
                  >
                    <div
                      className={
                        `w-full max-w-sm rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm ` +
                        `flex items-center justify-center gap-2 py-5 ` +
                        (isCenter ? 'border-primary/40 bg-card/70' : '')
                      }
                    >
                      <Gift size={20} weight="duotone" className="text-primary" />
                      <span className="text-3xl font-extrabold text-foreground tabular-nums">${formatAmount(value)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            {spinning
              ? ((t as any).gameSpinning ?? 'Spinning…')
              : spinDone
                ? ((t as any).gameSpinDone ?? 'Result ready')
                : ((t as any).gameReadyToSpin ?? 'Ready to spin')}
          </p>

          {!spinning && !spinDone && (
            <div className="pt-2">
              <Button
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold py-6"
                onClick={() => startSpin(roulette)}
              >
                {(t as any).gameSpinButton ?? 'Spin'}
              </Button>
            </div>
          )}

          {spinDone && (
            <div className="pt-2">
              <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold py-6" onClick={goBackToGrid}>
                {(t as any).gameBackToBoxes ?? 'Back to boxes'}
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!allowPurchases) {
    return (
      <div className="space-y-5 pb-4">
        <div className="bg-card/50 backdrop-blur-sm rounded-xl p-5 sm:p-6 space-y-3 border border-border/50 shadow-lg text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Gift size={28} weight="duotone" className="text-primary" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            {(t as any).gameGiftOnlyTitle ?? 'Gift box only'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {(t as any).gameGiftOnlyText ?? 'Open your gifted box from Home. Regular box purchases are hidden for this account.'}
          </p>
          <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold py-6" onClick={() => onExit?.()}>
            {(t as any).back ?? 'Back'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-4">
      <div className="bg-card/50 backdrop-blur-sm rounded-xl p-5 sm:p-6 space-y-3 border border-border/50 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Gift size={22} weight="duotone" className="text-primary sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">{(t as any).syntrixGameTitle ?? 'Syntrix Game'}</h2>
              <p className="text-xs text-muted-foreground">{(t as any).gameSubtitle ?? 'Buy a box and spin the roulette'}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-muted-foreground">{(t as any).availableBalance ?? 'Available balance'}</p>
            <span className="text-lg font-bold text-primary">${formatAmount(depositBalance)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {boxes.map((box) => {
          const affordable = canAfford(box)
          return (
            <button
              key={box.id}
              type="button"
              className={`relative overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 aspect-[4/5] flex flex-col text-left transition-opacity ${
                affordable ? 'hover:bg-card/70' : 'opacity-50 cursor-not-allowed'
              }`}
              onClick={() => affordable && openConfirm(box)}
            >
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="border-border/50 bg-background/50 text-muted-foreground">
                  {(t as any).upTo ?? 'Up to'} {box.maxPrize}
                </Badge>
                <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Gift size={18} weight="fill" className="text-primary" />
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center gap-2">
                <div className="w-24 h-24 rounded-2xl bg-primary/10 border border-primary/20 overflow-hidden flex items-center justify-center p-2">
                  <img src={box.imageSrc} alt={box.name} className="w-full h-full object-contain" />
                </div>
                <p className="text-sm font-bold text-foreground text-center leading-tight">{box.name}</p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <span className="text-lg font-bold text-foreground">${box.cost.toLocaleString('en-US')}</span>
              </div>

              {!affordable && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {(t as any).gameNotEnough ?? 'Not enough balance'}
                </p>
              )}
            </button>
          )
        })}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={(open) => !buying && setConfirmOpen(open)}>
        <AlertDialogContent className="bg-card border-border/50 rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              {(t as any).gameConfirmTitle ?? 'Confirm purchase'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {pendingBox
                ? `${(t as any).gameConfirmText ?? 'Do you want to buy'} “${pendingBox.name}” ${
                    (t as any).gameFor ?? 'for'
                  } $${pendingBox.cost}?`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={buying}>{(t as any).cancel ?? 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              disabled={buying}
              onClick={(e) => {
                e.preventDefault()
                handleConfirmBuy()
              }}
            >
              {buying ? ((t as any).loading ?? 'Loading…') : ((t as any).buy ?? 'Buy')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
