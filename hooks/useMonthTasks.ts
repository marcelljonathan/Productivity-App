"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Task } from "@/lib/types"

export function useMonthTasks(yearMonth: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const [year, month] = yearMonth.split('-').map(Number)
    const firstDay = `${yearMonth}-01`
    const lastDay = new Date(year, month, 0).toISOString().split('T')[0]

    const supabase = createClient()
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .gte('date', firstDay)
      .lte('date', lastDay)
      .neq('status', 'moved')
      .order('date', { ascending: true })

    if (data) setTasks(data as Task[])
    setLoading(false)
  }, [yearMonth])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const tasksByDate = tasks.reduce<Record<string, Task[]>>((acc, task) => {
    if (!acc[task.date]) acc[task.date] = []
    acc[task.date].push(task)
    return acc
  }, {})

  return { tasks, tasksByDate, loading, fetchTasks }
}
