import { useEffect, useRef } from 'react'
import { ACCENTS, PHOTOS, usePrefs, type WallpaperId } from './store'

interface Ctx { c: CanvasRenderingContext2D; w: number; h: number; t: number; a: string; b: string }

const hexA = (hex: string, alpha: number) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

/* Ridgelines: stacked lines of terrain drifting slowly, nearer ones brighter.
   Each ridge hides the ones behind it, so the lines never tangle. */
function drawRidge({ c, w, h, t, a, b }: Ctx) {
  c.clearRect(0, 0, w, h)
  const top = h * 0.5
  const n = 22
  const glow = c.createLinearGradient(0, top - h * 0.2, 0, h)
  glow.addColorStop(0, 'rgba(0,0,0,0)')
  glow.addColorStop(1, hexA(b, 0.1))
  c.fillStyle = glow
  c.fillRect(0, 0, w, h)
  c.lineWidth = 1
  for (let i = 0; i < n; i++) {
    const p = i / (n - 1)
    const base = top + Math.pow(p, 1.5) * (h - top) * 1.02
    const amp = 10 + p * 54
    c.beginPath()
    for (let x = -10; x <= w + 10; x += 10) {
      const u = x / w
      // tallest toward the right, so the icon column on the left stays calm
      const lift = 0.35 + 0.65 * Math.pow(u, 1.3)
      const y =
        base -
        amp * lift * (0.5 + 0.5 * Math.sin(u * 5.2 + i * 0.55 + t * 0.07)) *
          (0.55 + 0.45 * Math.sin(u * 11.3 - i * 0.9 - t * 0.045)) -
        amp * 0.18 * Math.sin(u * 23 + i * 1.7 + t * 0.09)
      if (x === -10) c.moveTo(x, y)
      else c.lineTo(x, y)
    }
    c.strokeStyle = hexA(i % 5 === 3 ? b : a, 0.1 + p * 0.42)
    c.stroke()
    c.lineTo(w + 10, h + 10)
    c.lineTo(-10, h + 10)
    c.closePath()
    c.fillStyle = '#05060b'
    c.fill()
  }
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

/* ---- 3D wallpapers: real perspective projection, drawn as points and lines ---- */

/* Globe: a sphere of points turning slowly, with one tilted orbit. */
function drawGlobe({ c, w, h, t, a, b }: Ctx) {
  c.clearRect(0, 0, w, h)
  const cx = w * 0.6, cy = h * 0.52
  const R = Math.min(w, h) * 0.33
  const f = R * 3.2
  const ry = t * 0.1, rx = 0.38
  const cosY = Math.cos(ry), sinY = Math.sin(ry), cosX = Math.cos(rx), sinX = Math.sin(rx)

  const halo = c.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.7)
  halo.addColorStop(0, hexA(a, 0.1))
  halo.addColorStop(0.55, hexA(b, 0.05))
  halo.addColorStop(1, 'rgba(0,0,0,0)')
  c.fillStyle = halo
  c.fillRect(0, 0, w, h)

  const put = (x: number, y: number, z: number, col: string, size: number, alpha: number) => {
    const x1 = x * cosY + z * sinY, z1 = -x * sinY + z * cosY
    const y2 = y * cosX - z1 * sinX, z2 = y * sinX + z1 * cosX
    const k = f / (f - z2)
    const depth = (z2 / R + 1) / 2
    c.fillStyle = hexA(col, alpha * (0.12 + depth * 0.88))
    const s = size * k
    c.fillRect(cx + x1 * k - s / 2, cy + y2 * k - s / 2, s, s)
  }

  for (let lat = -84; lat <= 84; lat += 12) {
    const phi = (lat * Math.PI) / 180
    const r = Math.cos(phi) * R, y = Math.sin(phi) * R
    const n = Math.max(8, Math.round(64 * Math.cos(phi)))
    for (let i = 0; i < n; i++) {
      const th = (i / n) * Math.PI * 2
      put(Math.cos(th) * r, y, Math.sin(th) * r, a, 1.6, 0.85)
    }
  }
  for (let lon = 0; lon < 360; lon += 30) {
    const th = (lon * Math.PI) / 180
    for (let i = -44; i <= 44; i++) {
      const phi = (i / 45) * (Math.PI / 2)
      put(Math.cos(phi) * Math.cos(th) * R, Math.sin(phi) * R, Math.cos(phi) * Math.sin(th) * R, a, 1.1, 0.4)
    }
  }
  // a tilted orbit with one satellite
  const oR = R * 1.38
  for (let i = 0; i < 160; i++) {
    const th = (i / 160) * Math.PI * 2
    put(Math.cos(th) * oR, Math.sin(th) * oR * 0.32, Math.sin(th) * oR, b, 1.1, 0.55)
  }
  const st = t * 0.45
  put(Math.cos(st) * oR, Math.sin(st) * oR * 0.32, Math.sin(st) * oR, b, 5, 1)
}

