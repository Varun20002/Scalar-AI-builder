import { chatJSON, ChatMessage } from '../minimax'
import { ExtractedQuestion } from './extractQuestions'

export interface CoverMessageOutput {
  message: string
}

export async function generateCoverMessage(
  profile: Record<string, unknown>,
  questions: ExtractedQuestion[],
  callSummary: string
): Promise<string> {
  const topQuestion = questions.find((q) => q.urgency === 'high') || questions[0]

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are a Scaler BDA sending a personalised WhatsApp message to a lead after a call, along with a PDF.

Write a short, warm, human WhatsApp message (2-4 lines max) that:
1. Addresses the lead by first name
2. References ONE specific thing from their call (their main question or concern)
3. Tells them what's in the PDF and why it's relevant to them specifically
4. Ends with a clear soft nudge toward the entrance test

DO NOT: use corporate language, mention "brochure", mention generic program benefits, add excessive exclamation marks.
DO: sound like a real person who listened to them on the call.

OUTPUT: Return valid JSON: { "message": "the WhatsApp message text" }`,
    },
    {
      role: 'user',
      content: `LEAD PROFILE: ${JSON.stringify(profile, null, 2)}

CALL SUMMARY: ${callSummary}

TOP CONCERN FROM CALL: "${topQuestion?.question || 'general interest in the program'}"
(their words: "${topQuestion?.raw_quote || 'interested in learning more'}")

Write the WhatsApp cover message.`,
    },
  ]

  const result = await chatJSON<CoverMessageOutput>(messages, { temperature: 0.6 })
  return result.message
}
