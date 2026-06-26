"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export type Profile = {
  display_name: string | null
  timezone: string
  theme: 'light' | 'dark'
  finance_monthly_start_day: number
}

const DEFAULT: Profile = { display_name: null, timezone: 'auto', theme: 'light', finance_monthly_start_day: 1 }

export function useProfile(userId: string) {
  const [profile, setProfile] = useState<Profile>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, timezone, theme, finance_monthly_start_day')
        .eq('id', userId)
        .single()
      if (data) setProfile(data as Profile)
      setLoading(false)
    }
    load()
  }, [userId])

  async function updateProfile(updates: Partial<Profile>) {
    const next = { ...profile, ...updates }
    setProfile(next)
    await supabase.from('profiles').upsert({
      id: userId,
      ...next,
      updated_at: new Date().toISOString(),
    })
  }

  return { profile, loading, updateProfile }
}