/* Terrain: flying low over a wire mesh landscape toward a glowing horizon. */
function drawTerrain({ c, w, h, t, a, b }: Ctx) {
  c.clearRect(0, 0, w, h)
  const hy = h * 0.46, cx = w * 0.5
  const f = h * 0.9, camH = 1.25
  const NX = 44, NZ = 30, span = 9, zNear = 0.9, dz = 0.45
  const scroll = (t * 0.55) % dz
  const offset = Math.floor((t * 0.55) / dz)

  const sky = c.createRadialGradient(cx, hy, 0, cx, hy, w * 0.55)
  sky.addColorStop(0, hexA(b, 0.26))
  sky.addColorStop(0.5, hexA(a, 0.06))
  sky.addColorStop(1, 'rgba(0,0,0,0)')
  c.fillStyle = sky
  c.fillRect(0, 0, w, hy + 2)

  const height = (x: number, zi: number) => {
    const valley = Math.min(1, Math.abs(x) / 2.2)
    return valley * valley * (0.55 * Math.sin(x * 1.3 + zi * 0.5) + 0.45 * Math.sin(x * 2.9 - zi * 0.83) + 0.5 * Math.sin(zi * 0.31 + x * 0.6) + 1.1) * 0.62
  }
  const proj = (x: number, y: number, z: number): [number, number] => [cx + (x * f) / z, hy + ((camH - y) * f) / z]

  c.lineWidth = 1
  for (let j = NZ - 1; j >= 0; j--) {
    const z = zNear + j * dz - scroll
    if (z <= 0.2) continue
    const zi = j + offset
    const fade = Math.pow(1 - j / NZ, 1.6)
    // the ridge line across, filled below so nearer ground hides what is behind it
    c.beginPath()
    for (let i = 0; i <= NX; i++) {
      const x = (i / NX - 0.5) * 2 * span
      const [px, py] = proj(x, height(x, zi), z)
      if (i === 0) c.moveTo(px, py)
      else c.lineTo(px, py)
    }
    c.strokeStyle = hexA(a, 0.06 + fade * 0.5)
    c.stroke()
    // lines running away from the camera, to the next row back
    if (j < NZ - 1) {
      const z2 = z + dz
      c.beginPath()
      for (let i = 0; i <= NX; i += 2) {
        const x = (i / NX - 0.5) * 2 * span
        const [x1, y1] = proj(x, height(x, zi), z)
        const [x2, y2] = proj(x, height(x, zi + 1), z2)
        c.moveTo(x1, y1)
        c.lineTo(x2, y2)
      }
      c.strokeStyle = hexA(b, 0.04 + fade * 0.26)
      c.stroke()
    }
  }

  const line = c.createLinearGradient(0, 0, w, 0)
  line.addColorStop(0, 'rgba(0,0,0,0)')
  line.addColorStop(0.5, hexA(b, 0.7))
  line.addColorStop(1, 'rgba(0,0,0,0)')
  c.fillStyle = line
  c.fillRect(0, hy - 0.5, w, 1.2)
}

/* Warp: a field of stars streaming past the camera. */
function makeWarp() {
  const N = 420
  const stars = Array.from({ length: N }, () => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random(), tint: Math.random() }))
  let last = 0
  return ({ c, w, h, t, a, b }: Ctx) => {
    const dt = Math.min(0.1, Math.max(0, t - last))
    last = t
    c.clearRect(0, 0, w, h)
    const cx = w * 0.58, cy = h * 0.5
    const glow = c.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.5)
    glow.addColorStop(0, hexA(a, 0.07))
    glow.addColorStop(1, 'rgba(0,0,0,0)')
    c.fillStyle = glow
    c.fillRect(0, 0, w, h)
    const speed = 0.11
    for (const s of stars) {
      const z0 = s.z
      s.z -= speed * dt
      if (s.z <= 0.03) { s.x = Math.random() * 2 - 1; s.y = Math.random() * 2 - 1; s.z = 1; continue }
      const x0 = cx + (s.x / z0) * w * 0.5, y0 = cy + (s.y / z0) * w * 0.5
      const zt = s.z - 0.012
      const x1 = cx + (s.x / zt) * w * 0.5, y1 = cy + (s.y / zt) * w * 0.5
      if (x1 < -50 || x1 > w + 50 || y1 < -50 || y1 > h + 50) continue
      const near = 1 - s.z
      c.strokeStyle = s.tint > 0.86 ? hexA(b, 0.25 + near * 0.6) : s.tint > 0.7 ? hexA(a, 0.25 + near * 0.6) : `rgba(225,232,255,${0.15 + near * 0.6})`
      c.lineWidth = 0.6 + near * 1.6
      c.beginPath()
      c.moveTo(x0, y0)
      c.lineTo(x1, y1)
      c.stroke()
    }
  }
}

