'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft, Zap, FileText, Upload, Loader2,
  CheckCircle, MessageSquare, ChevronRight, Mic
} from 'lucide-react'
import { toast } from 'sonner'

export default function LeadPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [lead, setLead] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  // Pre-call state
  const [nudgeLoading, setNudgeLoading] = useState(false)
  const [nudgeDone, setNudgeDone] = useState(false)
  const [nudgeContent, setNudgeContent] = useState('')

  // Post-call state
  const [transcriptMode, setTranscriptMode] = useState<'text' | 'audio'>('text')
  const [transcriptText, setTranscriptText] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [transcribing, setTranscribing] = useState(false)
  const [transcriptSaved, setTranscriptSaved] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfDraftId, setPdfDraftId] = useState<string | null>(null)

  const fetchLead = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/leads')
    const data = await res.json()
    const found = data.leads?.find((l: Record<string, unknown>) => l.id === id)
    if (found) {
      setLead(found)
      const nudges = found.nudges as Array<{ content_md: string }> | undefined
      if (nudges && nudges.length > 0) {
        setNudgeDone(true)
        setNudgeContent(nudges[nudges.length - 1].content_md)
      }
      const transcripts = found.transcripts as Array<{ text: string }> | undefined
      if (transcripts && transcripts.length > 0) {
        setTranscriptText(transcripts[transcripts.length - 1].text)
        setTranscriptSaved(true)
      }
      const drafts = found.pdf_drafts as Array<{ id: string }> | undefined
      if (drafts && drafts.length > 0) {
        setPdfDraftId(drafts[drafts.length - 1].id)
      }
    }
    setLoading(false)
  }, [id])

  useEffect(() => { fetchLead() }, [fetchLead])

  async function handleGenerateNudge() {
    setNudgeLoading(true)
    try {
      const res = await fetch('/api/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: id }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setNudgeContent(data.nudge.content_md)
      setNudgeDone(true)
      toast.success(data.nudge.sent ? '✓ Nudge sent to your WhatsApp!' : '✓ Nudge generated (WhatsApp not configured)')
    } catch (err) {
      toast.error(String(err))
    } finally {
      setNudgeLoading(false)
    }
  }

  async function handleTranscribeAudio() {
    if (!audioFile) return
    setTranscribing(true)
    try {
      const form = new FormData()
      form.append('audio', audioFile)
      const res = await fetch('/api/transcribe', { method: 'POST', body: form })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setTranscriptText(data.transcript)
      toast.success('Audio transcribed!')
    } catch (err) {
      toast.error(String(err))
    } finally {
      setTranscribing(false)
    }
  }

  async function handleSaveTranscript() {
    if (!transcriptText.trim()) { toast.error('Transcript is empty'); return }
    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          transcript_text: transcriptText,
          transcript_source: transcriptMode,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setTranscriptSaved(true)
      fetchLead()
      toast.success('Transcript saved!')
    } catch (err) {
      toast.error(String(err))
    }
  }

  async function handleGeneratePDF() {
    if (!transcriptSaved) { toast.error('Save the transcript first'); return }
    setPdfLoading(true)
    try {
      const res = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: id }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPdfDraftId(data.draft.id)
      toast.success('PDF generated! Review and approve it.')
      router.push(`/approval/${data.draft.id}`)
    } catch (err) {
      toast.error(String(err))
    } finally {
      setPdfLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Lead not found
      </div>
    )
  }

  const profile = lead.profile_json as Record<string, string>

  return (
    <div className="min-h-screen bg-background">
      {/* Floating header */}
      <div className="border-b border-border bg-background/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => router.push('/dashboard')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-foreground font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{lead.name as string}</h1>
            <p className="text-muted-foreground text-xs">{profile.current_role || 'No role'}</p>
          </div>
          <Badge variant="outline" className={
            lead.stage === 'post_call'
              ? 'border-[var(--color-sage)]/40 text-[var(--color-sage)] text-xs'
              : 'border-primary/40 text-primary text-xs'
          }>
            {lead.stage === 'post_call' ? 'Post-call' : 'Pre-call'}
          </Badge>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Profile summary */}
        <Card>
          <CardContent className="py-4 px-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {Object.entries(profile).filter(([k]) => k !== 'name').map(([key, val]) => (
                <div key={key}>
                  <p className="text-muted-foreground text-xs capitalize">{key.replace(/_/g, ' ')}</p>
                  <p className="text-foreground text-sm">{val || '—'}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* STAGE A: Pre-call nudge */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                </div>
                <CardTitle className="text-foreground text-sm">Stage A — Pre-call Nudge</CardTitle>
              </div>
              {nudgeDone && (
                <Badge variant="outline" className="border-[var(--color-sage)]/40 text-[var(--color-sage)] text-xs gap-1">
                  <CheckCircle className="w-3 h-3" />Sent
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-xs">
              Generates a scannable WhatsApp brief for you — who this lead is, angles to use, objections to expect, opening hook.
              Sent directly to your phone, no approval needed.
            </p>
            {nudgeDone && nudgeContent && (
              <div className="bg-muted rounded-lg p-3 border border-border">
                <div className="flex items-center gap-1.5 mb-2">
                  <MessageSquare className="w-3.5 h-3.5 text-[var(--color-sage)]" />
                  <span className="text-[var(--color-sage)] text-xs font-medium">Sent to your WhatsApp</span>
                </div>
                <p className="text-foreground text-xs whitespace-pre-wrap leading-relaxed">{nudgeContent}</p>
              </div>
            )}
            <Button
              onClick={handleGenerateNudge}
              disabled={nudgeLoading}
              variant={nudgeDone ? 'outline' : 'default'}
              className="text-sm w-full"
            >
              {nudgeLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : nudgeDone ? 'Regenerate Nudge' : 'Generate & Send Pre-call Nudge'}
            </Button>
          </CardContent>
        </Card>

        <Separator />

        {/* STAGE B: Post-call PDF */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[var(--color-clay)]/15 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-[var(--color-clay)]" />
                </div>
                <CardTitle className="text-foreground text-sm">Stage B — Post-call PDF</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-xs">
              After the call, add the transcript or upload the recording. The agent extracts open questions,
              generates a personalised PDF, and queues it for your review before sending.
            </p>

            {/* Transcript input */}
            <Tabs value={transcriptMode} onValueChange={(v) => setTranscriptMode(v as 'text' | 'audio')}>
              <TabsList className="w-full">
                <TabsTrigger value="text" className="flex-1 text-xs gap-1.5">
                  <FileText className="w-3.5 h-3.5" />Text Transcript
                </TabsTrigger>
                <TabsTrigger value="audio" className="flex-1 text-xs gap-1.5">
                  <Mic className="w-3.5 h-3.5" />Audio Recording
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-2 pt-2">
                <Label className="text-foreground text-xs">Paste call transcript</Label>
                <Textarea
                  value={transcriptText}
                  onChange={(e) => { setTranscriptText(e.target.value); setTranscriptSaved(false) }}
                  placeholder="BDA: Rohan, what's bringing you to Scaler?&#10;Rohan: I've been at TCS for 4 years..."
                  className="text-sm h-36 resize-none font-mono"
                />
              </TabsContent>

              <TabsContent value="audio" className="space-y-3 pt-2">
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors duration-150"
                  onClick={() => document.getElementById('audio-input')?.click()}
                >
                  <Upload className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">
                    {audioFile ? audioFile.name : 'Click to upload MP3 / WAV / M4A'}
                  </p>
                  <p className="text-muted-foreground/60 text-xs mt-1">Transcribed by Deepgram Nova-3</p>
                  <input
                    id="audio-input"
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => { setAudioFile(e.target.files?.[0] || null); setTranscriptSaved(false) }}
                  />
                </div>
                {audioFile && (
                  <Button
                    onClick={handleTranscribeAudio}
                    disabled={transcribing}
                    variant="outline"
                    className="w-full text-sm"
                  >
                    {transcribing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Transcribing...</> : 'Transcribe Audio'}
                  </Button>
                )}
                {transcriptText && (
                  <div className="bg-muted rounded-lg p-3 border border-border max-h-32 overflow-y-auto">
                    <p className="text-xs text-muted-foreground mb-1">Transcript preview</p>
                    <p className="text-foreground text-xs">{transcriptText.slice(0, 400)}{transcriptText.length > 400 ? '...' : ''}</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {transcriptText && !transcriptSaved && (
              <Button
                onClick={handleSaveTranscript}
                variant="outline"
                className="w-full text-sm gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Save Transcript
              </Button>
            )}

            {transcriptSaved && (
              <Badge variant="outline" className="border-[var(--color-sage)]/40 text-[var(--color-sage)] text-xs gap-1 w-fit">
                <CheckCircle className="w-3 h-3" />Transcript saved
              </Badge>
            )}

            <Button
              onClick={handleGeneratePDF}
              disabled={!transcriptSaved || pdfLoading}
              className="w-full font-semibold text-sm gap-2"
            >
              {pdfLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Generating PDF (1–2 min)...</>
                : 'Generate Post-call PDF'
              }
            </Button>

            {pdfDraftId && (
              <Button
                variant="outline"
                onClick={() => router.push(`/approval/${pdfDraftId}`)}
                className="w-full border-[var(--color-clay)]/40 text-[var(--color-clay)] text-sm gap-2"
              >
                View & Approve PDF <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
