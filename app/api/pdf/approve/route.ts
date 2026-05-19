import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendWhatsAppPDF } from '@/lib/whatsapp/twilio'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { draft_id, lead_phone, cover_message } = body

    if (!draft_id) return NextResponse.json({ error: 'draft_id is required' }, { status: 400 })
    if (!lead_phone) return NextResponse.json({ error: 'lead_phone is required' }, { status: 400 })

    const supabase = createServiceClient()

    // Fetch draft and verify it exists
    const { data: draft, error: draftError } = await supabase
      .from('pdf_drafts')
      .select('*')
      .eq('id', draft_id)
      .single()

    if (draftError || !draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 })

    // Safety gate: only send if status allows (not already sent/skipped)
    if (draft.status === 'skipped') {
      return NextResponse.json({ error: 'This draft has been skipped' }, { status: 400 })
    }

    if (!draft.pdf_url) {
      return NextResponse.json({ error: 'No PDF URL on this draft' }, { status: 400 })
    }

    const messageBody = cover_message || draft.cover_message || 'Hi, please find your personalised Scaler overview below.'

    // Send PDF via WhatsApp to lead
    const messageSid = await sendWhatsAppPDF(lead_phone, messageBody, draft.pdf_url)

    // Update draft status to approved
    await supabase
      .from('pdf_drafts')
      .update({ status: 'approved' })
      .eq('id', draft_id)

    // Log send
    await supabase.from('sends').insert({
      draft_id,
      channel: 'whatsapp',
      to_number: lead_phone,
      message_sid: messageSid,
      status: 'sent',
    })

    return NextResponse.json({ success: true, message_sid: messageSid })
  } catch (err) {
    console.error('Approve error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  // Skip route
  try {
    const body = await req.json()
    const { draft_id } = body

    if (!draft_id) return NextResponse.json({ error: 'draft_id is required' }, { status: 400 })

    const supabase = createServiceClient()
    await supabase.from('pdf_drafts').update({ status: 'skipped' }).eq('id', draft_id)

    return NextResponse.json({ success: true, status: 'skipped' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
