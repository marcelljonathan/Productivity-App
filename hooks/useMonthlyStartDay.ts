"use client"

import { useProfileContext } from "@/components/providers/ProfileProvider"

export function useMonthlyStartDay() {
  const { profile, updateProfile } = useProfileContext()
  const startDay = profile.finance_monthly_start_day ?? 1

  async function setStartDay(day: number) {
    const clamped = Math.min(Math.max(Math.round(day), 1), 28)
    await updateProfile({ finance_monthly_start_day: clamped })
  }

  return { startDay, setStartDay }
}
