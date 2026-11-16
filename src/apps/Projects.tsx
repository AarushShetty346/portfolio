import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Play, Search } from 'lucide-react'
import { appLabel, categories, projects, type Project } from '../data/projects'
import { openProject } from '../os/apps'
import { AppIcon, cn, GitHubMark, glyphFor } from '../os/icons'
import { Motif, Shot } from './shared'

/* ------------------------------------------------------------------
   PROJECTS: a software library, not a grid.
   Left: the shelf, every project as an installed app.
   Right: the stage, one project at a time in its own colours, with a
   live preview, and a way to step to the next one.
------------------------------------------------------------------- */

const accentVars = (p: Project) => ({ '--accent': p.accent, '--accent-2': p.accent2 }) as CSSProperties
const ease = [0.16, 1, 0.3, 1] as const
const pad = (n: number) => String(n).padStart(2, '0')

function Stage({ p, index, total, dir, go }: { p: Project; index: number; total: number; dir: number; go: (d: number) => void }) {
  const [shot, setShot] = useState(0)
  const shots = p.shots.length ? p.shots : p.hero ? [{ src: p.hero }] : []
  const current = shots[Math.min(shot, shots.length - 1)]
  const rise = (i: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.08 + i * 0.05, duration: 0.55, ease },
  })

  return (
    <motion.div
      style={accentVars(p)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="@container absolute inset-0 overflow-hidden"
    >
      {/* backdrop: the project's generative art, lit in its own colours */}
      <Motif kind={p.motif} seed={p.slug} className="absolute inset-0 opacity-50" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(70% 80% at 88% 30%, color-mix(in oklab, var(--accent) 20%, transparent), transparent 70%), linear-gradient(90deg, #090b12 0%, rgb(9 11 18 / 0.92) 34%, rgb(9 11 18 / 0.35) 70%, rgb(9 11 18 / 0.6) 100%), linear-gradient(0deg, #090b12 2%, transparent 40%)',
        }}
      />

      {/* the giant index numeral, half hidden behind everything */}
      <div
        aria-hidden
        className="display pointer-events-none absolute -top-4 right-4 select-none text-[130px] font-semibold leading-none tracking-[-0.04em] @2xl:-top-8 @2xl:right-6 @2xl:text-[220px]"
        style={{ color: 'transparent', WebkitTextStroke: '1px color-mix(in oklab, var(--accent) 30%, transparent)' }}
      >
        {pad(index + 1)}
      </div>

      {/* preview: the real interface, set at an angle like a product shot */}
      {current && (
        <motion.div
          initial={{ opacity: 0, x: 60 * (dir || 1) }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.75, ease }}
          className="absolute right-[-9%] top-[11%] hidden w-[66%] @3xl:block"
          style={{ perspective: 1600, transformStyle: 'preserve-3d' }}
        >
          <div
            className="overflow-hidden rounded-[10px] border border-white/15 bg-[#0b0d14]"
            style={{
              transform: 'rotateY(-16deg) rotateX(5deg) rotateZ(1deg)',
              transformOrigin: '0% 50%',
              boxShadow: '0 40px 90px -20px rgb(0 0 0 / 0.9), 0 0 80px -30px color-mix(in oklab, var(--accent) 70%, transparent)',
            }}
          >
            <div className="flex h-6 items-center gap-1.5 border-b border-white/10 bg-white/[0.04] px-2.5">
              <span className="size-1.5 rounded-full bg-white/25" />
              <span className="size-1.5 rounded-full bg-white/25" />
              <span className="size-1.5 rounded-full bg-white/25" />
              <span className="ml-2 truncate font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">{current.caption ?? appLabel(p)}</span>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={current.src} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <Shot src={current.src} alt={`${p.name}: ${current.caption ?? 'screenshot'}`} className="aspect-[16/10] w-full" />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* copy */}
      <div className="absolute inset-y-0 left-0 flex w-full max-w-[470px] flex-col overflow-y-auto p-5 pb-[76px] [scrollbar-width:none] @2xl:p-8 @2xl:pb-[76px]">
        <motion.div {...rise(0)} className="mt-auto flex items-center gap-3">
          <AppIcon icon={glyphFor(p.glyph)} color={p.accent} color2={p.accent2} variant="project" size={54} />
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-accent">{appLabel(p)}</div>
            <div className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">
              {pad(index + 1)} / {pad(total)} · {p.category}
            </div>
          </div>
        </motion.div>

        <motion.h2 {...rise(1)} className="display mt-5 text-[26px] font-semibold leading-[1.06] tracking-[-0.01em] text-ink @2xl:text-[36px]">
          {p.name}
        </motion.h2>
        <motion.p {...rise(2)} className="selectable mt-3.5 max-w-[38ch] text-[15px] leading-relaxed text-ink/75">
          {p.tagline}
        </motion.p>

        <motion.div {...rise(3)} className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-dim">
          {[p.context, p.year].filter(Boolean).map((v, i) => (
            <span key={v} className="flex items-center gap-3">
              {i > 0 && <span className="size-[3px] rounded-full bg-white/25" />}
              {v}
            </span>
          ))}
        </motion.div>

        <motion.div {...rise(4)} className="mt-4 flex flex-wrap gap-1.5">
          {p.stack.slice(0, 6).map((s) => <span key={s} className="chip">{s}</span>)}
          {p.stack.length > 6 && <span className="chip">+{p.stack.length - 6}</span>}
        </motion.div>

        <motion.div {...rise(5)} className="mt-6 flex items-center gap-2">
          <button className="btn btn-accent !h-10 !px-5" onClick={() => openProject(p.slug)}>
            <Play size={13} fill="currentColor" /> Launch app
          </button>
          {p.demo && (
            <a className="btn !h-10" href={p.demo} target="_blank" rel="noreferrer">Live demo <ArrowUpRight size={14} /></a>
          )}
          {p.repo && (
            <a className="btn !h-10 !px-3" href={`https://github.com/${p.repo}`} target="_blank" rel="noreferrer" aria-label="Repository on GitHub" title="Repository">
              <GitHubMark size={15} />
            </a>
          )}
        </motion.div>
      </div>

      {/* bottom rail: screenshots on the left, step to the neighbours on the right */}
      <div className="absolute inset-x-0 bottom-0 flex h-[60px] items-center gap-3 border-t border-white/[0.07] bg-[#090b12]/70 px-4 backdrop-blur-md @2xl:px-8">
        {shots.length > 1 && (
          <div className="hidden items-center gap-1.5 @3xl:flex">
            {shots.slice(0, 5).map((s, i) => (
              <button
                key={s.src}
                onClick={() => setShot(i)}
                aria-label={s.caption ?? `Screenshot ${i + 1}`}
                title={s.caption}
                className={cn('h-9 w-14 overflow-hidden rounded-[5px] border transition-all', i === shot ? 'border-accent opacity-100' : 'border-white/10 opacity-55 hover:opacity-100')}
              >
                <Shot src={s.src} alt="" className="size-full" fallback={<span />} />
              </button>
            ))}
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => go(-1)} aria-label="Previous project" className="win-key !h-8 !w-9"><ArrowLeft size={14} /></button>
          <button onClick={() => go(1)} className="group flex h-8 items-center gap-2.5 rounded-[7px] border border-white/[0.07] bg-white/[0.025] pl-3 pr-2.5 text-[12px] text-dim transition-colors hover:border-white/16 hover:bg-white/10 hover:text-ink">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">Next</span>
            <span className="max-w-32 truncate text-ink/90">{projects[(projects.indexOf(p) + 1) % projects.length].name}</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function Projects() {
  const [filter, setFilter] = useState('All')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState(projects[0].slug)
  const [dir, setDir] = useState(1)
  const list = useRef<HTMLDivElement>(null)

  const shown = useMemo(() => {
    const terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean)
    return projects.filter(
      (p) =>
        (filter === 'All' || p.category === filter) &&
        terms.every((t) => `${p.name} ${p.tagline} ${p.stack.join(' ')} ${p.context ?? ''}`.toLowerCase().includes(t)),
    )
  }, [filter, q])

  const current = projects.find((p) => p.slug === selected) ?? projects[0]
  const index = projects.indexOf(current)

  const select = (slug: string) => {
    setDir(projects.findIndex((p) => p.slug === slug) >= index ? 1 : -1)
    setSelected(slug)
  }
  const go = (d: number) => {
    const pool = shown.length ? shown : projects
    const i = pool.indexOf(current)
    const next = pool[(i + d + pool.length) % pool.length] ?? pool[0]
    setDir(d)
    setSelected(next.slug)
  }

  // keep the selected row in view when stepping with the keyboard or the Next button
  useEffect(() => {
    list.current?.querySelector(`[data-slug="${selected}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  return (
    <div
      className="flex h-full flex-col outline-none @2xl/win:flex-row"
      tabIndex={-1}
      onKeyDown={(e) => {
        if ((e.target as HTMLElement).tagName === 'INPUT') return
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); go(1) }
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
        else if (e.key === 'Enter') openProject(current.slug)
      }}
    >
      {/* Shelf */}
      <aside className="hidden w-[248px] shrink-0 flex-col border-r border-white/[0.07] bg-black/25 @2xl/win:flex">
        <div className="px-4 pb-3 pt-4">
          <div className="flex items-baseline justify-between">
            <h1 className="text-[15px] font-semibold tracking-tight text-ink">Library</h1>
            <span className="font-mono text-[10.5px] text-faint">{pad(shown.length)} / {pad(projects.length)}</span>
          </div>
          <label className="mt-3 flex h-8 items-center gap-2 rounded-lg border border-white/[0.08] bg-black/30 px-2.5 transition-colors focus-within:border-accent/50">
            <Search size={12.5} className="text-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Filter projects"
              placeholder="Name or technology"
              className="w-full bg-transparent text-[12.5px] text-ink outline-none placeholder:text-faint"
            />
          </label>
          <div className="mt-2.5 flex flex-wrap gap-1">
            {['All', ...categories].map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={cn(
                  'h-[22px] rounded-full px-2.5 text-[11px] transition-colors',
                  filter === c ? 'bg-ink text-[#06070b]' : 'bg-white/[0.05] text-dim hover:bg-white/10 hover:text-ink',
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div ref={list} className="os-scroll flex-1 px-2 pb-2">
          {shown.length === 0 && (
            <div className="px-3 py-10 text-center">
              <div className="text-[13px] text-ink">Nothing matches</div>
              <button className="mt-2 text-[12px] text-accent hover:underline" onClick={() => { setQ(''); setFilter('All') }}>Show everything</button>
            </div>
          )}
          {shown.map((p, i) => {
            const on = p.slug === current.slug
            return (
              <motion.button
                key={p.slug}
                data-slug={p.slug}
                style={accentVars(p)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.025, duration: 0.4, ease }}
                onClick={() => select(p.slug)}
                onDoubleClick={() => openProject(p.slug)}
                className={cn('group relative flex h-[54px] w-full items-center gap-3 rounded-[10px] px-2.5 text-left transition-colors', !on && 'hover:bg-white/[0.045]')}
              >
                {on && (
                  <motion.span
                    layoutId="shelf-on"
                    className="absolute inset-0 rounded-[10px] border border-white/10"
                    style={{ background: 'linear-gradient(90deg, color-mix(in oklab, var(--accent) 16%, transparent), rgb(255 255 255 / 0.04))' }}
                    transition={{ type: 'spring', stiffness: 480, damping: 40 }}
                  />
                )}
                <span className={cn('relative transition-transform duration-300', on ? 'scale-100' : 'scale-[0.92] group-hover:scale-100')}>
                  <AppIcon icon={glyphFor(p.glyph)} color={p.accent} color2={p.accent2} variant="project" size={34} />
                </span>
                <span className="relative min-w-0 flex-1">
                  <span className={cn('block truncate text-[13px] font-medium transition-colors', on ? 'text-ink' : 'text-ink/80')}>{p.name}</span>
                  <span className="block truncate font-mono text-[9.5px] uppercase tracking-[0.1em] text-faint">{p.category}</span>
                </span>
                <span className={cn('relative font-mono text-[10px] tabular-nums transition-colors', on ? 'text-accent' : 'text-faint')}>{pad(projects.indexOf(p) + 1)}</span>
              </motion.button>
            )
          })}
        </div>

        <div className="border-t border-white/[0.07] px-4 py-2.5 font-mono text-[9.5px] uppercase leading-relaxed tracking-[0.12em] text-faint">
          Arrow keys to browse. Enter to launch.
        </div>
      </aside>

      {/* Narrow windows and phones: the shelf becomes a strip of icons */}
      <div className="os-scroll flex shrink-0 gap-1 border-b border-white/[0.07] bg-black/25 px-3 py-2 [scrollbar-width:none] @2xl/win:hidden">
        {projects.map((p) => (
          <button
            key={p.slug}
            aria-label={p.name}
            onClick={() => select(p.slug)}
            className={cn('shrink-0 rounded-[13px] border p-1.5 transition-colors', p.slug === current.slug ? 'border-white/12 bg-white/[0.08]' : 'border-transparent')}
          >
            <AppIcon icon={glyphFor(p.glyph)} color={p.accent} color2={p.accent2} variant="project" size={36} />
          </button>
        ))}
      </div>

      {/* Stage */}
      <section className="relative min-h-0 min-w-0 flex-1 bg-[#090b12]">
        <AnimatePresence initial={false}>
          <Stage key={current.slug} p={current} index={index} total={projects.length} dir={dir} go={go} />
        </AnimatePresence>
      </section>
    </div>
  )
}
