import { useEffect, useRef, useState } from 'react'
import { Bomb, Flag } from 'lucide-react'
import { cn } from '../../os/icons'
import { Hud, type GameProps } from './kit'

const N = 9
const MINES = 10
interface Cell { mine: boolean; open: boolean; flag: boolean; near: number }
const COLORS = ['', '#5b9dff', '#5dffa8', '#ff5c7a', '#b07cff', '#ffb657', '#3ee6ff', '#e9edf5', '#9099ad']

const blank = (): Cell[] => Array.from({ length: N * N }, () => ({ mine: false, open: false, flag: false, near: 0 }))
const around = (i: number) => {
  const x = i % N, y = Math.floor(i / N), out: number[] = []
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const nx = x + dx, ny = y + dy
    if ((dx || dy) && nx >= 0 && ny >= 0 && nx < N && ny < N) out.push(ny * N + nx)
  }
  return out
}

/** Minesweeper: best result is the fastest clear, in seconds. */
export default function Mines({ best, submit }: GameProps) {
  const [cells, setCells] = useState<Cell[]>(blank)
  const [phase, setPhase] = useState<'ready' | 'playing' | 'won' | 'lost'>('ready')
  const [flagMode, setFlagMode] = useState(false)
  const [secs, setSecs] = useState(0)
  const began = useRef(0)

  useEffect(() => {
    if (phase !== 'playing') return
    const t = window.setInterval(() => setSecs(Math.floor((Date.now() - began.current) / 1000)), 250)
    return () => window.clearInterval(t)
  }, [phase])

  const reset = () => { setCells(blank()); setPhase('ready'); setSecs(0) }

  const open = (i: number) => {
    if (phase === 'won' || phase === 'lost') return
    let next = cells.map((c) => ({ ...c }))
    if (phase === 'ready') {
      // mines are laid after the first click, so it is always safe
      const safe = new Set([i, ...around(i)])
      let left = MINES
      while (left) {
        const k = Math.floor(Math.random() * N * N)
        if (!safe.has(k) && !next[k].mine) { next[k].mine = true; left-- }
      }
      next = next.map((c, k) => ({ ...c, near: around(k).filter((a) => next[a].mine).length }))
      began.current = Date.now()
      setPhase('playing')
    }
    if (next[i].flag || next[i].open) return
    if (next[i].mine) {
      next.forEach((c) => { if (c.mine) c.open = true })
      setCells(next)
      setPhase('lost')
      return
    }
    const queue = [i]
    while (queue.length) {
      const k = queue.pop()!
      if (next[k].open || next[k].flag) continue
      next[k].open = true
      if (next[k].near === 0) queue.push(...around(k))
    }
    setCells(next)
    if (next.every((c) => c.open || c.mine)) {
      const t = Math.max(1, Math.round((Date.now() - began.current) / 1000))
      setSecs(t)
      setPhase('won')
      submit(t)
    }
  }

  const flag = (i: number) => {
    if (phase !== 'playing' && phase !== 'ready') return
    if (cells[i].open) return
    setCells(cells.map((c, k) => (k === i ? { ...c, flag: !c.flag } : c)))
  }

  const flags = cells.filter((c) => c.flag).length

  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-3">
      <Hud items={[['Mines', MINES - flags], ['Time', `${secs}s`], ['Best', best ? `${best}s` : '-']]} />
      <div className="grid min-h-0 w-full flex-1 place-items-center [container-type:size]">
        <div className="relative aspect-square" style={{ width: 'min(100cqw, 100cqh, 520px)' }}>
          <div className="grid size-full grid-cols-9 gap-[3px] rounded-[10px] border border-white/12 bg-[#06070c] p-2">
            {cells.map((c, i) => (
              <button
                key={i}
                aria-label={c.open ? (c.mine ? 'mine' : `${c.near} nearby`) : c.flag ? 'flagged' : 'hidden'}
                onClick={() => (flagMode ? flag(i) : open(i))}
                onContextMenu={(e) => { e.preventDefault(); flag(i) }}
                className={cn(
                  'grid place-items-center rounded-[5px] text-[clamp(11px,3.4cqmin,17px)] font-semibold transition-colors',
                  c.open ? (c.mine ? 'bg-danger/30' : 'bg-white/[0.035]') : 'bg-white/[0.11] hover:bg-white/20',
                )}
                style={{ color: COLORS[c.near] }}
              >
                {c.open ? (c.mine ? <Bomb size={14} className="text-danger" /> : c.near || '') : c.flag ? <Flag size={13} className="text-accent" /> : ''}
              </button>
            ))}
          </div>
          {(phase === 'won' || phase === 'lost') && (
            <div className="absolute inset-x-0 bottom-3 flex justify-center">
              <div className="glass flex items-center gap-3 rounded-full py-1.5 pl-4 pr-1.5 text-[12.5px] text-ink">
                {phase === 'won' ? `Cleared in ${secs}s` : 'You hit a mine'}
                <button className="btn btn-accent !h-7 !text-[12px]" onClick={reset}>Again</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button className={cn('btn !h-9', flagMode && '!border-accent !text-accent')} onClick={() => setFlagMode((v) => !v)}>
          <Flag size={13} /> {flagMode ? 'Flagging' : 'Flag mode'}
        </button>
        <button className="btn !h-9" onClick={reset}>New board</button>
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.1em] text-ink/45 sm:inline">Right-click to flag</span>
      </div>
    </div>
  )
}
