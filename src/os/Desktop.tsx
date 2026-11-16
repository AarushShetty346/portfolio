import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { APPS, openApp, openProject, resolveApp } from './apps'
import { DesktopSurface } from './DesktopSurface'
import { Dock } from './Dock'
import { Launcher } from './Launcher'
import { notify, useFocusedId, useNotices, useShell, useWM } from './store'
import { TopBar } from './TopBar'
import { Wallpaper } from './Wallpaper'
import { WindowFrame } from './Window'

function Notifications() {
  const items = useNotices((s) => s.items)
  const dismiss = useNotices((s) => s.dismiss)
  return (
    <div className="pointer-events-none absolute right-4 top-[50px] z-[8000] flex w-[320px] flex-col gap-2">
      <AnimatePresence initial={false}>
        {items.map((n) => {
          const Icon = n.tone === 'ok' ? CircleCheck : n.tone === 'warn' ? CircleAlert : Info
          return (
            <motion.div
              layout
              key={n.id}
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              className="glass pointer-events-auto relative flex gap-3 overflow-hidden rounded-xl p-3.5 pr-9"
            >
              <span className="absolute inset-y-0 left-0 w-[2px] bg-accent" />
              <Icon size={16} className={n.tone === 'warn' ? 'mt-0.5 text-danger' : n.tone === 'ok' ? 'mt-0.5 text-term' : 'mt-0.5 text-accent'} />
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-ink">{n.title}</div>
                {n.body && <div className="mt-0.5 text-[12px] leading-snug text-dim">{n.body}</div>}
              </div>
              <button
                aria-label="Dismiss"
                onClick={() => dismiss(n.id)}
                className="absolute right-2 top-2 grid size-6 place-items-center rounded-md text-faint hover:bg-white/10 hover:text-ink"
              >
                <X size={13} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

function useShortcuts() {
  useEffect(() => {
    let seq: string[] = []
    const onKey = (e: KeyboardEvent) => {
      const shell = useShell.getState()
      const wm = useWM.getState()
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement)?.tagName ?? '')

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        shell.setLauncher(!shell.launcher)
        return
      }
      if (e.key === '/' && !typing) {
        e.preventDefault()
        shell.setLauncher(true)
        return
      }
      if (e.key === 'Escape' && shell.launcher) return shell.setLauncher(false)

      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const top = [...wm.windows].filter((w) => !w.minimized).sort((a, b) => b.z - a.z)[0]
        const k = e.key.toLowerCase()
        if (k === 'w' && top) { e.preventDefault(); wm.close(top.id) }
        else if (k === 'm' && top) { e.preventDefault(); wm.minimize(top.id) }
        else if (k === 'enter' && top) { e.preventDefault(); wm.toggleMaximize(top.id) }
        else if (k === 't') { e.preventDefault(); wm.tidy() }
        else if (k === '`') { e.preventDefault(); wm.cycle() }
        else if (/^[1-9]$/.test(k) && APPS[Number(k) - 1]) { e.preventDefault(); openApp(APPS[Number(k) - 1].id) }
        return
      }

      // Easter egg
      seq = [...seq, e.key.length === 1 ? e.key.toLowerCase() : e.key].slice(-KONAMI.length)
      if (seq.join() === KONAMI.join()) {
        seq = []
        document.documentElement.classList.add('overdrive')
        notify('Overdrive engaged', 'Colour bus unlocked for ten seconds.', 'ok')
        window.setTimeout(() => document.documentElement.classList.remove('overdrive'), 10000)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

export function Desktop() {
  const windows = useWM((s) => s.windows)
  const launcher = useShell((s) => s.launcher)
  useShortcuts()

  // Shareable links: /#project=astflow or /#app=github open straight into that app.
  useEffect(() => {
    const follow = () => {
      const params = new URLSearchParams(location.hash.slice(1))
      const project = params.get('project')
      const app = params.get('app')
      if (project) openProject(project)
      else if (app) openApp(app)
    }
    follow()
    window.addEventListener('hashchange', follow)
    return () => window.removeEventListener('hashchange', follow)
  }, [])

  // The browser tab is named after the focused app.
  const focusedId = useFocusedId()
  useEffect(() => {
    const win = windows.find((w) => w.id === focusedId)
    const title = win && resolveApp(win)?.title
    document.title = title ? `${title} - AARUSH.OS` : 'AARUSH.OS'
  }, [focusedId, windows])

  useEffect(() => {
    if (sessionStorage.getItem('aarush-os:welcomed')) return
    sessionStorage.setItem('aarush-os:welcomed', '1')
    const t = window.setTimeout(() => notify('Welcome to AARUSH.OS', 'Open Projects from the dock, or press Ctrl K to search.'), 900)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden">
      <Wallpaper />
      <DesktopSurface />

      {/* Windows get their own stacking context so their z-order never fights the shell. */}
      <div className="pointer-events-none absolute inset-0 isolate z-10 [&>*]:pointer-events-auto">
        <AnimatePresence>
          {windows.map((w) => (
            <WindowFrame key={w.id} win={w} />
          ))}
        </AnimatePresence>
      </div>

      <Dock />
      <TopBar />
      <Notifications />
      <AnimatePresence>{launcher && <Launcher key="launcher" />}</AnimatePresence>
    </div>
  )
}
