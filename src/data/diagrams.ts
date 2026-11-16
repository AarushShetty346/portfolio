/* ------------------------------------------------------------------
   Architecture diagrams, one per project, keyed by project slug.
   A diagram is a row of lanes read left to right. Each lane holds one
   or more parts, and `link` names what travels to the next lane.
   Keep these in step with the architecture text in projects.ts.
------------------------------------------------------------------- */

export interface DiagramNode { label: string; note?: string }

export interface DiagramLane {
  title: string
  nodes: DiagramNode[]
  /** What connects this lane to the next one. */
  link?: string
  /** True when the connection runs in both directions. */
  both?: boolean
}

export interface Diagram { lanes: DiagramLane[]; foot?: string }

export const diagrams: Record<string, Diagram> = {
  astflow: {
    lanes: [
      { title: 'Interface', nodes: [{ label: 'React and TypeScript UI', note: 'Search, call graph, snapshot compare' }], link: 'REST API', both: true },
      {
        title: 'Backend',
        nodes: [
          { label: 'FastAPI service', note: 'Indexing, search, call graph, version comparison' },
          { label: 'Embedding model', note: 'gte-modernbert-base, cosine, on CPU' },
        ],
        link: 'reads and writes',
        both: true,
      },
      { title: 'Storage', nodes: [{ label: 'SQLite index', note: 'The indexed repository' }] },
    ],
    foot: 'Ships as a Docker build. GitHub Actions gates every change on pytest, lint, dependency audits and Playwright tests.',
  },

  relayroom: {
    lanes: [
      { title: 'People', nodes: [{ label: 'Web client', note: 'React on Vite' }], link: 'Socket.IO', both: true },
      {
        title: 'Server',
        nodes: [
          { label: 'Fastify server', note: 'Rooms, tasks, at-most-once dispatch' },
          { label: 'PostgreSQL', note: 'Through Drizzle' },
        ],
        link: 'tasks out, results back',
        both: true,
      },
      { title: 'Local machine', nodes: [{ label: 'Local adapter', note: 'Agent token, permission cap, one registered directory' }], link: 'runs' },
      { title: 'Agents', nodes: [{ label: 'Coding agents', note: 'Claude Code, Codex' }] },
    ],
    foot: 'The adapter connects outbound, so agents never leave the developer\'s machine.',
  },

  activa: {
    lanes: [
      { title: 'Input', nodes: [{ label: 'Egocentric video', note: 'One file, passed to run.sh' }], link: 'frames' },
      {
        title: 'Two branches',
        nodes: [
          { label: 'CLIP at 2 fps', note: 'Zero-shot label and importance per frame' },
          { label: 'SlowFast and ActionFormer at 30 fps', note: 'Verbs and nouns, paired and filtered' },
        ],
        link: 'segments',
      },
      { title: 'Selection', nodes: [{ label: 'Highlight selector', note: 'Greedy packing inside the time budget' }], link: 'writes' },
      { title: 'Output', nodes: [{ label: 'Result file', note: 'Actions and highlights' }] },
    ],
    foot: 'Runs fully offline. Every stage has a fallback, and model files are checked by SHA-256 at setup.',
  },

  lapbylap: {
    lanes: [
      { title: 'Browser', nodes: [{ label: 'React frontend', note: 'Charts, plus Three.js for 3D' }], link: '50 REST endpoints', both: true },
      { title: 'API', nodes: [{ label: 'Node.js and Express', note: 'Analytical queries, query plans for the UI' }], link: 'queries', both: true },
      { title: 'Database', nodes: [{ label: 'MongoDB', note: 'Aggregations, indexes, transactions, geospatial' }] },
    ],
    foot: 'Runs in Docker. The live demo is hosted on Render.',
  },

  futurefork: {
    lanes: [
      {
        title: 'In the browser',
        nodes: [
          { label: 'React app', note: 'Comparison, custom SVG charts' },
          { label: 'Simulator', note: 'A simplified model, for learning' },
        ],
        link: 'live quotes',
      },
      { title: 'Outside', nodes: [{ label: 'Finnhub API', note: 'Quotes for 10 US stocks' }] },
    ],
    foot: 'There is no backend. The API key sits in a local config file that is kept out of git.',
  },

  shikshak: {
    lanes: [
      { title: 'Student', nodes: [{ label: 'Chalkboard in the browser', note: 'React and TypeScript' }], link: 'WebSocket', both: true },
      {
        title: 'One Node.js process',
        nodes: [
          { label: 'Express API and board server', note: 'One WebSocket per board' },
          { label: 'Step checker', note: 'Vision model reads, exact arithmetic verifies' },
        ],
        link: 'tool calls',
        both: true,
      },
      { title: 'Voice', nodes: [{ label: 'Voice agent on Bolna', note: 'Speaks, and calls tools to write on the board' }] },
    ],
    foot: 'A tool call only ever reaches the session it names.',
  },

  cadence: {
    lanes: [
      { title: 'Traffic', nodes: [{ label: 'Simulation', note: 'Normal and covert ICMP timing' }, { label: 'Capture' }], link: 'packet delays' },
      { title: 'Analysis', nodes: [{ label: 'Features', note: 'Std dev, IQR, entropy, KS distance' }, { label: 'Two detectors', note: 'Fixed rules, and calibrated' }], link: 'verdicts' },
      { title: 'Evaluation', nodes: [{ label: 'Benchmark and metrics', note: 'Detection rate against false positives' }], link: 'results' },
      { title: 'Lab', nodes: [{ label: 'Browser UI', note: 'React and TypeScript, built by teammates' }] },
    ],
    foot: 'The analysis side is one Python package of small modules, tested with pytest.',
  },

  'compiler-visualizer': {
    lanes: [
      { title: 'Input', nodes: [{ label: 'A regex or a grammar', note: 'Typed into the page' }], link: 'parsed' },
      {
        title: 'Algorithms',
        nodes: [
          { label: 'Regex to DFA', note: 'Syntax tree, firstpos, lastpos, followpos' },
          { label: 'Operator-precedence parser' },
        ],
        link: 'steps',
      },
      { title: 'View', nodes: [{ label: 'Step-by-step UI', note: 'Automatic graph layout, animated states' }] },
    ],
    foot: 'Everything runs in the browser. Each algorithm is a pure function, separate from the UI. Hosted on GitHub Pages.',
  },

  scamlingo: {
    lanes: [
      { title: 'Phone or laptop', nodes: [{ label: 'Browser', note: 'Streams the microphone, plays the warning' }], link: 'audio over WebSocket', both: true },
      {
        title: 'Server',
        nodes: [
          { label: 'FastAPI session', note: 'One per call' },
          { label: 'Detector', note: 'Rules first, risk score from 0 to 100' },
        ],
        link: 'speech in, voice out',
        both: true,
      },
      { title: 'Gnani', nodes: [{ label: 'Realtime speech-to-text' }, { label: 'Text-to-speech', note: 'The spoken warning' }] },
    ],
    foot: "If the warning clip is slow, the browser's own voice speaks it instead.",
  },

  'stock-predict': {
    lanes: [
      {
        title: 'Phone',
        nodes: [
          { label: 'Flutter app', note: 'Profiles, price charts' },
          { label: '30-day projection', note: 'Computed on the device from news sentiment' },
        ],
        link: 'REST and sign-in',
        both: true,
      },
      {
        title: 'Services',
        nodes: [
          { label: 'Financial Modeling Prep', note: 'Company profile, price history, news sentiment' },
          { label: 'Firebase Authentication', note: 'Google sign-in' },
        ],
      },
    ],
  },
}
