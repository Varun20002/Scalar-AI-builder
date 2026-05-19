import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { extractQuestions } from '@/lib/llm/prompts/extractQuestions'
import { composePDFSections, PersonaType } from '@/lib/llm/prompts/pdfSections'
import { checkFaithfulness } from '@/lib/llm/prompts/faithfulnessJudge'
import { generateCoverMessage } from '@/lib/llm/prompts/coverMessage'
import { retrieveSnippets, retrieveByPersonaType, getAllObjectionSnippets } from '@/lib/kb/retrieve'
import { renderHTML, renderPDF, uploadPDFToSupabase } from '@/lib/pdf/render'

export const maxDuration = 120

function inferPersonaType(profile: Record<string, unknown>): PersonaType {
  const yoe = Number(profile.years_of_experience || profile.yoe || 0)
  const intent = String(profile.intent || profile.current_role || '').toLowerCase()

  if (yoe === 0 || intent.includes('student') || intent.includes('final year') || intent.includes('fresher')) {
    return 'student'
  }
  if (yoe >= 7 || intent.includes('google') || intent.includes('microsoft') || intent.includes('senior')) {
    return 'senior'
  }
  return 'engineer'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { lead_id } = body

    if (!lead_id) return NextResponse.json({ error: 'lead_id is required' }, { status: 400 })

    const supabase = createServiceClient()

    // Fetch lead + latest transcript
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*, transcripts(*)')
      .eq('id', lead_id)
      .single()

    if (leadError || !lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

    const transcripts = lead.transcripts as Array<{ text: string; created_at: string }>
    if (!transcripts || transcripts.length === 0) {
      return NextResponse.json({ error: 'No transcript found. Add a transcript first.' }, { status: 400 })
    }

    const latestTranscript = transcripts.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0]

    const profile = lead.profile_json as Record<string, unknown>
    const personaType = inferPersonaType(profile)

    // Step 1: Extract open questions from transcript
    const extractResult = await extractQuestions(latestTranscript.text, profile)

    // Step 2: Retrieve KB snippets for each question
    const questionTexts = extractResult.questions.map((q) => q.question).join(' ')
    const profileText = Object.values(profile).join(' ')
    const kbSnippets = [
      ...retrieveSnippets(questionTexts, 5),
      ...retrieveSnippets(profileText, 3),
      ...retrieveByPersonaType(personaType, 4),
      ...getAllObjectionSnippets(),
    ]
    const uniqueSnippets = Array.from(new Map(kbSnippets.map((s) => [s.id, s])).values())

    // Step 3: Compose PDF sections
    const pdfContent = await composePDFSections(
      profile,
      extractResult.questions,
      uniqueSnippets,
      personaType,
      extractResult.call_summary
    )

    // Step 4: Faithfulness judge pass
    const sanitizedSections = await checkFaithfulness(pdfContent.sections, uniqueSnippets)
    pdfContent.sections = sanitizedSections
    pdfContent.bda_phone = (lead.bda_phone as string) ?? ''

    // Step 5: Generate cover message
    const coverMessage = await generateCoverMessage(
      profile,
      extractResult.questions,
      extractResult.call_summary
    )

    // Step 6: Render HTML and PDF
    const html = renderHTML(pdfContent)
    const pdfBuffer = await renderPDF(html)

    // Step 7: Upload to Supabase Storage
    const fileName = `${lead_id}-${Date.now()}.pdf`
    const pdfUrl = await uploadPDFToSupabase(pdfBuffer, fileName)

    // Step 8: Save draft to DB
    const { data: draft, error: draftError } = await supabase
      .from('pdf_drafts')
      .insert({
        lead_id,
        sections_json: pdfContent.sections,
        cover_message: coverMessage,
        html,
        pdf_url: pdfUrl,
        persona_type: personaType,
        status: 'pending',
      })
      .select()
      .single()

    if (draftError) return NextResponse.json({ error: draftError.message }, { status: 500 })

    return NextResponse.json({
      draft: {
        id: draft.id,
        pdf_url: pdfUrl,
        cover_message: coverMessage,
        sections: pdfContent.sections,
        persona_type: personaType,
        extracted_questions: extractResult.questions,
        call_summary: extractResult.call_summary,
      },
    })
  } catch (err) {
    console.error('PDF generate error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
