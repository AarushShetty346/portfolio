import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Search, Wifi, WifiOff } from 'lucide-react'
import { openApp, resolveApp } from './apps'
import { AppIcon, cn, OsMark } from './icons'
import { profile } from '../data/profile'
import { useFocusedId, usePrefs, useShell, useWM } from './store'

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(t)
  }, [intervalMs])
  return now
}

export function useOnline() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}

export const formatTime = (d: Date, h24: boolean, seconds = false) =>
  d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: seconds ? '2-digit' : undefined, hour12: !h24 })

function SystemMenu({ onClose }: { onClose: () => void }) {
  const { closeAll, tidy } = useWM.getState()
  const items: ({ label: string; hint?: string; run: () => void } | null)[] = [
    { label: 'About this system', run: () => openApp('about') },
    { label: 'Settings', run: () => openApp('settings') },
    { label: 'System Monitor', run: () => openApp('monitor') },
    null,
    { label: 'Tidy windows', hint: 'Alt T', run: tidy },
    { label: 'Close all windows', run: closeAll },
    null,
    { label: 'Restart', run: () => { sessionStorage.removeItem('aarush-os:booted'); location.reload() } },
  ]
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      className="glass absolute left-2 top-[calc(100%+6px)] w-60 origin-top-left rounded-xl p-1.5"
    >
      <div className="px-2.5 pb-2 pt-1.5">
        <div className="display text-[13px] font-semibold tracking-[0.2em]">AARUSH<span className="text-accent">.</span>OS</div>
        <div className="mt-0.5 text-[11.5px] text-faint">{profile.name}</div>
      </div>
      {items.map((it, i) =>
        it ? (
          <button
            key={it.label}
            onClick={() => { it.run(); onClose() }}
            className="flex h-8 w-full items-center justify-between rounded-md px-2.5 text-left text-[13px] text-ink/90 hover:bg-white/8"
          >
            {it.label}
            {it.hint && <span className="font-mono text-[10.5px] text-faint">{it.hint}</span>}
          </button>
        ) : (
          <div key={i} className="mx-2 my-1 h-px bg-line" />
        ),
      )}
    </motion.div>
  )
}

export function TopBar() {
  const windows = useWM((s) => s.windows)
  const focusedId = useFocusedId()
  const { focus, minimize } = useWM.getState()
  const clock24 = usePrefs((s) => s.clock24)
  const setLauncher = useShell((s) => s.setLauncher)
  const now = useNow()
  const online = useOnline()
  const [menu, setMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menu) return
    const away = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false)
    }
    window.addEventListener('pointerdown', away)
    return () => window.removeEventListener('pointerdown', away)
  }, [menu])

  return (
    <div className="absolute inset-x-0 top-0 z-[5000] flex h-[38px] items-center gap-1 border-b border-line bg-[#07080d]/72 px-2 backdrop-blur-xl">
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setMenu((m) => !m)}
          aria-label="System menu"
          className={cn(
            'flex h-7 items-center gap-2 rounded-md px-2 text-accent transition-colors hover:bg-white/8',
            menu && 'bg-white/10',
          )}
        >
          <OsMark size={15} />
          <span className="display text-[12px] font-semibold tracking-[0.22em] text-ink">
            AARUSH<span className="text-accent">.</span>OS
          </span>
        </button>
        <AnimatePresence>{menu && <SystemMenu onClose={() => setMenu(false)} />}</AnimatePresence>
      </div>

      <div className="mx-1.5 h-4 w-px bg-line" />

      {/* Taskbar: one entry per open window */}
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
        <AnimatePresence initial={false}>
          {windows.map((w) => {
            const app = resolveApp(w)
            if (!app) return null
            const active = w.id === focusedId
            return (
              <motion.button
                layout
                key={w.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                onClick={() => (active ? minimize(w.id) : focus(w.id))}
                title={app.title}
                className={cn(
                  'relative flex h-7 min-w-0 max-w-44 items-center gap-2 rounded-md px-2 text-[12px] transition-colors',
                  active ? 'bg-white/10 text-ink' : 'text-dim hover:bg-white/6 hover:text-ink',
                  w.minimized && 'opacity-55',
                )}
              >
                <AppIcon icon={app.icon} color={app.color} color2={app.color2} variant={app.variant} size={16} />
                <span className="truncate">{app.title}</span>
                {active && (
                  <motion.span
                    layoutId="taskbar-active"
                    className="absolute inset-x-2 -bottom-[5px] h-[2px] rounded-full bg-accent"
                  />
                )}
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      <button
        onClick={() => setLauncher(true)}
        className="flex h-7 items-center gap-2 rounded-md px-2 text-[12px] text-dim transition-colors hover:bg-white/8 hover:text-ink"
      >
        <Search size={13} />
        <span>Search</span>
        <kbd className="rounded border border-line px-1 font-mono text-[10px] text-faint">Ctrl K</kbd>
      </button>

      <div className="mx-1 h-4 w-px bg-line" />

      <div
        className={cn('flex h-7 items-center gap-1.5 px-1.5 text-[12px]', online ? 'text-term' : 'text-danger')}
        title={online ? 'Connected' : 'Offline'}
      >
        {online ? <Wifi size={14} /> : <WifiOff size={14} />}
      </div>

      <button
        onClick={() => openApp('monitor')}
        className="flex h-7 items-center gap-2.5 rounded-md px-2 font-mono text-[12px] text-ink/90 transition-colors hover:bg-white/8"
      >
        <span className="text-dim">{now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        <span className="tabular-nums">{formatTime(now, clock24)}</span>
      </button>
    </div>
  )
}
