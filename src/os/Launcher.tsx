import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { CornerDownLeft, Search } from 'lucide-react'
import { APPS, openApp, openProject } from './apps'
import { AppIcon, cn, glyphFor, type IconType } from './icons'
import { appLabel, projects } from '../data/projects'
import { useShell } from './store'

interface Entry { key: string; title: string; sub: string; icon: IconType; color: string; color2?: string; variant: 'system' | 'project'; run: () => void; hay: string }

/** Ctrl+K search over every application and project. */
export function Launcher() {
  const setLauncher = useShell((s) => s.setLauncher)
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const list = useRef<HTMLDivElement>(null)

  const entries = useMemo<Entry[]>(
    () => [
      ...APPS.map((a) => ({
        key: a.id, title: a.name, sub: a.blurb, icon: a.icon, color: a.color, variant: 'system' as const,
        run: () => openApp(a.id), hay: `${a.name} ${a.blurb}`.toLowerCase(),
      })),
      ...projects.map((p) => ({
        key: `p:${p.slug}`, title: appLabel(p), sub: p.tagline, icon: glyphFor(p.glyph), color: p.accent, color2: p.accent2,
        variant: 'project' as const, run: () => openProject(p.slug),
        hay: `${p.name} ${p.tagline} ${p.stack.join(' ')} ${p.category}`.toLowerCase(),
      })),
    ],
    [],
  )

  const results = useMemo(() => {
    const terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean)
    return terms.length ? entries.filter((e) => terms.every((t) => e.hay.includes(t))) : entries
  }, [q, entries])

  useEffect(() => setIdx(0), [q])
  useEffect(() => {
    list.current?.querySelector(`[data-i="${idx}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [idx])

  const close = () => setLauncher(false)
  const launch = (e?: Entry) => {
    if (!e) return
    e.run()
    close()
  }

  return (
    <motion.div
      className="absolute inset-0 z-[7000] flex justify-center bg-black/45 pt-[14vh] backdrop-blur-[3px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onPointerDown={(e) => e.target === e.currentTarget && close()}
    >
      <motion.div
        initial={{ opacity: 0, y: -14, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        className="glass flex h-fit max-h-[62vh] w-[600px] max-w-[92vw] flex-col overflow-hidden rounded-2xl"
      >
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4">
          <Search size={17} className="text-accent" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(i + 1, results.length - 1)) }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)) }
              else if (e.key === 'Enter') launch(results[idx])
              else if (e.key === 'Escape') close()
            }}
            aria-label="Search apps and projects"
            placeholder="Search apps and projects"
            className="h-full flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
          />
          <kbd className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-faint">Esc</kbd>
        </div>

        <div ref={list} className="os-scroll min-h-0 flex-1 p-1.5">
          {results.length === 0 && (
            <div className="px-4 py-10 text-center text-[13px] text-dim">
              Nothing matches "{q}". Try a project name or a technology.
            </div>
          )}
          {results.map((e, i) => (
            <button
              key={e.key}
              data-i={i}
              onPointerMove={() => setIdx(i)}
              onClick={() => launch(e)}
              className={cn(
                'flex h-[52px] w-full items-center gap-3 rounded-lg px-2.5 text-left transition-colors',
                i === idx && 'bg-white/8',
              )}
            >
              <AppIcon icon={e.icon} color={e.color} color2={e.color2} variant={e.variant} size={34} />
              <span className="min-w-0 flex-1">
                <span className={cn('block truncate text-[13.5px] text-ink', e.variant === 'project' && 'font-mono text-[12.5px] tracking-wide')}>
                  {e.title}
                </span>
                <span className="block truncate text-[12px] text-faint">{e.sub}</span>
              </span>
              {i === idx && <CornerDownLeft size={14} className="text-dim" />}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
