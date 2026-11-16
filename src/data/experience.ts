/* ------------------------------------------------------------------
   EXPERIENCE - internships, hackathons, open source, achievements.
   Every number here comes from the repos or measured runs. Leaving
   `summary` or `points` empty renders a "coming soon" slot.
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
    summary:
      'Built a Flutter mobile app end to end as the sole developer. I had never used Flutter or Dart before, so I learned both during the internship with mentorship from the ACC team.',
    points: [
      'Built the app: company profiles, closing-price history and a 30-day price projection for US stocks.',
      'Integrated 3 Financial Modeling Prep REST endpoints (company profile, historical prices, news sentiment) and Google sign-in through Firebase Authentication.',
      'Designed the projection logic: it averages a ticker\'s news-sentiment scores, turns the average into a daily percentage change and compounds it over 30 days from the last close.',
      'Charted prices over 4 ranges: 1W, 1M, 1Y and MAX.',
    ],
    tags: ['Flutter', 'Dart', 'Firebase Authentication', 'REST APIs'],
    project: 'stock-predict',
  },
  {
    id: 'prism-genai',
    kind: 'Hackathon',
    title: 'ASTFLOW',
    org: 'Samsung PRISM GenAI Hackathon, Team ByteCoders',
    period: '2026',
    summary:
      'A code search engine that answers plain-English questions about a JavaScript codebase, running on CPU. I led evaluation and model selection, the speed work and the CI.',
    points: [
      'Raised code-search NDCG@10 from 0.063 (BM25 baseline) to 0.551 on the MTEB AppsRetrieval test set (3,765 queries, 8,765 documents) under a pre-registered protocol: tune on a dev split, run the test set once.',
      'Tested reranking, long-query windowing and hybrid BM25 fusion against pre-set accept/reject rules with paired-bootstrap confidence intervals. Only changes that beat the baseline on held-out data shipped.',
      'Cut full-corpus indexing time by 39% (6,474 s to 3,968 s) by raising the embedding model\'s CPU thread cap from 4 to 8, with identical top-10 results on all 3,765 queries.',
      'Built the GitHub Actions CI: pytest, lint, dependency audits, a Docker build, and Playwright end-to-end and accessibility tests.',
    ],
    tags: ['Code retrieval', 'Evaluation', 'CI'],
    project: 'astflow',
  },
  {
    id: 'prism-xr',
    kind: 'Hackathon',
    title: 'ACTIVA',
    org: 'Samsung PRISM XR Hackathon, Team LensLog',
    period: '2026',
    summary:
      'A pipeline that takes a first-person video and writes one JSON file: what kind of video it is, every action found in it, and the highlight segments worth keeping.',
    points: [
      'Labels the video zero-shot from CLIP features sampled at 2 frames per second.',
      'Detects actions as verb, noun and time segment using SlowFast features and ActionFormer.',
      'Picks highlights that cover many different actions while staying within 15% of the video\'s length.',
      'Every stage has a fallback, so a valid output file is always written.',
    ],
    tags: ['Egocentric video', 'Action recognition'],
    project: 'activa',
  },
  {
    id: 'bolna',
    kind: 'Hackathon',
    title: 'Shikshak',
    org: 'Bolna Buildathon, Symphony 2026',
    period: '2026',
    summary:
      'A voice maths tutor for classes 8 to 12 that talks, writes on a shared chalkboard and checks the student\'s own working. I wrote about two-thirds of the code and set up the live deployment.',
    points: [
      'Wrote the Express server and the WebSocket layer that turns the voice agent\'s tool calls into live chalkboard updates.',
      'Wrote an exact-arithmetic engine (BigInt fractions and sums of square roots) that checks every handwritten step after a vision model reads it, and marks the first wrong line.',
      'Measured an estimated 1.56 s median and 2.36 s p95 voice response time across 23 calls (201 turns) with a benchmark harness built on Bolna\'s per-component timings.',
      'Works in Hindi, English, Tamil and Telugu, in the browser on phones, tablets and computers.',
    ],
    tags: ['Voice AI', 'Realtime', 'Education'],
    project: 'shikshak',
    links: [{ label: 'Live demo', href: 'https://shikshak-o0l8.onrender.com' }],
  },
  {
    id: 'orchestrate',
    kind: 'Achievement',
    title: 'HackerRank Orchestrate',
    org: 'Rank 353 of 4,094, solo',
    period: 'October 2026',
    summary: 'Finished in the top 9% of 4,094 participants, working solo.',
    points: ['Built and deployed an AI agent for the challenge on my own.'],
    tags: ['AI agents'],
  },
  {
    id: 'checkstyle',
    kind: 'Open source',
    title: 'Contributor, Checkstyle',
    org: 'checkstyle/checkstyle',
    period: 'November 2026',
    summary:
      'Checkstyle is a widely used Java static analysis tool. I have 12 pull requests merged by the lead maintainer, all on the test suite.',
    points: [
      'Brought 33 oversized test inputs under the project\'s 120-line limit by trimming or splitting them, keeping every expected violation.',
      'Proved each change safe with mutation testing: zero surviving pitest mutants on every pull request.',
      'Migrated two XPath regression test classes to the inline-config test style.',
      'For the parser tests, checked that every syntax-tree node from the old inputs is still parsed after the split.',
    ],
    tags: ['Java', 'Testing', 'Mutation testing'],
    links: [
      { label: 'Merged pull requests', href: 'https://github.com/checkstyle/checkstyle/pulls?q=is%3Apr+author%3AAarushShetty346+is%3Amerged' },
    ],
  },
]
