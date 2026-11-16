import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Bell, Check, ChevronLeft, ChevronRight, CircleAlert, CircleCheck, Info, Search, Wifi, WifiOff, X } from 'lucide-react'
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

/* ------------------------------------------------------------------
   Every control in the bar opens the same kind of surface: a frosted
   glass sheet holding glass cards. `Sheet` is that surface.
------------------------------------------------------------------- */
const pop = {
  initial: { opacity: 0, y: -8, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -5, scale: 0.98 },
  transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] as const },
}

function Sheet({ align = 'left', width, phone, children }: { align?: 'left' | 'right'; width: number; phone?: boolean; children: ReactNode }) {
  return (
    <motion.div
      {...pop}
      style={phone ? undefined : { width }}
      className={cn(
        'glass rounded-[18px] p-2',
        phone ? 'fixed inset-x-2 top-[45px]' : cn('absolute top-[calc(100%+8px)]', align === 'left' ? 'left-0 origin-top-left' : 'right-0 origin-top-right'),
      )}
    >
      {children}
    </motion.div>
  )
}

const SheetTitle = ({ children, aside }: { children: ReactNode; aside?: ReactNode }) => (
  <div className="flex h-8 items-center justify-between px-2">
    <span className="flex items-center gap-2 text-[12.5px] font-semibold text-ink">{children}</span>
    {aside}
  </div>
)

/* ------------------------------------------------------------------ menus */
type Item = { label: string; hint?: string; icon?: ReactNode; disabled?: boolean; run: () => void } | null

function MenuSheet({ title, items, onClose }: { title: string; items: Item[]; onClose: () => void }) {
  return (
    <Sheet width={248}>
      <SheetTitle>{title}</SheetTitle>
      <div className="glass-card p-1">
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
            <div key={i} className="mx-2 my-1 h-px bg-white/10" />
          ),
        )}
      </div>
    </Sheet>
  )
}

/* ---------------------------------------------------------- notifications */
const ago = (t: number) => {
  const s = Math.max(0, Math.round((Date.now() - t) / 1000))
  return s < 45 ? 'now' : s < 3600 ? `${Math.round(s / 60)}m` : `${Math.round(s / 3600)}h`
}

