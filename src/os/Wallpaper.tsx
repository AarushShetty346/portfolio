import { useEffect, useRef } from 'react'
import { ACCENTS, usePrefs, type WallpaperId } from './store'

interface Ctx { c: CanvasRenderingContext2D; w: number; h: number; t: number; a: string; b: string }

const hexA = (hex: string, alpha: number) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

/* Horizon: a slow perspective grid under a thin ringed sun. */
function drawHorizon({ c, w, h, t, a, b }: Ctx) {
  c.clearRect(0, 0, w, h)
  const hy = h * 0.6
  const cx = w * 0.5

  // sky glow
  const sky = c.createRadialGradient(cx, hy, 0, cx, hy, Math.max(w, h) * 0.7)
  sky.addColorStop(0, hexA(b, 0.2))
  sky.addColorStop(0.35, hexA(a, 0.06))
  sky.addColorStop(1, 'rgba(0,0,0,0)')
  c.fillStyle = sky
  c.fillRect(0, 0, w, hy)

  // stars
  for (let i = 0; i < 70; i++) {
    const sx = (Math.sin(i * 91.7) * 0.5 + 0.5) * w
    const sy = (Math.sin(i * 47.3 + 2) * 0.5 + 0.5) * hy * 0.92
    const tw = 0.25 + 0.25 * Math.sin(t * 0.6 + i * 1.7)
    c.fillStyle = `rgba(220,235,255,${tw * 0.55})`
    c.fillRect(sx, sy, 1.2, 1.2)
  }

  // ringed sun, clipped by the horizon
  const r = Math.min(w, h) * 0.26
  c.save()
  c.beginPath()
  c.rect(0, 0, w, hy)
  c.clip()
  const sun = c.createLinearGradient(0, hy - r, 0, hy + r * 0.2)
  sun.addColorStop(0, hexA(a, 0.0))
  sun.addColorStop(1, hexA(b, 0.22))
  c.fillStyle = sun
  c.beginPath()
  c.arc(cx, hy + r * 0.18, r, 0, Math.PI * 2)
  c.fill()
  c.lineWidth = 1
  for (let i = 0; i < 4; i++) {
    c.strokeStyle = hexA(i % 2 ? b : a, 0.34 - i * 0.07)
    c.beginPath()
    c.arc(cx, hy + r * 0.18, r + i * (14 + i * 6), 0, Math.PI * 2)
    c.stroke()
  }
  c.restore()

  // floor fade
  const floor = c.createLinearGradient(0, hy, 0, h)
  floor.addColorStop(0, hexA(a, 0.1))
  floor.addColorStop(0.5, 'rgba(0,0,0,0)')
  c.fillStyle = floor
  c.fillRect(0, hy, w, h - hy)

  // perspective grid
  c.lineWidth = 1
  const cols = 26
  for (let i = -cols; i <= cols; i++) {
    const x = cx + (i / cols) * w * 2.2
    const fade = 1 - Math.min(1, Math.abs(i) / cols)
    c.strokeStyle = hexA(a, 0.05 + fade * 0.2)
    c.beginPath()
    c.moveTo(cx + (i / cols) * w * 0.06, hy)
    c.lineTo(x, h)
    c.stroke()
  }
  const rows = 18
  const scroll = (t * 0.085) % 1
  for (let j = 0; j < rows; j++) {
    const p = (j + scroll) / rows
    const y = hy + Math.pow(p, 2.4) * (h - hy)
    c.strokeStyle = hexA(a, 0.04 + p * 0.26)
    c.beginPath()
    c.moveTo(0, y)
    c.lineTo(w, y)
    c.stroke()
  }

  // horizon line
  const line = c.createLinearGradient(0, 0, w, 0)
  line.addColorStop(0, 'rgba(0,0,0,0)')
  line.addColorStop(0.5, hexA(a, 0.9))
  line.addColorStop(1, 'rgba(0,0,0,0)')
  c.fillStyle = line
  c.fillRect(0, hy - 0.5, w, 1.2)
}

