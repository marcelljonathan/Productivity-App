"use client"

import { Task } from "@/lib/types"
import { getTodayLocalDate } from "@/lib/utils/timezone"
import { calcDayProgress } from "@/lib/utils/progress"

type Props = {
  yearMonth: string
  tasksByDate: Record<string, Task[]>
  tasks: Task[]
}

export default function MonthlySummary({ yearMonth, tasksByDate, tasks }: Props) {
  const today = getTodayLocalDate()
  const [year, month] = yearMonth.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()

  const countable = tasks.filter(t => t.status !== 'cancelled' && t.status !== 'moved')
  const done = countable.filter(t => t.status === 'done').length
  const partial = countable.filter(t => t.status === 'partial').length
  const failed = countable.filter(t => t.status === 'failed').length
  const pending = countable.filter(t => t.status === 'pending').length

  const pts = countable.reduce((sum, t) => {
    if (t.status === 'done') return sum + 1
    if (t.status === 'partial') return sum + 0.5
    return sum
  }, 0)
  const monthPct = countable.length > 0 ? Math.round((pts / countable.length) * 100) : null

  const pastDays = Array.from({ length: daysInMonth }, (_, i) =>
    `${yearMonth}-${String(i + 1).padStart(2, '0')}`
  ).filter(d => d <= today)

  const daysWithTasks = pastDays.filter(d => {
    const dayCountable = (tasksByDate[d] || []).filter(t => t.status !== 'cancelled' && t.status !== 'moved')
    return dayCountable.length > 0
  }).length

  let bestDay = { date: '', pct: -1 }
  pastDays.forEach(d => {
    const pct = calcDayProgress(tasksByDate[d] || [])
    if (pct !== null && pct > bestDay.pct) bestDay = { date: d, pct }
  })

  const stats = [
    { label: 'Done', value: done, color: 'text-green-600' },
    { label: 'Partial', value: partial, color: 'text-orange-500' },
    { label: 'Failed', value: failed, color: 'text-red-600' },
    { label: 'Pending', value: pending, color: 'text-yellow-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-4xl font-bold">{monthPct !== null ? `${monthPct}%` : '–'}</p>
        <p className="text-sm text-muted-foreground">Monthly completion rate</p>
        <p className="text-xs text-muted-foreground mt-1">{countable.length} total tasks</p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {stats.map(s => (
          <div key={s.label} className="border rounded-lg p-3 text-center">
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="border rounded-lg p-3 text-center">
          <p className="text-2xl font-semibold">{daysWithTasks}</p>
          <p className="text-xs text-muted-foreground">Active days</p>
        </div>
        <div className="border rounded-lg p-3 text-center">
          <p className="text-2xl font-semibold text-green-600">
            {bestDay.pct >= 0 ? `${bestDay.pct}%` : '–'}
          </p>
          <p className="text-xs text-muted-foreground">
            {bestDay.date ? `Best day (${Number(bestDay.date.slice(8))})` : 'Best day'}
          </p>
        </div>
      </div>
    </div>
  )
}
