/* ------------------------------------------------------------------
   EXPERIENCE - internships, hackathons, open source, achievements.
   `summary` and `points` are yours to write. Empty values render a
   "write-up pending" slot instead of filler text.
------------------------------------------------------------------- */

export type ExperienceKind = 'Internship' | 'Hackathon' | 'Open source' | 'Achievement'

export interface ExperienceItem {
  id: string
  kind: ExperienceKind
  title: string
  org: string
  period: string
  /** One or two sentences. */
  summary: string
  /** Bullet points. */
  points: string[]
  tags: string[]
  /** Slug of a related project app, opens from the entry. */
  project?: string
  links?: { label: string; href: string }[]
}

export const experience: ExperienceItem[] = [
  {
    id: 'acc',
    kind: 'Internship',
    title: 'Software Development Intern',
    org: 'Applied Cloud Computing (ACC)',
    period: 'Summer 2025',
    summary: '',
    points: [],
    tags: ['Flutter', 'Dart', 'Firebase Authentication', 'REST APIs'],
    project: 'stock-predict',
  },
  {
    id: 'prism-genai',
    kind: 'Hackathon',
    title: 'ASTFLOW',
    org: 'Samsung PRISM GenAI Hackathon, Team ByteCoders',
    period: '2026',
    summary: '',
    points: [],
    tags: ['Code retrieval', 'Evaluation', 'CI'],
    project: 'astflow',
  },
  {
    id: 'prism-xr',
    kind: 'Hackathon',
    title: 'ACTIVA',
    org: 'Samsung PRISM XR Hackathon',
    period: '2026',
    summary: '',
    points: [],
    tags: ['Egocentric video', 'Action recognition'],
    project: 'activa',
  },
  {
    id: 'bolna',
    kind: 'Hackathon',
    title: 'Shikshak',
    org: 'Bolna Buildathon, Symphony 2026',
    period: '2026',
    summary: '',
    points: [],
    tags: ['Voice AI', 'Realtime', 'Education'],
    project: 'shikshak',
  },
  {
    id: 'orchestrate',
    kind: 'Achievement',
    title: 'HackerRank Orchestrate',
    org: 'Rank 353 of 4,094, solo',
    period: 'October 2026',
    summary: '',
    points: [],
    tags: ['AI agents'],
  },
  {
    id: 'checkstyle',
    kind: 'Open source',
    title: 'Contributor, Checkstyle',
    org: 'checkstyle/checkstyle',
    period: 'November 2026',
    summary: '',
    points: [],
    tags: ['Java', 'Testing', 'Mutation testing'],
    links: [
      { label: 'Merged pull requests', href: 'https://github.com/checkstyle/checkstyle/pulls?q=is%3Apr+author%3AAarushShetty346+is%3Amerged' },
    ],
  },
  {
    id: 'mteb',
    kind: 'Open source',
    title: 'Contributor, MTEB',
    org: 'embeddings-benchmark/mteb',
    period: 'November 2026',
    summary: '',
    points: [],
    tags: ['Python', 'Embeddings'],
    links: [{ label: 'Pull request #5850', href: 'https://github.com/embeddings-benchmark/mteb/pull/5850' }],
  },
]
