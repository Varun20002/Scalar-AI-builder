'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft, CheckCircle, X, Edit3, RefreshCw, Loader2,
  Send, Eye, FileText
} from 'lucide-react'
import { toast } from 'sonner'

interface PDFSection {
  id: string
  heading: string
  body: string
  kb_citations: string[]
  section_type: string
}

interface Draft {
  id: string
  lead_id: string
  sections_json: PDFSection[]
  cover_message: string
  pdf_url: string | null
  persona_type: string
  status: string
}

export default function ApprovalPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [draft, setDraft] = useState<Draft | null>(null)
  const [lead, setLead] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  const [coverMessage, setCoverMessage] = useState('')
  const [editingCover, setEditingCover] = useState(false)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [sectionBody, setSectionBody] = useState('')
  const [regenerateNote, setRegenerateNote] = useState('')
  const [sectionLoading, setSectionLoading] = useState<string | null>(null)

  const [leadPhone, setLeadPhone] = useState('')
  const [approving, setApproving] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [approved, setApproved] = useState(false)

  const fetchDraft = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/leads')
    const data = await res.json()
    for (const l of (data.leads || [])) {
      const d = (l.pdf_drafts || []).find((d: Draft) => d.id === id)
      if (d) {
        setDraft(d)
        setCoverMessage(d.cover_message || '')
        setLead(l)
        setLeadPhone(l.lead_phone || '')
        if (d.status === 'approved') setApproved(true)
        break
      }
    }
    setLoading(false)
  }, [id])

  useEffect(() => { fetchDraft() }, [fetchDraft])

  async function handleEditSection(section: PDFSection) {
    setEditingSection(section.id)
    setSectionBody(section.body)
    setRegenerateNote('')
  }

  async function handleSaveSection(sectionId: string) {
    setSectionLoading(sectionId)
    try {
      const res = await fetch('/api/pdf/edit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft_id: id, section_id: sectionId, new_body: sectionBody }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setDraft(data.draft)
      setCoverMessage(data.draft.cover_message || '')
      setEditingSection(null)
      toast.success('Section updated, PDF re-rendered')
    } catch (err) {
      toast.error(String(err))
    } finally {
      setSectionLoading(null)
    }
  }

  async function handleRegenerateSection(sectionId: string) {
    if (!regenerateNote.trim()) { toast.error('Add a note for regeneration'); return }
    setSectionLoading(sectionId)
    try {
      const res = await fetch('/api/pdf/edit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft_id: id, section_id: sectionId, regenerate_note: regenerateNote }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setDraft(data.draft)
      setEditingSection(null)
      toast.success('Section regenerated!')
    } catch (err) {
      toast.error(String(err))
    } finally {
      setSectionLoading(null)
    }
  }

  async function handleSaveCover() {
    try {
      const res = await fetch('/api/pdf/edit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft_id: id, cover_message: coverMessage }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setEditingCover(false)
      toast.success('Cover message updated')
    } catch (err) {
      toast.error(String(err))
    }
  }

  async function handleApprove() {
    if (!leadPhone.trim()) { toast.error('Enter the lead\'s WhatsApp number'); return }
    setApproving(true)
    try {
      const res = await fetch('/api/pdf/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft_id: id, lead_phone: leadPhone, cover_message: coverMessage }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setApproved(true)
      toast.success('PDF sent to lead\'s WhatsApp!')
    } catch (err) {
      toast.error(String(err))
    } finally {
      setApproving(false)
    }
  }

  async function handleSkip() {
    setSkipping(true)
    try {
      const res = await fetch('/api/pdf/approve', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft_id: id }),
      })
      await res.json()
      toast.success('Draft skipped')
      router.push('/dashboard')
    } catch (err) {
      toast.error(String(err))
    } finally {
      setSkipping(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    )
  }

  if (!draft) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Draft not found
      </div>
    )
  }

  const sections = (draft.sections_json || []) as PDFSection[]

  return (
    <div className="min-h-screen bg-background">
      {/* Floating header */}
      <div className="border-b border-border bg-background/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => router.push(`/lead/${draft.lead_id}`)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-foreground font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Review PDF</h1>
            <p className="text-muted-foreground text-xs">
              {lead ? (lead.name as string) : ''} · {draft.persona_type} theme
            </p>
          </div>
          <Badge variant="outline" className={
            approved ? 'border-[var(--color-sage)]/40 text-[var(--color-sage)] text-xs' :
            draft.status === 'edited' ? 'border-[var(--color-slate-blue)]/40 text-[var(--color-slate-blue)] text-xs' :
            'border-primary/40 text-primary text-xs'
          }>
            {approved ? 'Sent' : draft.status}
          </Badge>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: PDF Preview */}
          <div className="space-y-4">
            <h2 className="text-foreground font-semibold text-sm flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <Eye className="w-4 h-4 text-[var(--color-clay)]" />
              PDF Preview
            </h2>
            {draft.pdf_url ? (
              <div className="rounded-lg overflow-hidden border border-border bg-muted">
                <iframe
                  src={draft.pdf_url}
                  className="w-full h-[600px]"
                  title="PDF Preview"
                />
                <div className="p-2 bg-card border-t border-border flex gap-2">
                  <a
                    href={draft.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--color-clay)] hover:text-[var(--terracotta-dark)] flex items-center gap-1 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />Open full PDF
                  </a>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-muted h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                No PDF generated yet
              </div>
            )}
          </div>

          {/* Right: Controls */}
          <div className="space-y-4">
            {/* Cover message */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground text-sm">WhatsApp Cover Message</CardTitle>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => setEditingCover(!editingCover)}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {editingCover ? (
                  <>
                    <Textarea
                      value={coverMessage}
                      onChange={(e) => setCoverMessage(e.target.value)}
                      className="text-sm h-24 resize-none"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveCover}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingCover(false)} className="text-muted-foreground">Cancel</Button>
                    </div>
                  </>
                ) : (
                  <p className="text-foreground text-sm whitespace-pre-wrap leading-relaxed">{coverMessage}</p>
                )}
              </CardContent>
            </Card>

            {/* Sections */}
            <div className="space-y-2">
              <h3 className="text-muted-foreground text-xs uppercase tracking-wider">PDF Sections ({sections.length})</h3>
              {sections.map((section) => (
                <Card key={section.id}>
                  <CardContent className="py-3 px-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-foreground text-xs font-semibold">{section.heading}</p>
                        <Badge variant="outline" className="border-border text-muted-foreground text-xs mt-0.5">{section.section_type}</Badge>
                      </div>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground flex-shrink-0"
                        onClick={() => editingSection === section.id ? setEditingSection(null) : handleEditSection(section)}
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                    </div>

                    {editingSection === section.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={sectionBody}
                          onChange={(e) => setSectionBody(e.target.value)}
                          className="text-xs h-28 resize-none"
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleSaveSection(section.id)}
                            disabled={sectionLoading === section.id}
                            className="text-xs h-7"
                          >
                            {sectionLoading === section.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingSection(null)} className="text-muted-foreground text-xs h-7">Cancel</Button>
                        </div>
                        <Separator />
                        <div className="space-y-1.5">
                          <Label className="text-muted-foreground text-xs">Regenerate with note</Label>
                          <div className="flex gap-1">
                            <Input
                              value={regenerateNote}
                              onChange={(e) => setRegenerateNote(e.target.value)}
                              placeholder="Make this more reassuring..."
                              className="text-xs h-7"
                            />
                            <Button
                              size="icon-sm"
                              onClick={() => handleRegenerateSection(section.id)}
                              disabled={sectionLoading === section.id}
                              variant="outline"
                              className="h-7 px-2 border-[var(--color-clay)]/40 text-[var(--color-clay)] hover:bg-[var(--color-clay)]/10"
                            >
                              {sectionLoading === section.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-xs line-clamp-2">{section.body.slice(0, 120)}...</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator />

            {/* Lead phone + action buttons */}
            {!approved ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-foreground text-xs">Lead&apos;s WhatsApp Number</Label>
                  <Input
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleApprove}
                    disabled={approving || !leadPhone}
                    className="flex-1 gap-2"
                  >
                    {approving ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</> : <><Send className="w-4 h-4" />Approve & Send</>}
                  </Button>
                  <Button
                    onClick={handleSkip}
                    disabled={skipping}
                    variant="outline"
                    className="gap-2"
                  >
                    {skipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    Skip
                  </Button>
                </div>
                <p className="text-muted-foreground/60 text-xs text-center">
                  ⚠ Nothing is sent until you click Approve
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-[var(--color-sage)]/10 border border-[var(--color-sage)]/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-[var(--color-sage)]" />
                <p className="text-[var(--color-sage)] text-sm font-medium">PDF sent to lead&apos;s WhatsApp</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
