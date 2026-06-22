"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Subtask } from "@/lib/types"

export function useSubtasks(taskId: string | null) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSubtasks = useCallback(async () => {
    if (!taskId) { setLoading(false); return }
    const supabase = createClient()
    const { data } = await supabase
      .from('subtasks')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    if (data) setSubtasks(data as Subtask[])
    setLoading(false)
  }, [taskId])

  useEffect(() => {
    fetchSubtasks()
  }, [fetchSubtasks])

  async function addSubtask(title: string) {
    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()
    await supabase.from('subtasks').insert({
      task_id: taskId,
      user_id: userData.user?.id,
      title,
      done: false,
    })
    await fetchSubtasks()
  }

  async function toggleSubtask(subtaskId: string, done: boolean): Promise<Subtask[]> {
    const supabase = createClient()
    await supabase.from('subtasks').update({ done }).eq('id', subtaskId)

    const { data } = await supabase
      .from('subtasks')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    const updated = (data as Subtask[]) || []
    setSubtasks(updated)
    return updated
  }

  return { subtasks, loading, addSubtask, toggleSubtask }
}
