import { useEffect, useRef, useState } from 'react'
import { DELTA, OPPOSITE, Overlay, prep, Stage, touchDevice, type Area, type Dir, type GameProps, type Input } from './kit'

/* Glitch Run: a maze chase. Collect every data bit while bugs hunt
   you. A patch (the large green dots) freezes the bugs for a few
   seconds, and a frozen bug can be squashed.
   The maze is generated to fit the window, so it is never the same twice. */

const BUG_COLORS = ['#ff5c7a', '#ffb657', '#b07cff', '#ff4fd8', '#5b9dff', '#ffe45c']
const DIRS: Dir[] = ['up', 'left', 'down', 'right']

interface Bug { x: number; y: number; dir: Dir; wait: number; hx: number; hy: number }
interface Level { wall: boolean[][]; bits: Set<string>; patches: Set<string>; px: number; py: number; bugs: Bug[] }

/** A maze with no dead ends: carve a perfect maze, then open every cul-de-sac and a few extra walls. */
function build(cols: number, rows: number): Level {
  const wall = Array.from({ length: rows }, () => Array<boolean>(cols).fill(true))
  const room = (x: number, y: number) => x > 0 && y > 0 && x < cols - 1 && y < rows - 1
  const stack: number[][] = [[1, 1]]
  wall[1][1] = false
  while (stack.length) {
    const [x, y] = stack[stack.length - 1]
    const next = DIRS.map((d) => [x + DELTA[d][0] * 2, y + DELTA[d][1] * 2, x + DELTA[d][0], y + DELTA[d][1]]).filter(([nx, ny]) => room(nx, ny) && wall[ny][nx])
    if (!next.length) { stack.pop(); continue }
    const [nx, ny, wx, wy] = next[Math.floor(Math.random() * next.length)]
    wall[wy][wx] = false
    wall[ny][nx] = false
    stack.push([nx, ny])
  }
  for (let y = 1; y < rows - 1; y += 2) for (let x = 1; x < cols - 1; x += 2) {
    const shut = DIRS.filter((d) => wall[y + DELTA[d][1]][x + DELTA[d][0]] && room(x + DELTA[d][0] * 2, y + DELTA[d][1] * 2))
    const exits = DIRS.filter((d) => !wall[y + DELTA[d][1]][x + DELTA[d][0]]).length
    if (shut.length && (exits === 1 || Math.random() < 0.14)) {
      const d = shut[Math.floor(Math.random() * shut.length)]
      wall[y + DELTA[d][1]][x + DELTA[d][0]] = false
    }
  }

  const odd = (n: number) => (n % 2 ? n : n - 1)
  const px = odd(Math.floor(cols / 2)), py = odd(Math.floor(rows / 2))
  const R = cols - 2, B = rows - 2
  const corners = [[1, 1], [R, 1], [1, B], [R, B], [px, 1], [px, B], [1, py], [R, py]]
  const count = Math.max(3, Math.min(BUG_COLORS.length, Math.round((cols * rows) / 300)))
  const bugs: Bug[] = corners.slice(0, count).map(([x, y], i) => ({ x, y, hx: x, hy: y, dir: 'up' as Dir, wait: 4 + i * 5 }))
  const patches = new Set(corners.slice(0, cols * rows > 500 ? 8 : 4).map(([x, y]) => `${x},${y}`))
  const bits = new Set<string>()
  wall.forEach((row, y) => row.forEach((w, x) => { if (!w && !(x === px && y === py) && !patches.has(`${x},${y}`)) bits.add(`${x},${y}`) }))
  return { wall, bits, patches, px, py, bugs }
}

