import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, profile_json, bda_phone, lead_phone, source_channel } = body

    if (!name || !profile_json) {
      return NextResponse.json({ error: 'name and profile_json are required' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('leads')
      .insert({
        name,
        profile_json,
        bda_phone: bda_phone || null,
        lead_phone: lead_phone || null,
        source_channel: source_channel || 'manual',
        stage: 'pre_call',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ lead: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('leads')
      .select(`*, transcripts(*), nudges(*), pdf_drafts(*)`)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ leads: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, transcript_text, transcript_source, audio_url } = body

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
    if (!transcript_text) return NextResponse.json({ error: 'transcript_text is required' }, { status: 400 })

    const supabase = createServiceClient()

    // Save transcript
    const { data: transcript, error: tError } = await supabase
      .from('transcripts')
      .insert({
        lead_id: id,
        source: transcript_source || 'text',
        text: transcript_text,
        audio_url: audio_url || null,
      })
      .select()
      .single()

    if (tError) return NextResponse.json({ error: tError.message }, { status: 500 })

    // Update lead stage
    await supabase.from('leads').update({ stage: 'post_call' }).eq('id', id)

    return NextResponse.json({ transcript })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
