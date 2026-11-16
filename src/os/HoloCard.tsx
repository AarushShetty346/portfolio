import { useEffect, useRef, useState } from 'react'
import { Mail } from 'lucide-react'
import { profile } from '../data/profile'
import { GitHubMark, LinkedInMark, OsMark } from './icons'
import { usePrefs } from './store'

/* ------------------------------------------------------------------
   Holographic ID card.
   Drag to spin it (it keeps its momentum), hover to tilt, double-click
   or press Enter to flip. The foil and glare follow the rotation.
   The photo comes from src/data/profile.ts > photo.
   Everything inside is sized in em, so `width` scales the whole card.
------------------------------------------------------------------- */

const BARS = Array.from({ length: 20 }, (_, i) => 1 + ((i * 7919) % 4))

function Portrait() {
  const [failed, setFailed] = useState(!profile.photo)
  const initials = profile.name.split(' ').map((w) => w[0]).join('')
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#070a14]">
      {failed ? (
        <div className="absolute inset-0 grid place-items-center" style={{ background: 'radial-gradient(circle at 50% 38%, color-mix(in oklab, var(--accent) 30%, transparent), transparent 62%)' }}>
          <span className="display font-semibold text-accent" style={{ fontSize: '6.2em', marginTop: '-0.5em', textShadow: '0 0 0.4em color-mix(in oklab, var(--accent) 70%, transparent)' }}>{initials}</span>
        </div>
      ) : (
        <img src={profile.photo} alt={profile.name} draggable={false} onError={() => setFailed(true)} className="absolute inset-0 size-full object-cover" style={{ filter: 'saturate(0.85) contrast(1.08)' }} />
      )}
      {/* colour grade so any photo sits in the theme */}
      <div className="absolute inset-0 mix-blend-color" style={{ background: 'linear-gradient(160deg, var(--accent), var(--accent-2))', opacity: 0.38 }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgb(4 6 14 / 0.55) 0%, transparent 24%, transparent 46%, rgb(4 6 14 / 0.96) 86%)' }} />
    </div>
  )
}

function Corners() {
  const base = 'absolute border-accent'
  const s = { width: '1.1em', height: '1.1em' }
  return (
    <>
      <span className={`${base} border-l-2 border-t-2`} style={{ ...s, left: '0.7em', top: '0.7em' }} />
      <span className={`${base} border-r-2 border-t-2`} style={{ ...s, right: '0.7em', top: '0.7em' }} />
      <span className={`${base} border-b-2 border-l-2`} style={{ ...s, left: '0.7em', bottom: '0.7em' }} />
      <span className={`${base} border-b-2 border-r-2`} style={{ ...s, right: '0.7em', bottom: '0.7em' }} />
    </>
  )
}

function Foil() {
  return (
    <>
      <div className="holo-foil pointer-events-none absolute inset-0" />
      <div className="holo-glare pointer-events-none absolute inset-0" />
      <div className="scanlines pointer-events-none absolute inset-0 opacity-70" />
    </>
  )
}

