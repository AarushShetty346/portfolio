import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AppWindow, Globe, Timer, Wifi, WifiOff, X } from 'lucide-react'
import { profile } from '../data/profile'
import { projects } from '../data/projects'
import { resolveApp } from '../os/apps'
import { AppIcon, cn } from '../os/icons'
import { useFocusedId, usePrefs, useWM } from '../os/store'
import { formatTime, useNow, useOnline } from '../os/TopBar'

/* Everything here describes this browser session and AARUSH.OS itself.
   Nothing claims to read the visitor's hardware. */

const BOOT_AT = performance.timeOrigin

/** Measures how smoothly the interface is drawing, sampled once a second. */
function useFrameRate(samples = 48) {
  const [series, setSeries] = useState<number[]>([])
  useEffect(() => {
    let raf = 0, frames = 0, last = performance.now()
    const loop = (now: number) => {
      frames++
      if (now - last >= 1000) {
        const fps = Math.round((frames * 1000) / (now - last))
        setSeries((s) => [...s.slice(-(samples - 1)), fps])
        frames = 0
        last = now
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [samples])
  return series
}

function Graph({ data, max }: { data: number[]; max: number }) {
  const w = 600, h = 120
  if (data.length < 2) return <div className="skeleton h-full" />
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (Math.min(v, max) / max) * (h - 14) - 7}`)
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="size-full">
      <defs>
        <linearGradient id="mon-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.28" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((y) => (
        <line key={y} x1="0" x2={w} y1={h * y} y2={h * y} stroke="rgb(255 255 255 / 0.06)" strokeDasharray="2 6" vectorEffect="non-scaling-stroke" />
      ))}
      <path d={`M0,${h} L${pts.join(' L')} L${w},${h}Z`} fill="url(#mon-fill)" />
      <path d={`M${pts.join(' L')}`} fill="none" stroke="var(--accent)" strokeWidth={1.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

const pad = (n: number) => String(n).padStart(2, '0')
const duration = (ms: number) => {
  const s = Math.floor(ms / 1000)
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}

export default function Monitor() {
  const windows = useWM((s) => s.windows)
  const focusedId = useFocusedId()
  const { focus, close } = useWM.getState()
  const clock24 = usePrefs((s) => s.clock24)
  const wallpaper = usePrefs((s) => s.wallpaper)
  const now = useNow()
  const online = useOnline()
  const fps = useFrameRate()
  const cached = useRef(0)
  cached.current = Object.keys(localStorage).filter((k) => k.startsWith('aarush-os:gh:')).length

  const homeTime = now.toLocaleTimeString([], { timeZone: profile.timezone, hour: 'numeric', minute: '2-digit', hour12: !clock24 })
  const lastFps = fps[fps.length - 1]

  const avg = fps.length ? Math.round(fps.reduce((n, v) => n + v, 0) / fps.length) : undefined
  const low = fps.length ? Math.min(...fps) : undefined

  const facts: { icon: typeof Timer; label: string; value: string; sub: string; tone?: string }[] = [
    { icon: Timer, label: 'Session uptime', value: duration(now.getTime() - BOOT_AT), sub: 'Since this page loaded' },
    { icon: Globe, label: 'Local time', value: formatTime(now, clock24), sub: `${homeTime} for Aarush` },
    { icon: online ? Wifi : WifiOff, tone: online ? 'text-term' : 'text-danger', label: 'Connection', value: online ? 'Online' : 'Offline', sub: online ? 'Live GitHub data available' : 'Showing saved data' },
    { icon: AppWindow, label: 'Windows', value: String(windows.length), sub: `${windows.filter((w) => w.minimized).length} minimized` },
  ]

  const Heading = ({ children, aside }: { children: string; aside?: string }) => (
    <div className="flex items-baseline justify-between border-b border-white/[0.07] pb-2">
      <h3 className="label !text-ink/60">{children}</h3>
      {aside && <span className="font-mono text-[10px] text-faint">{aside}</span>}
    </div>
  )

  return (
    <div className="os-scroll @container h-full">
      {/* the one live instrument: how smoothly this interface is drawing */}
      <div className="flex flex-col border-b border-white/[0.07] bg-black/25 @lg:h-[168px] @lg:flex-row @lg:items-stretch">
        <div className="flex shrink-0 flex-col justify-between gap-5 p-6 @lg:w-[230px]">
          <div className="label !text-ink/60">Interface frame rate</div>
          <div>
            <div className="display flex items-baseline gap-2 text-[58px] font-light leading-none tracking-[-0.03em] tabular-nums text-ink">
              {lastFps ?? '..'}
              <span className="text-[13px] font-medium tracking-[0.14em] text-accent">FPS</span>
            </div>
            <div className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
              avg {avg ?? '..'} · low {low ?? '..'}
            </div>
          </div>
        </div>
        <div className="relative h-[120px] min-w-0 @lg:h-auto @lg:flex-1">
          <Graph data={fps} max={Math.max(60, ...fps)} />
          <div className="absolute bottom-2 right-4 font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">
            This page only. Not a reading of your hardware.
          </div>
        </div>
      </div>

      {/* session facts as one ruled strip */}
      <div className="grid grid-cols-2 border-b border-white/[0.07] @2xl:grid-cols-4">
        {facts.map((f, i) => (
          <div key={f.label} className={cn('px-6 py-4', i > 0 && '@2xl:border-l @2xl:border-white/[0.07]')}>
            <div className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint">
              <f.icon size={12} className={f.tone ?? 'text-accent'} /> {f.label}
            </div>
            <div className="display mt-2 text-[21px] font-medium leading-none tabular-nums text-ink">{f.value}</div>
            <div className="mt-1.5 truncate text-[11.5px] text-dim">{f.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-x-10 gap-y-8 p-6 @2xl:grid-cols-[1.4fr_1fr]">
        <div>
          <Heading aside={`${windows.length} running`}>Applications</Heading>
          <AnimatePresence initial={false}>
            {windows.map((w) => {
              const app = resolveApp(w)
              if (!app) return null
              const state = w.minimized ? 'Minimized' : w.id === focusedId ? 'Focused' : 'Running'
              return (
                <motion.div
                  layout
                  key={w.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="group flex h-12 items-center gap-3 border-b border-white/[0.06]"
                >
                  <AppIcon icon={app.icon} color={app.color} color2={app.color2} variant={app.variant} size={26} />
                  <button onClick={() => focus(w.id)} className="min-w-0 flex-1 truncate text-left text-[13px] text-ink transition-colors hover:text-accent">{app.title}</button>
                  <span className={cn('flex w-24 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em]', state === 'Focused' ? 'text-term' : state === 'Running' ? 'text-dim' : 'text-faint')}>
                    <span className={cn('size-1.5 rounded-full', state === 'Focused' ? 'animate-pulse-soft bg-term' : state === 'Running' ? 'bg-dim' : 'bg-faint')} />
                    {state}
                  </span>
                  <span className="hidden w-16 text-right font-mono text-[10px] text-faint @md:block">{Math.round(w.w)} x {Math.round(w.h)}</span>
                  <button aria-label={`Close ${app.title}`} onClick={() => close(w.id)} className="win-key !h-7 !w-7 opacity-0 transition-opacity group-hover:opacity-100 max-md:opacity-100" data-danger>
                    <X size={12} />
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        <div>
          <Heading>System</Heading>
          <dl>
            {[
              ['Project apps installed', String(projects.length)],
              ['GitHub responses cached', String(cached.current)],
              ['Display', `${window.innerWidth} x ${window.innerHeight}`],
              ['Wallpaper', wallpaper],
            ].map(([k, v]) => (
              <div key={k} className="flex h-10 items-center justify-between gap-4 border-b border-white/[0.06] text-[12.5px]">
                <dt className="text-dim">{k}</dt>
                <dd className="font-mono text-[11.5px] capitalize text-ink/90">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}
