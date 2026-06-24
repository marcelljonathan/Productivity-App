"use client"

import { Task } from "@/lib/types"
import { addDays, getTodayLocalDate } from "@/lib/utils/timezone"
import { calcDayProgress, progressBarFill, progressTextColor } from "@/lib/utils/progress"

type Props = {
  weekStart: string
  tasksByDate: Record<string, Task[]>
  onDayClick: (date: string) => void
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function WeeklySummary({ weekStart, tasksByDate, onDayClick }: Props) {
  const today = getTodayLocalDate()
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const dayData = days.map((dateStr, i) => ({
    dateStr,
    label: DAY_NAMES[i],
    day: dateStr.slice(8),
    pct: calcDayProgress(tasksByDate[dateStr] || []),
    isFuture: dateStr > today,
    isToday: dateStr === today,
  }))

  const activeDays = dayData.filter(d => !d.isFuture && d.pct !== null)
  const weekPct = activeDays.length > 0
    ? Math.round(activeDays.reduce((sum, d) => sum + (d.pct ?? 0), 0) / activeDays.length)
    : null

  const totalTasks = days.flatMap(d => tasksByDate[d] || []).filter(t => t.status !== 'cancelled' && t.status !== 'moved').length
  const doneTasks = days.flatMap(d => tasksByDate[d] || []).filter(t => t.status === 'done').length

  return (
    <div className="space-y-6">
      <div className="flex gap-6 justify-center text-center">
        <div>
          <p className="text-3xl font-bold">{weekPct !== null ? `${weekPct}%` : '–'}</p>
          <p className="text-xs text-muted-foreground">Weekly average</p>
        </div>
        <div className="border-l" />
        <div>
          <p className="text-3xl font-bold">{doneTasks}<span className="text-lg text-muted-foreground">/{totalTasks}</span></p>
          <p className="text-xs text-muted-foreground">Tasks done</p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-3">
        {dayData.map(({ dateStr, label, day, pct, isFuture, isToday }) => {
          const barHeight = isFuture || pct === null ? 0 : pct

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity"
            >
              <span className={`text-[10px] sm:text-xs font-medium ${progressTextColor(isFuture ? null : pct)}`}>
                {!isFuture && pct !== null ? `${pct}%` : '–'}
              </span>
              <div className="relative w-full h-24 sm:h-28 bg-muted rounded overflow-hidden">
                <div
                  className={`absolute bottom-0 left-0 right-0 transition-all ${progressBarFill(isFuture ? null : pct)}`}
                  style={{ height: `${barHeight}%` }}
                />
              </div>
              <span className={`text-[10px] sm:text-xs font-medium ${isToday ? 'text-blue-600' : 'text-muted-foreground'}`}>{label}</span>
              <span className="text-[9px] sm:text-[10px] text-muted-foreground">{day}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
