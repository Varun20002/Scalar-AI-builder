import { chatJSON, ChatMessage } from '../minimax'

export interface ExtractedQuestion {
  question: string
  urgency: 'high' | 'medium' | 'low'
  requires_curriculum_grounding: boolean
  category: 'curriculum_depth' | 'roi_salary' | 'placement' | 'cost_financing' | 'peer_quality' | 'instructor_quality' | 'entrance_test' | 'alternatives' | 'personal_situation' | 'other'
  raw_quote: string
}

export interface ExtractQuestionsOutput {
  questions: ExtractedQuestion[]
  call_sentiment: 'interested' | 'skeptical' | 'confused' | 'on_the_fence'
  call_summary: string
}

export async function extractQuestions(
  transcript: string,
  profile: Record<string, unknown>
): Promise<ExtractQuestionsOutput> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are an expert at analysing Scaler sales call transcripts and extracting what a lead really wants to know.

Your job: identify every open question, concern, or objection the lead raised — explicitly or implicitly.

RULES:
1. Only extract questions/concerns that are actually in the transcript. Do NOT invent concerns not present.
2. If a concern was stated vaguely, capture the underlying question, not your projection.
3. Mark requires_curriculum_grounding=true for anything about program content, instructors, syllabus, tools.
4. Mark urgency=high for concerns that sounded like deal-breakers.
5. Include the raw_quote from the transcript that supports this question.

CATEGORIES:
- curriculum_depth: what's covered, how deep, updated curriculum
- roi_salary: salary jump, ROI, worth the money
- placement: job guarantee, placement rate, success stories
- cost_financing: affordability, EMI, ISA
- peer_quality: cohort level, who else is in the batch
- instructor_quality: who teaches, are they practitioners
- entrance_test: test difficulty, prep, multiple attempts
- alternatives: Coursera, YouTube, other programs
- personal_situation: family pressure, government job, current job constraints
- other: anything else

OUTPUT: Return valid JSON:
{
  "questions": [
    {
      "question": "clear restatement of the question",
      "urgency": "high|medium|low",
      "requires_curriculum_grounding": true|false,
      "category": "category from list above",
      "raw_quote": "exact quote or paraphrase from transcript"
    }
  ],
  "call_sentiment": "interested|skeptical|confused|on_the_fence",
  "call_summary": "2-3 sentence summary of where the lead is"
}`,
    },
    {
      role: 'user',
      content: `LEAD PROFILE:
${JSON.stringify(profile, null, 2)}

CALL TRANSCRIPT:
${transcript}

Extract all open questions and concerns.`,
    },
  ]

  return chatJSON<ExtractQuestionsOutput>(messages, { temperature: 0.2 })
}
