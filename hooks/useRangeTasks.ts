"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Task } from "@/lib/types"

export function useRangeTasks(startDate: string, endDate: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .neq('status', 'moved')
      .order('date', { ascending: true })
    if (data) setTasks(data as Task[])
    setLoading(false)
  }, [startDate, endDate])

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
