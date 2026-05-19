'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Plus, User, FileText, ChevronRight, Phone, Upload, Loader2, Settings } from 'lucide-react'
import { toast } from 'sonner'

interface Lead {
  id: string
  name: string
  stage: string
  profile_json: Record<string, string>
  created_at: string
  nudges?: Array<{ id: string }>
  pdf_drafts?: Array<{ id: string; status: string }>
}

const SAMPLE_PROFILES = {
  rohan: {
    name: 'Rohan Sharma',
    profile: {
      name: 'Rohan Sharma',
      current_role: 'Software Engineer, TCS',
      years_of_experience: '4',
      intent: 'Want to switch to a product company, tired of service work, interested in AI engineering roles',
      linkedin_summary: 'B.Tech CSE VIT Vellore 2020, SDE-2 at TCS for 4 years (banking clients: HDFC, Citi), recent AWS Solutions Architect cert',
      current_package_lpa: '14',
    },
  },
  karthik: {
    name: 'Karthik Iyer',
    profile: {
      name: 'Karthik Iyer',
      current_role: 'Senior Software Engineer, Google',
      years_of_experience: '9',
      intent: 'Looking at AI engineering — exploring what Scaler offers for someone at my level',
      linkedin_summary: 'IIT Madras CS, 6 years at Google (Search infra), previously Microsoft, frequent open-source contributor',
      current_package_lpa: '60',
    },
  },
  meera: {
    name: 'Meera Patel',
    profile: {
      name: 'Meera Patel',
      current_role: 'Final-year B.Tech student',
      years_of_experience: '0',
      intent: 'Need a job, family wants me to take the govt job offer but I want to work at a product company',
      linkedin_summary: 'none provided',
      current_package_lpa: '0',
    },
  },
}

