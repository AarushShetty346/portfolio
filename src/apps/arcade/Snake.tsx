import { useEffect, useRef, useState } from 'react'
import { DELTA, OPPOSITE, Overlay, prep, Stage, touchDevice, type Area, type Dir, type GameProps, type Input } from './kit'

function Field({ area, input, best, submit, hud }: GameProps & { area: Area; input: React.RefObject<Input> }) {
  // as many cells as fit: wide on a laptop, tall on a phone
  const target = area.w < 520 ? 22 : 30
  const cols = Math.max(8, Math.floor(area.w / target)), rows = Math.max(8, Math.floor(area.h / target))
  const cell = Math.floor(Math.min(area.w / cols, area.h / rows))
  const W = cols * cell, H = rows * cell

  const canvas = useRef<HTMLCanvasElement>(null)
  const game = useRef({ body: [] as number[][], dir: 'right' as Dir, queue: [] as Dir[], food: [0, 0] })
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState<'ready' | 'playing' | 'over'>('ready')

  const draw = () => {
    const c = prep(canvas.current, W, H)
    if (!c) return
    const g = game.current
    c.clearRect(0, 0, W, H)
    c.fillStyle = 'rgba(255,255,255,0.028)'
    for (let x = 0; x < cols; x++) for (let y = 0; y < rows; y++) if ((x + y) % 2 === 0) c.fillRect(x * cell, y * cell, cell, cell)
    if (!g.body.length) return
    c.fillStyle = '#ff4fd8'; c.shadowColor = '#ff4fd8'; c.shadowBlur = 14
    c.beginPath(); c.arc(g.food[0] * cell + cell / 2, g.food[1] * cell + cell / 2, cell * 0.3, 0, Math.PI * 2); c.fill()
    c.shadowBlur = 0
    g.body.forEach(([x, y], i) => {
      c.fillStyle = i === 0 ? '#d9ffe9' : `rgba(93,255,168,${Math.max(0.35, 1 - i * 0.025)})`
      c.beginPath(); c.roundRect(x * cell + 1.5, y * cell + 1.5, cell - 3, cell - 3, cell * 0.26); c.fill()
    })
  }

  const placeFood = () => {
    const g = game.current
    do { g.food = [Math.floor(Math.random() * cols), Math.floor(Math.random() * rows)] }
    while (g.body.some(([x, y]) => x === g.food[0] && y === g.food[1]))
  }

  const start = () => {
    const y = Math.floor(rows / 2), x = Math.floor(cols / 3)
    game.current = { body: [[x, y], [x - 1, y], [x - 2, y]], dir: 'right', queue: [], food: [0, 0] }
    placeFood()
    setScore(0)
    setPhase('playing')
  }

  // a different window size is a different field: start over
  useEffect(() => { game.current.body = []; setPhase('ready'); setScore(0) }, [cols, rows])
  useEffect(() => { draw() })
  useEffect(() => { hud([['Score', score], ['Best', best ?? '-']]) }, [score, best, hud])

  useEffect(() => {
    if (phase !== 'playing') return
    const t = window.setInterval(() => {
      const g = game.current
      const next = g.queue.shift()
      if (next && next !== OPPOSITE[g.dir]) g.dir = next
      const [dx, dy] = DELTA[g.dir]
      const head = [g.body[0][0] + dx, g.body[0][1] + dy]
      if (head[0] < 0 || head[1] < 0 || head[0] >= cols || head[1] >= rows || g.body.some(([x, y]) => x === head[0] && y === head[1])) {
        setPhase('over')
        submit(g.body.length - 3)
        return
      }
      g.body.unshift(head)
      if (head[0] === g.food[0] && head[1] === g.food[1]) { setScore(g.body.length - 3); placeFood() }
      else g.body.pop()
      draw()
    }, 95)
    return () => window.clearInterval(t)
  }, [phase, cols, rows]) // eslint-disable-line react-hooks/exhaustive-deps

  const turn = (d: Dir) => {
    if (phase !== 'playing') return start()
    if (game.current.queue.length < 3) game.current.queue.push(d)
  }
  input.current = { dir: turn, go: () => phase !== 'playing' && start(), key: (k) => k === ' ' && phase !== 'playing' && start() }
  const hint = touchDevice() ? 'Swipe to steer.' : 'Arrow keys or WASD to steer.'

  return (
    <div className="relative" style={{ width: W, height: H }}>
      <canvas ref={canvas} style={{ width: W, height: H }} className="block" />
      {phase === 'ready' && <Overlay title="Snake" note={hint} action="Start" onAction={start} />}
      {phase === 'over' && <Overlay title="Game over" note={`You ate ${score}.`} action="Play again" onAction={start} />}
    </div>
  )
}

export default function Snake(props: GameProps) {
  return <Stage>{(area, input) => <Field area={area} input={input} {...props} />}</Stage>
}
