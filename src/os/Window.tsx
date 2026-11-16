import { Suspense, useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from 'react'
import { motion } from 'motion/react'
import { Copy, Minus, Square, X } from 'lucide-react'
import { resolveApp } from './apps'
import { AppIcon, cn } from './icons'
import { DOCK_SPACE, TOPBAR_H, useFocusedId, useWM, type Win } from './store'

const MIN_W = 420
const MIN_H = 300
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)

type Dir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
const HANDLES: { dir: Dir; cls: string }[] = [
  { dir: 'n', cls: 'top-[-4px] left-3 right-3 h-2 cursor-ns-resize' },
  { dir: 's', cls: 'bottom-[-4px] left-3 right-3 h-2 cursor-ns-resize' },
  { dir: 'e', cls: 'right-[-4px] top-3 bottom-3 w-2 cursor-ew-resize' },
  { dir: 'w', cls: 'left-[-4px] top-3 bottom-3 w-2 cursor-ew-resize' },
  { dir: 'nw', cls: 'top-[-5px] left-[-5px] size-4 cursor-nwse-resize' },
  { dir: 'ne', cls: 'top-[-5px] right-[-5px] size-4 cursor-nesw-resize' },
  { dir: 'sw', cls: 'bottom-[-5px] left-[-5px] size-4 cursor-nesw-resize' },
  { dir: 'se', cls: 'bottom-[-5px] right-[-5px] size-4 cursor-nwse-resize' },
]