export function HoloCard({ width = 230, className }: { width?: number; className?: string }) {
  const stage = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const reduce = usePrefs((s) => s.reduceMotion)
  const api = useRef({ flip: () => {} })

  useEffect(() => {
    const el = card.current!
    const box = stage.current!
    const still = reduce || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let ry = -18, rx = 6, vy = 0, snap = 0
    let hx = 0, hy = 0, hovering = false
    let dragging = false, moved = 0, lastX = 0
    let raf = 0
    const t0 = performance.now()

    const paint = () => {
      const face = ((ry % 360) + 360) % 360
      el.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`
      el.style.setProperty('--shine', `${(face / 3.6 + rx * 2).toFixed(1)}%`)
      el.style.setProperty('--gx', `${(50 + hx * 40 - Math.sin((ry * Math.PI) / 180) * 30).toFixed(1)}%`)
      el.style.setProperty('--gy', `${(40 + hy * 40).toFixed(1)}%`)
    }

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (document.hidden) return
      if (!dragging) {
        if (Math.abs(vy) > 0.25) {
          ry += vy
          vy *= 0.955
          snap = Math.round((ry + vy * 12) / 180) * 180
        } else {
          vy = 0
          const t = (now - t0) / 1000
          const sway = still || hovering ? 0 : Math.sin(t * 0.7) * 9
          ry += (snap + sway + hx * 16 - ry) * 0.085
        }
        const bob = still || hovering ? 0 : Math.sin(((now - t0) / 1000) * 0.9) * 2.5
        rx += (-hy * 12 + bob - rx) * 0.1
      }
      paint()
    }

    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('a')) return
      dragging = true; moved = 0; lastX = e.clientX; vy = 0
      box.setPointerCapture(e.pointerId)
      e.stopPropagation()
    }
    const move = (e: PointerEvent) => {
      const r = box.getBoundingClientRect()
      hx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1))
      hy = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1))
      if (!dragging) return
      const dx = e.clientX - lastX
      lastX = e.clientX
      moved += Math.abs(dx)
      ry += dx * 0.7
      vy = vy * 0.5 + dx * 0.7 * 0.5
    }
    const up = () => {
      if (!dragging) return
      dragging = false
      snap = Math.round(ry / 180) * 180
    }
    const enter = () => { hovering = true }
    const leave = () => { hovering = false; hx = 0; hy = 0 }
    api.current.flip = () => { if (moved < 6) { vy = 0; snap = Math.round(ry / 180) * 180 + 180 } }

    box.addEventListener('pointerdown', down)
    box.addEventListener('pointermove', move)
    box.addEventListener('pointerup', up)
    box.addEventListener('pointercancel', up)
    box.addEventListener('pointerenter', enter)
    box.addEventListener('pointerleave', leave)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      box.removeEventListener('pointerdown', down)
      box.removeEventListener('pointermove', move)
      box.removeEventListener('pointerup', up)
      box.removeEventListener('pointercancel', up)
      box.removeEventListener('pointerenter', enter)
      box.removeEventListener('pointerleave', leave)
    }
  }, [reduce])

  const rows: [string, string][] = [
    ['Base', `${profile.school}, ${profile.location}`],
    ['Class', profile.gradYear],
    ['Focus', profile.interests.slice(0, 3).join(' / ')],
    ['Status', 'Open to summer 2027 internships'],
  ]

  return (
    <div
      ref={stage}
      role="button"
      tabIndex={0}
      aria-label={`${profile.name} ID card. Drag to spin, double-click to flip.`}
      title="Drag to spin. Double-click to flip."
      onDoubleClick={() => api.current.flip()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), api.current.flip())}
      onContextMenu={(e) => e.stopPropagation()}
      className={className}
      style={{ width, height: width * 1.42, fontSize: (width / 230) * 10, perspective: width * 5, cursor: 'grab', touchAction: 'none' }}
    >
      <div ref={card} className="holo-card relative size-full" style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}>
        {/* FRONT */}
        <div className="holo-face absolute inset-0 overflow-hidden">
          <Portrait />
          <Corners />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between font-mono uppercase text-accent" style={{ padding: '1.5em 2.3em 0', fontSize: '0.86em', letterSpacing: '0.18em' }}>
            <span className="flex items-center" style={{ gap: '0.6em' }}><OsMark size={width * 0.055} /> AARUSH.OS</span>
            <span className="text-ink/70">ID 0346</span>
          </div>
          <div className="absolute inset-x-0 bottom-0" style={{ padding: '0 1.9em 1.9em' }}>
            <div className="font-mono uppercase text-accent" style={{ fontSize: '0.82em', letterSpacing: '0.22em' }}>Operator</div>
            <div className="display font-semibold leading-none text-ink" style={{ fontSize: '2.5em', marginTop: '0.25em', textShadow: '0 0 0.6em color-mix(in oklab, var(--accent) 55%, transparent)' }}>{profile.name}</div>
            <div className="text-ink/75" style={{ fontSize: '1.08em', marginTop: '0.55em' }}>{profile.role}, {profile.school}</div>
            <div className="flex items-end justify-between" style={{ marginTop: '1.1em' }}>
              <div className="flex items-end" style={{ gap: '0.16em', height: '1.9em' }}>
                {BARS.map((w, i) => <span key={i} className="h-full bg-ink/70" style={{ width: `${w * 0.11}em` }} />)}
              </div>
              <span className="font-mono text-ink/60" style={{ fontSize: '0.82em', letterSpacing: '0.12em' }}>@{profile.handle}</span>
            </div>
          </div>
          <Foil />
        </div>

        {/* BACK */}
        <div className="holo-face absolute inset-0 overflow-hidden" style={{ transform: 'rotateY(180deg)' }}>
          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 30% 0%, color-mix(in oklab, var(--accent-2) 26%, transparent), transparent 55%), radial-gradient(circle at 90% 100%, color-mix(in oklab, var(--accent) 22%, transparent), transparent 55%), #070a14' }} />
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(color-mix(in oklab, var(--accent) 22%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--accent) 22%, transparent) 1px, transparent 1px)', backgroundSize: '1.6em 1.6em', maskImage: 'linear-gradient(180deg, transparent, black 30%, transparent)' }} />
          <Corners />
          <div className="relative flex h-full flex-col" style={{ padding: '2.4em 2.2em 2.1em' }}>
            <div className="flex items-center justify-between">
              <span className="text-accent"><OsMark size={width * 0.11} /></span>
              <span className="rounded-full border border-accent/50 font-mono uppercase text-accent" style={{ fontSize: '0.78em', letterSpacing: '0.18em', padding: '0.35em 0.9em' }}>Access granted</span>
            </div>
            <div style={{ marginTop: '2em' }}>
              {rows.map(([k, v]) => (
                <div key={k} className="border-b border-white/10" style={{ padding: '0.75em 0' }}>
                  <div className="font-mono uppercase text-accent/80" style={{ fontSize: '0.74em', letterSpacing: '0.2em' }}>{k}</div>
                  <div className="text-ink/90" style={{ fontSize: '1.06em', marginTop: '0.25em', lineHeight: 1.3 }}>{v}</div>
                </div>
              ))}
            </div>
            <div className="mt-auto flex" style={{ gap: '0.8em' }}>
              {[
                { href: profile.links.github, label: 'GitHub', icon: GitHubMark },
                { href: profile.links.linkedin, label: 'LinkedIn', icon: LinkedInMark },
                { href: `mailto:${profile.links.email}`, label: 'Email', icon: Mail },
              ].map((l) => (
                <a key={l.label} href={l.href} target={l.label === 'Email' ? undefined : '_blank'} rel="noreferrer" aria-label={l.label} title={l.label} draggable={false}
                  className="grid flex-1 place-items-center rounded-[0.7em] border border-white/15 bg-white/5 text-ink/85 transition-colors hover:border-accent/60 hover:text-accent" style={{ height: '3.4em' }}>
                  <l.icon size={width * 0.07} />
                </a>
              ))}
            </div>
          </div>
          <Foil />
        </div>
      </div>
    </div>
  )
}
