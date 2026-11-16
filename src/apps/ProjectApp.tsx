import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, ChevronLeft, ChevronRight, CircleAlert, GitFork, Images, Play, RefreshCw, Star, X } from 'lucide-react'
import { appLabel, projectBySlug, type Project } from '../data/projects'
import { useGh, timeAgo, type GhLanguages, type GhRepo } from '../lib/github'
import type { AppProps } from '../os/apps'
import { AppIcon, cn, GitHubMark, glyphFor } from '../os/icons'
import { ContentSlot, LanguageBar, Motif, Prose, SectionTitle, Shot } from './shared'

const TABS = ['Overview', 'Technical', 'Architecture', 'Gallery'] as const
type Tab = (typeof TABS)[number]

/* Live numbers from the public GitHub API, with loading and failure states. */
function RepoPanel({ p }: { p: Project }) {
  const repo = useGh<GhRepo>(p.repo ? `/repos/${p.repo}` : null)
  const langs = useGh<GhLanguages>(p.repo ? `/repos/${p.repo}/languages` : null)

  if (!p.repo)
    return <div className="rounded-xl border border-dashed border-line-strong p-3.5 text-[12px] text-dim">Repository link to be added.</div>

  if (repo.loading)
    return (
      <div className="space-y-2.5">
        <div className="skeleton h-12" />
        <div className="skeleton h-2 w-full" />
        <div className="skeleton h-3 w-2/3" />
      </div>
    )

  if (repo.error || !repo.data)
    return (
      <div className="rounded-xl border border-line bg-black/20 p-3.5">
        <div className="flex items-center gap-2 text-[12.5px] text-ink"><CircleAlert size={14} className="text-danger" /> Live stats unavailable</div>
        <div className="mt-1 text-[12px] leading-relaxed text-dim">{repo.error?.message}</div>
        <button className="btn mt-3 !h-7 !text-[12px]" onClick={repo.reload}><RefreshCw size={12} /> Retry</button>
      </div>
    )

  const r = repo.data
  return (
    <div>
      <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-line bg-black/20">
        {[
          { icon: Star, v: r.stargazers_count, k: 'Stars' },
          { icon: GitFork, v: r.forks_count, k: 'Forks' },
          { icon: CircleAlert, v: r.open_issues_count, k: 'Issues' },
        ].map(({ icon: Icon, v, k }, i) => (
          <div key={k} className={cn('px-3 py-2.5', i > 0 && 'border-l border-line')}>
            <div className="display text-[19px] font-medium tabular-nums text-ink">{v}</div>
            <div className="mt-0.5 flex items-center gap-1 text-[10.5px] text-faint"><Icon size={10} /> {k}</div>
          </div>
        ))}
      </div>
      <div className="mt-2.5 text-[11.5px] text-dim">
        Last push {timeAgo(r.pushed_at)}
        {repo.stale && <span className="text-faint"> (cached)</span>}
      </div>
      {langs.data && Object.keys(langs.data).length > 0 && (
        <div className="mt-4"><LanguageBar langs={langs.data} max={5} /></div>
      )}
    </div>
  )
}

function Lightbox({ p, index, onClose, onNav }: { p: Project; index: number; onClose: () => void; onNav: (d: number) => void }) {
  const shot = p.shots[index]
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNav(1)
      if (e.key === 'ArrowLeft') onNav(-1)
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [onClose, onNav])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="absolute inset-0 z-20 flex flex-col bg-[#05060a]/92 backdrop-blur-md"
      onClick={onClose}
    >
      <div className="flex h-11 shrink-0 items-center justify-between px-4">
        <span className="font-mono text-[11.5px] text-dim">{shot.caption ?? p.name}</span>
        <button aria-label="Close" className="grid size-7 place-items-center rounded-md text-dim hover:bg-white/10 hover:text-ink" onClick={onClose}>
          <X size={15} />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-6 @lg/win:px-14">
        <motion.img
          key={shot.src}
          src={shot.src}
          alt={shot.caption ?? p.name}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="max-h-full max-w-full rounded-lg border border-line object-contain shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          draggable={false}
        />
        {p.shots.length > 1 && (
          <>
            <button aria-label="Previous" className="absolute left-3 grid size-9 place-items-center rounded-full border border-line bg-black/40 text-ink hover:bg-white/10"
              onClick={(e) => { e.stopPropagation(); onNav(-1) }}><ChevronLeft size={17} /></button>
            <button aria-label="Next" className="absolute right-3 grid size-9 place-items-center rounded-full border border-line bg-black/40 text-ink hover:bg-white/10"
              onClick={(e) => { e.stopPropagation(); onNav(1) }}><ChevronRight size={17} /></button>
          </>
        )}
      </div>
    </motion.div>
  )
}

