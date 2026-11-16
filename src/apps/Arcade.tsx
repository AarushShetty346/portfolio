import { lazy, Suspense, useCallback, useState, type ComponentType, type LazyExoticComponent } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft, Bomb, Bug, Layers, Trophy, Worm, type LucideIcon } from 'lucide-react'
import type { AppProps } from '../os/apps'
import { useWM } from '../os/store'
import type { GameProps, HudItem } from './arcade/kit'

/* ------------------------------------------------------------------
   ARCADE: four small games. Starting one takes the window fullscreen
   and the game fills it. Best results are kept only in memory, so they
   last until the page is closed or reloaded.
------------------------------------------------------------------- */

interface GameDef {
  id: string
  name: string
  blurb: string
  icon: LucideIcon
  color: string
  /** How a best result reads, and which direction is better. */
  unit: string
  lowerIsBetter?: boolean
  component: LazyExoticComponent<ComponentType<GameProps>>
}

const GAMES: GameDef[] = [
  { id: 'blockfall', name: 'Blockfall', blurb: 'Falling blocks. Fill a row to clear it.', icon: Layers, color: '#3ee6ff', unit: 'pts', component: lazy(() => import('./arcade/Blockfall')) },
  { id: 'snake', name: 'Snake', blurb: 'Eat, grow, and do not bite yourself.', icon: Worm, color: '#5dffa8', unit: 'eaten', component: lazy(() => import('./arcade/Snake')) },
  { id: 'mines', name: 'Minesweeper', blurb: 'A board cut to your screen. Fastest clear wins.', icon: Bomb, color: '#ff5c7a', unit: 's', lowerIsBetter: true, component: lazy(() => import('./arcade/Mines')) },
  { id: 'maze', name: 'Glitch Run', blurb: 'A maze chase. Collect the bits, dodge the bugs.', icon: Bug, color: '#ffb657', unit: 'pts', component: lazy(() => import('./arcade/Maze')) },
]

// lives for the session only, by design
const best: Record<string, number> = {}

export default function Arcade({ win }: AppProps) {
  const [open, setOpen] = useState<string | null>(null)
  const [, bump] = useState(0)
  const [hudItems, setHudItems] = useState<HudItem[]>([])
  const game = GAMES.find((g) => g.id === open)

  const submit = useCallback((score: number) => {
    const g = GAMES.find((x) => x.id === open)
    if (!g || score <= 0) return
    const prev = best[g.id]
    if (prev === undefined || (g.lowerIsBetter ? score < prev : score > prev)) { best[g.id] = score; bump((n) => n + 1) }
  }, [open])

  const hud = useCallback((items: HudItem[]) => {
    setHudItems((prev) => (JSON.stringify(prev) === JSON.stringify(items) ? prev : items))
  }, [])

  const play = (id: string) => {
    // a game gets the whole screen
    const w = useWM.getState().windows.find((x) => x.id === win.id)
    if (w && !w.maximized) useWM.getState().toggleMaximize(win.id)
    setHudItems([])
    setOpen(id)
  }

  if (game) {
    const Game = game.component
    return (
      <div className="relative size-full bg-[#06070c]" style={{ ['--accent' as string]: game.color }}>
        <div className="absolute inset-x-0 bottom-0 top-8">
          <Suspense fallback={<div className="skeleton size-full" />}>
            <Game best={best[game.id]} submit={submit} hud={hud} />
          </Suspense>
        </div>
        {/* one slim line: the way back on the left, the numbers on the right */}
        <div className="absolute inset-x-0 top-0 flex h-8 items-center gap-2.5 px-2">
          <button className="flex h-6 items-center gap-1.5 rounded-md px-1.5 text-[12px] text-ink/70 transition-colors hover:bg-white/10 hover:text-ink" onClick={() => setOpen(null)}>
            <ArrowLeft size={13} /> {game.name}
          </button>
          <div className="ml-auto flex items-center gap-3.5 pr-1 font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink/50">
            {hudItems.map(([k, v]) => (
              <span key={k}>
                {k} <span className={k === 'Best' ? 'text-accent' : 'text-ink'} style={{ fontSize: 12.5 }}>{v}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="os-scroll h-full px-5 py-6 @2xl/win:px-8 @2xl/win:py-8">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink/55">Insert coin</div>
      <h1 className="display mt-3 text-[28px] font-semibold leading-none text-ink">Arcade</h1>
      <p className="mt-2.5 max-w-[56ch] text-[13.5px] leading-relaxed text-ink/65">
        Four small games. Each one opens fullscreen and sizes its field to your screen. High scores last until you close the site.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 @xl/win:grid-cols-2">
        {GAMES.map((g, i) => (
          <motion.button
            key={g.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => play(g.id)}
            className="group relative flex items-center gap-4 overflow-hidden rounded-[14px] border border-white/[0.09] bg-black/25 p-4 text-left transition-colors hover:border-white/20"
          >
            <span
              className="pointer-events-none absolute inset-0 opacity-70 transition-opacity group-hover:opacity-100"
              style={{ background: `radial-gradient(80% 120% at 0% 50%, color-mix(in oklab, ${g.color} 16%, transparent), transparent 70%)` }}
            />
            <span
              className="relative grid size-14 shrink-0 place-items-center rounded-[14px] border transition-transform duration-300 group-hover:-translate-y-0.5"
              style={{ color: g.color, borderColor: `color-mix(in oklab, ${g.color} 45%, transparent)`, background: `color-mix(in oklab, ${g.color} 12%, #0b0d14)` }}
            >
              <g.icon size={24} strokeWidth={1.6} />
            </span>
            <span className="relative min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-ink">{g.name}</span>
              <span className="mt-0.5 block text-[12.5px] leading-snug text-ink/60">{g.blurb}</span>
              <span className="mt-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/50">
                <Trophy size={11} style={{ color: g.color }} />
                {best[g.id] !== undefined ? `Best ${best[g.id]} ${g.unit}` : 'No score yet'}
              </span>
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
