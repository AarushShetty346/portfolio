import { useCallback, useEffect, useRef, useState } from 'react'
import { Board, dirFromKey, Hud, Overlay, Pad, Stage, type Dir, type GameProps } from './kit'

/* Blockfall: a falling-block puzzle. Fill a row to clear it. */

const W = 10, H = 20, CELL = 24
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
const spawn = (): Piece => {
  const s = SHAPES[Math.floor(Math.random() * SHAPES.length)]
  const box = Math.max(...s.cells.flat()) + 1
  return { cells: s.cells.map((c) => [...c]), color: s.color, x: Math.floor((W - box) / 2), y: 0, box }
}

export default function Blockfall({ best, submit }: GameProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const game = useRef({ grid: [] as (string | null)[][], piece: spawn(), score: 0, lines: 0 })
  const [stats, setStats] = useState({ score: 0, lines: 0 })
  const [phase, setPhase] = useState<'ready' | 'playing' | 'over'>('ready')

  const fits = (p: Piece, dx = 0, dy = 0, cells = p.cells) =>
    cells.every(([cx, cy]) => {
      const x = p.x + cx + dx, y = p.y + cy + dy
      return x >= 0 && x < W && y < H && (y < 0 || !game.current.grid[y][x])
    })

  const draw = useCallback(() => {
    const c = canvas.current?.getContext('2d')
    if (!c) return
    const g = game.current
    c.clearRect(0, 0, W * CELL, H * CELL)
    c.strokeStyle = 'rgba(255,255,255,0.045)'
    for (let x = 1; x < W; x++) { c.beginPath(); c.moveTo(x * CELL + 0.5, 0); c.lineTo(x * CELL + 0.5, H * CELL); c.stroke() }
    const block = (x: number, y: number, color: string, alpha = 1) => {
      c.globalAlpha = alpha
      c.fillStyle = color
      c.beginPath(); c.roundRect(x * CELL + 1.5, y * CELL + 1.5, CELL - 3, CELL - 3, 4); c.fill()
      c.fillStyle = 'rgba(255,255,255,0.22)'
      c.fillRect(x * CELL + 4, y * CELL + 4, CELL - 8, 3)
      c.globalAlpha = 1
    }
    g.grid.forEach((row, y) => row.forEach((col, x) => col && block(x, y, col)))
    if (phase === 'playing') {
      let drop = 0
      while (fits(g.piece, 0, drop + 1)) drop++
      g.piece.cells.forEach(([cx, cy]) => block(g.piece.x + cx, g.piece.y + cy + drop, g.piece.color, 0.18))
      g.piece.cells.forEach(([cx, cy]) => block(g.piece.x + cx, g.piece.y + cy, g.piece.color))
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const lock = () => {
    const g = game.current
    g.piece.cells.forEach(([cx, cy]) => { const y = g.piece.y + cy; if (y >= 0) g.grid[y][g.piece.x + cx] = g.piece.color })
    const kept = g.grid.filter((row) => row.some((c) => !c))
    const cleared = H - kept.length
    if (cleared) {
      g.grid = [...Array.from({ length: cleared }, () => Array<string | null>(W).fill(null)), ...kept]
      g.lines += cleared
      g.score += [0, 100, 300, 500, 800][cleared] * (1 + Math.floor(g.lines / 10))
    }
    g.piece = spawn()
    setStats({ score: g.score, lines: g.lines })
    if (!fits(g.piece)) { setPhase('over'); submit(g.score) }
  }

  const step = () => {
    const g = game.current
    if (fits(g.piece, 0, 1)) g.piece.y++
    else lock()
    draw()
  }

  const start = () => {
    game.current = { grid: Array.from({ length: H }, () => Array<string | null>(W).fill(null)), piece: spawn(), score: 0, lines: 0 }
    setStats({ score: 0, lines: 0 })
    setPhase('playing')
  }

  useEffect(() => { draw() }, [draw, phase])

  const level = 1 + Math.floor(stats.lines / 10)
  useEffect(() => {
    if (phase !== 'playing') return
    const t = window.setInterval(step, Math.max(90, 620 - level * 55))
    return () => window.clearInterval(t)
  }, [phase, level]) // eslint-disable-line react-hooks/exhaustive-deps

  const act = (d: Dir | 'drop') => {
    if (phase !== 'playing') return start()
    const g = game.current
    if (d === 'left' && fits(g.piece, -1, 0)) g.piece.x--
    else if (d === 'right' && fits(g.piece, 1, 0)) g.piece.x++
    else if (d === 'down') { if (fits(g.piece, 0, 1)) { g.piece.y++; g.score += 1 } }
    else if (d === 'up' && g.piece.color !== '#ffe45c') { // the square does not turn
      const turned = g.piece.cells.map(([x, y]) => [g.piece.box - 1 - y, x])
      for (const kick of [0, -1, 1, -2, 2]) if (fits(g.piece, kick, 0, turned)) { g.piece.cells = turned; g.piece.x += kick; break }
    } else if (d === 'drop') {
      while (fits(g.piece, 0, 1)) { g.piece.y++; g.score += 2 }
      lock()
    }
    draw()
  }

  return (
    <Stage onKey={(e) => { const d = dirFromKey(e.key); if (d) act(d); else if (e.key === ' ') act('drop'); else if (e.key === 'Enter' && phase !== 'playing') start() }}>
      <Hud items={[['Score', stats.score], ['Lines', stats.lines], ['Level', level], ['Best', best ?? '-']]} />
      <Board
        canvas={canvas}
        w={W * CELL}
        h={H * CELL}
        overlay={
          phase === 'ready' ? <Overlay title="Blockfall" note="Left and right to move, up to turn, space to drop." action="Start" onAction={start} />
          : phase === 'over' ? <Overlay title="Stacked out" note={`${stats.score} points, ${stats.lines} lines.`} action="Play again" onAction={start} />
          : undefined
        }
      />
      <Pad onDir={act} extra={<button className="btn !h-9" onPointerDown={(e) => { e.preventDefault(); act('drop') }}>Drop</button>} />
    </Stage>
  )
}
