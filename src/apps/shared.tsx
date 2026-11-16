import { useMemo, useState, type ReactNode } from 'react'
import { ImageOff, PenLine } from 'lucide-react'
import type { Motif as MotifKind } from '../data/projects'
import { langColor, type GhLanguages } from '../lib/github'
import { cn } from '../os/icons'

/* ------------------------------------------------------------------
   ContentSlot - the placeholder for writing that has not been added
   yet. Visitors see a calm "in progress" panel; in development it also
   shows exactly which field to fill in.
------------------------------------------------------------------- */
export function ContentSlot({ title, note, path, className }: { title: string; note?: string; path?: string; className?: string }) {
  return (
    <div
      className={cn('relative overflow-hidden rounded-xl border border-dashed border-line-strong p-5', className)}
      style={{ background: 'repeating-linear-gradient(135deg, rgb(255 255 255 / 0.018) 0 10px, transparent 10px 20px)' }}
    >
      <div className="flex items-start gap-3.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-accent/10 text-accent">
          <PenLine size={16} />
        </span>
        <div className="min-w-0">
          <div className="text-[13.5px] font-medium text-ink">{title}</div>
          <div className="mt-1 text-[12.5px] leading-relaxed text-dim">{note ?? 'This section is being written and will appear here soon.'}</div>
          {import.meta.env.DEV && path && (
            <div className="mt-2.5 inline-block rounded-md border border-line bg-black/30 px-2 py-1 font-mono text-[10.5px] text-term">
              edit: {path}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** Renders plain text with blank-line paragraph breaks. */
export function Prose({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn('selectable max-w-[68ch] space-y-3.5 text-[14px] leading-[1.75] text-ink/85', className)}>
      {text.trim().split(/\n\s*\n/).map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  )
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <h3 className="label !text-dim">{children}</h3>
      <div className="h-px flex-1 bg-line" />
      {aside}
    </div>
  )
}

/* ------------------------------------------------------------------
   Remote image with a skeleton while loading and a fallback on error.
------------------------------------------------------------------- */
export function Shot({ src, alt, className, fallback }: { src: string; alt: string; className?: string; fallback?: ReactNode }) {
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  if (state === 'error')
    return (
      <div className={cn('relative grid place-items-center overflow-hidden bg-black/30', className)}>
        {fallback ?? (
          <div className="flex flex-col items-center gap-2 text-faint">
            <ImageOff size={18} />
            <span className="text-[11.5px]">Image unavailable</span>
          </div>
        )}
      </div>
    )
  return (
    <div className={cn('relative overflow-hidden bg-black/30', className)}>
      {state === 'loading' && <div className="skeleton absolute inset-0 !rounded-none" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        draggable={false}
        onLoad={() => setState('ok')}
        onError={() => setState('error')}
        className={cn('size-full object-cover object-top transition-opacity duration-500', state === 'ok' ? 'opacity-100' : 'opacity-0')}
      />
    </div>
  )
}

/* ------------------------------------------------------------------
   Language bar from the GitHub languages endpoint.
------------------------------------------------------------------- */
export function LanguageBar({ langs, max = 6 }: { langs: GhLanguages; max?: number }) {
  const total = Object.values(langs).reduce((a, b) => a + b, 0) || 1
  const rows = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, max)
  return (
    <div>
      <div className="flex h-1.5 gap-[2px] overflow-hidden rounded-full">
        {rows.map(([name, n]) => (
          <span key={name} style={{ width: `${(n / total) * 100}%`, background: langColor(name) }} className="min-w-[3px] rounded-full" />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-3.5 gap-y-1">
        {rows.map(([name, n]) => (
          <span key={name} className="flex items-center gap-1.5 text-[11.5px] text-dim">
            <span className="size-2 rounded-full" style={{ background: langColor(name) }} />
            {name}
            <span className="font-mono text-[10.5px] text-faint">{((n / total) * 100).toFixed(1)}%</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------
   Motif - generative artwork that gives each project its own look.
   Deterministic per seed, drawn in the project's two colours.
------------------------------------------------------------------- */
function rng(seed: string) {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

const W = 800
const H = 400

function smoothClosed(pts: [number, number][]) {
  const n = pts.length
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d + 'Z'
}

function build(kind: MotifKind, seed: string): ReactNode {
  const r = rng(seed + kind)
  const A = 'var(--accent)'
  const B = 'var(--accent-2)'

  if (kind === 'graph') {
    const nodes = Array.from({ length: 17 }, () => [60 + r() * (W - 120), 40 + r() * (H - 80)] as [number, number])
    const edges: [number, number][] = []
    nodes.forEach((n, i) => {
      nodes
        .map((m, j) => [j, Math.hypot(m[0] - n[0], m[1] - n[1])] as [number, number])
        .filter(([j]) => j !== i)
        .sort((a, b) => a[1] - b[1])
        .slice(0, 2)
        .forEach(([j]) => edges.push([i, j]))
    })
    return (
      <>
        {edges.map(([a, b], i) => (
          <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke={A} strokeOpacity={0.35} />
        ))}
        {nodes.map(([x, y], i) => {
          const hot = i % 5 === 0
          return (
            <g key={i}>
              {hot && <circle cx={x} cy={y} r={15} fill="none" stroke={B} strokeOpacity={0.5} />}
              <circle cx={x} cy={y} r={hot ? 6 : 4} fill={hot ? B : '#0b0d14'} stroke={hot ? B : A} strokeWidth={1.5} />
            </g>
          )
        })}
      </>
    )
  }

  if (kind === 'track') {
    const n = 11
    const pts = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2
      const rad = 0.62 + r() * 0.5
      return [W / 2 + Math.cos(a) * 280 * rad, H / 2 + Math.sin(a) * 130 * rad] as [number, number]
    })
    const d = smoothClosed(pts)
    return (
      <>
        <path d={d} fill="none" stroke={A} strokeOpacity={0.14} strokeWidth={22} strokeLinejoin="round" />
        <path d={d} fill="none" stroke={A} strokeOpacity={0.9} strokeWidth={2} />
        <path d={d} fill="none" stroke={B} strokeOpacity={0.7} strokeWidth={2} strokeDasharray="3 16" transform="translate(0 10)" />
        <circle r={5} fill={B}>
          <animateMotion dur="9s" repeatCount="indefinite" path={d} />
        </circle>
        <rect x={pts[0][0] - 2} y={pts[0][1] - 16} width={4} height={32} fill="#fff" fillOpacity={0.85} />
      </>
    )
  }

  if (kind === 'pulse') {
    const rows = [110, 200, 290]
    return (
      <>
        {rows.map((y, ri) => {
          let x = 30
          const ticks: ReactNode[] = []
          let k = 0
          while (x < W - 30) {
            const long = r() > 0.62
            const h = long ? 46 : 22
            ticks.push(
              <rect key={k++} x={x} y={y - h / 2} width={2.5} height={h} rx={1} fill={long ? B : A} fillOpacity={long ? 0.9 : 0.55} />,
            )
            x += long ? 30 + r() * 26 : 9 + r() * 9
          }
          return (
            <g key={ri} opacity={1 - ri * 0.22}>
              <line x1={20} x2={W - 20} y1={y} y2={y} stroke={A} strokeOpacity={0.18} />
              {ticks}
            </g>
          )
        })}
      </>
    )
  }

  if (kind === 'wave') {
    return (
      <>
        {Array.from({ length: 9 }, (_, i) => {
          const amp = 14 + r() * 46
          const freq = 0.006 + r() * 0.01
          const phase = r() * 6
          const y0 = 60 + i * 35
          let d = ''
          for (let x = 0; x <= W; x += 10) {
            const env = Math.sin((x / W) * Math.PI)
            d += `${x ? 'L' : 'M'}${x},${(y0 + Math.sin(x * freq + phase) * amp * env).toFixed(1)}`
          }
          return <path key={i} d={d} fill="none" stroke={i % 3 === 1 ? B : A} strokeOpacity={0.2 + (i / 9) * 0.6} strokeWidth={1.4} />
        })}
      </>
    )
  }

  if (kind === 'matrix') {
    const cells: ReactNode[] = []
    const s = 26
    for (let y = 0; y * s < H; y++)
      for (let x = 0; x * s < W; x++) {
        const v = r()
        if (v < 0.42) continue
        const hot = v > 0.93
        cells.push(
          <rect key={`${x}-${y}`} x={x * s + 4} y={y * s + 4} width={s - 8} height={s - 8} rx={3}
            fill={hot ? B : A} fillOpacity={hot ? 0.9 : (v - 0.42) * 0.5} />,
        )
      }
    return <>{cells}</>
  }

  // rings
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => {
        const rad = 36 + i * 30
        const dash = `${20 + r() * 120} ${10 + r() * 60}`
        return (
          <circle key={i} cx={W * 0.5} cy={H * 0.5} r={rad} fill="none" stroke={i % 3 === 2 ? B : A}
            strokeOpacity={0.75 - i * 0.07} strokeWidth={i % 3 === 2 ? 2.5 : 1.2} strokeDasharray={dash}
            transform={`rotate(${r() * 360} ${W * 0.5} ${H * 0.5})`} />
        )
      })}
      {Array.from({ length: 5 }, (_, i) => {
        const a = r() * Math.PI * 2
        const rad = 66 + Math.floor(r() * 6) * 30
        return <circle key={`d${i}`} cx={W * 0.5 + Math.cos(a) * rad} cy={H * 0.5 + Math.sin(a) * rad} r={5} fill={i % 2 ? A : B} />
      })}
    </>
  )
}

export function Motif({ kind, seed, className }: { kind: MotifKind; seed: string; className?: string }) {
  const art = useMemo(() => build(kind, seed), [kind, seed])
  return (
    <div className={cn('relative overflow-hidden', className)} aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 90% at 30% 20%, color-mix(in oklab, var(--accent) 22%, transparent), transparent 70%), radial-gradient(ellipse 70% 80% at 85% 90%, color-mix(in oklab, var(--accent-2) 16%, transparent), transparent 70%), #0a0c13',
        }}
      />
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
        {art}
      </svg>
    </div>
  )
}
