import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { renderHTML, renderPDF, uploadPDFToSupabase } from '@/lib/pdf/render'
import { PDFContent, PDFSection } from '@/lib/llm/prompts/pdfSections'
import { chatText } from '@/lib/llm/minimax'

export const maxDuration = 60

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { draft_id, section_id, new_body, cover_message, regenerate_note } = body

    if (!draft_id) return NextResponse.json({ error: 'draft_id is required' }, { status: 400 })

    const supabase = createServiceClient()

    const { data: draft, error: draftError } = await supabase
      .from('pdf_drafts')
      .select('*')
      .eq('id', draft_id)
      .single()

    if (draftError || !draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 })

    const { data: lead } = await supabase
      .from('leads')
      .select('bda_phone, name')
      .eq('id', draft.lead_id)
      .single()

    let sections = draft.sections_json as PDFSection[]
    let updatedCoverMessage = draft.cover_message
    const persistedContent = (draft.content_json ?? null) as PDFContent | null

    // Update cover message if provided
    if (cover_message !== undefined) {
      updatedCoverMessage = cover_message
    }

    // Update a specific section
    if (section_id) {
      if (regenerate_note) {
        // Regenerate section with BDA's instruction
        const sectionIndex = sections.findIndex((s) => s.id === section_id)
        if (sectionIndex === -1) return NextResponse.json({ error: 'Section not found' }, { status: 404 })

        const section = sections[sectionIndex]
        const newBody = await chatText([
          {
            role: 'system',
            content: 'You are rewriting a section of a personalised sales PDF for a Scaler lead. Keep it factual, personalised, and within the same length. Do not add made-up statistics.',
          },
          {
            role: 'user',
            content: `Original section heading: "${section.heading}"\n\nOriginal body:\n${section.body}\n\nBDA's instruction: ${regenerate_note}\n\nRewrite the section body following the instruction.`,
          },
        ])
        sections[sectionIndex] = { ...section, body: newBody }
      } else if (new_body) {
        sections = sections.map((s) => (s.id === section_id ? { ...s, body: new_body } : s))
      }
    }

    // Re-render PDF with updated sections.
    // Prefer the persisted PDFContent (content_json). Fall back to a minimal
    // reconstruction for legacy drafts that pre-date the content_json column.
    const pdfContentPartial: PDFContent = persistedContent
      ? {
          ...persistedContent,
          sections,
          bda_phone: (lead?.bda_phone as string) ?? persistedContent.bda_phone ?? '',
          lead_name: persistedContent.lead_name || (lead?.name as string) || '',
          persona_type: (draft.persona_type as PDFContent['persona_type']) ?? persistedContent.persona_type,
        }
      : {
          hero_headline: '',
          hero_subheadline: '',
          intro_paragraph: '',
          closing_cta: '',
          persona_type: (draft.persona_type as PDFContent['persona_type']) ?? 'engineer',
          lead_name: (lead?.name as string) ?? '',
          bda_phone: (lead?.bda_phone as string) ?? '',
          sections,
        }
    const html = renderHTML(pdfContentPartial)
    const pdfBuffer = await renderPDF(html)
    const fileName = `${draft.lead_id}-${Date.now()}-edit.pdf`
    const pdfUrl = await uploadPDFToSupabase(pdfBuffer, fileName)

    // Update draft
    const { data: updated, error: updateError } = await supabase
      .from('pdf_drafts')
      .update({
        sections_json: sections,
        content_json: pdfContentPartial,
        cover_message: updatedCoverMessage,
        html,
        pdf_url: pdfUrl,
        status: 'edited',
      })
      .eq('id', draft_id)
      .select()
      .single()

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    return NextResponse.json({ draft: updated })
  } catch (err) {
    console.error('Edit error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