export default function DashboardPage() {
  const router = useRouter()
  const [bdaPhone, setBdaPhone] = useState('')
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [profileMode, setProfileMode] = useState<'form' | 'json'>('form')

  // Form state
  const [formName, setFormName] = useState('')
  const [formRole, setFormRole] = useState('')
  const [formYoe, setFormYoe] = useState('')
  const [formIntent, setFormIntent] = useState('')
  const [formLinkedin, setFormLinkedin] = useState('')
  const [formPackage, setFormPackage] = useState('')
  const [formLeadPhone, setFormLeadPhone] = useState('')
  const [formJson, setFormJson] = useState('')
  const [jsonError, setJsonError] = useState('')

  const fetchLeads = useCallback(async () => {
    const res = await fetch('/api/leads')
    const data = await res.json()
    if (data.leads) setLeads(data.leads)
  }, [])

  useEffect(() => {
    const phone = localStorage.getItem('bda_phone')
    if (!phone) { router.push('/'); return }
    setBdaPhone(phone)
    fetchLeads()
  }, [router, fetchLeads])

  function loadSample(key: keyof typeof SAMPLE_PROFILES) {
    const s = SAMPLE_PROFILES[key]
    setFormName(s.profile.name)
    setFormRole(s.profile.current_role)
    setFormYoe(s.profile.years_of_experience)
    setFormIntent(s.profile.intent)
    setFormLinkedin(s.profile.linkedin_summary)
    setFormPackage(s.profile.current_package_lpa)
    setProfileMode('form')
    toast.success(`Loaded ${s.name}'s profile`)
  }

  async function handleCreateLead() {
    let profileJson: Record<string, string> = {}

    if (profileMode === 'json') {
      try {
        profileJson = JSON.parse(formJson)
        setJsonError('')
      } catch {
        setJsonError('Invalid JSON')
        return
      }
    } else {
      if (!formName) { toast.error('Name is required'); return }
      profileJson = {
        name: formName,
        current_role: formRole,
        years_of_experience: formYoe,
        intent: formIntent,
        linkedin_summary: formLinkedin,
        current_package_lpa: formPackage,
      }
    }

    const name = profileJson.name || formName
    if (!name) { toast.error('Profile must include a name'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          profile_json: profileJson,
          bda_phone: bdaPhone,
          lead_phone: formLeadPhone || profileJson.phone || null,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      toast.success(`Lead "${name}" created!`)
      setShowForm(false)
      resetForm()
      fetchLeads()
      router.push(`/lead/${data.lead.id}`)
    } catch (err) {
      toast.error(String(err))
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormName(''); setFormRole(''); setFormYoe('')
    setFormIntent(''); setFormLinkedin(''); setFormPackage('')
    setFormLeadPhone(''); setFormJson('')
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-amber-500/20 flex items-center justify-center">
              <span className="text-amber-400 font-black text-sm">S</span>
            </div>
            <span className="text-white font-semibold">BDA Agent</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-green-500/40 text-green-400 text-xs gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              {bdaPhone}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              className="text-slate-400 hover:text-white"
              onClick={() => router.push('/')}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Create Lead */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Leads</h1>
            <p className="text-slate-500 text-sm">{leads.length} total</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold gap-2"
          >
            <Plus className="w-4 h-4" />
            New Lead
          </Button>
        </div>

        {/* Create Lead Form */}
        {showForm && (
          <Card className="bg-slate-800/60 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base">Create Lead</CardTitle>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="text-slate-500 text-xs">Quick load:</span>
                {Object.keys(SAMPLE_PROFILES).map((key) => (
                  <button
                    key={key}
                    onClick={() => loadSample(key as keyof typeof SAMPLE_PROFILES)}
                    className="text-xs text-amber-400 hover:text-amber-300 underline"
                  >
                    {SAMPLE_PROFILES[key as keyof typeof SAMPLE_PROFILES].name}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={profileMode} onValueChange={(v) => setProfileMode(v as 'form' | 'json')}>
                <TabsList className="bg-slate-700/50 w-full">
                  <TabsTrigger value="form" className="flex-1 text-xs">Form Fields</TabsTrigger>
                  <TabsTrigger value="json" className="flex-1 text-xs">Paste JSON</TabsTrigger>
                </TabsList>
                <TabsContent value="form" className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-slate-300 text-xs">Name *</Label>
                      <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Rohan Sharma" className="bg-slate-700/50 border-slate-600 text-white text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-slate-300 text-xs">Current Role / Company</Label>
                      <Input value={formRole} onChange={(e) => setFormRole(e.target.value)} placeholder="SDE-2 at TCS" className="bg-slate-700/50 border-slate-600 text-white text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-slate-300 text-xs">Years of Experience</Label>
                      <Input value={formYoe} onChange={(e) => setFormYoe(e.target.value)} placeholder="4" className="bg-slate-700/50 border-slate-600 text-white text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-slate-300 text-xs">Current Package (LPA)</Label>
                      <Input value={formPackage} onChange={(e) => setFormPackage(e.target.value)} placeholder="14" className="bg-slate-700/50 border-slate-600 text-white text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-300 text-xs">Intent / What brought them to Scaler</Label>
                    <Textarea value={formIntent} onChange={(e) => setFormIntent(e.target.value)} placeholder="Want to switch to product, interested in AI roles..." className="bg-slate-700/50 border-slate-600 text-white text-sm h-20 resize-none" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-300 text-xs">LinkedIn Summary (paste relevant info)</Label>
                    <Textarea value={formLinkedin} onChange={(e) => setFormLinkedin(e.target.value)} placeholder="B.Tech CSE VIT 2020, 4 years at TCS banking team, AWS cert..." className="bg-slate-700/50 border-slate-600 text-white text-sm h-16 resize-none" />
                  </div>
                </TabsContent>
                <TabsContent value="json" className="space-y-2 pt-2">
                  <Textarea
                    value={formJson}
                    onChange={(e) => { setFormJson(e.target.value); setJsonError('') }}
                    placeholder={'{\n  "name": "Rohan Sharma",\n  "current_role": "SDE-2, TCS",\n  "years_of_experience": "4",\n  "intent": "switch to product company"\n}'}
                    className="bg-slate-700/50 border-slate-600 text-white text-sm h-40 resize-none font-mono"
                  />
                  {jsonError && <p className="text-red-400 text-xs">{jsonError}</p>}
                </TabsContent>
              </Tabs>

              <Separator className="bg-slate-700" />

              <div className="space-y-1">
                <Label className="text-slate-300 text-xs">Lead&apos;s WhatsApp Number (for PDF delivery)</Label>
                <Input value={formLeadPhone} onChange={(e) => setFormLeadPhone(e.target.value)} placeholder="+91 9876543210" className="bg-slate-700/50 border-slate-600 text-white text-sm" />
              </div>

              <div className="flex gap-2 pt-1">
                <Button onClick={handleCreateLead} disabled={loading} className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create Lead & Continue'}
                </Button>
                <Button variant="outline" onClick={() => { setShowForm(false); resetForm() }} className="border-slate-600 text-slate-300">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leads List */}
        <div className="space-y-2">
          {leads.length === 0 && (
            <div className="text-center py-16 text-slate-500">
              <User className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No leads yet. Create one to get started.</p>
            </div>
          )}
          {leads.map((lead) => (
            <button
              key={lead.id}
              onClick={() => router.push(`/lead/${lead.id}`)}
              className="w-full text-left"
            >
              <Card className="bg-slate-800/40 border-slate-700 hover:bg-slate-800/80 hover:border-slate-600 transition-all cursor-pointer">
                <CardContent className="py-4 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-semibold text-sm">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{lead.name}</p>
                      <p className="text-slate-500 text-xs">
                        {(lead.profile_json?.current_role as string) || 'No role specified'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={lead.stage === 'post_call'
                        ? 'border-green-500/40 text-green-400 text-xs'
                        : 'border-amber-500/40 text-amber-400 text-xs'
                      }
                    >
                      {lead.stage === 'post_call' ? 'Post-call' : 'Pre-call'}
                    </Badge>
                    {lead.nudges && lead.nudges.length > 0 && (
                      <Badge variant="outline" className="border-blue-500/40 text-blue-400 text-xs gap-1">
                        <Phone className="w-3 h-3" />Nudge sent
                      </Badge>
                    )}
                    {lead.pdf_drafts && lead.pdf_drafts.length > 0 && (
                      <Badge variant="outline" className="border-purple-500/40 text-purple-400 text-xs gap-1">
                        <FileText className="w-3 h-3" />PDF
                      </Badge>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>

        {/* Compare link */}
        {leads.length >= 2 && (
          <div className="text-center pt-4">
            <button
              onClick={() => {
                const ids = leads.slice(0, 3).map((l) => {
                  const draft = l.pdf_drafts?.[0]
                  return draft?.id
                }).filter(Boolean)
                if (ids.length < 2) { toast.error('Generate PDFs for at least 2 leads first'); return }
                router.push(`/compare?ids=${ids.join(',')}`)
              }}
              className="text-xs text-slate-500 hover:text-amber-400 underline transition-colors"
            >
              Compare PDFs side-by-side →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
