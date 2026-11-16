import { useMemo, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, LayoutGrid, List, Play, Radio, Search, Sparkles, Trophy, type LucideIcon } from 'lucide-react'
import { appLabel, categories, projects, type Project } from '../data/projects'
import { openProject } from '../os/apps'
import { AppIcon, cn, GitHubMark, glyphFor } from '../os/icons'
import { Motif } from './shared'

type Filter = { key: string; label: string; icon?: LucideIcon; test: (p: Project) => boolean }

const isEvent = (p: Project) => /hackathon|buildathon/i.test(p.context ?? '')

const COLLECTIONS: Filter[] = [
  { key: 'featured', label: 'Featured', icon: Sparkles, test: (p) => !!p.featured },
  { key: 'events', label: 'Hackathons', icon: Trophy, test: isEvent },
  { key: 'live', label: 'Live demos', icon: Radio, test: (p) => !!p.demo },
]

const accentVars = (p: Project) => ({ '--accent': p.accent, '--accent-2': p.accent2 }) as CSSProperties

function Inspector({ p }: { p: Project }) {
  return (
    <motion.div
      key={p.slug}
      style={accentVars(p)}
      initial={{ opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 flex flex-col"
    >
      <Motif kind={p.motif} seed={p.slug} className="h-[150px] shrink-0 border-b border-line" />
      <div className="os-scroll -mt-9 flex-1 px-5 pb-5">
        <AppIcon icon={glyphFor(p.glyph)} color={p.accent} color2={p.accent2} variant="project" size={68} className="relative ring-4 ring-[#0b0d14]" />
        <h2 className="mt-4 text-[20px] font-semibold tracking-tight text-ink">{p.name}</h2>
        <div className="mt-0.5 font-mono text-[11px] tracking-[0.12em] text-accent">{appLabel(p)}</div>
        <p className="mt-3 text-[13px] leading-relaxed text-dim">{p.tagline}</p>

        <div className="mt-5 flex gap-2">
          <button className="btn btn-accent flex-1 justify-center" onClick={() => openProject(p.slug)}>
            <Play size={14} fill="currentColor" /> Launch
          </button>
          {p.repo && (
            <a className="btn !px-2.5" href={`https://github.com/${p.repo}`} target="_blank" rel="noreferrer" aria-label="Repository on GitHub" title="Repository">
              <GitHubMark size={15} />
            </a>
          )}
          {p.demo && (
            <a className="btn !px-2.5" href={p.demo} target="_blank" rel="noreferrer" aria-label="Live demo" title="Live demo">
              <ArrowUpRight size={15} />
            </a>
          )}
        </div>

        <dl className="mt-6 space-y-2.5 text-[12.5px]">
          {[
            ['Category', p.category],
            ['Context', p.context],
            ['Year', p.year],
          ].map(([k, v]) =>
            v ? (
              <div key={k} className="flex gap-4">
                <dt className="w-16 shrink-0 text-faint">{k}</dt>
                <dd className="text-ink/85">{v}</dd>
              </div>
            ) : null,
          )}
        </dl>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {p.stack.map((s) => (
            <span key={s} className="chip">{s}</span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default function Projects() {
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [selected, setSelected] = useState(projects[0].slug)

  const filters = useMemo<Filter[]>(
    () => [
      { key: 'all', label: 'All apps', test: () => true },
      ...categories.map((c) => ({ key: c, label: c, test: (p: Project) => p.category === c })),
    ],
    [],
  )
  const active = [...filters, ...COLLECTIONS].find((f) => f.key === filter)!

  const shown = useMemo(() => {
    const terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean)
    return projects.filter(
      (p) =>
        active.test(p) &&
        terms.every((t) => `${p.name} ${p.tagline} ${p.stack.join(' ')} ${p.context ?? ''}`.toLowerCase().includes(t)),
    )
  }, [active, q])

  const current = projects.find((p) => p.slug === selected) ?? projects[0]

  const NavButton = ({ f }: { f: Filter }) => {
    const count = projects.filter(f.test).length
    const on = filter === f.key
    return (
      <button
        onClick={() => setFilter(f.key)}
        className={cn(
          'relative flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] transition-colors',
          on ? 'text-ink' : 'text-dim hover:bg-white/5 hover:text-ink',
        )}
      >
        {on && <motion.span layoutId="projects-nav" className="absolute inset-0 rounded-lg bg-white/8" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
        {f.icon && <f.icon size={14} className={cn('relative', on && 'text-accent')} />}
        <span className="relative flex-1 truncate">{f.label}</span>
        <span className="relative font-mono text-[10.5px] text-faint">{count}</span>
      </button>
    )
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="flex w-[196px] shrink-0 flex-col border-r border-line bg-black/20 p-3">
        <div className="label px-2.5 pb-2 pt-1">Library</div>
        <div className="space-y-0.5">{filters.map((f) => <NavButton key={f.key} f={f} />)}</div>
        <div className="label px-2.5 pb-2 pt-5">Collections</div>
        <div className="space-y-0.5">{COLLECTIONS.map((f) => <NavButton key={f.key} f={f} />)}</div>
        <div className="mt-auto px-2.5 pb-1 text-[11.5px] leading-relaxed text-faint">
          {projects.length} apps installed. Double-click one to launch it.
        </div>
      </aside>

      {/* App grid */}
      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-[54px] shrink-0 items-center gap-3 border-b border-line px-5">
          <h1 className="text-[15px] font-semibold tracking-tight">{active.label}</h1>
          <span className="font-mono text-[11px] text-faint">{shown.length}</span>
          <label className="ml-auto flex h-8 w-[210px] items-center gap-2 rounded-lg border border-line bg-black/25 px-2.5 focus-within:border-accent/50">
            <Search size={13} className="text-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Filter apps"
              placeholder="Filter by name or tech"
              className="w-full bg-transparent text-[12.5px] text-ink outline-none placeholder:text-faint"
            />
          </label>
          <div className="flex rounded-lg border border-line p-0.5">
            {([['grid', LayoutGrid], ['list', List]] as const).map(([v, Icon]) => (
              <button
                key={v}
                aria-label={`${v} view`}
                onClick={() => setView(v)}
                className={cn('grid h-6 w-7 place-items-center rounded-md transition-colors', view === v ? 'bg-white/10 text-ink' : 'text-faint hover:text-ink')}
              >
                <Icon size={13} />
              </button>
            ))}
          </div>
        </div>

        <div className="os-scroll flex-1 p-4">
          {shown.length === 0 ? (
            <div className="grid h-full place-items-center">
              <div className="text-center">
                <Search size={22} className="mx-auto text-faint" />
                <div className="mt-3 text-[14px] text-ink">No apps match</div>
                <div className="mt-1 text-[12.5px] text-dim">Try another name, technology or collection.</div>
                <button className="btn mt-4" onClick={() => { setQ(''); setFilter('all') }}>Show all apps</button>
              </div>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-1.5">
              {shown.map((p, i) => {
                const on = p.slug === current.slug
                return (
                  <motion.button
                    key={p.slug}
                    style={accentVars(p)}
                    initial={{ opacity: 0, y: 12, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.03, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => setSelected(p.slug)}
                    onDoubleClick={() => openProject(p.slug)}
                    onKeyDown={(e) => e.key === 'Enter' && openProject(p.slug)}
                    className={cn(
                      'group flex flex-col items-center rounded-2xl border px-2 pb-3.5 pt-5 transition-colors duration-200',
                      on ? 'border-accent/40 bg-accent/10' : 'border-transparent hover:bg-white/5',
                    )}
                  >
                    <span className="transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-105 group-active:scale-95">
                      <AppIcon icon={glyphFor(p.glyph)} color={p.accent} color2={p.accent2} variant="project" size={72} />
                    </span>
                    <span className="mt-3.5 w-full truncate text-[13px] font-medium text-ink">{p.name}</span>
                    <span className="mt-0.5 w-full truncate font-mono text-[10px] tracking-[0.08em] text-faint">{appLabel(p)}</span>
                  </motion.button>
                )
              })}
            </div>
          ) : (
            <div className="space-y-1">
              {shown.map((p) => {
                const on = p.slug === current.slug
                return (
                  <button
                    key={p.slug}
                    style={accentVars(p)}
                    onClick={() => setSelected(p.slug)}
                    onDoubleClick={() => openProject(p.slug)}
                    className={cn(
                      'flex h-[58px] w-full items-center gap-3.5 rounded-xl border px-3 text-left transition-colors',
                      on ? 'border-accent/40 bg-accent/10' : 'border-transparent hover:bg-white/5',
                    )}
                  >
                    <AppIcon icon={glyphFor(p.glyph)} color={p.accent} color2={p.accent2} variant="project" size={38} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium text-ink">{p.name}</span>
                      <span className="block truncate text-[12px] text-dim">{p.tagline}</span>
                    </span>
                    <span className="chip hidden lg:inline-flex">{p.category}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Inspector */}
      <aside className="relative w-[290px] shrink-0 overflow-hidden border-l border-line bg-black/20">
        <AnimatePresence mode="popLayout" initial={false}>
          <Inspector p={current} />
        </AnimatePresence>
      </aside>
    </div>
  )
}
