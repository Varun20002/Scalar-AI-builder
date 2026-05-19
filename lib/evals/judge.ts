/**
 * LLM-as-judge evals for PDF quality
 * Run: npx tsx lib/evals/judge.ts
 *
 * Three rubrics:
 * 1. Faithfulness — every curriculum claim cites a KB id
 * 2. Personalization delta — PDF for Rohan vs Karthik vs Meera are sufficiently different
 * 3. Question coverage — every extracted question maps to a section
 */

import { chatJSON } from '../llm/minimax'

interface FaithfulnessScore {
  score: number  // 0-10
  unsupported_claims: string[]
  verdict: string
}

interface PersonalizationScore {
  score: number  // 0-10
  analysis: string
  convergence_warnings: string[]
}

interface CoverageScore {
  score: number  // 0-10
  uncovered_questions: string[]
  verdict: string
}

interface PDFEvalResult {
  lead_name: string
  faithfulness: FaithfulnessScore
  coverage: CoverageScore
  overall: number
}

export async function evalFaithfulness(
  sections: Array<{ heading: string; body: string; kb_citations: string[] }>,
  kbSnippets: Array<{ id: string; text: string }>
): Promise<FaithfulnessScore> {
  const kbContext = kbSnippets.map((s) => `[${s.id}] ${s.text}`).join('\n')

  const result = await chatJSON<FaithfulnessScore>([
    {
      role: 'system',
      content: `You are a strict fact-checker for Scaler sales materials. 
Score the faithfulness of the PDF sections on a 0-10 scale where 10 means every claim is supported by the KB.
Return JSON: { score: number, unsupported_claims: string[], verdict: string }`,
    },
    {
      role: 'user',
      content: `KB SNIPPETS (ground truth):\n${kbContext}\n\nPDF SECTIONS:\n${sections.map((s) => `${s.heading}: ${s.body}`).join('\n\n')}`,
    },
  ], { temperature: 0.1 })

  return result
}

export async function evalPersonalizationDelta(
  pdfs: Array<{ lead_name: string; content: string }>
): Promise<PersonalizationScore> {
  if (pdfs.length < 2) {
    return { score: 10, analysis: 'Only one PDF, cannot compare', convergence_warnings: [] }
  }

  const result = await chatJSON<PersonalizationScore>([
    {
      role: 'system',
      content: `You are an evaluator checking if personalised sales PDFs are genuinely different per person.
Score 0-10 where 10 means they are visibly distinct (different content, tone, sections). 0 means generic middle.
Identify any "convergence warnings" — phrases or sections that appear verbatim across multiple PDFs.
Return JSON: { score: number, analysis: string, convergence_warnings: string[] }`,
    },
    {
      role: 'user',
      content: `PDFs to compare:\n\n${pdfs.map((p) => `--- ${p.lead_name} ---\n${p.content.slice(0, 1500)}`).join('\n\n')}`,
    },
  ], { temperature: 0.1 })

  return result
}

export async function evalQuestionCoverage(
  questions: Array<{ question: string; category: string }>,
  sections: Array<{ heading: string; body: string }>
): Promise<CoverageScore> {
  const result = await chatJSON<CoverageScore>([
    {
      role: 'system',
      content: `You are checking if every question extracted from a sales call has a corresponding section in the PDF.
Score 0-10 where 10 means full coverage. List any uncovered questions.
Return JSON: { score: number, uncovered_questions: string[], verdict: string }`,
    },
    {
      role: 'user',
      content: `QUESTIONS FROM CALL:\n${questions.map((q, i) => `${i + 1}. [${q.category}] ${q.question}`).join('\n')}\n\nPDF SECTIONS:\n${sections.map((s) => `- ${s.heading}`).join('\n')}`,
    },
  ], { temperature: 0.1 })

  return result
}

export async function runFullEval(
  pdfs: Array<{
    lead_name: string
    sections: Array<{ heading: string; body: string; kb_citations: string[] }>
    questions: Array<{ question: string; category: string }>
    kbSnippets: Array<{ id: string; text: string }>
  }>
): Promise<void> {
  console.log('\n=== Scaler BDA Agent — PDF Quality Evals ===\n')

  const results: PDFEvalResult[] = []

  for (const pdf of pdfs) {
    console.log(`\n--- Evaluating ${pdf.lead_name} ---`)

    const faithfulness = await evalFaithfulness(pdf.sections, pdf.kbSnippets)
    const coverage = await evalQuestionCoverage(pdf.questions, pdf.sections)

    const overall = Math.round((faithfulness.score + coverage.score) / 2)

    results.push({ lead_name: pdf.lead_name, faithfulness, coverage, overall })

    console.log(`  Faithfulness: ${faithfulness.score}/10 — ${faithfulness.verdict}`)
    if (faithfulness.unsupported_claims.length > 0) {
      console.log(`  ⚠ Unsupported: ${faithfulness.unsupported_claims.join('; ')}`)
    }
    console.log(`  Coverage: ${coverage.score}/10 — ${coverage.verdict}`)
    if (coverage.uncovered_questions.length > 0) {
      console.log(`  ⚠ Uncovered: ${coverage.uncovered_questions.join('; ')}`)
    }
    console.log(`  Overall: ${overall}/10`)
  }

  if (pdfs.length >= 2) {
    console.log('\n--- Personalization Delta ---')
    const pdfTexts = pdfs.map((p) => ({
      lead_name: p.lead_name,
      content: p.sections.map((s) => `${s.heading}\n${s.body}`).join('\n\n'),
    }))
    const personalization = await evalPersonalizationDelta(pdfTexts)
    console.log(`  Score: ${personalization.score}/10`)
    console.log(`  Analysis: ${personalization.analysis}`)
    if (personalization.convergence_warnings.length > 0) {
      console.log(`  ⚠ Convergence warnings: ${personalization.convergence_warnings.join('; ')}`)
    }
  }

  console.log('\n=== Summary ===')
  for (const r of results) {
    const status = r.overall >= 7 ? '✓' : r.overall >= 5 ? '⚠' : '✗'
    console.log(`  ${status} ${r.lead_name}: ${r.overall}/10`)
  }
}
