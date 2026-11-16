import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { APPS, openApp, openProject } from './apps'
import { AppIcon, cn, glyphFor } from './icons'
import { HoloCard } from './HoloCard'
import { projects } from '../data/projects'
import { notify, usePrefs, useShell, useWM, WALLPAPERS, type WallpaperId } from './store'
import { formatTime, useNow } from './TopBar'

const DESKTOP_APPS = ['projects', 'github', 'about', 'experience', 'resume', 'contact']

function DesktopIcons() {
  const [selected, setSelected] = useState<string | null>(null)
  const hinted = useRef(false)

  return (
    <div
      className="absolute bottom-[104px] left-5 top-[58px] grid w-max grid-flow-col grid-rows-[repeat(auto-fill,92px)] gap-x-2"
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
            className={cn(
              'group flex h-[88px] w-[88px] flex-col items-center gap-1.5 rounded-xl border pt-2 transition-colors',
              on ? 'border-accent/35 bg-accent/10' : 'border-transparent hover:bg-white/5',
            )}
          >
            <span className="transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-active:scale-95">
              <AppIcon icon={a.icon} color={a.color} size={50} />
            </span>
            <span className="text-[12px] font-medium text-ink/90 [text-shadow:0_1px_6px_rgb(0_0_0/0.9)]">{a.name}</span>
          </motion.button>
        )
      })}
    </div>
  )
}

function Widgets() {
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
      className="absolute right-8 top-[70px] w-[300px] text-right"
    >
      <div className="display flex items-baseline justify-end gap-2 text-[76px] font-light leading-none tracking-tight text-ink tabular-nums [text-shadow:0_2px_30px_rgb(0_0_0/0.6)]">
        {digits}
        {suffix && <span className="text-[18px] font-medium tracking-[0.12em] text-dim">{suffix}</span>}
      </div>
      <div className="mt-2 font-mono text-[12px] uppercase tracking-[0.2em] text-dim">
        {now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>

      <HoloCard width={tall ? 250 : 200} className="ml-auto mr-2 mt-7 text-left" />

      <div className="mt-7 flex justify-end gap-3">
        {pinned.map((p) => (
          <button
            key={p.slug}
            title={p.name}
            aria-label={`Open ${p.name}`}
            onClick={() => openProject(p.slug)}
            className="transition-transform duration-300 ease-out hover:-translate-y-1 active:scale-95"
          >
            <AppIcon icon={glyphFor(p.glyph)} color={p.accent} color2={p.accent2} variant="project" size={44} />
          </button>
        ))}
      </div>
      <button
        onClick={() => openApp('projects')}
        className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-faint transition-colors hover:text-accent"
      >
        Open the project library
      </button>
    </motion.div>
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
    { label: prefs.showWidgets ? 'Hide desktop widget' : 'Show desktop widget', run: () => prefs.set('showWidgets', !prefs.showWidgets) },
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
          <button
            key={it.label}
            onClick={() => { it.run(); onClose() }}
            className="flex h-8 w-full items-center justify-between rounded-md px-2.5 text-left text-[13px] text-ink/90 hover:bg-accent/15"
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

/** Everything that lives directly on the wallpaper: icons, widget, right-click menu. */
export function DesktopSurface() {
  const showWidgets = usePrefs((s) => s.showWidgets)
  const [menu, setMenu] = useState<MenuPos | null>(null)

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
        <AnimatePresence>{showWidgets && <Widgets key="w" />}</AnimatePresence>
      </div>
      <AnimatePresence>{menu && <ContextMenu key={`${menu.x}-${menu.y}`} pos={menu} onClose={() => setMenu(null)} />}</AnimatePresence>
    </>
  )
}
