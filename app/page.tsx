'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, CheckCircle, Phone, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

const SANDBOX_CODE = process.env.NEXT_PUBLIC_TWILIO_SANDBOX_CODE || 'join your-sandbox-code'
const SANDBOX_NUMBER = '+14155238886'

export default function OnboardingPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const storedPhone = localStorage.getItem('bda_phone')
    if (storedPhone) {
      setPhone(storedPhone)
      setSaved(true)
    }
  }, [])

  const waJoinLink = `https://wa.me/${SANDBOX_NUMBER.replace('+', '')}?text=${encodeURIComponent(SANDBOX_CODE)}`

  function handleSave() {
    if (!phone.trim()) {
      toast.error('Please enter your phone number')
      return
    }
    setLoading(true)
    const normalised = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '').slice(-10)}`
    localStorage.setItem('bda_phone', normalised)
    setSaved(true)
    setLoading(false)
    toast.success('Phone number saved!')
  }

  function handleContinue() {
    if (!saved) {
      toast.error('Save your phone number first')
      return
    }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-4">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-primary text-sm font-medium" style={{ fontFamily: 'var(--font-sans)' }}>Scaler BDA Agent</span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            Set up your WhatsApp
          </h1>
          <p className="text-muted-foreground text-base">
            Your pre-call briefs and lead PDFs are sent here
          </p>
        </div>

        {/* Step 1: Join sandbox */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm">1</div>
              <div>
                <CardTitle className="text-foreground text-base">Join the WhatsApp Sandbox</CardTitle>
                <CardDescription className="text-muted-foreground text-sm">
                  Tap the button to open WhatsApp — it will pre-fill the join message
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-muted rounded-lg p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Message to send</p>
              <div className="flex items-center justify-between">
                <code className="text-[var(--color-sage)] text-sm font-mono">{SANDBOX_CODE}</code>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => { navigator.clipboard.writeText(SANDBOX_CODE); toast.success('Copied!') }}
                >
                  Copy
                </Button>
              </div>
            </div>
            <a href={waJoinLink} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                className="w-full gap-2 border-[var(--color-sage)] text-[var(--color-sage)] hover:bg-[var(--color-sage)]/10"
              >
                <MessageSquare className="w-4 h-4" />
                Open WhatsApp to Join
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
            <p className="text-xs text-muted-foreground text-center">
              To: {SANDBOX_NUMBER} · This is a dev sandbox — free to use
            </p>
          </CardContent>
        </Card>

        {/* Step 2: Phone number */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm">2</div>
              <div>
                <CardTitle className="text-foreground text-base">Enter your phone number</CardTitle>
                <CardDescription className="text-muted-foreground text-sm">
                  The same number you joined the sandbox with
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Your WhatsApp number</Label>
              <div className="flex gap-2">
                <div className="flex items-center bg-muted border border-border rounded-md px-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                </div>
                <Input
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setSaved(false) }}
                  className="flex-1"
                />
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={loading || !phone}
              className="w-full"
            >
              {saved ? (
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Saved
                </span>
              ) : 'Save Phone Number'}
            </Button>
          </CardContent>
        </Card>

        {/* Continue */}
        <Button
          onClick={handleContinue}
          disabled={!saved}
          size="lg"
          className="w-full"
        >
          Continue to Dashboard →
        </Button>

        {saved && (
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="border-[var(--color-sage)]/50 text-[var(--color-sage)] text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />
              {phone}
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
}
