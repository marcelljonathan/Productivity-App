"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Task } from "@/lib/types"
import { formatLocalDate } from "@/lib/utils/timezone"

type WeekGroup = {
  weekLabel: string
  days: {
    date: string
    tasks: Task[]
  }[]
}

function getWeekLabel(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const dayOfWeek = date.getDay()
  const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  const monday = new Date(date.setDate(diff))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(monday)} – ${fmt(sunday)}`
}

export default function LogPage() {
  const [failedTasks, setFailedTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchFailed() {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'failed')
        .order('date', { ascending: false })

      if (data) setFailedTasks(data as Task[])
      setLoading(false)
    }
    fetchFailed()
  }, [])

  const weekGroups: WeekGroup[] = []
  const weekMap: Record<string, Record<string, Task[]>> = {}

  for (const task of failedTasks) {
    const weekLabel = getWeekLabel(task.date)
    if (!weekMap[weekLabel]) weekMap[weekLabel] = {}
    if (!weekMap[weekLabel][task.date]) weekMap[weekLabel][task.date] = []
    weekMap[weekLabel][task.date].push(task)
  }

  for (const weekLabel of Object.keys(weekMap)) {
    const days = Object.keys(weekMap[weekLabel])
      .sort((a, b) => b.localeCompare(a))
      .map(date => ({ date, tasks: weekMap[weekLabel][date] }))
    weekGroups.push({ weekLabel, days })
  }

  if (loading) {
    return <p className="text-muted-foreground text-sm text-center">Loading...</p>
  }

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-xl font-bold">Failed Log</h1>
        <p className="text-sm text-muted-foreground">All failed tasks, grouped by week.</p>
      </div>

      {weekGroups.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-8">No failed tasks yet.</p>
      )}

      {weekGroups.map(week => (
        <div key={week.weekLabel} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {week.weekLabel}
            </h2>
            <span className="text-xs text-muted-foreground">
              {week.days.reduce((sum, d) => sum + d.tasks.length, 0)} failed
            </span>
          </div>

          {week.days.map(day => (
            <div key={day.date} className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {formatLocalDate(day.date)} — {day.tasks.length} task{day.tasks.length > 1 ? 's' : ''}
              </p>
              {day.tasks.map(task => (
                <div key={task.id} className="border rounded-lg p-3 space-y-1">
                  <p className="font-medium text-sm">{task.title}</p>
                  {task.category && (
                    <p className="text-xs text-muted-foreground">{task.category}</p>
                  )}
                  {task.description && (
                    <p className="text-xs text-muted-foreground">{task.description}</p>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}

    </div>
  )
}
