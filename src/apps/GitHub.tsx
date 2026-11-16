import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, CircleAlert, GitCommitHorizontal, GitFork, RefreshCw, Search, Star } from 'lucide-react'
import { profile } from '../data/profile'
import { projects } from '../data/projects'
import { langColor, timeAgo, useGh, type GhCommit, type GhLanguages, type GhRepo, type GhUser } from '../lib/github'
import { openProject } from '../os/apps'
import { cn, GitHubMark } from '../os/icons'
import { LanguageBar, SectionTitle } from './shared'

const USER = profile.handle
type Kind = 'all' | 'source' | 'fork'

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

function RepoDetail({ repo }: { repo: GhRepo }) {
  const langs = useGh<GhLanguages>(`/repos/${repo.full_name}/languages`)
  const commits = useGh<GhCommit[]>(`/repos/${repo.full_name}/commits?per_page=6`)
  const linked = projects.find((p) => p.repo?.toLowerCase() === repo.full_name.toLowerCase())

  return (
    <motion.div
      key={repo.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="p-6"
    >
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[11.5px] text-faint">{repo.owner.login} /</div>
          <h2 className="selectable mt-0.5 truncate text-[22px] font-semibold tracking-tight text-ink">{repo.name}</h2>
        </div>
        <a className="btn shrink-0" href={repo.html_url} target="_blank" rel="noreferrer"><GitHubMark size={14} /> Open</a>
      </div>

      <p className={cn('selectable mt-3 max-w-[62ch] text-[13.5px] leading-relaxed', repo.description ? 'text-ink/85' : 'text-faint')}>
        {repo.description ?? 'No description on GitHub.'}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {repo.fork && <span className="chip"><GitFork size={11} /> Fork</span>}
        {repo.archived && <span className="chip">Archived</span>}
        <span className="chip"><Star size={11} /> {repo.stargazers_count}</span>
        <span className="chip"><GitFork size={11} /> {repo.forks_count}</span>
        <span className="chip">Updated {timeAgo(repo.pushed_at)}</span>
        {repo.license?.spdx_id && repo.license.spdx_id !== 'NOASSERTION' && <span className="chip">{repo.license.spdx_id}</span>}
        {repo.homepage && (
          <a className="chip !text-accent hover:!border-accent/50" href={repo.homepage} target="_blank" rel="noreferrer">
            Website <ArrowUpRight size={11} />
          </a>
        )}
      </div>

      {linked && (
        <button
          onClick={() => openProject(linked.slug)}
          className="mt-5 flex w-full items-center justify-between rounded-xl border border-accent/30 bg-accent/[0.07] px-4 py-3 text-left transition-colors hover:bg-accent/[0.12]"
        >
          <span>
            <span className="block text-[13px] font-medium text-ink">This repository has its own app</span>
            <span className="block text-[12px] text-dim">Open {linked.name} for screenshots and details.</span>
          </span>
          <ArrowUpRight size={16} className="text-accent" />
        </button>
      )}

      <div className="mt-7">
        <SectionTitle>Languages</SectionTitle>
        {langs.loading ? (
          <div className="space-y-2.5"><div className="skeleton h-1.5" /><div className="skeleton h-3 w-1/2" /></div>
        ) : langs.data && Object.keys(langs.data).length ? (
          <LanguageBar langs={langs.data} />
        ) : (
          <div className="text-[12.5px] text-faint">{langs.error?.message ?? 'No language data for this repository.'}</div>
        )}
      </div>

      <div className="mt-7">
        <SectionTitle>Latest commits</SectionTitle>
        {commits.loading ? (
          <div className="space-y-2">{Array.from({ length: 5 }, (_, i) => <div key={i} className="skeleton h-11" />)}</div>
        ) : commits.data?.length ? (
          <ol className="relative ml-2 border-l border-line">
            {commits.data.map((c) => (
              <li key={c.sha} className="relative pb-3.5 pl-5 last:pb-0">
                <span className="absolute -left-[5px] top-1.5 size-[9px] rounded-full border border-accent bg-[#0b0d14]" />
                <a href={c.html_url} target="_blank" rel="noreferrer" className="group block">
                  <span className="selectable block truncate text-[13px] text-ink/90 transition-colors group-hover:text-accent">
                    {c.commit.message.split('\n')[0]}
                  </span>
                  <span className="mt-0.5 flex items-center gap-2 text-[11.5px] text-faint">
                    <span className="font-mono">{c.sha.slice(0, 7)}</span>
                    <span>{c.author?.login ?? c.commit.author.name}</span>
                    <span>{timeAgo(c.commit.author.date)}</span>
                  </span>
                </a>
              </li>
            ))}
          </ol>
        ) : (
          <div className="flex items-center gap-2 text-[12.5px] text-faint">
            <GitCommitHorizontal size={14} /> {commits.error?.message ?? 'No commits to show.'}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function GitHub() {
  const user = useGh<GhUser>(`/users/${USER}`)
  const repos = useGh<GhRepo[]>(`/users/${USER}/repos?per_page=100&sort=pushed`)
  const [kind, setKind] = useState<Kind>('all')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<number | null>(null)

  const list = useMemo(() => {
    const term = q.toLowerCase().trim()
    return (repos.data ?? []).filter(
      (r) =>
        (kind === 'all' || (kind === 'fork') === r.fork) &&
        (!term || `${r.name} ${r.description ?? ''} ${r.language ?? ''}`.toLowerCase().includes(term)),
    )
  }, [repos.data, kind, q])

  useEffect(() => {
    if (list.length && !list.some((r) => r.id === selected)) setSelected(list[0].id)
  }, [list, selected])

  const current = list.find((r) => r.id === selected)

  const langSummary = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of repos.data ?? []) if (r.language && !r.fork) m.set(r.language, (m.get(r.language) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [repos.data])

  if (repos.error && !repos.data) return <Failure message={repos.error.message} retry={repos.reload} />

  return (
    <div className="flex h-full">
      <aside className="flex w-[330px] shrink-0 flex-col border-r border-line bg-black/20">
        {/* Profile */}
        <div className="border-b border-line p-4">
          <div className="flex items-center gap-3.5">
            {user.data ? (
              <img src={user.data.avatar_url} alt="" className="size-12 rounded-xl border border-line object-cover" draggable={false} />
            ) : (
              <div className="skeleton size-12 !rounded-xl" />
            )}
            <div className="min-w-0">
              <div className="truncate text-[14.5px] font-semibold text-ink">{user.data?.name ?? profile.name}</div>
              <a href={profile.links.github} target="_blank" rel="noreferrer" className="font-mono text-[11.5px] text-accent hover:underline">@{USER}</a>
            </div>
          </div>
          <div className="mt-3.5 grid grid-cols-3 gap-2">
            {[
              ['Repos', user.data?.public_repos],
              ['Followers', user.data?.followers],
              ['Following', user.data?.following],
            ].map(([k, v]) => (
              <div key={k as string} className="rounded-lg border border-line bg-black/20 px-2.5 py-2">
                <div className="display text-[17px] font-medium tabular-nums text-ink">{v ?? <span className="text-faint">..</span>}</div>
                <div className="text-[10.5px] text-faint">{k}</div>
              </div>
            ))}
          </div>
          {langSummary.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
              {langSummary.map(([name, n]) => (
                <span key={name} className="flex items-center gap-1.5 text-[11.5px] text-dim">
                  <span className="size-2 rounded-full" style={{ background: langColor(name) }} />
                  {name} <span className="font-mono text-[10.5px] text-faint">{n}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 border-b border-line p-3">
          <label className="flex h-8 flex-1 items-center gap-2 rounded-lg border border-line bg-black/25 px-2.5 focus-within:border-accent/50">
            <Search size={13} className="text-faint" />
            <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search repositories" placeholder="Search repositories"
              className="w-full bg-transparent text-[12.5px] text-ink outline-none placeholder:text-faint" />
          </label>
          <div className="flex rounded-lg border border-line p-0.5">
            {(['all', 'source', 'fork'] as Kind[]).map((k) => (
              <button key={k} onClick={() => setKind(k)}
                className={cn('h-6 rounded-md px-2 text-[11.5px] capitalize transition-colors', kind === k ? 'bg-white/10 text-ink' : 'text-faint hover:text-ink')}>
                {k === 'fork' ? 'Forks' : k === 'source' ? 'Own' : 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Repo list */}
        <div className="os-scroll flex-1 p-2">
          {repos.loading && !repos.data && Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton mb-1.5 h-[52px]" />)}
          {repos.data && list.length === 0 && (
            <div className="px-3 py-10 text-center text-[12.5px] text-dim">No repositories match that filter.</div>
          )}
          {list.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r.id)}
              className={cn('relative block w-full rounded-lg px-3 py-2.5 text-left transition-colors', r.id === selected ? 'bg-white/8' : 'hover:bg-white/5')}
            >
              {r.id === selected && <motion.span layoutId="gh-sel" className="absolute inset-y-2.5 left-0 w-[2px] rounded-full bg-accent" />}
              <span className="flex items-center gap-2">
                <span className="truncate text-[13px] font-medium text-ink">{r.name}</span>
                {r.fork && <GitFork size={11} className="shrink-0 text-faint" />}
              </span>
              <span className="mt-1 flex items-center gap-2.5 text-[11.5px] text-faint">
                {r.language && (
                  <span className="flex items-center gap-1.5 text-dim">
                    <span className="size-2 rounded-full" style={{ background: langColor(r.language) }} />
                    {r.language}
                  </span>
                )}
                <span>{timeAgo(r.pushed_at)}</span>
              </span>
            </button>
          ))}
          {repos.stale && <div className="px-3 py-2 text-[11px] text-faint">Showing a saved copy. GitHub could not be reached just now.</div>}
        </div>
      </aside>

      <section className="os-scroll min-w-0 flex-1">
        {current ? (
          <AnimatePresence mode="wait" initial={false}><RepoDetail key={current.id} repo={current} /></AnimatePresence>
        ) : repos.loading ? (
          <div className="space-y-4 p-6">
            <div className="skeleton h-8 w-1/2" />
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-28" />
            <div className="skeleton h-40" />
          </div>
        ) : (
          <div className="grid h-full place-items-center text-[13px] text-dim">Select a repository.</div>
        )}
      </section>
    </div>
  )
}
