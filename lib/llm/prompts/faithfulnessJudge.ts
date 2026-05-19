import { chatJSON, ChatMessage } from '../minimax'
import { PDFSection } from './pdfSections'
import { KBSnippet } from '../../kb/retrieve'

interface ClaimCheck {
  claim: string
  supported_by_kb: boolean
  kb_ids: string[]
  rewritten?: string
}

interface FaithfulnessResult {
  checks: ClaimCheck[]
  overall_faithful: boolean
  unsupported_count: number
}

const FABRICATION_PATTERNS = [
  /\d+%\s*(placement|salary|job)/i,
  /alumni.{0,30}(earn|earning|package|lpa)/i,
  /average.{0,30}(salary|package|hike)/i,
  /guaranteed/i,
  /100%/i,
]

function containsFabrication(text: string): boolean {
  return FABRICATION_PATTERNS.some((p) => p.test(text))
}

export async function checkFaithfulness(
  sections: PDFSection[],
  kbSnippets: KBSnippet[]
): Promise<PDFSection[]> {
  const kbIds = new Set(kbSnippets.map((s) => s.id))
  const kbContext = kbSnippets.map((s) => `[${s.id}] ${s.text}`).join('\n\n')

  // First pass: flag sections with citations not in KB or fabrication patterns
  const sectionsToCheck = sections.filter(
    (s) =>
      s.kb_citations.some((cid) => !kbIds.has(cid)) ||
      containsFabrication(s.body)
  )

  if (sectionsToCheck.length === 0) return sections

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are a fact-checker for Scaler sales materials. 
Your job: identify any curriculum claims, placement statistics, or alumni outcomes that are NOT supported by the provided KB snippets.
For each unsupported claim, rewrite it to either: (a) an accurate version using KB evidence, or (b) "We'll confirm this specifically on our follow-up call."

NEVER allow: specific placement percentages not in KB, fabricated alumni names, salary figures not in KB, "guaranteed" language.

OUTPUT: Return valid JSON:
{
  "checks": [
    {
      "claim": "the original claim text",
      "supported_by_kb": true|false,
      "kb_ids": ["relevant kb ids if supported"],
      "rewritten": "safe version if unsupported (omit if supported)"
    }
  ],
  "overall_faithful": true|false,
  "unsupported_count": number
}`,
    },
    {
      role: 'user',
      content: `KB SNIPPETS (ground truth):
${kbContext}

SECTIONS TO CHECK:
${sectionsToCheck.map((s) => `Section "${s.heading}":\n${s.body}`).join('\n\n---\n\n')}

Check for unsupported claims.`,
    },
  ]

  const result = await chatJSON<FaithfulnessResult>(messages, { temperature: 0.1 })

  // Apply rewrites to sections
  const rewriteMap: Record<string, string> = {}
  for (const check of result.checks) {
    if (!check.supported_by_kb && check.rewritten) {
      rewriteMap[check.claim] = check.rewritten
    }
  }

  return sections.map((section) => {
    let body = section.body
    for (const [original, rewritten] of Object.entries(rewriteMap)) {
      if (body.includes(original)) {
        body = body.replace(original, rewritten)
      }
    }
    // Also sweep for fabrication patterns
    if (containsFabrication(body)) {
      body = body.replace(
        /\d+%\s*(placement|salary|job)/gi,
        'strong placement outcomes (we\'ll share the placement report)'
      )
    }
    return { ...section, body }
  })
}
