"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Task } from "@/lib/types"
import { computeStreak, computeLongestStreak, buildDayHistory, DayRecord } from "@/lib/utils/streak"
import { getTodayLocalDate } from "@/lib/utils/timezone"

export function useStreak() {
  const [streak, setStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const [history, setHistory] = useState<DayRecord[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchStreak()
  }, [])

  async function fetchStreak() {
    const today = getTodayLocalDate()

    const { data } = await supabase
      .from('tasks')
      .select('*')
      .lte('date', today)

    if (data) {
      const tasks = data as Task[]
      setStreak(computeStreak(tasks, today))
      setLongestStreak(computeLongestStreak(tasks, today))
      setHistory(buildDayHistory(tasks, today))
    }

    setLoading(false)
  }

  return { streak, longestStreak, history, loading, refresh: fetchStreak }
}
