import { useEffect, useRef, useState } from 'react'
import { Bomb, Flag } from 'lucide-react'
import { cn } from '../../os/icons'
import { Stage, touchDevice, type Area, type GameProps } from './kit'

interface Cell { mine: boolean; open: boolean; flag: boolean; near: number }
const COLORS = ['', '#5b9dff', '#5dffa8', '#ff5c7a', '#b07cff', '#ffb657', '#3ee6ff', '#e9edf5', '#9099ad']

/** Minesweeper on a board cut to fit the window. Best result is the fastest clear, in seconds. */
function Field({ area, best, submit, hud }: GameProps & { area: Area }) {
  const target = area.w < 520 ? 34 : 44
  const cols = Math.max(8, Math.min(30, Math.floor(area.w / target)))
  const BAR = 46 // the controls sit under the board, so they never cover a square
  const rows = Math.max(8, Math.min(16, Math.floor((area.h - BAR) / target)))
  const cell = Math.floor(Math.min(area.w / cols, (area.h - BAR) / rows))
  const total = cols * rows
  const MINES = Math.round(total * 0.15)

  const blank = (): Cell[] => Array.from({ length: total }, () => ({ mine: false, open: false, flag: false, near: 0 }))
  const around = (i: number) => {
    const x = i % cols, y = Math.floor(i / cols), out: number[] = []
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy
      if ((dx || dy) && nx >= 0 && ny >= 0 && nx < cols && ny < rows) out.push(ny * cols + nx)
    }
    return out
  }

  const [cells, setCells] = useState<Cell[]>(blank)
  const [phase, setPhase] = useState<'ready' | 'playing' | 'won' | 'lost'>('ready')
  const [flagMode, setFlagMode] = useState(false)
  const [secs, setSecs] = useState(0)
  const began = useRef(0)
  const hold = useRef<number | undefined>(undefined)
  const held = useRef(false)

  const reset = () => { setCells(blank()); setPhase('ready'); setSecs(0) }
  useEffect(reset, [cols, rows]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== 'playing') return
    const t = window.setInterval(() => setSecs(Math.floor((Date.now() - began.current) / 1000)), 250)
    return () => window.clearInterval(t)
  }, [phase])

  const flags = cells.filter((c) => c.flag).length
  useEffect(() => { hud([['Mines', MINES - flags], ['Time', `${secs}s`], ['Best', best ? `${best}s` : '-']]) }, [flags, secs, best, MINES, hud])

  const open = (i: number) => {
    if (phase === 'won' || phase === 'lost' || cells.length !== total) return
    let next = cells.map((c) => ({ ...c }))
    if (phase === 'ready') {
      // mines are laid after the first click, so it is always safe
      const safe = new Set([i, ...around(i)])
      let left = MINES
      while (left) {
        const k = Math.floor(Math.random() * total)
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
    if ((phase !== 'playing' && phase !== 'ready') || cells[i]?.open) return
    setCells(cells.map((c, k) => (k === i ? { ...c, flag: !c.flag } : c)))
  }

  if (cells.length !== total) return null
  const done = phase === 'won' || phase === 'lost'

  return (
    <div style={{ width: cols * cell }}>
      <div className="grid" style={{ height: rows * cell }}>
      <div className="grid size-full" style={{ gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gridAutoRows: cell }}>
        {cells.map((c, i) => (
          <button
            key={i}
            aria-label={c.open ? (c.mine ? 'mine' : `${c.near} nearby`) : c.flag ? 'flagged' : 'hidden'}
            onClick={() => { if (held.current) { held.current = false; return } if (flagMode) flag(i); else open(i) }}
            onContextMenu={(e) => { e.preventDefault(); flag(i) }}
            onPointerDown={(e) => {
              if (e.pointerType === 'mouse') return
              held.current = false
              hold.current = window.setTimeout(() => { held.current = true; flag(i) }, 420)
            }}
            onPointerUp={() => window.clearTimeout(hold.current)}
            onPointerLeave={() => window.clearTimeout(hold.current)}
            className="p-[1.5px]"
          >
            <span
              className={cn(
                'grid size-full place-items-center rounded-[6px] font-semibold transition-colors',
                c.open ? (c.mine ? 'bg-danger/30' : 'bg-white/[0.03]') : 'bg-white/[0.11] hover:bg-white/20',
              )}
              style={{ color: COLORS[c.near], fontSize: cell * 0.42 }}
            >
              {c.open ? (c.mine ? <Bomb size={cell * 0.42} className="text-danger" /> : c.near || '') : c.flag ? <Flag size={cell * 0.4} className="text-accent" /> : ''}
            </span>
          </button>
        ))}
      </div>

      </div>
      <div className="flex items-center justify-center" style={{ height: BAR }}>
        <div className="flex items-center gap-2 text-[12.5px] text-ink">
          {done && <span className="pl-3 pr-1">{phase === 'won' ? `Cleared in ${secs}s` : 'You hit a mine'}</span>}
          {touchDevice() && !done && (
            <button className={cn('btn !h-8 !rounded-full', flagMode && '!border-accent !text-accent')} onClick={() => setFlagMode((v) => !v)}>
              <Flag size={13} /> {flagMode ? 'Flagging' : 'Flag'}
            </button>
          )}
          <button className={cn('btn !h-8 !rounded-full', done && 'btn-accent')} onClick={reset}>{done ? 'Again' : 'New board'}</button>
        </div>
      </div>
    </div>
  )
}

export default function Mines(props: GameProps) {
  return <Stage>{(area) => <Field area={area} {...props} />}</Stage>
}
