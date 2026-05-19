import { NextRequest, NextResponse } from 'next/server'
import { transcribeAudio } from '@/lib/stt/deepgram'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('audio') as File | null

    if (!file) return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const mimeType = file.type || 'audio/mpeg'

    const transcript = await transcribeAudio(buffer, mimeType)

    return NextResponse.json({ transcript })
  } catch (err) {
    console.error('Transcribe error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
