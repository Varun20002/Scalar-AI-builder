import { chatJSON, ChatMessage } from '../minimax'
import { KBSnippet } from '../../kb/retrieve'
import { ExtractedQuestion } from './extractQuestions'

export type PersonaType = 'engineer' | 'senior' | 'student'

export interface PDFSection {
  id: string
  heading: string
  body: string
  kb_citations: string[]
  section_type: 'question_answer' | 'roi_analysis' | 'curriculum_detail' | 'social_proof' | 'next_steps'
}

export interface PDFContent {
  hero_headline: string
  hero_subheadline: string
  intro_paragraph: string
  sections: PDFSection[]
  closing_cta: string
  persona_type: PersonaType
  lead_name: string
}

function getPersonaTone(personaType: PersonaType): string {
  switch (personaType) {
    case 'senior':
      return `TONE: Peer-to-peer, no fluff. This is a senior engineer at a top company. They've seen bad training. 
Be direct about what's substantively different, reference production-grade instructors, and acknowledge what they already know.
Don't oversell. A confident wrong claim about curriculum will lose them. Defer on specifics you can't confirm.`
    case 'student':
      return `TONE: Mentoring, reassuring, concrete. This is a student with family pressure, financial concern, and fear of failure.
Lead with empathy. Be specific about financing options. Make the entrance test feel approachable.
Address the family's concerns too — they're an implicit stakeholder.`
    default:
      return `TONE: Pragmatic, ROI-focused, peer. This is an experienced engineer who wants to see the numbers.
Cut to the ROI math. Be specific about curriculum depth on AI/LLM. Address the Coursera comparison honestly.
They're analytical — vague reassurance won't land. Show the working.`
  }
}

export async function composePDFSections(
  profile: Record<string, unknown>,
  questions: ExtractedQuestion[],
  kbSnippets: KBSnippet[],
  personaType: PersonaType,
  callSummary: string
): Promise<PDFContent> {
  const kbContext = kbSnippets.map((s) => `[${s.id}] ${s.text}`).join('\n\n')
  const questionsText = questions
    .map((q, i) => `${i + 1}. [${q.category}/${q.urgency}] "${q.question}" (quote: "${q.raw_quote}")`)
    .join('\n')

  const personaToneInstructions = getPersonaTone(personaType)

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are a world-class sales copywriter creating a personalised 2-3 page PDF for a Scaler lead.
This PDF's job: build enough trust that the lead takes the entrance test.

${personaToneInstructions}

CRITICAL RULES:
1. Every curriculum claim MUST be grounded in the provided KB snippets. Cite the kb_id in brackets, e.g. [prog-academy-mod-ai-agents].
2. If you don't have KB evidence for a specific claim, write: "We'll confirm this specifically on our follow-up call."
3. NEVER fabricate alumni names, specific salary figures, or placement percentages not in the KB.
4. The PDF should look visibly different from a generic Scaler brochure — it must reference this lead's specific situation.
5. Each section must address a specific question the lead raised. No generic sections.
6. The hero headline must name the lead and reference their specific situation.
7. Sections should flow like a conversation, not a sales brochure.

OUTPUT: Return valid JSON:
{
  "hero_headline": "string (personalised, references lead name and situation)",
  "hero_subheadline": "string",
  "intro_paragraph": "string (references the call, acknowledges their situation specifically)",
  "sections": [
    {
      "id": "string (e.g. 'section-1')",
      "heading": "string",
      "body": "string (the full section content in markdown-compatible text)",
      "kb_citations": ["kb-snippet-id-1", "kb-snippet-id-2"],
      "section_type": "question_answer|roi_analysis|curriculum_detail|social_proof|next_steps"
    }
  ],
  "closing_cta": "string (specific next step — take the entrance test — with the lead's name)",
  "persona_type": "${personaType}",
  "lead_name": "string"
}`,
    },
    {
      role: 'user',
      content: `LEAD PROFILE:
${JSON.stringify(profile, null, 2)}

CALL SUMMARY: ${callSummary}

OPEN QUESTIONS FROM THE CALL (address each one):
${questionsText}

RELEVANT SCALER KB SNIPPETS (only cite facts from here):
${kbContext}

Create the personalised PDF content. Every section must address a specific question above.`,
    },
  ]

  return chatJSON<PDFContent>(messages, { temperature: 0.5 })
}
