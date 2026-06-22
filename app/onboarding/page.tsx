"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const RAW_TIMEZONES: string[] =
  typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl
    ? (Intl as any).supportedValuesOf('timeZone')
    : ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Jakarta', 'Asia/Singapore', 'Asia/Tokyo']

function getOffsetMinutes(tz: string): number {
  try {
    const now = new Date()
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    }).formatToParts(now)
    const offsetStr = parts.find(p => p.type === 'timeZoneName')?.value ?? 'GMT+0'
    const match = offsetStr.match(/GMT([+-])(\d+)(?::(\d+))?/)
    if (!match) return 0
    const sign = match[1] === '+' ? 1 : -1
    return sign * (parseInt(match[2]) * 60 + parseInt(match[3] ?? '0'))
  } catch {
    return 0
  }
}

function formatTimezone(tz: string): string {
  try {
    const offset = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value ?? ''
    return `${tz} (${offset})`
  } catch {
    return tz
  }
}

const TIMEZONES = [...RAW_TIMEZONES].sort((a, b) => getOffsetMinutes(a) - getOffsetMinutes(b))

const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [displayName, setDisplayName] = useState("")
  const [timezone, setTimezone] = useState(detectedTimezone)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single()

      if (profile?.display_name) router.push('/')
    }
    check()
  }, [])

  async function handleFinish() {
    if (!displayName.trim()) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: displayName.trim(),
      timezone,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      setSaveError(error.message)
      setSaving(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm space-y-8">

        <div className="space-y-2 text-center">
          <div className="flex gap-1.5 justify-center">
            <div className={`h-1 w-12 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-1 w-12 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
          <p className="text-xs text-muted-foreground">Step {step} of 2</p>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold">What should we call you?</h1>
              <p className="text-sm text-muted-foreground">
                This shows as "[name]'s Domain" in your sidebar.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="e.g. John"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && displayName.trim() && setStep(2)}
              />
            </div>

            <Button
              className="w-full"
              onClick={() => setStep(2)}
              disabled={!displayName.trim()}
            >
              Next
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold">Where are you located?</h1>
              <p className="text-sm text-muted-foreground">
                Used for accurate streak tracking and day boundaries.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full border border-gray-400 rounded-md px-3 py-2 text-sm bg-background text-foreground"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz} value={tz}>{formatTimezone(tz)}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Auto-detected: {detectedTimezone}</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleFinish} disabled={saving} className="flex-1">
                {saving ? 'Saving...' : 'Finish'}
              </Button>
            </div>
            {saveError && (
              <p className="text-sm text-red-600 text-center">{saveError}</p>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
