import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateNudge } from '@/lib/llm/prompts/nudge'
import { retrieveSnippets, retrieveByPersonaType } from '@/lib/kb/retrieve'
import { sendWhatsAppText } from '@/lib/whatsapp/twilio'

function inferPersonaType(profile: Record<string, unknown>): 'engineer' | 'senior' | 'student' {
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

    // Fetch lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single()

    if (leadError || !lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

    const profile = lead.profile_json as Record<string, unknown>
    const personaType = inferPersonaType(profile)

    // Retrieve relevant KB snippets
    const profileText = Object.values(profile).join(' ')
    const kbSnippets = [
      ...retrieveSnippets(profileText, 4),
      ...retrieveByPersonaType(personaType, 4),
    ]
    // Deduplicate
    const uniqueSnippets = Array.from(new Map(kbSnippets.map((s) => [s.id, s])).values()).slice(0, 8)

    // Generate nudge
    const nudgeOutput = await generateNudge(profile, uniqueSnippets)

    // Save to DB
    const { data: nudge, error: nudgeError } = await supabase
      .from('nudges')
      .insert({
        lead_id,
        content_md: nudgeOutput.formatted_message,
        structured_json: nudgeOutput,
        sent_at: null,
      })
      .select()
      .single()

    if (nudgeError) return NextResponse.json({ error: nudgeError.message }, { status: 500 })

    // Send via WhatsApp to BDA (no approval gate)
    const bdaPhone = lead.bda_phone
    let messageSid: string | null = null

    if (bdaPhone) {
      try {
        messageSid = await sendWhatsAppText(bdaPhone, nudgeOutput.formatted_message)

        // Update nudge with message SID
        await supabase
          .from('nudges')
          .update({ message_sid: messageSid, sent_at: new Date().toISOString() })
          .eq('id', nudge.id)

        // Log in sends
        await supabase.from('sends').insert({
          nudge_id: nudge.id,
          channel: 'whatsapp',
          to_number: bdaPhone,
          message_sid: messageSid,
          status: 'sent',
        })
      } catch (sendErr) {
        console.error('WhatsApp send error:', sendErr)
        // Still return success — nudge was generated
      }
    }

    return NextResponse.json({
      nudge: {
        id: nudge.id,
        content_md: nudgeOutput.formatted_message,
        structured: nudgeOutput,
        sent: !!messageSid,
        message_sid: messageSid,
      },
    })
  } catch (err) {
    console.error('Nudge error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