type CanvasKind = 'flow' | 'ridge' | 'globe' | 'terrain' | 'warp'
const CANVAS_KINDS: CanvasKind[] = ['flow', 'ridge', 'globe', 'terrain', 'warp']

function CanvasWallpaper({ kind }: { kind: CanvasKind }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const accent = usePrefs((s) => s.accent)

  useEffect(() => {
    const canvas = ref.current!
    const c = canvas.getContext('2d')!
    const { value: a, second: b } = ACCENTS[accent]
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const draw = kind === 'ridge' ? drawRidge : kind === 'globe' ? drawGlobe : kind === 'terrain' ? drawTerrain : kind === 'warp' ? makeWarp() : makeFlow()
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
  }, [kind, accent])

  return <canvas ref={ref} className="absolute inset-0 size-full" />
}

function Aurora() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="aurora-blob" style={{ left: '-10%', top: '-20%', width: '60vw', height: '60vw', background: 'var(--accent)', opacity: 0.22, animationDuration: '19s' }} />
      <div className="aurora-blob" style={{ right: '-15%', top: '10%', width: '55vw', height: '55vw', background: 'var(--accent-2)', opacity: 0.22, animationDuration: '25s', animationDirection: 'alternate-reverse' }} />
      <div className="aurora-blob" style={{ left: '25%', bottom: '-40%', width: '70vw', height: '70vw', background: '#2a4bff', opacity: 0.18, animationDuration: '31s' }} />
    </div>
  )
}

function Dusk() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(180deg, #04050b 0%, #080a1c 40%, #140d2e 68%, #22103a 100%)' }}>
      <div className="aurora-blob" style={{ left: '20%', bottom: '-46%', width: '80vw', height: '60vw', background: 'var(--accent-2)', opacity: 0.4, animationDuration: '23s' }} />
      <div className="aurora-blob" style={{ right: '-18%', bottom: '-40%', width: '54vw', height: '46vw', background: 'var(--accent)', opacity: 0.22, animationDuration: '29s', animationDirection: 'alternate-reverse' }} />
    </div>
  )
}

export function WallpaperArt({ id }: { id: WallpaperId }) {
  const photo = PHOTOS[id]
  if (photo)
    return (
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${photo})` }} />
        {/* dimmed, and darker on the left, so icon labels and the greeting stay readable */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgb(4 5 10 / 0.74) 0%, rgb(4 5 10 / 0.4) 36%, rgb(4 5 10 / 0.22) 100%), linear-gradient(180deg, rgb(4 5 10 / 0.3), transparent 32%, rgb(4 5 10 / 0.5))',
          }}
        />
      </div>
    )
  if ((CANVAS_KINDS as string[]).includes(id)) return <CanvasWallpaper key={id} kind={id as CanvasKind} />
  if (id === 'aurora') return <Aurora />
  if (id === 'dusk') return <Dusk />
  if (id === 'grid')
    return (
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 55% at 78% 70%, color-mix(in oklab, var(--accent) 13%, transparent), transparent 70%), radial-gradient(45% 40% at 20% 100%, color-mix(in oklab, var(--accent-2) 10%, transparent), transparent 70%), #06070c',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgb(255 255 255 / 0.16) 1px, transparent 1.5px)',
            backgroundSize: '26px 26px',
            maskImage: 'radial-gradient(90% 80% at 70% 60%, black, transparent)',
            WebkitMaskImage: 'radial-gradient(90% 80% at 70% 60%, black, transparent)',
          }}
        />
      </div>
    )
  return null
}

export function Wallpaper() {
  const id = usePrefs((s) => s.wallpaper)
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-void">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #07080d 0%, #05060a 60%, #030407 100%)' }} />
      <WallpaperArt id={id} />
      <div className="vignette absolute inset-0" />
      {/* scanlines are part of the look, not a preference */}
      <div className="scanlines absolute inset-0" />
    </div>
  )
}
