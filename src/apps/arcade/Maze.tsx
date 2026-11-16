import { useCallback, useEffect, useRef, useState } from 'react'
import { Board, DELTA, dirFromKey, Hud, Overlay, Pad, Stage, type Dir, type GameProps } from './kit'

/* Glitch Run: a maze chase. Collect every data bit while three bugs
   hunt you. A patch (the large dots) freezes the bugs for a few
   seconds, and a frozen bug can be squashed. */

const MAP = [
  '###################',
  '#........#........#',
  '#o##.###.#.###.##o#',
  '#.................#',
  '#.##.#.#####.#.##.#',
  '#....#...#...#....#',
  '####.### # ###.####',
  '####.#       #.####',
  '####.# ## ## #.####',
  '    .  #   #  .    ',
  '####.# ##### #.####',
  '####.#       #.####',
  '####.# ##### #.####',
  '#........#........#',
  '#.##.###.#.###.##.#',
  '#o.#.....P.....#.o#',
  '##.#.#.#####.#.#.##',
  '#....#...#...#....#',
  '#.######.#.######.#',
  '#.................#',
  '###################',
]
const COLS = 19, ROWS = MAP.length, CELL = 22
const BUG_COLORS = ['#ff5c7a', '#ffb657', '#b07cff']
const DIRS: Dir[] = ['up', 'left', 'down', 'right']
const BACK: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' }
const wall = (x: number, y: number) => MAP[y]?.[(x + COLS) % COLS] === '#'

interface Bug { x: number; y: number; dir: Dir; home: number }
const fresh = () => {
  const bits = new Set<string>(), patches = new Set<string>()
  let px = 9, py = 15
  MAP.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.') bits.add(`${x},${y}`)
    else if (ch === 'o') patches.add(`${x},${y}`)
    else if (ch === 'P') { px = x; py = y }
  }))
  return { bits, patches, px, py }
}
const bugs = (): Bug[] => [8, 9, 10].map((x, i) => ({ x, y: 9, dir: 'up' as Dir, home: i * 6 }))

