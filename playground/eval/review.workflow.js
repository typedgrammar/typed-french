export const meta = {
  name: 'parsing-cross-review',
  description: 'Cross-review a batch of Typed Japanese snippets against the parsing rubric (K independent judges per item), score, and synthesize routed fix proposals',
  phases: [{ title: 'Review' }, { title: 'Synthesize' }],
}

// args: { round, rubric, items: [{id, source, jp, chapter?, code, resolves}] }
// The runtime delivers `args` as a JSON string; parse it (tolerate an object too).
const A = typeof args === 'string' ? JSON.parse(args) : (args ?? {})
const round = A.round ?? 0
const rubric = A.rubric ?? '(rubric missing)'
const items = A.items ?? []
const JUDGES = 3 // cross-review: independent judges per item

const JUDGE_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['dimensions', 'total', 'verdict', 'issues'],
  properties: {
    dimensions: {
      type: 'object', additionalProperties: false,
      required: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6'],
      properties: Object.fromEntries(['D1','D2','D3','D4','D5','D6'].map((d) => [d, {
        type: 'object', additionalProperties: false, required: ['score', 'reason'],
        properties: { score: { type: 'integer', minimum: 0, maximum: 2 }, reason: { type: 'string' } },
      }])),
    },
    total: { type: 'integer', minimum: 0, maximum: 12 },
    verdict: { enum: ['conforms', 'needs-work'] },
    issues: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['dimension', 'severity', 'rootCause', 'note'],
        properties: {
          dimension: { enum: ['D1','D2','D3','D4','D5','D6'] },
          severity: { enum: ['low', 'high'] },
          rootCause: { enum: ['ts-def', 'prompt', 'content'] },
          note: { type: 'string' },
        },
      },
    },
  },
}

const PROPOSAL_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['proposals'],
  properties: {
    proposals: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['target', 'title', 'rationale', 'dimensions', 'change', 'confidence'],
        properties: {
          target: { enum: ['ts-def', 'prompt', 'content'] },
          title: { type: 'string' },
          rationale: { type: 'string' },
          dimensions: { type: 'array', items: { enum: ['D1','D2','D3','D4','D5','D6'] } },
          change: { type: 'string', description: 'concrete, minimal change to make (file + what to edit)' },
          confidence: { enum: ['low', 'medium', 'high'] },
          frequency: { type: 'integer', description: 'how many sampled items exhibit this' },
        },
      },
    },
  },
}

const judgePrompt = (item, k) => `You are judge #${k + 1}, an expert Japanese linguistics reviewer. Score ONE "Typed Japanese" snippet against the rubric. Judge the GRAMMATICAL ANALYSIS, not just whether it type-checks. Be strict and independent; do not assume other judges agree.

# Rubric
${rubric}

# Item (source: ${item.source}${item.chapter ? `, chapter ${item.chapter}` : ''})
Target sentence (must be the exact resolution): ${JSON.stringify(item.jp)}
Snippet:
\`\`\`typescript
${item.code}
\`\`\`

Score every dimension D1–D6 (0/1/2) with a one-line reason, give total (0–12) and verdict, and list concrete issues. For each issue, set rootCause: "ts-def" if the library lacks a type to express it correctly, "prompt" if the annotate prompt should have guided differently, "content" if it is a one-off authoring slip. Return the structured object only.`

phase('Review')
const reviewed = await pipeline(
  items,
  (item) => parallel(
    Array.from({ length: JUDGES }, (_, k) => () =>
      agent(judgePrompt(item, k), { label: `judge:${item.id}#${k + 1}`, phase: 'Review', schema: JUDGE_SCHEMA })
    )
  ).then((votes) => {
    const v = votes.filter(Boolean)
    if (!v.length) return null
    const total = v.reduce((s, x) => s + x.total, 0) / v.length
    const dims = {}
    for (const d of ['D1','D2','D3','D4','D5','D6'])
      dims[d] = v.reduce((s, x) => s + x.dimensions[d].score, 0) / v.length
    const conforms = v.filter((x) => x.verdict === 'conforms').length
    const issues = v.flatMap((x) => x.issues)
    return {
      id: item.id, source: item.source, chapter: item.chapter ?? null, jp: item.jp,
      judges: v.length, total, dims,
      verdict: conforms > v.length / 2 ? 'conforms' : 'needs-work',
      issues,
    }
  })
)

const scored = reviewed.filter(Boolean)
const roundScore = scored.length
  ? scored.reduce((s, x) => s + x.total, 0) / scored.length / 12
  : 0
const byDimension = {}
for (const d of ['D1','D2','D3','D4','D5','D6'])
  byDimension[d] = scored.length ? scored.reduce((s, x) => s + x.dims[d], 0) / scored.length / 2 : 0

// Aggregate issues for the synthesizer.
const allIssues = scored.flatMap((x) =>
  x.issues.map((i) => ({ ...i, itemId: x.id, jp: x.jp, source: x.source })))

phase('Synthesize')
let proposals = []
if (allIssues.length) {
  const synth = await agent(
    `You are the eval synthesizer. Below are issues found by independent judges across a sample of Typed Japanese snippets, plus the rubric. Cluster recurring problems and propose a SHORT list of concrete, minimal fixes, each routed to a target:
- "ts-def": a change to the library type definitions in <repo>/src (e.g. add/repair a constructor or conjugation form).
- "prompt": a change to the annotate prompt in playground/scripts/annotate.ts (API_REFERENCE or hard rules).
- "content": a one-off authoring fix to a specific chapter snippet.

Prioritize systemic (ts-def/prompt) fixes that would raise many items at once over one-off content fixes. Give each a concrete change description and a confidence. Order by impact.

# Rubric
${rubric}

# Issues (${allIssues.length})
${JSON.stringify(allIssues, null, 2)}

Return the structured proposals only.`,
    { label: 'synthesize', phase: 'Synthesize', schema: PROPOSAL_SCHEMA }
  )
  proposals = synth?.proposals ?? []
}

return {
  round,
  sampled: items.length,
  scored: scored.length,
  roundScore: Number(roundScore.toFixed(4)),
  byDimension: Object.fromEntries(Object.entries(byDimension).map(([k, v]) => [k, Number(v.toFixed(3))])),
  perItem: scored.map((x) => ({
    id: x.id, source: x.source, chapter: x.chapter, jp: x.jp,
    total: Number(x.total.toFixed(2)), verdict: x.verdict, issueCount: x.issues.length,
  })),
  proposals,
  issues: allIssues,
}
