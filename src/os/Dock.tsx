import { useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimationControls, useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react'
import { APPS, openApp, resolveApp, type ResolvedApp } from './apps'
import { AppIcon } from './icons'
import { useFocusedId, usePrefs, useWM } from './store'

const BASE = 46
const FAR = 99999

interface ItemProps {
  app: ResolvedApp
  mouseX: MotionValue<number>
  running: boolean
  active: boolean
  onClick: () => void
}

function DockItem({ app, mouseX, running, active, onClick }: ItemProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const [hover, setHover] = useState(false)
  const bounce = useAnimationControls()
  const dist = useTransform(mouseX, (v) => {
    const r = ref.current?.getBoundingClientRect()
    return r ? v - (r.left + r.width / 2) : FAR
  })
  const size = useSpring(useTransform(dist, [-140, 0, 140], [BASE, 68, BASE]), { stiffness: 420, damping: 30, mass: 0.4 })
  const scale = useTransform(size, (s) => s / BASE)

  return (
    <motion.button
      ref={ref}
      layout="position"
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.4 }}
      style={{ width: size, height: size }}
      className="relative shrink-0"
      aria-label={app.title}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onClick={() => {
        if (!running) bounce.start({ y: [0, -14, 0], transition: { duration: 0.45, ease: [0.3, 0, 0.3, 1] } })
        onClick()
      }}
    >
      <motion.div animate={bounce} className="absolute left-0 top-0">
        <motion.div style={{ scale, transformOrigin: 'top left', width: BASE, height: BASE }} whileTap={{ filter: 'brightness(0.75)' }}>
          <AppIcon icon={app.icon} color={app.color} color2={app.color2} variant={app.variant} size={BASE} />
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {hover && (
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.14 }}
            className="glass pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2.5 py-1 text-[11.5px] text-ink"
          >
            {app.title}
          </motion.span>
        )}
      </AnimatePresence>

      <span
        className="absolute -bottom-[7px] left-1/2 h-[3px] -translate-x-1/2 rounded-full transition-all duration-300"
        style={{
          width: running ? (active ? 14 : 4) : 0,
          opacity: running ? 1 : 0,
          background: active ? 'var(--accent)' : 'rgb(255 255 255 / 0.55)',
        }}
      />
    </motion.button>
  )
}

export function Dock() {
  const windows = useWM((s) => s.windows)
  const focusedId = useFocusedId()
  const magnify = usePrefs((s) => s.dockMagnify)
  const mouseX = useMotionValue(FAR)
  const { focus, minimize } = useWM.getState()

  const toggle = (id: string, launch: () => void) => {
    const w = windows.find((x) => x.id === id)
    if (!w) return launch()
    if (w.id === focusedId) minimize(id)
    else focus(id)
  }

  const projectWins = windows.filter((w) => w.appId === 'project')

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-[4000] flex justify-center">
      <motion.div
        initial={{ y: 90, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26, delay: 0.15 }}
        onPointerMove={(e) => magnify && mouseX.set(e.clientX)}
        onPointerLeave={() => mouseX.set(FAR)}
        className="glass pointer-events-auto flex h-[66px] items-end gap-2.5 rounded-[22px] px-2.5 pb-2.5"
      >
        {APPS.map((a) => (
          <DockItem
            key={a.id}
            app={resolveApp({ appId: a.id })!}
            mouseX={mouseX}
            running={windows.some((w) => w.id === a.id)}
            active={focusedId === a.id}
            onClick={() => toggle(a.id, () => openApp(a.id))}
          />
        ))}
        <AnimatePresence initial={false}>
          {projectWins.length > 0 && (
            <motion.div
              key="sep"
              layout="position"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mx-0.5 mb-1.5 h-9 w-px shrink-0 self-end bg-line-strong"
            />
          )}
          {projectWins.map((w) => {
            const app = resolveApp(w)
            if (!app) return null
            return (
              <DockItem
                key={w.id}
                app={app}
                mouseX={mouseX}
                running
                active={focusedId === w.id}
                onClick={() => toggle(w.id, () => {})}
              />
            )
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
