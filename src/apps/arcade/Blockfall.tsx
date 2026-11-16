import { useEffect, useRef, useState } from 'react'
import { Overlay, prep, Stage, touchDevice, type Area, type Dir, type GameProps, type Input } from './kit'

/* Blockfall: a falling-block puzzle. Fill a row to clear it.
   The well is as tall as the window; on a wide screen it also gets
   wider, with the next pieces and the controls beside it. */

const ROWS = 20
const SHAPES: { cells: number[][]; color: string }[] = [
  { cells: [[0, 1], [1, 1], [2, 1], [3, 1]], color: '#3ee6ff' },
  { cells: [[0, 0], [0, 1], [1, 1], [2, 1]], color: '#5b9dff' },
  { cells: [[2, 0], [0, 1], [1, 1], [2, 1]], color: '#ffb657' },
  { cells: [[1, 0], [2, 0], [1, 1], [2, 1]], color: '#ffe45c' },
  { cells: [[1, 0], [2, 0], [0, 1], [1, 1]], color: '#5dffa8' },
  { cells: [[1, 0], [0, 1], [1, 1], [2, 1]], color: '#b07cff' },
  { cells: [[0, 0], [1, 0], [1, 1], [2, 1]], color: '#ff5c7a' },
]
interface Piece { cells: number[][]; color: string; x: number; y: number; box: number }
const pick = () => SHAPES[Math.floor(Math.random() * SHAPES.length)]
type Shape = (typeof SHAPES)[number]

