import { useCallback, useEffect, useState } from 'react'

/* ------------------------------------------------------------------
   Public GitHub REST API, unauthenticated on purpose: no token ever
   ships to the browser. Responses are cached in localStorage so the
   60 requests/hour anonymous limit is rarely reached, and a stale copy
   is served if the network or the limit gets in the way.
------------------------------------------------------------------- */
const API = 'https://api.github.com'
const TTL = 60 * 60 * 1000
const PREFIX = 'aarush-os:gh:'

export interface GhRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  homepage: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  fork: boolean
  archived: boolean
  pushed_at: string
  created_at: string
  default_branch: string
  topics?: string[]
  license?: { spdx_id: string } | null
  owner: { login: string; avatar_url: string }
}

export interface GhUser {
  login: string
  name: string | null
  avatar_url: string
  bio: string | null
  public_repos: number
  followers: number
  following: number
  html_url: string
  created_at: string
}

export interface GhCommit {
  sha: string
  html_url: string
  commit: { message: string; author: { name: string; date: string } }
  author: { login: string; avatar_url: string } | null
}

export type GhLanguages = Record<string, number>

export class GhError extends Error {
  constructor(public kind: 'rate' | 'missing' | 'network', message: string) {
    super(message)
  }
}

interface Cached<T> { at: number; data: T }

const read = <T,>(path: string): Cached<T> | null => {
  try {
    const raw = localStorage.getItem(PREFIX + path)
    return raw ? (JSON.parse(raw) as Cached<T>) : null
  } catch {
    return null
  }
}

const inflight = new Map<string, Promise<unknown>>()

export async function gh<T>(path: string, force = false): Promise<{ data: T; stale: boolean }> {
  const cached = read<T>(path)
  if (cached && !force && Date.now() - cached.at < TTL) return { data: cached.data, stale: false }

  if (!inflight.has(path)) {
    inflight.set(
      path,
      (async () => {
        let res: Response
        try {
          res = await fetch(API + path, { headers: { Accept: 'application/vnd.github+json' } })
        } catch {
          throw new GhError('network', 'Could not reach GitHub.')
        }
        if (res.status === 403 || res.status === 429) throw new GhError('rate', 'GitHub rate limit reached. Try again in a while.')
        if (res.status === 404) throw new GhError('missing', 'Not found on GitHub.')
        if (!res.ok) throw new GhError('network', `GitHub answered ${res.status}.`)
        const data = (await res.json()) as T
        try {
          localStorage.setItem(PREFIX + path, JSON.stringify({ at: Date.now(), data }))
        } catch {
          /* storage full or blocked: carry on without the cache */
        }
        return data
      })().finally(() => inflight.delete(path)),
    )
  }

  try {
    return { data: (await inflight.get(path)) as T, stale: false }
  } catch (err) {
    if (cached) return { data: cached.data, stale: true }
    throw err
  }
}

export interface GhState<T> { data?: T; error?: GhError; loading: boolean; stale: boolean; reload: () => void }

export function useGh<T>(path: string | null | undefined): GhState<T> {
  const [state, setState] = useState<Omit<GhState<T>, 'reload'>>({ loading: !!path, stale: false })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!path) return setState({ loading: false, stale: false })
    let alive = true
    setState((s) => ({ ...s, loading: true, error: undefined }))
    gh<T>(path, tick > 0)
      .then((r) => alive && setState({ data: r.data, stale: r.stale, loading: false }))
      .catch((error: GhError) => alive && setState({ error, loading: false, stale: false }))
    return () => {
      alive = false
    }
  }, [path, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { ...state, reload }
}

/** Colours for the language bar. Anything unlisted falls back to grey. */
export const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3ea6ff', JavaScript: '#f5d547', Python: '#5dffa8', Java: '#ff8a4c', 'C++': '#ff5fd2', C: '#9aa4b8',
  Dart: '#3ee6ff', HTML: '#ff6b5e', CSS: '#a98bff', Svelte: '#ff5c3a', Shell: '#b9f24a', Dockerfile: '#5b9dff',
  'Jupyter Notebook': '#ffb657', Kotlin: '#c58bff', Swift: '#ff7a59', CMake: '#7fd4a0',
}
export const langColor = (name: string) => LANG_COLORS[name] ?? '#7a8296'

export function timeAgo(iso: string) {
  const s = Math.max(1, (Date.now() - new Date(iso).getTime()) / 1000)
  const units: [number, string][] = [[31536000, 'year'], [2592000, 'month'], [86400, 'day'], [3600, 'hour'], [60, 'minute']]
  for (const [n, label] of units) {
    if (s >= n) {
      const v = Math.floor(s / n)
      return `${v} ${label}${v > 1 ? 's' : ''} ago`
    }
  }
  return 'just now'
}
