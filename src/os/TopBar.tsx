import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Bell, Check, Search, Wifi, WifiOff } from 'lucide-react'
import { APPS, openApp, resolveApp } from './apps'
import { usePhone } from './device'
import { AppIcon, cn, OsMark } from './icons'
import { profile } from '../data/profile'
import { ACCENTS, notify, useFocusedId, useNotices, usePrefs, useShell, useWM, WALLPAPERS, type AccentId, type WallpaperId } from './store'

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

/* ------------------------------------------------------------------ menus */
type Item = { label: string; hint?: string; icon?: ReactNode; disabled?: boolean; run: () => void } | null

const pop = {
  initial: { opacity: 0, y: -6, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -4, scale: 0.98 },
  transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] as const },
}

function MenuList({ items, onClose, header }: { items: Item[]; onClose: () => void; header?: ReactNode }) {
  return (
    <motion.div {...pop} className="glass absolute left-0 top-[calc(100%+7px)] w-60 origin-top-left rounded-xl p-1.5">
      {header}
      {items.map((it, i) =>
        it ? (
          <button
            key={it.label}
            disabled={it.disabled}
            onClick={() => { it.run(); onClose() }}
            className="menu-item disabled:pointer-events-none disabled:opacity-35"
          >
            {it.icon}
            {it.label}
            {it.hint && <kbd>{it.hint}</kbd>}
          </button>
        ) : (
          <div key={i} className="mx-2 my-1 h-px bg-line" />
        ),
      )}
    </motion.div>
  )
}

/* ------------------------------------------------------- control centre */
const ago = (t: number) => {
  const s = Math.max(0, Math.round((Date.now() - t) / 1000))
  return s < 45 ? 'now' : s < 3600 ? `${Math.round(s / 60)}m` : `${Math.round(s / 3600)}h`
}