function useViewport() {
  const [v, setV] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const on = () => setV({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return v
}

/** Loading state shown while an application bundle is fetched. */
function AppLoading({ title }: { title: string }) {
  return (
    <div className="flex h-full flex-col gap-4 p-7">
      <div className="label">Starting {title}</div>
      <div className="skeleton h-8 w-2/5" />
      <div className="skeleton h-4 w-3/5" />
      <div className="mt-3 grid flex-1 grid-cols-3 gap-4">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    </div>
  )
}

export function WindowFrame({ win }: { win: Win }) {
  const app = resolveApp(win)
  const focused = useFocusedId() === win.id
  const { focus, close, minimize, toggleMaximize, setBounds } = useWM.getState()
  const el = useRef<HTMLDivElement>(null)
  const sizeEl = useRef<HTMLSpanElement>(null)
  const vp = useViewport()
  const [snap, setSnap] = useState(false)

  useEffect(() => {
    if (!win.snapTick) return
    setSnap(true)
    const t = window.setTimeout(() => setSnap(false), 380)
    return () => window.clearTimeout(t)
  }, [win.snapTick])

  // Keep windows reachable when the browser is resized.
  useEffect(() => {
    if (win.maximized) return
    const x = clamp(win.x, 120 - win.w, vp.w - 120)
    const y = clamp(win.y, TOPBAR_H, vp.h - 80)
    if (x !== win.x || y !== win.y) setBounds(win.id, { x, y })
  }, [vp.w, vp.h]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!app) return null

  const b = win.maximized
    ? { x: 0, y: TOPBAR_H, w: vp.w, h: vp.h - TOPBAR_H - DOCK_SPACE + 6 }
    : { x: win.x, y: win.y, w: win.w, h: win.h }

  const track = (move: (ev: PointerEvent) => void, done: () => void, cursor: string) => {
    document.body.classList.add('os-dragging')
    document.body.style.cursor = cursor
    const up = () => {
      window.removeEventListener('pointermove', move)
      document.body.classList.remove('os-dragging')
      document.body.style.cursor = ''
      done()
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up, { once: true })
  }

  const startDrag = (e: RPointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('[data-nodrag]')) return
    if (win.maximized) return
    const node = el.current!
    const sx = e.clientX, sy = e.clientY
    let nx = win.x, ny = win.y
    track(
      (ev) => {
        nx = clamp(win.x + ev.clientX - sx, 120 - win.w, window.innerWidth - 120)
        ny = clamp(win.y + ev.clientY - sy, TOPBAR_H, window.innerHeight - 80)
        node.style.transform = `translate3d(${nx}px, ${ny}px, 0)`
      },
      () => setBounds(win.id, { x: nx, y: ny }),
      'grabbing',
    )
  }

  const startResize = (dir: Dir) => (e: RPointerEvent) => {
    if (e.button !== 0 || win.maximized) return
    e.stopPropagation()
    const node = el.current!
    const sx = e.clientX, sy = e.clientY
    const o = { x: win.x, y: win.y, w: win.w, h: win.h }
    let n = { ...o }
    track(
      (ev) => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy
        n = { ...o }
        if (dir.includes('e')) n.w = Math.max(MIN_W, o.w + dx)
        if (dir.includes('s')) n.h = Math.max(MIN_H, o.h + dy)
        if (dir.includes('w')) { n.w = Math.max(MIN_W, o.w - dx); n.x = o.x + (o.w - n.w) }
        if (dir.includes('n')) {
          n.h = Math.max(MIN_H, o.h - dy); n.y = o.y + (o.h - n.h)
          if (n.y < TOPBAR_H) { n.h -= TOPBAR_H - n.y; n.y = TOPBAR_H }
        }
        node.style.transform = `translate3d(${n.x}px, ${n.y}px, 0)`
        node.style.width = `${n.w}px`
        node.style.height = `${n.h}px`
        if (sizeEl.current) sizeEl.current.textContent = `${Math.round(n.w)} x ${Math.round(n.h)}`
      },
      () => setBounds(win.id, n),
      getComputedStyle(e.currentTarget as HTMLElement).cursor,
    )
  }

  const App = app.component
  const style = {
    transform: `translate3d(${b.x}px, ${b.y}px, 0)`,
    width: b.w,
    height: b.h,
    zIndex: win.z,
    ...(app.accent ? { '--accent': app.accent, '--accent-2': app.color2 ?? app.accent } : {}),
  } as CSSProperties

  return (
    <div
      ref={el}
      className={cn('absolute left-0 top-0', snap && 'win-snap')}
      style={style}
      onPointerDownCapture={() => focus(win.id)}
      aria-hidden={win.minimized}
    >
      <motion.div
        className="relative size-full"
        style={{ transformOrigin: '50% 100%', pointerEvents: win.minimized ? 'none' : 'auto' }}
        initial={{ opacity: 0, scale: 0.95, y: 22 }}
        animate={win.minimized ? { opacity: 0, scale: 0.5, y: 240 } : { opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.965, y: 8, transition: { duration: 0.17, ease: [0.4, 0, 1, 1] } }}
        transition={{ type: 'spring', stiffness: 340, damping: 30, mass: 0.85 }}
      >
        <section
          role="dialog"
          aria-label={app.title}
          className="win"
          data-focused={focused}
          data-max={win.maximized}
          style={{ '--app': app.color } as CSSProperties}
        >
          <header
            className="win-bar flex h-11 shrink-0 items-center gap-3 pl-3.5 pr-2.5"
            onPointerDown={startDrag}
            onDoubleClick={(e) => {
              if (!(e.target as HTMLElement).closest('[data-nodrag]')) toggleMaximize(win.id)
            }}
          >
            <AppIcon icon={app.icon} color={app.color} color2={app.color2} variant={app.variant} size={22} />
            <div className="flex min-w-0 items-baseline gap-2.5">
              <span className={cn('truncate text-[13px] font-semibold tracking-[-0.005em] transition-colors', focused ? 'text-ink' : 'text-dim')}>
                {app.title}
              </span>
              <span className="hidden truncate font-mono text-[10.5px] uppercase tracking-[0.12em] text-faint sm:inline">
                {app.subtitle}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-1.5" data-nodrag>
              <button type="button" className="win-key" aria-label="Minimize" title="Minimize" onClick={() => minimize(win.id)}>
                <Minus size={13} />
              </button>
              <button type="button" className="win-key" aria-label={win.maximized ? 'Restore' : 'Maximize'} title={win.maximized ? 'Restore' : 'Maximize'} onClick={() => toggleMaximize(win.id)}>
                {win.maximized ? <Copy size={11} /> : <Square size={10} />}
              </button>
              <button type="button" className="win-key" data-danger aria-label="Close" title="Close" onClick={() => close(win.id)}>
                <X size={13} />
              </button>
            </div>
          </header>

          <div className={cn('relative min-h-0 flex-1 transition-opacity duration-300', !focused && 'opacity-[0.82]')}>
            <Suspense fallback={<AppLoading title={app.title} />}>
              <App win={win} />
            </Suspense>
          </div>

          <footer className="win-foot flex h-[22px] shrink-0 items-center justify-between px-3.5">
            <span className="flex items-center gap-2">
              <span className="size-1.5 rounded-full" style={{ background: focused ? 'var(--app)' : 'rgb(255 255 255 / 0.2)' }} />
              aarush.os / {app.title.toLowerCase()}
            </span>
            <span ref={sizeEl} className="tabular-nums">{Math.round(b.w)} x {Math.round(b.h)}</span>
          </footer>
        </section>

        {!win.maximized &&
          HANDLES.map((h) => (
            <div key={h.dir} className={cn('absolute', h.cls)} onPointerDown={startResize(h.dir)} />
          ))}
      </motion.div>
    </div>
  )
}
