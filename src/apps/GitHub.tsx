import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowUpRight, CircleAlert, GitCommitHorizontal, GitFork, RefreshCw, Search, Star } from 'lucide-react'
import { profile } from '../data/profile'
import { projects } from '../data/projects'
import { langColor, timeAgo, useGh, type GhCommit, type GhLanguages, type GhRepo, type GhUser } from '../lib/github'
import { openProject } from '../os/apps'
import { AppIcon, cn, GitHubMark, glyphFor } from '../os/icons'
import { LanguageBar } from './shared'

/* ------------------------------------------------------------------
   GITHUB: live data from the public API.
   A profile band across the top (numbers and the language mix of all
   repositories), then a repository index beside the selected repo.
------------------------------------------------------------------- */

const USER = profile.handle
const ease = [0.16, 1, 0.3, 1] as const

function Failure({ message, retry }: { message?: string; retry: () => void }) {
  return (
    <div className="grid h-full place-items-center p-8">
      <div className="max-w-xs text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-xl border border-line bg-danger/10 text-danger"><CircleAlert size={18} /></span>
        <div className="mt-3.5 text-[14px] text-ink">GitHub is not answering</div>
        <div className="mt-1 text-[12.5px] leading-relaxed text-dim">{message ?? 'Something went wrong.'}</div>
        <div className="mt-4 flex justify-center gap-2">
          <button className="btn" onClick={retry}><RefreshCw size={13} /> Try again</button>
          <a className="btn" href={profile.links.github} target="_blank" rel="noreferrer">Open profile <ArrowUpRight size={13} /></a>
        </div>
      </div>
    </div>
  )
}

const Heading = ({ children, aside }: { children: string; aside?: string }) => (
  <div className="flex items-baseline justify-between border-b border-white/[0.07] pb-2">
    <h3 className="label !text-ink/60">{children}</h3>
    {aside && <span className="font-mono text-[10px] text-faint">{aside}</span>}
  </div>
)

