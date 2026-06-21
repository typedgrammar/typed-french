export const meta = {
  name: 'ab-regression-check',
  description: 'A/B: score a fixed benchmark of identical sentences on current HEAD vs pre-loop main, to separate real regression from sampling variance',
  phases: [{ title: 'AB' }],
}

const A = typeof args === 'string' ? JSON.parse(args) : (args ?? {})
const rubric = A.rubric ?? '(rubric missing)'
const items = A.items ?? []
const JUDGES = 3

const SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['total', 'verdict'],
  properties: {
    total: { type: 'integer', minimum: 0, maximum: 12 },
    verdict: { enum: ['conforms', 'needs-work'] },
    worst: { type: 'string', description: 'one-line: the most serious issue, or "none"' },
  },
}

const judge = (jp, code, arm) => agent(
  `You are an expert Japanese-linguistics reviewer. Score ONE Typed Japanese snippet against the rubric. Judge the grammatical analysis, not just that it type-checks. Be strict and consistent.\n\n# Rubric\n${rubric}\n\n# Target sentence (must be the exact resolution)\n${JSON.stringify(jp)}\n# Snippet (${arm})\n\`\`\`typescript\n${code}\n\`\`\`\nReturn ONLY total (0-12), verdict, and the single worst issue.`,
  { label: `${arm}:${jp.slice(0, 8)}`, phase: 'AB', schema: SCHEMA }
)

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)] }

phase('AB')
const rows = await parallel(items.map((it) => async () => {
  const [cur, main] = await Promise.all([
    parallel(Array.from({ length: JUDGES }, () => () => judge(it.jp, it.currentCode, 'current'))),
    parallel(Array.from({ length: JUDGES }, () => () => judge(it.jp, it.mainCode, 'main'))),
  ])
  const c = cur.filter(Boolean), m = main.filter(Boolean)
  if (!c.length || !m.length) return null
  const cs = median(c.map((x) => x.total)), ms = median(m.map((x) => x.total))
  return {
    id: it.id, jp: it.jp, changed: it.changed,
    current: cs, main: ms, delta: cs - ms,
    currentWorst: c[0].worst ?? '', mainWorst: m[0].worst ?? '',
  }
}))

const r = rows.filter(Boolean)
const mean = (a) => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0
const curMean = mean(r.map((x) => x.current)), mainMean = mean(r.map((x) => x.main))
return {
  n: r.length,
  currentMean: Number((curMean / 12).toFixed(4)),
  mainMean: Number((mainMean / 12).toFixed(4)),
  deltaMeanPts: Number((curMean - mainMean).toFixed(2)),
  regressions: r.filter((x) => x.delta < 0).map((x) => ({ id: x.id, jp: x.jp, current: x.current, main: x.main, delta: x.delta, currentWorst: x.currentWorst })),
  improvements: r.filter((x) => x.delta > 0).map((x) => ({ id: x.id, jp: x.jp, delta: x.delta })),
  unchanged: r.filter((x) => x.delta === 0).map((x) => ({ id: x.id, jp: x.jp, score: x.current })),
  perItem: r.map((x) => ({ id: x.id, jp: x.jp, current: x.current, main: x.main, delta: x.delta })),
}
