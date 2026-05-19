'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Loader2, FileText } from 'lucide-react'

interface DraftInfo {
  id: string
  pdf_url: string | null
  persona_type: string
  lead_name: string
}

function CompareContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const idsParam = searchParams.get('ids') || ''
  const ids = idsParam.split(',').filter(Boolean)

  const [drafts, setDrafts] = useState<DraftInfo[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDrafts = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/leads')
    const data = await res.json()
    const found: DraftInfo[] = []

    for (const lead of (data.leads || [])) {
      for (const draft of (lead.pdf_drafts || [])) {
        if (ids.includes(draft.id)) {
          found.push({
            id: draft.id,
            pdf_url: draft.pdf_url,
            persona_type: draft.persona_type,
            lead_name: lead.name,
          })
        }
      }
    }

    setDrafts(found)
    setLoading(false)
  }, [ids])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchDrafts() }, [fetchDrafts])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-white font-semibold">PDF Comparison</h1>
            <p className="text-slate-500 text-xs">{drafts.length} PDFs side-by-side</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {drafts.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No PDFs found for the given IDs.</p>
            <p className="text-xs mt-1">Generate PDFs for your leads first.</p>
          </div>
        ) : (
          <div className={`grid gap-4 ${drafts.length === 1 ? 'grid-cols-1' : drafts.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {drafts.map((draft) => (
              <div key={draft.id} className="space-y-2">
                <Card className="bg-slate-800/40 border-slate-700">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold text-sm">{draft.lead_name}</p>
                      <p className="text-slate-500 text-xs capitalize">{draft.persona_type} theme</p>
                    </div>
                    {draft.pdf_url && (
                      <a
                        href={draft.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-400 hover:text-purple-300"
                      >
                        Open →
                      </a>
                    )}
                  </CardContent>
                </Card>
                {draft.pdf_url ? (
                  <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
                    <iframe
                      src={draft.pdf_url}
                      className="w-full h-[700px]"
                      title={`${draft.lead_name} PDF`}
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-700 bg-slate-900 h-[400px] flex items-center justify-center text-slate-500 text-sm">
                    No PDF
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    }>
      <CompareContent />
    </Suspense>
  )
}