function RepoDetail({ repo, onBack }: { repo: GhRepo; onBack: () => void }) {
  const langs = useGh<GhLanguages>(`/repos/${repo.full_name}/languages`)
  const commits = useGh<GhCommit[]>(`/repos/${repo.full_name}/commits?per_page=6`)
  const linked = projects.find((p) => p.repo?.toLowerCase() === repo.full_name.toLowerCase())
  const facts: [string, string][] = [
    ['Stars', String(repo.stargazers_count)],
    ['Forks', String(repo.forks_count)],
    ['Language', repo.language ?? 'n/a'],
    ['Updated', timeAgo(repo.pushed_at)],
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease }}
      className="px-5 py-6 @2xl/win:px-8 @2xl/win:py-7"
    >
      <button onClick={onBack} className="mb-5 flex items-center gap-1.5 text-[12.5px] text-dim @2xl/win:hidden">
        <ArrowLeft size={14} /> Repositories
      </button>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        <div className="min-w-[60%] flex-1">
          <div className="font-mono text-[11px] tracking-[0.06em] text-faint">{repo.owner.login} /</div>
          <h2 className="selectable mt-1 truncate font-mono text-[21px] font-medium tracking-[-0.02em] text-ink @2xl/win:text-[26px]">{repo.name}</h2>
        </div>
        {repo.homepage && <a className="btn shrink-0" href={repo.homepage} target="_blank" rel="noreferrer">Website <ArrowUpRight size={13} /></a>}
        <a className="btn btn-accent shrink-0" href={repo.html_url} target="_blank" rel="noreferrer"><GitHubMark size={14} /> Open</a>
      </div>

      <p className={cn('selectable mt-3 max-w-[60ch] text-[14px] leading-relaxed', repo.description ? 'text-ink/80' : 'text-faint')}>
        {repo.description ?? 'No description on GitHub.'}
      </p>

      {/* facts as one ruled strip instead of four boxes */}
      <dl className="mt-6 grid grid-cols-2 border-y border-white/[0.07] @lg/win:grid-cols-4">
        {facts.map(([k, v], i) => (
          <div
            key={k}
            className={cn(
              'border-white/[0.07] py-3.5',
              i > 0 && '@lg/win:border-l @lg/win:pl-4',
              i % 2 === 1 && '@max-lg/win:border-l @max-lg/win:pl-4',
              i >= 2 && '@max-lg/win:border-t',
            )}
          >
            <dt className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint">{k}</dt>
            <dd className="mt-1.5 flex items-center gap-2 truncate text-[15px] font-medium text-ink">
              {k === 'Language' && repo.language && <span className="size-2 shrink-0 rounded-full" style={{ background: langColor(repo.language) }} />}
              {v}
            </dd>
          </div>
        ))}
      </dl>

      {linked && (
        <button
          onClick={() => openProject(linked.slug)}
          className="group mt-5 flex w-full items-center gap-3.5 rounded-xl border border-white/[0.08] p-2.5 text-left transition-colors hover:border-white/16"
          style={{ background: `linear-gradient(90deg, color-mix(in oklab, ${linked.accent} 14%, transparent), rgb(255 255 255 / 0.02) 60%)` }}
        >
          <AppIcon icon={glyphFor(linked.glyph)} color={linked.accent} color2={linked.accent2} variant="project" size={40} />
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-medium text-ink">{linked.name} has its own app</span>
            <span className="block truncate text-[12px] text-dim">Screenshots, the write-up and how it works.</span>
          </span>
          <ArrowUpRight size={16} className="mr-1.5 text-faint transition-colors group-hover:text-ink" />
        </button>
      )}

      <div className="mt-8">
        <Heading>Languages</Heading>
        <div className="mt-4">
          {langs.loading ? (
            <div className="space-y-2.5"><div className="skeleton h-1.5" /><div className="skeleton h-3 w-1/2" /></div>
          ) : langs.data && Object.keys(langs.data).length ? (
            <LanguageBar langs={langs.data} />
          ) : (
            <div className="text-[12.5px] text-faint">{langs.error?.message ?? 'No language data for this repository.'}</div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <Heading aside="latest 6">Commits</Heading>
        {commits.loading ? (
          <div className="mt-3 space-y-2">{Array.from({ length: 5 }, (_, i) => <div key={i} className="skeleton h-10" />)}</div>
        ) : commits.data?.length ? (
          <ol>
            {commits.data.map((c) => (
              <li key={c.sha} className="border-b border-white/[0.06]">
                <a href={c.html_url} target="_blank" rel="noreferrer" className="group flex items-center gap-4 py-2.5">
                  <span className="shrink-0 rounded-[5px] bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10.5px] text-accent">{c.sha.slice(0, 7)}</span>
                  <span className="selectable min-w-0 flex-1 truncate text-[13px] text-ink/85 transition-colors group-hover:text-ink">{c.commit.message.split('\n')[0]}</span>
                  <span className="shrink-0 font-mono text-[10.5px] text-faint">{timeAgo(c.commit.author.date)}</span>
                </a>
              </li>
            ))}
          </ol>
        ) : (
          <div className="mt-3 flex items-center gap-2 text-[12.5px] text-faint">
            <GitCommitHorizontal size={14} /> {commits.error?.message ?? 'No commits to show.'}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function GitHub() {
  const user = useGh<GhUser>(`/users/${USER}`)
  const allRepos = useGh<GhRepo[]>(`/users/${USER}/repos?per_page=100&sort=pushed`)
  // Only original work is listed: forks and the profile README repo are left out.
  const repos = useMemo(
    () => ({ ...allRepos, data: allRepos.data?.filter((r) => !r.fork && r.name !== USER) }),
    [allRepos],
  )
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<number | null>(null)

  const list = useMemo(() => {
    const term = q.toLowerCase().trim()
    return (repos.data ?? []).filter((r) => !term || `${r.name} ${r.description ?? ''} ${r.language ?? ''}`.toLowerCase().includes(term))
  }, [repos.data, q])

  useEffect(() => {
    if (list.length && !list.some((r) => r.id === selected)) setSelected(list[0].id)
  }, [list, selected])

  const current = list.find((r) => r.id === selected)
  // narrow windows and phones show one pane at a time: the index, then the repository
  const [detail, setDetail] = useState(false)

  const langMix = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of repos.data ?? []) if (r.language) m.set(r.language, (m.get(r.language) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [repos.data])
  const langTotal = langMix.reduce((n, [, c]) => n + c, 0)
  const stars = (repos.data ?? []).reduce((n, r) => n + r.stargazers_count, 0)

  if (repos.error && !repos.data) return <Failure message={repos.error.message} retry={repos.reload} />

  const numbers: [string, number | undefined][] = [
    ['Repositories', repos.data?.length],
    ['Stars', repos.data ? stars : undefined],
    ['Followers', user.data?.followers],
  ]

  return (
    <div className="flex h-full flex-col">
      {/* Profile band */}
      <header className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-3.5 border-b border-white/[0.07] bg-black/25 px-5 py-4 @2xl/win:px-6">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-full border border-white/12 bg-white/[0.04] text-ink"><GitHubMark size={22} /></span>
          <div className="min-w-0">
            <div className="truncate text-[15px] font-semibold tracking-tight text-ink">{user.data?.name ?? profile.name}</div>
            <a href={profile.links.github} target="_blank" rel="noreferrer" className="font-mono text-[11px] text-dim transition-colors hover:text-accent">github.com/{USER}</a>
          </div>
        </div>

        <div className="flex shrink-0 items-stretch">
          {numbers.map(([k, v], i) => (
            <div key={k} className={cn('pr-5', i > 0 && 'border-l border-white/[0.08] pl-5')}>
              <div className="display text-[24px] font-medium leading-none tabular-nums text-ink">{v ?? <span className="text-faint">..</span>}</div>
              <div className="mt-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint">{k}</div>
            </div>
          ))}
        </div>

        {/* language mix across every repository */}
        <div className="hidden min-w-0 flex-1 lg:block">
          {langTotal > 0 ? (
            <>
              <div className="flex h-1.5 gap-[2px] overflow-hidden rounded-full">
                {langMix.map(([name, n]) => (
                  <motion.span key={name} initial={{ flexGrow: 0 }} animate={{ flexGrow: n }} transition={{ duration: 0.8, ease }} style={{ background: langColor(name) }} title={`${name}: ${n}`} />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3.5 gap-y-0.5">
                {langMix.slice(0, 5).map(([name, n]) => (
                  <span key={name} className="flex items-center gap-1.5 text-[11px] text-dim">
                    <span className="size-1.5 rounded-full" style={{ background: langColor(name) }} />
                    {name} <span className="font-mono text-[10px] text-faint">{n}</span>
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="skeleton h-1.5" />
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Repository index */}
        <aside className={cn('w-full shrink-0 flex-col border-r border-white/[0.07] bg-black/15 @2xl/win:flex @2xl/win:w-[286px]', detail ? 'hidden' : 'flex')}>
          <div className="p-3">
            <label className="flex h-8 items-center gap-2 rounded-lg border border-white/[0.08] bg-black/30 px-2.5 transition-colors focus-within:border-accent/50">
              <Search size={12.5} className="text-faint" />
              <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search repositories" placeholder="Search repositories"
                className="w-full bg-transparent text-[12.5px] text-ink outline-none placeholder:text-faint" />
            </label>
          </div>

          <div className="os-scroll flex-1 px-2 pb-2">
            {repos.loading && !repos.data && Array.from({ length: 7 }, (_, i) => <div key={i} className="skeleton mb-1.5 h-[50px]" />)}
            {repos.data && list.length === 0 && <div className="px-3 py-10 text-center text-[12.5px] text-dim">No repositories match.</div>}
            {list.map((r) => {
              const on = r.id === selected
              return (
                <button
                  key={r.id}
                  onClick={() => { setSelected(r.id); setDetail(true) }}
                  className={cn('relative block w-full rounded-[10px] px-3 py-2.5 text-left transition-colors', !on && 'hover:bg-white/[0.04]')}
                >
                  {on && <motion.span layoutId="gh-sel" className="absolute inset-0 rounded-[10px] border border-white/10 bg-white/[0.055]" transition={{ type: 'spring', stiffness: 480, damping: 40 }} />}
                  <span className="relative flex items-center gap-2">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: r.language ? langColor(r.language) : 'rgb(255 255 255 / 0.2)' }} />
                    <span className={cn('min-w-0 flex-1 truncate font-mono text-[12.5px]', on ? 'text-ink' : 'text-ink/80')}>{r.name}</span>
                    {r.stargazers_count > 0 && <span className="flex items-center gap-1 font-mono text-[10px] text-faint"><Star size={10} /> {r.stargazers_count}</span>}
                    {r.forks_count > 0 && <span className="flex items-center gap-1 font-mono text-[10px] text-faint"><GitFork size={10} /> {r.forks_count}</span>}
                  </span>
                  <span className="relative mt-1 block pl-4 text-[11px] text-faint">{r.language ?? 'No language'} · {timeAgo(r.pushed_at)}</span>
                </button>
              )
            })}
            {repos.stale && <div className="px-3 py-2 text-[11px] text-faint">Showing a saved copy. GitHub could not be reached just now.</div>}
          </div>
        </aside>

        <section className={cn('os-scroll min-w-0 flex-1', !detail && 'hidden @2xl/win:block')}>
          {current ? (
            <AnimatePresence mode="wait" initial={false}><RepoDetail key={current.id} repo={current} onBack={() => setDetail(false)} /></AnimatePresence>
          ) : repos.loading ? (
            <div className="space-y-4 p-8">
              <div className="skeleton h-8 w-1/2" />
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-16" />
              <div className="skeleton h-40" />
            </div>
          ) : (
            <div className="grid h-full place-items-center text-[13px] text-dim">Select a repository.</div>
          )}
        </section>
      </div>
    </div>
  )
}