function Field({ area, input, best, submit, hud }: GameProps & { area: Area; input: React.RefObject<Input> }) {
  const target = area.w < 520 ? 23 : 31
  const oddDown = (n: number) => Math.max(9, n % 2 ? n : n - 1)
  const cols = oddDown(Math.floor(area.w / target)), rows = oddDown(Math.floor(area.h / target))
  const cell = Math.floor(Math.min(area.w / cols, area.h / rows))
  const W = cols * cell, H = rows * cell

  const canvas = useRef<HTMLCanvasElement>(null)
  const game = useRef<Level & { dir: Dir; want: Dir; frozen: number; tick: number; score: number; lives: number; level: number }>(null)
  const [stats, setStats] = useState({ score: 0, lives: 3, level: 1 })
  const [phase, setPhase] = useState<'ready' | 'playing' | 'over'>('ready')

  const fresh = (level = 1, score = 0, lives = 3) => {
    game.current = { ...build(cols, rows), dir: 'left', want: 'left', frozen: 0, tick: 0, score, lives, level }
  }

  const draw = () => {
    const c = prep(canvas.current, W, H)
    const g = game.current
    if (!c || !g) return
    c.clearRect(0, 0, W, H)
    const pad = Math.max(2, cell * 0.12)
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (!g.wall[y][x]) continue
      c.fillStyle = 'rgba(62,230,255,0.09)'
      c.strokeStyle = 'rgba(62,230,255,0.4)'
      c.lineWidth = 1
      c.beginPath(); c.roundRect(x * cell + pad, y * cell + pad, cell - pad * 2, cell - pad * 2, cell * 0.2); c.fill(); c.stroke()
    }
    const mid = cell / 2
    c.fillStyle = '#e9edf5'
    const dot = Math.max(2.5, cell * 0.12)
    g.bits.forEach((k) => { const [x, y] = k.split(',').map(Number); c.fillRect(x * cell + mid - dot / 2, y * cell + mid - dot / 2, dot, dot) })
    c.fillStyle = '#5dffa8'
    g.patches.forEach((k) => {
      const [x, y] = k.split(',').map(Number)
      c.beginPath(); c.arc(x * cell + mid, y * cell + mid, cell * 0.24 + Math.sin(g.tick / 3) * cell * 0.04, 0, Math.PI * 2); c.fill()
    })
    // the player: the AARUSH.OS mark, pointing the way it is heading
    const u = cell / 22
    c.save()
    c.translate(g.px * cell + mid, g.py * cell + mid)
    c.rotate({ up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 }[g.dir])
    c.fillStyle = '#3ee6ff'; c.shadowColor = '#3ee6ff'; c.shadowBlur = 12
    c.beginPath(); c.moveTo(0, -8 * u); c.lineTo(7.5 * u, 7.5 * u); c.lineTo(0, 3.5 * u); c.lineTo(-7.5 * u, 7.5 * u); c.closePath(); c.fill()
    c.restore()
    // bugs: small beetles, grey while frozen
    g.bugs.forEach((b, i) => {
      const bx = b.x * cell + mid, by = b.y * cell + mid
      const blink = g.frozen > 0 && g.frozen < 12 && g.tick % 2 === 0
      c.fillStyle = c.strokeStyle = g.frozen > 0 && !blink ? '#5a6276' : BUG_COLORS[i % BUG_COLORS.length]
      c.beginPath(); c.roundRect(bx - 7 * u, by - 6 * u, 14 * u, 12 * u, 4 * u); c.fill()
      c.lineWidth = 1.4 * u
      for (const s of [-1, 1]) for (const o of [-3.5, 0, 3.5]) { c.beginPath(); c.moveTo(bx + s * 7 * u, by + o * u); c.lineTo(bx + s * 10 * u, by + (o + 1.5) * u); c.stroke() }
      c.fillStyle = '#06070c'
      c.fillRect(bx - 4 * u, by - 3 * u, 2.5 * u, 2.5 * u); c.fillRect(bx + 1.5 * u, by - 3 * u, 2.5 * u, 2.5 * u)
    })
  }

  const start = () => { fresh(); setStats({ score: 0, lives: 3, level: 1 }); setPhase('playing') }

  // a different window size is a different maze
  useEffect(() => { fresh(); setPhase('ready'); setStats({ score: 0, lives: 3, level: 1 }) }, [cols, rows]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { draw() })
  useEffect(() => { hud([['Score', stats.score], ['Lives', stats.lives], ['Level', stats.level], ['Best', best ?? '-']]) }, [stats, best, hud])

  useEffect(() => {
    if (phase !== 'playing') return
    const t = window.setInterval(() => {
      const g = game.current
      if (!g) return
      g.tick++
      const blocked = (x: number, y: number) => g.wall[y]?.[x] !== false
      const settle = () => {
        const i = g.bugs.findIndex((b) => b.x === g.px && b.y === g.py)
        if (i < 0) return false
        if (g.frozen > 0) { g.score += 200; const b = g.bugs[i]; b.x = b.hx; b.y = b.hy; b.wait = 12; return false }
        g.lives--
        if (g.lives <= 0) { setStats({ score: g.score, lives: 0, level: g.level }); setPhase('over'); submit(g.score); return true }
        const home = build(cols, rows)
        g.px = home.px; g.py = home.py; g.dir = g.want = 'left'
        g.bugs.forEach((b, k) => { b.x = b.hx; b.y = b.hy; b.wait = 6 + k * 4 })
        return false
      }

      const move = (d: Dir) => {
        const nx = g.px + DELTA[d][0], ny = g.py + DELTA[d][1]
        if (blocked(nx, ny)) return false
        g.px = nx; g.py = ny; g.dir = d
        return true
      }
      if (!move(g.want)) move(g.dir)
      const k = `${g.px},${g.py}`
      if (g.bits.delete(k)) g.score += 10
      if (g.patches.delete(k)) { g.score += 50; g.frozen = 46 }
      if (settle()) return

      // bugs move a little slower than the player, and not at all while frozen
      if (g.frozen > 0) g.frozen--
      else if (g.tick % 5 !== 0) {
        for (const b of g.bugs) {
          if (b.wait > 0) { b.wait--; continue }
          const options = DIRS.filter((d) => d !== OPPOSITE[b.dir] && !blocked(b.x + DELTA[d][0], b.y + DELTA[d][1]))
          const pool = options.length ? options : [OPPOSITE[b.dir]]
          const dist = (d: Dir) => Math.abs(b.x + DELTA[d][0] - g.px) + Math.abs(b.y + DELTA[d][1] - g.py)
          const chase = Math.random() < Math.min(0.9, 0.58 + g.level * 0.06)
          b.dir = chase ? pool.reduce((a, d) => (dist(d) < dist(a) ? d : a)) : pool[Math.floor(Math.random() * pool.length)]
          b.x += DELTA[b.dir][0]
          b.y += DELTA[b.dir][1]
        }
        if (settle()) return
      }

      if (g.bits.size === 0) fresh(g.level + 1, g.score + 500, g.lives)
      const now = game.current!
      setStats((s) => (s.score === now.score && s.lives === now.lives && s.level === now.level ? s : { score: now.score, lives: now.lives, level: now.level }))
      draw()
    }, 135)
    return () => window.clearInterval(t)
  }, [phase, cols, rows]) // eslint-disable-line react-hooks/exhaustive-deps

  input.current = {
    dir: (d) => { if (phase !== 'playing') start(); else if (game.current) game.current.want = d },
    go: () => phase !== 'playing' && start(),
    key: (k) => k === ' ' && phase !== 'playing' && start(),
  }

  return (
    <div className="relative" style={{ width: W, height: H }}>
      <canvas ref={canvas} style={{ width: W, height: H }} className="block" />
      {phase === 'ready' && <Overlay title="Glitch Run" note={`Collect every bit. Green patches freeze the bugs so you can squash them. ${touchDevice() ? 'Swipe to steer.' : 'Arrow keys or WASD to steer.'}`} action="Start" onAction={start} />}
      {phase === 'over' && <Overlay title="Caught" note={`${stats.score} points, level ${stats.level}.`} action="Play again" onAction={start} />}
    </div>
  )
}

export default function Maze(props: GameProps) {
  return <Stage>{(area, input) => <Field area={area} input={input} {...props} />}</Stage>
}
