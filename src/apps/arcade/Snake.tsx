import { useCallback, useEffect, useRef, useState } from 'react'
import { Board, DELTA, dirFromKey, Hud, Overlay, Pad, Stage, type Dir, type GameProps } from './kit'

const N = 21
const CELL = 20
const SIZE = N * CELL
const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' }

export default function Snake({ best, submit }: GameProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const game = useRef({ body: [[10, 10]] as number[][], dir: 'right' as Dir, next: 'right' as Dir, food: [15, 10], alive: false })
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState<'ready' | 'playing' | 'over'>('ready')

  const draw = useCallback(() => {
    const c = canvas.current?.getContext('2d')
    if (!c) return
    const g = game.current
    c.clearRect(0, 0, SIZE, SIZE)
    c.fillStyle = 'rgba(255,255,255,0.035)'
    for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) if ((x + y) % 2 === 0) c.fillRect(x * CELL, y * CELL, CELL, CELL)
    c.fillStyle = '#ff4fd8'
    c.shadowColor = '#ff4fd8'; c.shadowBlur = 12
    c.beginPath(); c.arc(g.food[0] * CELL + CELL / 2, g.food[1] * CELL + CELL / 2, CELL * 0.32, 0, Math.PI * 2); c.fill()
    c.shadowBlur = 0
    g.body.forEach(([x, y], i) => {
      c.fillStyle = i === 0 ? '#d9ffe9' : `rgba(93,255,168,${Math.max(0.35, 1 - i * 0.03)})`
      c.beginPath(); c.roundRect(x * CELL + 1.5, y * CELL + 1.5, CELL - 3, CELL - 3, 5); c.fill()
    })
  }, [])

  const placeFood = () => {
    const g = game.current
    do { g.food = [Math.floor(Math.random() * N), Math.floor(Math.random() * N)] }
    while (g.body.some(([x, y]) => x === g.food[0] && y === g.food[1]))
  }

  const start = () => {
    game.current = { body: [[10, 10], [9, 10], [8, 10]], dir: 'right', next: 'right', food: [15, 10], alive: true }
    setScore(0)
    setPhase('playing')
    draw()
  }

  useEffect(() => { draw() }, [draw])

  useEffect(() => {
    if (phase !== 'playing') return
    const t = window.setInterval(() => {
      const g = game.current
      g.dir = g.next
      const [dx, dy] = DELTA[g.dir]
      const head = [g.body[0][0] + dx, g.body[0][1] + dy]
      const hit = head[0] < 0 || head[1] < 0 || head[0] >= N || head[1] >= N || g.body.some(([x, y]) => x === head[0] && y === head[1])
      if (hit) {
        g.alive = false
        setPhase('over')
        submit(g.body.length - 3)
        return
      }
      g.body.unshift(head)
      if (head[0] === g.food[0] && head[1] === g.food[1]) { setScore(g.body.length - 3); placeFood() }
      else g.body.pop()
      draw()
    }, 105)
    return () => window.clearInterval(t)
  }, [phase, draw, submit])

  const turn = (d: Dir) => {
    if (phase !== 'playing') return start()
    if (d !== OPPOSITE[game.current.dir]) game.current.next = d
  }

  return (
    <Stage onKey={(e) => { const d = dirFromKey(e.key); if (d) turn(d); else if (e.key === ' ' || e.key === 'Enter') { if (phase !== 'playing') start() } }}>
      <Hud items={[['Score', score], ['Best', best ?? '-']]} />
      <Board
        canvas={canvas}
        w={SIZE}
        h={SIZE}
        overlay={
          phase === 'ready' ? <Overlay title="Snake" note="Arrow keys or WASD to steer." action="Start" onAction={start} />
          : phase === 'over' ? <Overlay title="Game over" note={`You ate ${score}.`} action="Play again" onAction={start} />
          : undefined
        }
      />
      <Pad onDir={turn} />
    </Stage>
  )
}
