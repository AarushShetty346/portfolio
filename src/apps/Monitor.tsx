import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AppWindow, Globe, Timer, Wifi, WifiOff, X } from 'lucide-react'
import { profile } from '../data/profile'
import { projects } from '../data/projects'
import { resolveApp } from '../os/apps'
import { AppIcon, cn } from '../os/icons'
import { useFocusedId, usePrefs, useWM } from '../os/store'
import { formatTime, useNow, useOnline } from '../os/TopBar'
import { SectionTitle } from './shared'

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

function Sparkline({ data, max }: { data: number[]; max: number }) {
  const w = 300, h = 64
  if (data.length < 2) return <div className="skeleton h-16" />
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (Math.min(v, max) / max) * (h - 6) - 3}`)
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-16 w-full">
      <path d={`M0,${h} L${pts.join(' L')} L${w},${h}Z`} fill="var(--accent)" fillOpacity={0.12} />
      <path d={`M${pts.join(' L')}`} fill="none" stroke="var(--accent)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

const pad = (n: number) => String(n).padStart(2, '0')
const duration = (ms: number) => {
  const s = Math.floor(ms / 1000)
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}

function Stat({ icon: Icon, label, value, sub, tone }: { icon: typeof Timer; label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-line bg-black/20 p-4">
      <div className="flex items-center gap-2 text-[11.5px] text-faint"><Icon size={13} className={tone ?? 'text-accent'} /> {label}</div>
      <div className="display mt-2.5 text-[24px] font-medium leading-none tabular-nums text-ink">{value}</div>
      {sub && <div className="mt-1.5 truncate text-[11.5px] text-dim">{sub}</div>}
    </div>
  )
}

export default function Monitor() {
  const windows = useWM((s) => s.windows)
  const focusedId = useFocusedId()
  const { focus, close } = useWM.getState()
  const clock24 = usePrefs((s) => s.clock24)
  const now = useNow()
  const online = useOnline()
  const fps = useFrameRate()
  const cached = useRef(0)
  cached.current = Object.keys(localStorage).filter((k) => k.startsWith('aarush-os:gh:')).length

  const homeTime = now.toLocaleTimeString([], { timeZone: profile.timezone, hour: 'numeric', minute: '2-digit', hour12: !clock24 })
  const lastFps = fps[fps.length - 1]

  return (
    <div className="os-scroll h-full p-6">
      <div className="grid grid-cols-4 gap-3">
        <Stat icon={Timer} label="Session uptime" value={duration(now.getTime() - BOOT_AT)} sub="Since this page loaded" />
        <Stat icon={Globe} label="Local time" value={formatTime(now, clock24)} sub={`${homeTime} for Aarush`} />
        <Stat icon={online ? Wifi : WifiOff} tone={online ? 'text-term' : 'text-danger'} label="Connection" value={online ? 'Online' : 'Offline'} sub={online ? 'Live GitHub data available' : 'Showing saved data'} />
        <Stat icon={AppWindow} label="Windows" value={String(windows.length)} sub={`${windows.filter((w) => w.minimized).length} minimized`} />
      </div>

      <div className="mt-5 grid grid-cols-[1.25fr_1fr] gap-5">
        <div>
          <SectionTitle aside={<span className="font-mono text-[10.5px] text-faint">{windows.length} running</span>}>Applications</SectionTitle>
          <div className="space-y-1.5">
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
                    className="flex h-12 items-center gap-3 rounded-lg border border-line bg-black/20 pl-2.5 pr-1.5"
                  >
                    <AppIcon icon={app.icon} color={app.color} color2={app.color2} variant={app.variant} size={28} />
                    <button onClick={() => focus(w.id)} className="min-w-0 flex-1 truncate text-left text-[13px] text-ink hover:text-accent">{app.title}</button>
                    <span className={cn('flex items-center gap-1.5 font-mono text-[10.5px]', state === 'Focused' ? 'text-term' : state === 'Running' ? 'text-dim' : 'text-faint')}>
                      <span className={cn('size-1.5 rounded-full', state === 'Focused' ? 'animate-pulse-soft bg-term' : state === 'Running' ? 'bg-dim' : 'bg-faint')} />
                      {state}
                    </span>
                    <span className="w-14 text-right font-mono text-[10.5px] text-faint">{Math.round(w.w)}x{Math.round(w.h)}</span>
                    <button aria-label={`Close ${app.title}`} onClick={() => close(w.id)} className="grid size-7 place-items-center rounded-md text-faint hover:bg-danger/80 hover:text-white">
                      <X size={13} />
                    </button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <SectionTitle aside={<span className="font-mono text-[10.5px] text-accent">{lastFps ? `${lastFps} fps` : 'measuring'}</span>}>Interface frame rate</SectionTitle>
            <div className="overflow-hidden rounded-xl border border-line bg-black/20 px-1 pt-3">
              <Sparkline data={fps} max={Math.max(60, ...fps)} />
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-faint">How smoothly this page is drawing. It is not a reading of your hardware.</p>
          </div>

          <div>
            <SectionTitle>System</SectionTitle>
            <dl className="space-y-2 text-[12.5px]">
              {[
                ['Project apps installed', String(projects.length)],
                ['GitHub responses cached', String(cached.current)],
                ['Display', `${window.innerWidth} x ${window.innerHeight}`],
                ['Wallpaper', usePrefs.getState().wallpaper],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-dim">{k}</dt>
                  <dd className="font-mono text-[11.5px] capitalize text-ink/90">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