export default function Maze({ best, submit }: GameProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const game = useRef({ ...fresh(), dir: 'left' as Dir, want: 'left' as Dir, bugs: bugs(), frozen: 0, tick: 0, score: 0, lives: 3, level: 1 })
  const [hud, setHud] = useState({ score: 0, lives: 3, level: 1 })
  const [phase, setPhase] = useState<'ready' | 'playing' | 'over'>('ready')

  const draw = useCallback(() => {
    const c = canvas.current?.getContext('2d')
    if (!c) return
    const g = game.current
    c.clearRect(0, 0, COLS * CELL, ROWS * CELL)
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (!wall(x, y)) continue
      c.fillStyle = 'rgba(62,230,255,0.10)'
      c.strokeStyle = 'rgba(62,230,255,0.45)'
      c.beginPath(); c.roundRect(x * CELL + 2.5, y * CELL + 2.5, CELL - 5, CELL - 5, 4); c.fill(); c.stroke()
    }
    c.fillStyle = '#e9edf5'
    g.bits.forEach((k) => { const [x, y] = k.split(',').map(Number); c.fillRect(x * CELL + CELL / 2 - 1.5, y * CELL + CELL / 2 - 1.5, 3, 3) })
    c.fillStyle = '#5dffa8'
    g.patches.forEach((k) => {
      const [x, y] = k.split(',').map(Number)
      c.beginPath(); c.arc(x * CELL + CELL / 2, y * CELL + CELL / 2, 5 + Math.sin(g.tick / 3) * 1.2, 0, Math.PI * 2); c.fill()
    })
    // the player: the AARUSH.OS mark, pointing the way it is heading
    const cx = g.px * CELL + CELL / 2, cy = g.py * CELL + CELL / 2
    c.save()
    c.translate(cx, cy)
    c.rotate({ up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 }[g.dir])
    c.fillStyle = '#3ee6ff'; c.shadowColor = '#3ee6ff'; c.shadowBlur = 10
    c.beginPath(); c.moveTo(0, -8); c.lineTo(7.5, 7.5); c.lineTo(0, 3.5); c.lineTo(-7.5, 7.5); c.closePath(); c.fill()
    c.restore()
    // bugs: small beetles, grey while frozen
    g.bugs.forEach((b, i) => {
      const bx = b.x * CELL + CELL / 2, by = b.y * CELL + CELL / 2
      const blink = g.frozen > 0 && g.frozen < 12 && g.tick % 2 === 0
      c.fillStyle = g.frozen > 0 && !blink ? '#5a6276' : BUG_COLORS[i]
      c.beginPath(); c.roundRect(bx - 7, by - 6, 14, 12, 4); c.fill()
      c.strokeStyle = c.fillStyle; c.lineWidth = 1.4
      for (const s of [-1, 1]) for (const o of [-3.5, 0, 3.5]) { c.beginPath(); c.moveTo(bx + s * 7, by + o); c.lineTo(bx + s * 10, by + o + 1.5); c.stroke() }
      c.fillStyle = '#06070c'
      c.fillRect(bx - 4, by - 3, 2.5, 2.5); c.fillRect(bx + 1.5, by - 3, 2.5, 2.5)
    })
  }, [])

  const start = () => {
    game.current = { ...fresh(), dir: 'left', want: 'left', bugs: bugs(), frozen: 0, tick: 0, score: 0, lives: 3, level: 1 }
    setHud({ score: 0, lives: 3, level: 1 })
    setPhase('playing')
  }

  useEffect(() => { draw() }, [draw, phase])

  useEffect(() => {
    if (phase !== 'playing') return
    const t = window.setInterval(() => {
      const g = game.current
      g.tick++
      const caught = () => g.bugs.findIndex((b) => b.x === g.px && b.y === g.py)
      const settle = () => {
        const i = caught()
        if (i < 0) return false
        if (g.frozen > 0) { g.score += 200; g.bugs[i] = { ...bugs()[i], home: 10 }; return false }
        g.lives--
        if (g.lives <= 0) { setPhase('over'); submit(g.score); return true }
        const f = fresh(); g.px = f.px; g.py = f.py; g.dir = g.want = 'left'; g.bugs = bugs()
        return false
      }

      // player moves every tick
      const tryMove = (d: Dir) => {
        const nx = (g.px + DELTA[d][0] + COLS) % COLS, ny = g.py + DELTA[d][1]
        if (wall(nx, ny)) return false
        g.px = nx; g.py = ny; g.dir = d
        return true
      }
      if (!tryMove(g.want)) tryMove(g.dir)
      const k = `${g.px},${g.py}`
      if (g.bits.delete(k)) g.score += 10
      if (g.patches.delete(k)) { g.score += 50; g.frozen = 46 }
      if (settle()) return

      // bugs move a little slower than the player, and not at all while frozen
      if (g.frozen > 0) g.frozen--
      else if (g.tick % 5 !== 0) {
        for (const b of g.bugs) {
          if (b.home > 0) { b.home--; continue }
          const options = DIRS.filter((d) => d !== BACK[b.dir] && !wall((b.x + DELTA[d][0] + COLS) % COLS, b.y + DELTA[d][1]))
          const pool = options.length ? options : [BACK[b.dir]]
          const dist = (d: Dir) => Math.abs(((b.x + DELTA[d][0] + COLS) % COLS) - g.px) + Math.abs(b.y + DELTA[d][1] - g.py)
          const chase = Math.random() < Math.min(0.9, 0.62 + g.level * 0.06)
          b.dir = chase ? pool.reduce((a, d) => (dist(d) < dist(a) ? d : a)) : pool[Math.floor(Math.random() * pool.length)]
          b.x = (b.x + DELTA[b.dir][0] + COLS) % COLS
          b.y += DELTA[b.dir][1]
        }
        if (settle()) return
      }

      if (g.bits.size === 0) {
        const f = fresh()
        Object.assign(g, f, { bugs: bugs(), frozen: 0, level: g.level + 1, dir: 'left', want: 'left' })
        g.score += 500
      }
      setHud({ score: g.score, lives: g.lives, level: g.level })
      draw()
    }, 150)
    return () => window.clearInterval(t)
  }, [phase, draw, submit])

  const steer = (d: Dir) => {
    if (phase !== 'playing') return start()
    game.current.want = d
  }

  return (
    <Stage onKey={(e) => { const d = dirFromKey(e.key); if (d) steer(d); else if ((e.key === ' ' || e.key === 'Enter') && phase !== 'playing') start() }}>
      <Hud items={[['Score', hud.score], ['Lives', hud.lives], ['Level', hud.level], ['Best', best ?? '-']]} />
      <Board
        canvas={canvas}
        w={COLS * CELL}
        h={ROWS * CELL}
        overlay={
          phase === 'ready' ? <Overlay title="Glitch Run" note="Collect every bit. Green patches freeze the bugs so you can squash them." action="Start" onAction={start} />
          : phase === 'over' ? <Overlay title="Caught" note={`${hud.score} points, level ${hud.level}.`} action="Play again" onAction={start} />
          : undefined
        }
      />
      <Pad onDir={steer} />
    </Stage>
  )
}
