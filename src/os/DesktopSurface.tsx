import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { APPS, openApp, openProject } from './apps'
import { usePhone } from './device'
import { AppIcon, cn, glyphFor } from './icons'
import { profile } from '../data/profile'
import { HoloCard } from './HoloCard'
import { projects } from '../data/projects'
import { notify, usePrefs, useShell, useWM, WALLPAPERS, type WallpaperId } from './store'
import { formatTime, useNow } from './TopBar'

const DESKTOP_APPS = ['projects', 'about', 'experience', 'github', 'resume', 'contact']

function DesktopIcons() {
  const [selected, setSelected] = useState<string | null>(null)
  const hinted = useRef(false)

  return (
    <div
      className="absolute left-7 top-[64px] grid grid-cols-2 gap-x-1.5 gap-y-1"
      onPointerDown={(e) => e.target === e.currentTarget && setSelected(null)}
    >
      {DESKTOP_APPS.map((id, i) => {
        const a = APPS.find((x) => x.id === id)!
        const on = selected === id
        return (
          <motion.button
            key={id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => {
              setSelected(id)
              if (!hinted.current && !sessionStorage.getItem('aarush-os:dbl')) {
                hinted.current = true
                window.setTimeout(() => {
                  if (!useWM.getState().windows.length) {
                    notify('Double-click to open', 'Or use the dock below.')
                    sessionStorage.setItem('aarush-os:dbl', '1')
                  }
                }, 900)
              }
            }}
            onDoubleClick={() => openApp(id)}
            onKeyDown={(e) => e.key === 'Enter' && openApp(id)}
            className="group flex h-[92px] w-[88px] flex-col items-center gap-2 pt-2.5"
          >
            <span className="relative transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-active:scale-95">
              <span
                className="absolute -inset-1.5 rounded-[20px] border transition-all duration-200"
                style={{
                  borderColor: on ? `color-mix(in oklab, ${a.color} 55%, transparent)` : 'transparent',
                  background: on ? `color-mix(in oklab, ${a.color} 12%, transparent)` : undefined,
                }}
              />
              <AppIcon icon={a.icon} color={a.color} size={52} className="relative" />
            </span>
            <span
              className={cn(
                'rounded-[5px] px-1.5 py-px text-[11.5px] font-medium leading-tight tracking-[0.01em] transition-colors',
                on ? 'bg-white/14 text-white' : 'text-ink/90 [text-shadow:0_1px_8px_rgb(0_0_0),0_0_2px_rgb(0_0_0)]',
              )}
            >
              {a.name}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}

/** Lower-left: who this machine belongs to, and where to start. */
function Welcome() {
  const now = useNow(30000)
  const h = now.getHours()
  const greeting = h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="absolute bottom-[112px] left-8 max-w-[440px]"
    >
      <div className="flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink/55">
        <span className="h-px w-8 bg-accent" />
        {profile.name} / Portfolio
      </div>
      <h1 className="display mt-3 text-[44px] font-light leading-[1.02] tracking-[-0.01em] text-ink [text-shadow:0_2px_40px_rgb(0_0_0/0.7)]">
        {greeting}.
      </h1>
      <p className="mt-2.5 max-w-[40ch] text-[14px] leading-relaxed text-ink/70 [text-shadow:0_1px_12px_rgb(0_0_0/0.9)]">
        {profile.headline}
      </p>
      <div className="mt-4 flex items-center gap-4">
        <button className="btn btn-accent" onClick={() => openApp('projects')}>
          Open the library <ArrowRight size={14} />
        </button>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink/45">
          or press <kbd className="rounded border border-white/15 px-1 py-px text-ink/70">Ctrl K</kbd>
        </span>
      </div>
    </motion.div>
  )
}

/** Right: the clock, then the identity panel built around the ID card. */
function Identity() {
  const clock24 = usePrefs((s) => s.clock24)
  const now = useNow()
  const pinned = projects.filter((p) => p.featured).slice(0, 4)
  const time = formatTime(now, clock24)
  const [digits, suffix] = time.split(/\s/)
  const [tall, setTall] = useState(() => window.innerHeight >= 860)
  useEffect(() => {
    const on = () => setTall(window.innerHeight >= 860)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ delay: 0.35, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="absolute right-7 top-[58px] w-[272px]"
    >
      <div className="flex items-end justify-between px-1">
        <div className="display flex items-baseline gap-1.5 text-[52px] font-light leading-none tracking-[-0.02em] text-ink tabular-nums [text-shadow:0_2px_30px_rgb(0_0_0/0.6)]">
          {digits}
          {suffix && <span className="text-[13px] font-medium tracking-[0.14em] text-ink/55">{suffix}</span>}
        </div>
        <div className="pb-1 text-right font-mono text-[10.5px] uppercase leading-[1.5] tracking-[0.16em] text-ink/60">
          {now.toLocaleDateString([], { weekday: 'long' })}
          <br />
          {now.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>

      <div className="glass mt-4 overflow-hidden rounded-[18px]">
        <div className="flex h-9 items-center justify-between border-b border-white/[0.07] px-3.5">
          <span className="label !text-ink/60">Identity</span>
          <span className="flex items-center gap-1.5 text-[11px] text-ink/75">
            <span className="relative flex size-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-term opacity-60" />
              <span className="relative size-1.5 rounded-full bg-term" />
            </span>
            Open to internships
          </span>
        </div>

        <div
          className="relative grid place-items-center"
          style={{
            padding: tall ? '22px 0 20px' : '16px 0 14px',
            background: 'radial-gradient(80% 60% at 50% 45%, color-mix(in oklab, var(--accent) 12%, transparent), transparent 70%)',
          }}
        >
          <HoloCard width={tall ? 210 : 164} />
        </div>

        <div className="grid grid-cols-2 border-t border-white/[0.07] text-[12px]">
          <button onClick={() => openApp('about')} className="h-9 border-r border-white/[0.07] text-ink/80 transition-colors hover:bg-white/[0.06] hover:text-ink">About me</button>
          <button onClick={() => openApp('resume')} className="h-9 text-ink/80 transition-colors hover:bg-white/[0.06] hover:text-ink">Resume</button>
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.07] px-3.5 py-2.5">
          <span className="label !text-ink/60">Pinned</span>
          <div className="flex gap-2">
            {pinned.map((p) => (
              <button
                key={p.slug}
                title={p.name}
                aria-label={`Open ${p.name}`}
                onClick={() => openProject(p.slug)}
                className="transition-transform duration-300 ease-out hover:-translate-y-0.5 active:scale-95"
              >
                <AppIcon icon={glyphFor(p.glyph)} color={p.accent} color2={p.accent2} variant="project" size={30} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/** Quiet edge detail: a build and location readout beside the dock. */
function Readout() {
  return (
    <div className="absolute bottom-[24px] left-8 hidden items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/35 xl:flex">
      <span>AARUSH.OS 2.0</span>
      <span className="size-[3px] rounded-full bg-ink/35" />
      <span>Vellore, IN</span>
      <span className="size-[3px] rounded-full bg-ink/35" />
      <span>12.97 N 79.16 E</span>
    </div>
  )
}

/** Phones get a home screen instead of a desktop: who this is, every app one tap away, pinned work below. */
function PhoneHome() {
  const now = useNow(30000)
  const h = now.getHours()
  const greeting = h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  const pinned = projects.filter((p) => p.featured).slice(0, 4)
  const ease = [0.16, 1, 0.3, 1] as const

  return (
    <div className="os-scroll absolute inset-x-0 bottom-0 top-[38px] px-5 pb-[116px] pt-6 [scrollbar-width:none]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.7, ease }}
        className="mx-auto flex max-w-[460px] items-center gap-5"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 font-mono text-[9.5px] uppercase tracking-[0.2em] text-ink/55">
            <span className="h-px w-5 bg-accent" />
            Portfolio
          </div>
          <h1 className="display mt-2.5 text-[29px] font-light leading-[1.04] tracking-[-0.01em] text-ink [text-shadow:0_2px_30px_rgb(0_0_0/0.7)]">
            {greeting}.
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-ink/70 [text-shadow:0_1px_12px_rgb(0_0_0/0.9)]">{profile.headline}</p>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-ink/75">
            <span className="size-1.5 rounded-full bg-term" />
            Open to internships
          </div>
        </div>
        <HoloCard width={112} className="shrink-0" />
      </motion.div>

      <div className="mx-auto mt-8 grid max-w-[460px] grid-cols-4 gap-y-4">
        {APPS.map((a, i) => (
          <motion.button
            key={a.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.04, duration: 0.5, ease }}
            onClick={() => openApp(a.id)}
            className="flex flex-col items-center gap-1.5 active:scale-95"
          >
            <AppIcon icon={a.icon} color={a.color} size={54} />
            <span className="text-[11px] font-medium text-ink/90 [text-shadow:0_1px_8px_rgb(0_0_0),0_0_2px_rgb(0_0_0)]">
              {a.name.replace('System ', '')}
            </span>
          </motion.button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6, ease }}
        className="glass mx-auto mt-8 max-w-[460px] overflow-hidden rounded-[16px]"
      >
        <div className="flex h-9 items-center justify-between border-b border-white/[0.07] px-3.5">
          <span className="label !text-ink/60">Pinned projects</span>
          <button onClick={() => openApp('projects')} className="text-[11px] text-accent">See all</button>
        </div>
        {pinned.map((p) => (
          <button
            key={p.slug}
            onClick={() => openProject(p.slug)}
            className="flex w-full items-center gap-3 border-b border-white/[0.06] px-3.5 py-2.5 text-left last:border-b-0 active:bg-white/[0.06]"
          >
            <AppIcon icon={glyphFor(p.glyph)} color={p.accent} color2={p.accent2} variant="project" size={36} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-ink">{p.name}</span>
              <span className="block truncate text-[11.5px] text-dim">{p.tagline}</span>
            </span>
            <ArrowRight size={14} className="shrink-0 text-faint" />
          </button>
        ))}
      </motion.div>
    </div>
  )
}

interface MenuPos { x: number; y: number }

function ContextMenu({ pos, onClose }: { pos: MenuPos; onClose: () => void }) {
  const prefs = usePrefs()
  const { tidy, closeAll } = useWM.getState()
  const setLauncher = useShell((s) => s.setLauncher)

  const nextWallpaper = () => {
    const ids = Object.keys(WALLPAPERS) as WallpaperId[]
    const next = ids[(ids.indexOf(prefs.wallpaper) + 1) % ids.length]
    prefs.set('wallpaper', next)
    notify('Wallpaper changed', WALLPAPERS[next].name)
  }

  const items: ({ label: string; hint?: string; run: () => void } | null)[] = [
    { label: 'Open Projects', run: () => openApp('projects') },
    { label: 'Search', hint: 'Ctrl K', run: () => setLauncher(true) },
    null,
    { label: 'Next wallpaper', run: nextWallpaper },
    { label: prefs.showWidgets ? 'Hide identity panel' : 'Show identity panel', run: () => prefs.set('showWidgets', !prefs.showWidgets) },
    { label: 'Tidy windows', hint: 'Alt T', run: tidy },
    { label: 'Close all windows', run: closeAll },
    null,
    { label: 'Settings', run: () => openApp('settings') },
  ]

  useEffect(() => {
    const away = () => onClose()
    window.addEventListener('pointerdown', away)
    window.addEventListener('blur', away)
    return () => {
      window.removeEventListener('pointerdown', away)
      window.removeEventListener('blur', away)
    }
  }, [onClose])

  const x = Math.min(pos.x, window.innerWidth - 232)
  const y = Math.min(pos.y, window.innerHeight - 300)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.13, ease: [0.16, 1, 0.3, 1] }}
      style={{ left: x, top: y }}
      className="glass absolute z-[6000] w-56 origin-top-left rounded-xl p-1.5"
      onPointerDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((it, i) =>
        it ? (
          <button key={it.label} onClick={() => { it.run(); onClose() }} className="menu-item">
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

/** Everything that lives directly on the wallpaper: icons, welcome, identity panel, right-click menu. */
export function DesktopSurface() {
  const showWidgets = usePrefs((s) => s.showWidgets)
  const [menu, setMenu] = useState<MenuPos | null>(null)
  const phone = usePhone()

  if (phone) return <PhoneHome />

  return (
    <>
      <div
        className="absolute inset-0"
        onContextMenu={(e) => {
          e.preventDefault()
          setMenu({ x: e.clientX, y: e.clientY })
        }}
      >
        <DesktopIcons />
        <Welcome />
        <Readout />
        <AnimatePresence>{showWidgets && <Identity key="w" />}</AnimatePresence>
      </div>
      <AnimatePresence>{menu && <ContextMenu key={`${menu.x}-${menu.y}`} pos={menu} onClose={() => setMenu(null)} />}</AnimatePresence>
    </>
  )
}