function Field({ area, input, best, submit, hud }: GameProps & { area: Area; input: React.RefObject<Input> }) {
  const wide = area.w > area.h * 1.15
  const cell = Math.floor(area.h / ROWS)
  const COLS = Math.max(10, Math.min(wide ? 18 : 12, Math.floor((area.w - (wide ? 360 : 0)) / cell)))
  const W = COLS * cell, H = ROWS * cell
  // the panels beside the well take whatever width is left, so nothing sits empty
  const side = wide ? Math.min(460, Math.floor((area.w - W - 2) / 2)) : 0

  const canvas = useRef<HTMLCanvasElement>(null)
  const game = useRef({ grid: [] as (string | null)[][], piece: null as Piece | null, score: 0, lines: 0 })
  const [stats, setStats] = useState({ score: 0, lines: 0 })
  const queue = useRef<Shape[]>([pick(), pick(), pick()])
  const [, redraw] = useState(0)
  const [phase, setPhase] = useState<'ready' | 'playing' | 'over'>('ready')
  const level = 1 + Math.floor(stats.lines / 10)

  const place = (s: Shape): Piece => {
    const box = Math.max(...s.cells.flat()) + 1
    return { cells: s.cells.map((c) => [...c]), color: s.color, x: Math.floor((COLS - box) / 2), y: 0, box }
  }
  const fits = (p: Piece, dx = 0, dy = 0, cells = p.cells) =>
    cells.every(([cx, cy]) => {
      const x = p.x + cx + dx, y = p.y + cy + dy
      return x >= 0 && x < COLS && y < ROWS && (y < 0 || !game.current.grid[y]?.[x])
    })

  const draw = () => {
    const c = prep(canvas.current, W, H)
    if (!c) return
    const g = game.current
    c.clearRect(0, 0, W, H)
    c.strokeStyle = 'rgba(255,255,255,0.045)'
    c.lineWidth = 1
    for (let x = 1; x < COLS; x++) { c.beginPath(); c.moveTo(x * cell + 0.5, 0); c.lineTo(x * cell + 0.5, H); c.stroke() }
    const block = (x: number, y: number, color: string, alpha = 1) => {
      c.globalAlpha = alpha
      c.fillStyle = color
      c.beginPath(); c.roundRect(x * cell + 1.5, y * cell + 1.5, cell - 3, cell - 3, cell * 0.17); c.fill()
      c.fillStyle = 'rgba(255,255,255,0.22)'
      c.fillRect(x * cell + cell * 0.18, y * cell + cell * 0.16, cell * 0.64, Math.max(2, cell * 0.1))
      c.globalAlpha = 1
    }
    g.grid.forEach((row, y) => row.forEach((col, x) => col && block(x, y, col)))
    const p = g.piece
    if (p && phase === 'playing') {
      let drop = 0
      while (fits(p, 0, drop + 1)) drop++
      p.cells.forEach(([cx, cy]) => block(p.x + cx, p.y + cy + drop, p.color, 0.16))
      p.cells.forEach(([cx, cy]) => block(p.x + cx, p.y + cy, p.color))
    }
  }

  const bring = () => {
    const g = game.current
    g.piece = place(queue.current[0])
    queue.current = [...queue.current.slice(1), pick()]
    redraw((n) => n + 1)
    if (!fits(g.piece)) { g.piece = null; setPhase('over'); submit(g.score) }
  }

  const lock = () => {
    const g = game.current, p = g.piece!
    p.cells.forEach(([cx, cy]) => { const y = p.y + cy; if (y >= 0) g.grid[y][p.x + cx] = p.color })
    const kept = g.grid.filter((row) => row.some((c) => !c))
    const cleared = ROWS - kept.length
    if (cleared) {
      g.grid = [...Array.from({ length: cleared }, () => Array<string | null>(COLS).fill(null)), ...kept]
      g.lines += cleared
      g.score += [0, 100, 300, 500, 800][cleared] * (1 + Math.floor(g.lines / 10))
    }
    setStats({ score: g.score, lines: g.lines })
    bring()
  }

  const start = () => {
    game.current = { grid: Array.from({ length: ROWS }, () => Array<string | null>(COLS).fill(null)), piece: null, score: 0, lines: 0 }
    setStats({ score: 0, lines: 0 })
    setPhase('playing')
    bring()
  }

  useEffect(() => { game.current.grid = []; game.current.piece = null; setPhase('ready') }, [COLS])
  useEffect(() => { draw() })
  useEffect(() => { hud([['Score', stats.score], ['Lines', stats.lines], ['Level', level], ['Best', best ?? '-']]) }, [stats, level, best, hud])

  useEffect(() => {
    if (phase !== 'playing') return
    const t = window.setInterval(() => {
      const p = game.current.piece
      if (!p) return
      if (fits(p, 0, 1)) p.y++
      else lock()
      draw()
    }, Math.max(90, 620 - level * 55))
    return () => window.clearInterval(t)
  }, [phase, level, COLS]) // eslint-disable-line react-hooks/exhaustive-deps

  const act = (d: Dir | 'drop') => {
    if (phase !== 'playing') return start()
    const g = game.current, p = g.piece
    if (!p) return
    if (d === 'left' && fits(p, -1, 0)) p.x--
    else if (d === 'right' && fits(p, 1, 0)) p.x++
    else if (d === 'down' && !touchDevice()) { if (fits(p, 0, 1)) { p.y++; g.score += 1 } }
    else if (d === 'up' && p.color !== '#ffe45c') { // the square does not turn
      const turned = p.cells.map(([x, y]) => [p.box - 1 - y, x])
      for (const kick of [0, -1, 1, -2, 2]) if (fits(p, kick, 0, turned)) { p.cells = turned; p.x += kick; break }
    } else if (d === 'drop' || d === 'down') {
      while (fits(p, 0, 1)) { p.y++; g.score += 2 }
      lock()
    }
    draw()
  }
  // on a touch screen: swipe sideways to move, tap or swipe up to turn, swipe down to drop
  input.current = { dir: act, go: () => (phase === 'playing' ? act('up') : start()), key: (k) => k === ' ' && act('drop') }

  const preview = (s: Shape, size: number) => (
    <svg viewBox="0 0 4 2.4" width={size * 4} height={size * 2.4}>
      {s.cells.map(([x, y]) => <rect key={`${x}${y}`} x={x + 0.06} y={y + 0.2} width={0.88} height={0.88} rx={0.16} fill={s.color} />)}
    </svg>
  )

  return (
    <div className="flex items-stretch" style={{ height: H }}>
      {wide && (
        <div className="flex flex-col justify-between border-y border-l border-white/10 bg-white/[0.02] p-4" style={{ width: side }}>
          <div>
            <div className="label">Next</div>
            <div className="mt-3 space-y-2">{queue.current.map((s, i) => <div key={i} style={{ opacity: 1 - i * 0.28 }}>{preview(s, i === 0 ? 24 : 18)}</div>)}</div>
          </div>
          <div className="display text-[13px] leading-relaxed text-ink/40">LEVEL<br /><span className="text-[40px] leading-none text-ink/80">{level}</span></div>
        </div>
      )}
      <div className="relative border border-white/12 bg-[#06070c]" style={{ width: W + 2, height: H }}>
        <canvas ref={canvas} style={{ width: W, height: H }} className="block" />
        {phase === 'ready' && <Overlay title="Blockfall" note={touchDevice() ? 'Swipe sideways to move, tap to turn, swipe down to drop.' : 'Left and right to move, up to turn, down to step, space to drop.'} action="Start" onAction={start} />}
        {phase === 'over' && <Overlay title="Stacked out" note={`${stats.score} points, ${stats.lines} lines.`} action="Play again" onAction={start} />}
      </div>
      {wide && (
        <div className="flex flex-col justify-between border-y border-r border-white/10 bg-white/[0.02] p-4" style={{ width: side }}>
          <div>
            <div className="label">Controls</div>
            <dl className="mt-3 space-y-2 text-[12px]">
              {[['Left / Right', 'Move'], ['Up', 'Turn'], ['Down', 'Step down'], ['Space', 'Drop']].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-2">
                  <dt><kbd className="rounded-md bg-white/[0.08] px-1.5 py-0.5 font-mono text-[10px] text-ink/80">{k}</kbd></dt>
                  <dd className="text-ink/55">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-ink/35">Four rows at once scores the most.</div>
        </div>
      )}
    </div>
  )
}

export default function Blockfall(props: GameProps) {
  return <Stage>{(area, input) => <Field area={area} input={input} {...props} />}</Stage>
}