export default function ProjectApp({ win }: AppProps) {
  const p = projectBySlug(win.payload)
  const [tab, setTab] = useState<Tab>('Overview')
  const [light, setLight] = useState<number | null>(null)

  if (!p)
    return (
      <div className="grid h-full place-items-center text-[13px] text-dim">This app is no longer installed.</div>
    )

  const path = (field: string) => `src/data/projects.ts > ${p.slug} > ${field}`
  const nav = (d: number) => setLight((i) => (i === null ? i : (i + d + p.shots.length) % p.shots.length))

  return (
    <div className="relative h-full">
     {/* side by side in a wide window; one scrolling column in a narrow one */}
     <div className="os-scroll flex h-full flex-col @2xl/win:flex-row @2xl/win:overflow-hidden">
      {/* Identity rail */}
      <aside className="flex shrink-0 flex-col border-b border-line bg-black/20 @2xl/win:w-[278px] @2xl/win:border-b-0 @2xl/win:border-r">
        <Motif kind={p.motif} seed={p.slug} className="h-[132px] shrink-0 border-b border-line" />
        <div className="os-scroll -mt-10 flex-1 px-5 pb-5">
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.08 }} className="w-fit">
            <AppIcon icon={glyphFor(p.glyph)} color={p.accent} color2={p.accent2} variant="project" size={76} className="relative ring-4 ring-[#0b0d14]" />
          </motion.div>
          <h1 className="display mt-4 text-[25px] font-semibold leading-tight text-ink">{p.name}</h1>
          <div className="mt-1 font-mono text-[11px] tracking-[0.12em] text-accent">{appLabel(p)}</div>
          <p className="mt-3 text-[13px] leading-relaxed text-dim">{p.tagline}</p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            <span className="chip">{p.category}</span>
            {p.year && <span className="chip">{p.year}</span>}
          </div>
          {p.context && <div className="mt-2.5 text-[12px] text-dim">{p.context}</div>}

          <div className="mt-5 space-y-2">
            {p.demo && (
              <a className="btn btn-accent w-full justify-center" href={p.demo} target="_blank" rel="noreferrer">
                Open live demo <ArrowUpRight size={14} />
              </a>
            )}
            {p.repo && (
              <a className="btn w-full justify-center" href={`https://github.com/${p.repo}`} target="_blank" rel="noreferrer">
                <GitHubMark size={14} /> View repository
              </a>
            )}
            {p.video && (
              <a className="btn w-full justify-center" href={p.video} target="_blank" rel="noreferrer">
                <Play size={13} /> Watch demo video
              </a>
            )}
          </div>

          <div className="mt-6">
            <SectionTitle>Repository</SectionTitle>
            <RepoPanel p={p} />
          </div>
        </div>
      </aside>

      {/* Content */}
      <section className="flex min-w-0 flex-col @2xl/win:flex-1">
        <nav className="os-scroll flex h-[46px] shrink-0 items-end gap-1 border-b border-line px-2 [scrollbar-width:none] @2xl/win:px-5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn('relative h-[38px] shrink-0 px-3 text-[13px] transition-colors', tab === t ? 'text-ink' : 'text-dim hover:text-ink')}
            >
              {t}
              {t === 'Gallery' && p.shots.length > 0 && <span className="ml-1.5 font-mono text-[10.5px] text-faint">{p.shots.length}</span>}
              {tab === t && <motion.span layoutId={`tab-${win.id}`} className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-accent" transition={{ type: 'spring', stiffness: 520, damping: 38 }} />}
            </button>
          ))}
        </nav>

        <div className="os-scroll @2xl/win:flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="p-5 @2xl/win:p-6"
            >
              {tab === 'Overview' && (
                <div className="space-y-7">
                  <button
                    className="group relative block aspect-[16/8.2] w-full overflow-hidden rounded-xl border border-line text-left"
                    onClick={() => p.shots.length && setLight(0)}
                    disabled={!p.shots.length}
                    aria-label={p.shots.length ? 'Open screenshots' : undefined}
                  >
                    {p.hero ? (
                      <Shot src={p.hero} alt={`${p.name} screenshot`} className="size-full transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                        fallback={<Motif kind={p.motif} seed={p.slug + 'hero'} className="absolute inset-0" />} />
                    ) : (
                      <Motif kind={p.motif} seed={p.slug + 'hero'} className="absolute inset-0" />
                    )}
                    <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
                  </button>

                  <div>
                    <SectionTitle>Overview</SectionTitle>
                    {p.overview ? <Prose text={p.overview} /> : <ContentSlot title="Overview coming soon" note="The story behind this project, in Aarush's own words." path={path('overview')} />}
                  </div>

                  <div>
                    <SectionTitle>Stack</SectionTitle>
                    <div className="flex flex-wrap gap-2">
                      {p.stack.map((s) => (
                        <span key={s} className="rounded-lg border border-line bg-accent/[0.07] px-3 py-1.5 text-[12.5px] text-ink/90">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'Technical' && (
                <div className="space-y-7">
                  <div>
                    <SectionTitle>Technical details</SectionTitle>
                    {p.technical ? <Prose text={p.technical} /> : <ContentSlot title="Technical write-up coming soon" note="How it works and the engineering decisions that mattered." path={path('technical')} />}
                  </div>
                  <div>
                    <SectionTitle>Built with</SectionTitle>
                    <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
                      {p.stack.map((s, i) => (
                        <div key={s} className="flex items-center gap-3 rounded-lg border border-line bg-black/20 px-3 py-2.5">
                          <span className="font-mono text-[10.5px] text-accent">{String(i + 1).padStart(2, '0')}</span>
                          <span className="truncate text-[13px] text-ink/90">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'Architecture' && (
                <div className="space-y-7">
                  <div>
                    <SectionTitle>Architecture</SectionTitle>
                    {p.architecture ? <Prose text={p.architecture} /> : <ContentSlot title="Architecture notes coming soon" note="System design, data flow and trade-offs." path={path('architecture')} />}
                  </div>
                  <div>
                    <SectionTitle>Diagram</SectionTitle>
                    <div className="relative aspect-[16/7] overflow-hidden rounded-xl border border-dashed border-line-strong">
                      <Motif kind={p.motif} seed={p.slug + 'arch'} className="absolute inset-0 opacity-35" />
                      <div className="absolute inset-0 grid place-items-center">
                        <div className="rounded-lg border border-line bg-[#0b0d14]/85 px-4 py-2.5 text-center backdrop-blur">
                          <div className="text-[13px] text-ink">Diagram slot</div>
                          <div className="mt-0.5 text-[11.5px] text-dim">An architecture diagram will sit here.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'Gallery' &&
                (p.shots.length ? (
                  <div className="grid grid-cols-1 gap-3 @lg/win:grid-cols-2">
                    {p.shots.map((s, i) => (
                      <button key={s.src} onClick={() => setLight(i)} className={cn('group text-left', i === 0 && p.shots.length % 2 === 1 && '@lg/win:col-span-2')}>
                        <Shot src={s.src} alt={s.caption ?? p.name}
                          className={cn('w-full rounded-xl border border-line transition-[border-color] duration-200 group-hover:border-accent/60', i === 0 && p.shots.length % 2 === 1 ? 'aspect-[16/7]' : 'aspect-[16/10]')} />
                        {s.caption && <div className="mt-2 text-[12px] text-dim transition-colors group-hover:text-ink">{s.caption}</div>}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid min-h-[360px] place-items-center rounded-xl border border-dashed border-line-strong">
                    <div className="text-center">
                      <span className="mx-auto grid size-11 place-items-center rounded-xl border border-line bg-accent/10 text-accent"><Images size={18} /></span>
                      <div className="mt-3.5 text-[14px] text-ink">No screenshots yet</div>
                      <div className="mt-1 text-[12.5px] text-dim">Captures of {p.name} will be added here.</div>
                      {import.meta.env.DEV && <div className="mt-3 inline-block rounded-md border border-line bg-black/30 px-2 py-1 font-mono text-[10.5px] text-term">edit: {path('shots')}</div>}
                    </div>
                  </div>
                ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
     </div>

      <AnimatePresence>
        {light !== null && <Lightbox p={p} index={light} onClose={() => setLight(null)} onNav={nav} />}
      </AnimatePresence>
    </div>
  )
}
