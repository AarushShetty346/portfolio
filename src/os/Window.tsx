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
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={win.minimized ? { opacity: 0, scale: 0.55, y: 220 } : { opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10, transition: { duration: 0.16, ease: 'easeIn' } }}
        transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.8 }}
      >
        <section
          role="dialog"
          aria-label={app.title}
          className={cn(
            'glass flex size-full flex-col overflow-hidden transition-[border-color,box-shadow] duration-200',
            win.maximized ? 'rounded-none' : 'rounded-win',
          )}
          style={
            focused
              ? {
                  borderColor: 'color-mix(in oklab, var(--accent) 62%, rgb(255 255 255 / 0.1))',
                  boxShadow:
                    'inset 0 1px 0 rgb(255 255 255 / 0.08), 0 30px 90px -14px rgb(0 0 0 / 0.85), 0 0 0 1px rgb(0 0 0 / 0.5), 0 0 34px -8px color-mix(in oklab, var(--accent) 65%, transparent), 0 0 90px -30px color-mix(in oklab, var(--accent-2) 70%, transparent)',
                }
              : undefined
          }
        >
          {/* accent hairline along the top edge of the focused window */}
          <div
            className="pointer-events-none absolute inset-x-10 top-0 h-px transition-opacity duration-300"
            style={{
              opacity: focused ? 0.9 : 0,
              background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
            }}
          />

          {!win.maximized && (
            <>
              <span className="hud-corner -left-px -top-px z-10 rounded-tl-[14px] border-l-2 border-t-2" style={{ opacity: focused ? 1 : 0 }} />
              <span className="hud-corner -right-px -top-px z-10 rounded-tr-[14px] border-r-2 border-t-2" style={{ opacity: focused ? 1 : 0 }} />
              <span className="hud-corner -bottom-px -left-px z-10 rounded-bl-[14px] border-b-2 border-l-2" style={{ opacity: focused ? 1 : 0 }} />
              <span className="hud-corner -bottom-px -right-px z-10 rounded-br-[14px] border-b-2 border-r-2" style={{ opacity: focused ? 1 : 0 }} />
            </>
          )}

          <header
            style={focused ? { background: 'linear-gradient(90deg, color-mix(in oklab, var(--accent) 14%, transparent), transparent 45%, color-mix(in oklab, var(--accent-2) 10%, transparent))' } : undefined}
            className="relative flex h-10 shrink-0 items-center gap-2.5 border-b border-line pl-3 pr-1.5"
            onPointerDown={startDrag}
            onDoubleClick={(e) => {
              if (!(e.target as HTMLElement).closest('[data-nodrag]')) toggleMaximize(win.id)
            }}
          >
            <AppIcon icon={app.icon} color={app.color} color2={app.color2} variant={app.variant} size={20} />
            <span
              className={cn(
                'truncate font-mono text-[11.5px] uppercase tracking-[0.14em] transition-colors',
                focused ? 'text-ink' : 'text-faint',
              )}
            >
              {app.title}
            </span>
            <div className="ml-auto flex items-center gap-0.5" data-nodrag>
              <WinButton label="Minimize" onClick={() => minimize(win.id)}><Minus size={14} /></WinButton>
              <WinButton label={win.maximized ? 'Restore' : 'Maximize'} onClick={() => toggleMaximize(win.id)}>
                {win.maximized ? <Copy size={12} /> : <Square size={11} />}
              </WinButton>
              <WinButton label="Close" danger onClick={() => close(win.id)}><X size={14} /></WinButton>
            </div>
          </header>

          <div className={cn('relative min-h-0 flex-1 transition-opacity duration-200', !focused && 'opacity-[0.86]')}>
            <Suspense fallback={<AppLoading title={app.title} />}>
              <App win={win} />
            </Suspense>
          </div>
        </section>

        {!win.maximized &&
          HANDLES.map((h) => (
            <div key={h.dir} className={cn('absolute', h.cls)} onPointerDown={startResize(h.dir)} />
          ))}
      </motion.div>
    </div>
  )
}

function WinButton({ children, label, danger, onClick }: { children: React.ReactNode; label: string; danger?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'grid h-7 w-8 place-items-center rounded-md text-dim transition-colors active:scale-95',
        danger ? 'hover:bg-danger/90 hover:text-white' : 'hover:bg-white/10 hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}