function NotificationSheet({ phone, onClose }: { phone: boolean; onClose: () => void }) {
  const prefs = usePrefs()
  const history = useNotices((s) => s.history)
  const clearHistory = useNotices((s) => s.clearHistory)
  const removeHistory = useNotices((s) => s.removeHistory)
  const wallpapers = Object.keys(WALLPAPERS) as WallpaperId[]

  return (
    <Sheet align="right" width={360} phone={phone}>
      <SheetTitle
        aside={history.length > 0 && <button onClick={clearHistory} className="text-[11.5px] text-ink/60 transition-colors hover:text-ink">Clear all</button>}
      >
        <Bell size={13.5} /> Notifications
        {history.length > 0 && <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10.5px] font-semibold text-[#05060a]">{history.length}</span>}
      </SheetTitle>

      <div className="os-scroll max-h-[300px] space-y-1.5 [scrollbar-width:none]">
        {history.length === 0 && <div className="glass-card px-3 py-6 text-center text-[12.5px] text-ink/55">Nothing new.</div>}
        <AnimatePresence initial={false}>
          {history.map((n) => {
            const Icon = n.tone === 'ok' ? CircleCheck : n.tone === 'warn' ? CircleAlert : Info
            return (
              <motion.div
                layout
                key={n.id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.2 }}
                className="glass-card flex items-start gap-3 p-3"
              >
                <span className={cn('grid size-9 shrink-0 place-items-center rounded-[10px] bg-white/[0.08]', n.tone === 'warn' ? 'text-danger' : n.tone === 'ok' ? 'text-term' : 'text-accent')}>
                  <Icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[13px] font-semibold text-ink">{n.title}</span>
                    <span className="shrink-0 font-mono text-[10px] text-ink/45">{ago(n.at)}</span>
                  </div>
                  {n.body && <div className="mt-0.5 text-[12px] leading-snug text-ink/65">{n.body}</div>}
                </div>
                <button aria-label="Dismiss" onClick={() => removeHistory(n.id)} className="grid size-6 shrink-0 place-items-center rounded-full bg-white/[0.08] text-ink/60 transition-colors hover:bg-white/20 hover:text-ink">
                  <X size={11} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <div className="glass-card mt-1.5 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-ink/70">Accent</span>
          <div className="flex gap-1.5">
            {(Object.keys(ACCENTS) as AccentId[]).map((id) => (
              <button
                key={id}
                aria-label={ACCENTS[id].name}
                title={ACCENTS[id].name}
                onClick={() => prefs.set('accent', id)}
                className="grid size-5 place-items-center rounded-full transition-transform hover:scale-110"
                style={{ background: ACCENTS[id].value, boxShadow: prefs.accent === id ? `0 0 0 2px rgb(20 22 34), 0 0 0 3.5px ${ACCENTS[id].value}` : undefined }}
              >
                {prefs.accent === id && <Check size={11} strokeWidth={3.5} className="text-[#05060a]" />}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 text-[12px] text-ink/70">Wallpaper</div>
        <div className="mt-2 grid grid-cols-5 gap-1">
          {wallpapers.map((id) => (
            <button
              key={id}
              title={WALLPAPERS[id].name}
              onClick={() => prefs.set('wallpaper', id)}
              className={cn('h-6 truncate rounded-md px-1 text-[10px] transition-colors', prefs.wallpaper === id ? 'bg-white/20 text-ink' : 'bg-white/[0.05] text-ink/55 hover:text-ink')}
            >
              {WALLPAPERS[id].name}
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => { openApp('settings'); onClose() }} className="menu-item mt-1 justify-center !text-[12px] text-ink/60">All settings</button>
    </Sheet>
  )
}

/* ---------------------------------------------------------------- calendar */
function CalendarSheet({ now, clock24, phone }: { now: Date; clock24: boolean; phone: boolean }) {
  const [shift, setShift] = useState(0)
  const first = new Date(now.getFullYear(), now.getMonth() + shift, 1)
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const lead = first.getDay()
  const cells: (number | null)[] = [...Array<null>(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  const isThisMonth = shift === 0
  const homeTime = now.toLocaleTimeString([], { timeZone: profile.timezone, hour: 'numeric', minute: '2-digit', hour12: !clock24 })
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 7 + i).toLocaleDateString([], { weekday: 'narrow' }))

  return (
    <Sheet align="right" width={300} phone={phone}>
      <div className="glass-card p-4">
        <div className="display text-[30px] leading-none tabular-nums text-ink">{formatTime(now, clock24, true)}</div>
        <div className="mt-2 text-[12.5px] text-ink/70">{now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </div>

      <div className="glass-card mt-1.5 p-3">
        <div className="flex items-center justify-between pb-2">
          <span className="text-[12.5px] font-semibold text-ink">{first.toLocaleDateString([], { month: 'long', year: 'numeric' })}</span>
          <div className="flex gap-1">
            <button aria-label="Previous month" onClick={() => setShift((s) => s - 1)} className="grid size-6 place-items-center rounded-full bg-white/[0.08] text-ink/70 hover:bg-white/20 hover:text-ink"><ChevronLeft size={13} /></button>
            <button aria-label="Next month" onClick={() => setShift((s) => s + 1)} className="grid size-6 place-items-center rounded-full bg-white/[0.08] text-ink/70 hover:bg-white/20 hover:text-ink"><ChevronRight size={13} /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {weekdays.map((d, i) => <span key={i} className="font-mono text-[9.5px] uppercase text-ink/40">{d}</span>)}
          {cells.map((d, i) => (
            <span
              key={i}
              className={cn(
                'mx-auto grid size-7 place-items-center rounded-full text-[12px] tabular-nums',
                d === null ? '' : isThisMonth && d === now.getDate() ? 'bg-accent font-semibold text-[#05060a]' : 'text-ink/80',
              )}
            >
              {d}
            </span>
          ))}
        </div>
      </div>

      <div className="glass-card mt-1.5 flex items-center justify-between px-3 py-2.5 text-[12px]">
        <span className="text-ink/65">Aarush's time, {profile.location}</span>
        <span className="font-medium tabular-nums text-ink">{homeTime}</span>
      </div>
    </Sheet>
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
    Window: [
      { label: 'Minimize', hint: 'Alt M', disabled: none, run: () => focused && wm.minimize(focused.id) },
      { label: focused?.maximized ? 'Exit fullscreen' : 'Fullscreen', hint: 'Alt Enter', disabled: none, run: () => focused && wm.toggleMaximize(focused.id) },
      { label: 'Close', hint: 'Alt W', disabled: none, run: () => focused && wm.close(focused.id) },
      null,
      { label: 'Next window', hint: 'Alt `', disabled: windows.length < 2, run: wm.cycle },
      { label: 'Tidy windows', hint: 'Alt T', disabled: !windows.length, run: wm.tidy },
      { label: 'Close all', disabled: !windows.length, run: wm.closeAll },
    ],
    Go: APPS.map((a, i) => ({
      label: a.name,
      hint: i < 9 ? `Alt ${i + 1}` : undefined,
      icon: <AppIcon icon={a.icon} color={a.color} size={18} />,
      run: () => openApp(a.id),
    })),
    Help: [
      { label: 'Search everything', hint: 'Ctrl K', run: () => setLauncher(true) },
      { label: 'Keyboard shortcuts', run: () => notify('Keyboard shortcuts', 'Ctrl K search. Alt W close, Alt M minimize, Alt Enter fullscreen, Alt T tidy, Alt 1 to 9 open an app.') },
      { label: 'Restart', run: () => { sessionStorage.removeItem('aarush-os:booted'); location.reload() } },
      { label: 'Get in touch', run: () => openApp('contact') },
    ],
  }

  // a plain render helper, not a component: the bar re-renders every second for the clock
  const menuButton = (id: string) => (
    <div className="relative" data-menu>
      <button
        onClick={() => setOpen((o) => (o === id ? null : id))}
        onPointerEnter={() => open && open in menus && setOpen(id)}
        className={cn('flex h-[26px] items-center rounded-md px-2 text-[12.5px] transition-colors', open === id ? 'bg-white/14 text-ink' : 'text-ink/75 hover:bg-white/8 hover:text-ink')}
      >
        {id}
      </button>
      <AnimatePresence>{open === id && <MenuSheet title={id} items={menus[id]} onClose={() => setOpen(null)} />}</AnimatePresence>
    </div>
  )

  return (
    <div
      className="absolute inset-x-0 top-0 z-[5000] flex h-[38px] items-center gap-0.5 px-2.5"
      style={{
        background: 'linear-gradient(180deg, rgb(10 12 22 / 0.62), rgb(10 12 22 / 0.42))',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        boxShadow: 'inset 0 -1px 0 rgb(255 255 255 / 0.09), 0 1px 0 rgb(0 0 0 / 0.4)',
      }}
    >
      {/* the system mark is a label on a desktop; on a phone it is the way home */}
      {phone ? (
        <button aria-label="Home screen" onClick={() => windows.forEach((w) => wm.minimize(w.id))} className="flex h-[26px] items-center rounded-md px-1.5 text-accent">
          <OsMark size={15} />
        </button>
      ) : (
        <div className="flex h-[26px] items-center gap-2 px-1.5 text-accent">
          <OsMark size={15} />
          <span className="display text-[11.5px] font-semibold tracking-[0.24em] text-ink">AARUSH<span className="text-accent">.</span>OS</span>
        </div>
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
      {!phone && menuButton('Window')}
      {!phone && menuButton('Go')}
      {!phone && menuButton('Help')}

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
                {active && <motion.span layoutId="taskbar-active" className="absolute inset-0 rounded-md border border-white/12 bg-white/[0.09]" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
                <span className="relative"><AppIcon icon={app.icon} color={app.color} color2={app.color2} variant={app.variant} size={18} /></span>
                <span className="relative hidden max-w-28 truncate lg:inline">{app.title}</span>
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      {/* status */}
      <button
        onClick={() => { setOpen(null); setLauncher(true) }}
        aria-label="Search"
        className={cn('flex h-[26px] items-center gap-2 rounded-md text-[11.5px] text-ink/65 transition-colors hover:bg-white/10 hover:text-ink', phone ? 'w-8 justify-center' : 'border border-white/10 bg-white/[0.05] pl-2 pr-1.5')}
      >
        <Search size={phone ? 13.5 : 12} />
        {!phone && <span>Search</span>}
        {!phone && <kbd className="rounded bg-white/10 px-1 font-mono text-[9.5px] text-ink/45">Ctrl K</kbd>}
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
          aria-label="Notifications"
          onClick={() => { setOpen((o) => (o === 'bell' ? null : 'bell')); markRead() }}
          className={cn('relative grid h-[26px] w-8 place-items-center rounded-md transition-colors', open === 'bell' ? 'bg-white/14 text-ink' : 'text-ink/65 hover:bg-white/10 hover:text-ink')}
        >
          <Bell size={13.5} />
          {unread > 0 && open !== 'bell' && <span className="absolute right-[7px] top-[5px] size-[6px] rounded-full bg-accent ring-2 ring-[#0b0d16]" />}
        </button>
        <AnimatePresence>{open === 'bell' && <NotificationSheet phone={phone} onClose={() => setOpen(null)} />}</AnimatePresence>
      </div>

      <div className="mx-1 h-3.5 w-px bg-white/12" />

      <div className="relative shrink-0" data-menu>
        <button
          aria-label="Date and time"
          onClick={() => setOpen((o) => (o === 'clock' ? null : 'clock'))}
          className={cn('flex h-[26px] items-center gap-2.5 whitespace-nowrap rounded-md px-2 text-[12px] leading-none transition-colors', open === 'clock' ? 'bg-white/14' : 'hover:bg-white/10')}
        >
          {!phone && <span className="text-ink/65">{now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}</span>}
          <span className="font-medium tabular-nums text-ink">{formatTime(now, clock24)}</span>
        </button>
        <AnimatePresence>{open === 'clock' && <CalendarSheet now={now} clock24={clock24} phone={phone} />}</AnimatePresence>
      </div>
    </div>
  )
}
