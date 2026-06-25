"use client"

import { useState, useEffect } from "react"

const KEY = 'finance_monthly_start_day'

export function useMonthlyStartDay() {
  const [startDay, setStartDayState] = useState(1)

  useEffect(() => {
    const stored = localStorage.getItem(KEY)
    if (stored) {
      const n = parseInt(stored, 10)
      if (n >= 1 && n <= 28) setStartDayState(n)
    }
  }, [])

  function setStartDay(day: number) {
    const clamped = Math.min(Math.max(Math.round(day), 1), 28)
    setStartDayState(clamped)
    localStorage.setItem(KEY, String(clamped))
  }

  return { startDay, setStartDay }
}
