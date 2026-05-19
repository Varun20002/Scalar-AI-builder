import { chatJSON, ChatMessage } from '../minimax'
import { KBSnippet } from '../../kb/retrieve'

export interface NudgeAngle {
  claim: string
  evidence_from_profile: string
  confidence: 'fact' | 'inferred' | 'missing'
}

export interface NudgeObjection {
  objection: string
  one_line_handle: string
}

export interface NudgeOutput {
  persona_label: string
  persona_why: string
  angles: NudgeAngle[]
  objections: NudgeObjection[]
  opening_hook: string
  inferred_vs_fact: Record<string, 'fact' | 'inferred' | 'missing'>
  formatted_message: string
}

export async function generateNudge(
  profile: Record<string, unknown>,
  kbSnippets: KBSnippet[]
): Promise<NudgeOutput> {
  const kbContext = kbSnippets.map((s) => `[${s.id}] ${s.text}`).join('\n\n')

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are a senior Scaler sales teammate briefing a BDA (Business Development Associate) before a call with a lead. 
Your job: write a short, scannable WhatsApp-style pre-call brief so the BDA walks in prepared and the first 30 seconds don't sound generic.

RULES:
1. Be specific to THIS lead — reference actual things from their profile.
2. Label every claim: "fact" (from profile), "inferred" (reasonable deduction), or "missing" (not in profile).
3. If LinkedIn or any key field is missing, explicitly note it as "missing" — never invent.
4. Write like a smart teammate's message, NOT a corporate memo. Conversational, scannable.
5. Only use curriculum facts from the provided KB snippets. Never fabricate curriculum details.
6. The formatted_message should be WhatsApp-ready: emoji OK, short lines, under 300 words.

OUTPUT: Return valid JSON matching this exact schema:
{
  "persona_label": "string (e.g. 'Frustrated service engineer eyeing product + AI')",
  "persona_why": "string (1-2 sentences explaining the label)",
  "angles": [
    { "claim": "string", "evidence_from_profile": "string", "confidence": "fact|inferred|missing" }
  ],
  "objections": [
    { "objection": "string", "one_line_handle": "string" }
  ],
  "opening_hook": "string (a specific opener the BDA can use, referencing something real about the lead)",
  "inferred_vs_fact": { "field_name": "fact|inferred|missing" },
  "formatted_message": "string (the actual WhatsApp message to send to the BDA)"
}`,
    },
    {
      role: 'user',
      content: `LEAD PROFILE:
${JSON.stringify(profile, null, 2)}

RELEVANT SCALER KB SNIPPETS (only cite facts from here):
${kbContext}

Generate the pre-call brief for this lead.`,
    },
  ]

  return chatJSON<NudgeOutput>(messages, { temperature: 0.4 })
}