/* Flow field: particles following a slow analytic current, leaving trails. */
interface P { x: number; y: number; life: number; hue: number }
function makeFlow() {
  let ps: P[] = []
  let lw = 0, lh = 0
  return ({ c, w, h, t, a, b }: Ctx) => {
    if (w !== lw || h !== lh || !ps.length) {
      lw = w; lh = h
      c.fillStyle = '#06070b'
      c.fillRect(0, 0, w, h)
      ps = Array.from({ length: Math.round((w * h) / 5200) }, () => ({
        x: Math.random() * w, y: Math.random() * h, life: Math.random() * 200, hue: Math.random(),
      }))
    }
    c.fillStyle = 'rgba(6,7,11,0.055)'
    c.fillRect(0, 0, w, h)
    c.lineWidth = 1
    for (const p of ps) {
      const s = 0.0021
      const ang =
        Math.sin(p.x * s + t * 0.05) * 1.6 + Math.cos(p.y * s * 1.3 - t * 0.04) * 1.6 + Math.sin((p.x + p.y) * s * 0.6) * 1.2
      const nx = p.x + Math.cos(ang) * 1.3
      const ny = p.y + Math.sin(ang) * 1.3
      c.strokeStyle = hexA(p.hue > 0.72 ? b : a, 0.32)
      c.beginPath()
      c.moveTo(p.x, p.y)
      c.lineTo(nx, ny)
      c.stroke()
      p.x = nx; p.y = ny; p.life--
      if (p.life < 0 || nx < 0 || ny < 0 || nx > w || ny > h) {
        p.x = Math.random() * w; p.y = Math.random() * h; p.life = 120 + Math.random() * 220
      }
    }
  }
}

function CanvasWallpaper({ kind }: { kind: 'horizon' | 'flow' }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const accent = usePrefs((s) => s.accent)
  const reduce = usePrefs((s) => s.reduceMotion)

  useEffect(() => {
    const canvas = ref.current!
    const c = canvas.getContext('2d')!
    const { value: a, second: b } = ACCENTS[accent]
    const still = reduce || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const draw = kind === 'horizon' ? drawHorizon : makeFlow()
    let raf = 0, last = 0, w = 0, h = 0
    const start = performance.now()

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      w = window.innerWidth; h = window.innerHeight
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (still) paintStill()
    }
    const paintStill = () => {
      // a flow field needs a few hundred steps before it reads as an image
      const n = kind === 'flow' ? 260 : 1
      for (let i = 0; i < n; i++) draw({ c, w, h, t: 12 + i / 30, a, b })
    }
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (document.hidden || now - last < 33) return
      last = now
      draw({ c, w, h, t: (now - start) / 1000, a, b })
    }

    resize()
    window.addEventListener('resize', resize)
    if (!still) raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [kind, accent, reduce])

  return <canvas ref={ref} className="absolute inset-0 size-full" />
}

function Aurora() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="aurora-blob" style={{ left: '-10%', top: '-20%', width: '60vw', height: '60vw', background: 'var(--accent)', opacity: 0.2, animationDuration: '34s' }} />
      <div className="aurora-blob" style={{ right: '-15%', top: '10%', width: '55vw', height: '55vw', background: 'var(--accent-2)', opacity: 0.2, animationDuration: '46s', animationDirection: 'reverse' }} />
      <div className="aurora-blob" style={{ left: '25%', bottom: '-40%', width: '70vw', height: '70vw', background: '#2a4bff', opacity: 0.16, animationDuration: '58s' }} />
    </div>
  )
}

export function WallpaperArt({ id }: { id: WallpaperId }) {
  if (id === 'horizon' || id === 'flow') return <CanvasWallpaper key={id} kind={id} />
  if (id === 'aurora') return <Aurora />
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          'radial-gradient(ellipse 70% 55% at 50% 0%, color-mix(in oklab, var(--accent) 9%, transparent), transparent), radial-gradient(ellipse 60% 50% at 80% 100%, color-mix(in oklab, var(--accent-2) 8%, transparent), transparent)',
      }}
    />
  )
}

export function Wallpaper() {
  const id = usePrefs((s) => s.wallpaper)
  const scanlines = usePrefs((s) => s.scanlines)
  const grain = usePrefs((s) => s.grain)
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-void">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #07080d 0%, #05060a 60%, #030407 100%)' }} />
      <WallpaperArt id={id} />
      <div className="vignette absolute inset-0" />
      {grain && <div className="grain absolute inset-0" />}
      {scanlines && <div className="scanlines absolute inset-0" />}
    </div>
  )
}