function ControlCentre({ phone }: { phone: boolean }) {
  const prefs = usePrefs()
  const history = useNotices((s) => s.history)
  const clearHistory = useNotices((s) => s.clearHistory)
  const wallpapers = Object.keys(WALLPAPERS) as WallpaperId[]

  return (
    <motion.div {...pop} className={cn('glass origin-top-right rounded-2xl p-3', phone ? 'fixed inset-x-2 top-[45px]' : 'absolute right-0 top-[calc(100%+7px)] w-[320px]')}>
      <div className="rounded-[10px] border border-line bg-white/[0.025] p-2.5">
        <div className="flex items-center justify-between">
          <span className="label">Accent</span>
          <div className="flex gap-1.5">
            {(Object.keys(ACCENTS) as AccentId[]).map((id) => (
              <button
                key={id}
                aria-label={ACCENTS[id].name}
                title={ACCENTS[id].name}
                onClick={() => prefs.set('accent', id)}
                className="grid size-5 place-items-center rounded-full transition-transform hover:scale-110"
                style={{ background: ACCENTS[id].value, boxShadow: prefs.accent === id ? `0 0 0 2px #0b0d14, 0 0 0 3.5px ${ACCENTS[id].value}` : undefined }}
              >
                {prefs.accent === id && <Check size={11} strokeWidth={3.5} className="text-[#05060a]" />}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2.5 border-t border-line pt-2.5">
          <span className="label">Wallpaper</span>
          <div className="mt-2 grid grid-cols-4 gap-y-0.5 rounded-md border border-line p-0.5">
            {wallpapers.map((id) => (
              <button
                key={id}
                onClick={() => prefs.set('wallpaper', id)}
                className={cn('h-6 truncate rounded px-1 text-[10.5px] transition-colors', prefs.wallpaper === id ? 'bg-white/12 text-ink' : 'text-faint hover:text-ink')}
              >
                {WALLPAPERS[id].name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between px-1">
        <span className="label">Notifications</span>
        {history.length > 0 && (
          <button onClick={clearHistory} className="text-[11px] text-faint transition-colors hover:text-ink">Clear</button>
        )}
      </div>
      <div className="os-scroll mt-1.5 max-h-[188px] space-y-1">
        {history.length === 0 && <div className="px-1 py-4 text-center text-[12px] text-faint">Nothing new.</div>}
        {history.map((n) => (
          <div key={n.id} className="flex gap-2.5 rounded-[10px] bg-white/[0.03] px-2.5 py-2">
            <span className={cn('mt-[5px] size-1.5 shrink-0 rounded-full', n.tone === 'warn' ? 'bg-danger' : n.tone === 'ok' ? 'bg-term' : 'bg-accent')} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[12.5px] font-medium text-ink">{n.title}</span>
                <span className="shrink-0 font-mono text-[10px] text-faint">{ago(n.at)}</span>
              </div>
              {n.body && <div className="mt-0.5 text-[11.5px] leading-snug text-dim">{n.body}</div>}
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => openApp('settings')} className="menu-item mt-2 justify-center !text-[12px] text-dim">All settings</button>
    </motion.div>
  )
}

/* ---------------------------------------------------------------- top bar */
export function TopBar() {
  const windows = useWM((s) => s.windows)
  const focusedId = useFocusedId()
  const wm = useWM.getState()
  const clock24 = usePrefs((s) => s.clock24)
  const setLauncher = useShell((s) => s.setLauncher)
  const unread = useNotices((s) => s.unread)
  const markRead = useNotices((s) => s.markRead)
  const now = useNow()
  const online = useOnline()
  const [open, setOpen] = useState<string | null>(null)
  const phone = usePhone()

  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest('[data-menu]')) setOpen(null)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null)
    window.addEventListener('pointerdown', away)
    window.addEventListener('keydown', esc)
    return () => {
      window.removeEventListener('pointerdown', away)
      window.removeEventListener('keydown', esc)
    }
  }, [open])

  const focused = windows.find((w) => w.id === focusedId)
  const focusedApp = focused && resolveApp(focused)
  const none = !focused

  const menus: Record<string, Item[]> = {
    system: [
      ...(phone
        ? [
            { label: 'Home screen', disabled: none, run: () => windows.forEach((w) => wm.minimize(w.id)) },
            { label: 'Search', run: () => setLauncher(true) },
            null,
          ]
        : []),
      { label: 'About this system', run: () => openApp('about') },
      { label: 'Settings', run: () => openApp('settings') },
      { label: 'System Monitor', run: () => openApp('monitor') },
      null,
      { label: 'Restart', run: () => { sessionStorage.removeItem('aarush-os:booted'); location.reload() } },
    ],
    Window: [
      { label: 'Minimize', hint: 'Alt M', disabled: none, run: () => focused && wm.minimize(focused.id) },
      { label: focused?.maximized ? 'Restore' : 'Maximize', hint: 'Alt Enter', disabled: none, run: () => focused && wm.toggleMaximize(focused.id) },
      { label: 'Close', hint: 'Alt W', disabled: none, run: () => focused && wm.close(focused.id) },
      null,
      { label: 'Next window', hint: 'Alt `', disabled: windows.length < 2, run: wm.cycle },
      { label: 'Tidy windows', hint: 'Alt T', disabled: !windows.length, run: wm.tidy },
      { label: 'Close all', disabled: !windows.length, run: wm.closeAll },
    ],
    Go: APPS.map((a, i) => ({
      label: a.name,
      hint: `Alt ${i + 1}`,
      icon: <AppIcon icon={a.icon} color={a.color} size={18} />,
      run: () => openApp(a.id),
    })),
    Help: [
      { label: 'Search everything', hint: 'Ctrl K', run: () => setLauncher(true) },
      { label: 'Keyboard shortcuts', run: () => notify('Keyboard shortcuts', 'Ctrl K search. Alt W close, Alt M minimize, Alt Enter maximize, Alt T tidy, Alt 1 to 8 open an app.') },
      { label: 'Get in touch', run: () => openApp('contact') },
    ],
  }

  // a plain render helper, not a component: the bar re-renders every second for the clock
  const menuButton = (id: string, children: ReactNode, className?: string) => (
    <div className="relative" data-menu>
      <button
        onClick={() => setOpen((o) => (o === id ? null : id))}
        onPointerEnter={() => open && open !== 'cc' && setOpen(id)}
        className={cn('flex h-[26px] items-center rounded-md px-2 text-[12.5px] transition-colors', open === id ? 'bg-white/12 text-ink' : 'text-ink/75 hover:bg-white/8 hover:text-ink', className)}
      >
        {children}
      </button>
      <AnimatePresence>
        {open === id && (
          <MenuList
            items={menus[id]}
            onClose={() => setOpen(null)}
            header={
              id === 'system' ? (
                <div className="px-2.5 pb-2 pt-1.5">
                  <div className="display text-[13px] font-semibold tracking-[0.2em]">AARUSH<span className="text-accent">.</span>OS</div>
                  <div className="mt-0.5 text-[11.5px] text-faint">{profile.name}</div>
                </div>
              ) : undefined
            }
          />
        )}
      </AnimatePresence>
    </div>
  )

  return (
    <div
      className="absolute inset-x-0 top-0 z-[5000] flex h-[38px] items-center gap-0.5 px-2.5"
      style={{
        background: 'linear-gradient(180deg, rgb(6 7 13 / 0.86), rgb(6 7 13 / 0.6))',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        boxShadow: 'inset 0 -1px 0 rgb(255 255 255 / 0.07), 0 1px 0 rgb(0 0 0 / 0.5)',
      }}
    >
      {/* system + focused application context */}
      {menuButton(
        'system',
        <>
          <OsMark size={15} />
          {!phone && <span className="display text-[11.5px] font-semibold tracking-[0.24em] text-ink">AARUSH<span className="text-accent">.</span>OS</span>}
        </>,
        'gap-2 !px-1.5 text-accent',
      )}

      <div className="mx-1.5 h-3.5 w-px bg-white/12" />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={focusedApp?.title ?? 'desktop'}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.14 }}
          className="flex min-w-0 items-center gap-2 px-1.5 text-[12.5px] font-semibold text-ink"
        >
          {focusedApp && <span className="size-1.5 shrink-0 rounded-full" style={{ background: focusedApp.color }} />}
          <span className="min-w-0 max-w-40 truncate">{focusedApp?.title ?? (phone ? 'Home' : 'Desktop')}</span>
        </motion.div>
      </AnimatePresence>
      {!phone && menuButton('Window', 'Window')}
      {!phone && menuButton('Go', 'Go')}
      {!phone && menuButton('Help', 'Help')}

      {/* open windows */}
      <div className="ml-3 flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
        <AnimatePresence initial={false}>
          {(phone ? [] : windows).map((w) => {
            const app = resolveApp(w)
            if (!app) return null
            const active = w.id === focusedId
            return (
              <motion.button
                layout
                key={w.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: w.minimized ? 0.5 : 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                onClick={() => (active ? wm.minimize(w.id) : wm.focus(w.id))}
                title={app.title}
                className={cn(
                  'relative flex h-[26px] min-w-0 items-center gap-1.5 rounded-md pl-1 pr-2 text-[11.5px] transition-colors',
                  active ? 'text-ink' : 'text-dim hover:bg-white/6 hover:text-ink',
                )}
              >
                {active && <motion.span layoutId="taskbar-active" className="absolute inset-0 rounded-md border border-white/10 bg-white/[0.07]" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
                <span className="relative"><AppIcon icon={app.icon} color={app.color} color2={app.color2} variant={app.variant} size={18} /></span>
                <span className="relative hidden max-w-28 truncate lg:inline">{app.title}</span>
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      {/* status */}
      <button
        onClick={() => setLauncher(true)}
        aria-label="Search"
        className={cn('flex h-[26px] items-center gap-2 rounded-md text-[11.5px] text-dim transition-colors hover:bg-white/8 hover:text-ink', phone ? 'w-8 justify-center' : 'border border-white/8 bg-white/[0.03] pl-2 pr-1.5')}
      >
        <Search size={phone ? 13.5 : 12} />
        {!phone && <span>Search</span>}
        {!phone && <kbd className="rounded bg-white/8 px-1 font-mono text-[9.5px] text-faint">Ctrl K</kbd>}
      </button>

      <div
        className={cn('ml-1.5 flex h-[26px] items-center gap-1.5 px-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em]', online ? 'text-dim' : 'text-danger')}
        title={online ? 'Connected' : 'Offline'}
      >
        {online ? <Wifi size={13} className="text-term" /> : <WifiOff size={13} />}
        <span className="hidden xl:inline">{online ? 'Online' : 'Offline'}</span>
      </div>

      <div className="relative" data-menu>
        <button
          aria-label="Control centre and notifications"
          onClick={() => { setOpen((o) => (o === 'cc' ? null : 'cc')); markRead() }}
          className={cn('relative grid h-[26px] w-8 place-items-center rounded-md transition-colors', open === 'cc' ? 'bg-white/12 text-ink' : 'text-dim hover:bg-white/8 hover:text-ink')}
        >
          <Bell size={13.5} />
          {unread > 0 && open !== 'cc' && <span className="absolute right-[7px] top-[5px] size-[6px] rounded-full bg-accent ring-2 ring-[#090a10]" />}
        </button>
        <AnimatePresence>{open === 'cc' && <ControlCentre phone={phone} />}</AnimatePresence>
      </div>

      <div className="mx-1 h-3.5 w-px bg-white/12" />

      <button
        onClick={() => openApp('monitor')}
        className="flex h-[26px] shrink-0 items-center gap-2.5 whitespace-nowrap rounded-md px-2 text-[12px] transition-colors hover:bg-white/8"
      >
        {!phone && <span className="text-dim">{now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}</span>}
        <span className="font-medium tabular-nums text-ink">{formatTime(now, clock24)}</span>
      </button>
    </div>
  )
}
