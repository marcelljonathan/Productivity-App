"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useProfileContext } from "@/components/providers/ProfileProvider"
import { changePassword, deleteAccount } from "@/app/actions/account"
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
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date())
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

export default function SettingsPage() {
  const { profile, loading, updateProfile } = useProfileContext()
  const router = useRouter()

  const [displayName, setDisplayName] = useState("")
  const [timezone, setTimezone] = useState("auto")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!loading) {
      setDisplayName(profile.display_name ?? "")
      setTimezone(profile.timezone)
    }
  }, [loading])

  async function handleSaveProfile() {
    await updateProfile({ display_name: displayName.trim() || null, timezone })
    setProfileMsg({ type: 'success', text: 'Saved.' })
    setTimeout(() => setProfileMsg(null), 3000)
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Minimum 6 characters.' })
      return
    }
    try {
      await changePassword(newPassword)
      setPasswordMsg({ type: 'success', text: 'Password changed.' })
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setPasswordMsg(null), 3000)
    } catch (e: any) {
      setPasswordMsg({ type: 'error', text: e.message })
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'DELETE') return
    try {
      await deleteAccount()
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
    } catch (e: any) {
      setDeleteMsg(e.message)
    }
  }

  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  return (
    <div className="max-w-lg mx-auto space-y-10">
      <h1 className="text-xl font-semibold">Settings</h1>

      {/* Profile */}
      <section className="space-y-4">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Profile</h2>

        <div className="space-y-1.5">
          <Label htmlFor="display-name">Display Name</Label>
          <p className="text-xs text-muted-foreground">Shows as "[name]'s Domain" in the sidebar.</p>
          <Input
            id="display-name"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="e.g. John"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="timezone">Timezone</Label>
          <select
            id="timezone"
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
            className="w-full border border-gray-400 rounded-md px-3 py-2 text-sm bg-background text-foreground"
          >
            <option value="auto">Auto-detect ({detectedTimezone})</option>
            {TIMEZONES.map(tz => (
              <option key={tz} value={tz}>{formatTimezone(tz)}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSaveProfile}>Save</Button>
          {profileMsg && (
            <span className={`text-sm ${profileMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {profileMsg.text}
            </span>
          )}
        </div>
      </section>

      {/* Appearance */}
      <section className="space-y-4">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-xs text-muted-foreground">
              Currently {profile.theme === 'dark' ? 'dark' : 'light'} mode.
            </p>
          </div>
          <button
            onClick={() => updateProfile({ theme: profile.theme === 'dark' ? 'light' : 'dark' })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              profile.theme === 'dark' ? 'bg-primary' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                profile.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Security */}
      <section className="space-y-4">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Security</h2>

        <div className="space-y-1.5">
          <Label htmlFor="new-password">New Password</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="New password"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleChangePassword} disabled={!newPassword || !confirmPassword}>
            Change Password
          </Button>
          {passwordMsg && (
            <span className={`text-sm ${passwordMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {passwordMsg.text}
            </span>
          )}
        </div>
      </section>

      {/* Danger Zone */}
      <section className="space-y-4">
        <h2 className="text-xs font-medium text-red-500 uppercase tracking-widest">Danger Zone</h2>
        <div className="border border-red-200 rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium">Delete Account</p>
          <p className="text-xs text-muted-foreground">
            Permanently deletes your account and all data. Type <strong>DELETE</strong> to confirm.
          </p>
          <Input
            value={deleteConfirm}
            onChange={e => setDeleteConfirm(e.target.value)}
            placeholder="Type DELETE to confirm"
          />
          <Button
            variant="destructive"
            disabled={deleteConfirm !== 'DELETE'}
            onClick={handleDeleteAccount}
          >
            Delete Account
          </Button>
          {deleteMsg && <p className="text-sm text-red-600">{deleteMsg}</p>}
        </div>
      </section>
    </div>
  )
}
