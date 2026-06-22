"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Task } from "@/lib/types"
import { sortTasks } from "@/lib/utils/sort"

export function useTasks(date: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchTasks()
  }, [date])

  async function fetchTasks() {
    setLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('date', date)
      .neq('status', 'moved')

    if (data) setTasks(sortTasks(data))
    setLoading(false)
  }

  async function updateTaskStatus(id: string, status: Task['status'], extra?: Partial<Task>) {
    await supabase
      .from('tasks')
      .update({ status, updated_at: new Date().toISOString(), ...extra })
      .eq('id', id)

    fetchTasks()
  }

  return { tasks, loading, fetchTasks, updateTaskStatus }
}
