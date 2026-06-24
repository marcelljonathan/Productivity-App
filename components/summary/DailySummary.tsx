"use client"

import { Task } from "@/lib/types"
import { getTodayLocalDate } from "@/lib/utils/timezone"
import { calcDayProgress, progressBg, progressTextColor } from "@/lib/utils/progress"

type Props = {
  yearMonth: string
  tasksByDate: Record<string, Task[]>
  onDayClick: (date: string) => void
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function DailySummary({ yearMonth, tasksByDate, onDayClick }: Props) {
  const [year, month] = yearMonth.split('-').map(Number)
  const today = getTodayLocalDate()

  const firstWeekday = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-gray-100 dark:bg-gray-800/50" /> No tasks</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-red-100" /> 0%</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-orange-100" /> 1–49%</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-lime-100" /> 50–99%</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-green-100" /> 100%</span>
      </div>

      <div className="grid grid-cols-7">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-xs font-medium text-muted-foreground text-center py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`blank-${i}`} />

          const dateStr = `${yearMonth}-${String(day).padStart(2, '0')}`
          const dayTasks = tasksByDate[dateStr] || []
          const pct = calcDayProgress(dayTasks)
          const isToday = dateStr === today
          const isFuture = dateStr > today

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className={`
                rounded-lg flex flex-col items-center justify-center gap-0.5 py-2
                transition-all hover:ring-2 hover:ring-blue-400
                ${isFuture ? 'bg-muted/20' : progressBg(pct)}
                ${isToday ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              <span className={`text-xs font-medium ${isToday ? 'text-blue-600' : ''}`}>{day}</span>
              {!isFuture && pct !== null && (
                <span className={`text-[10px] font-semibold ${progressTextColor(pct)}`}>{pct}%</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
