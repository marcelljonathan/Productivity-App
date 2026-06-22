"use client"

import { Task, TaskStatus } from "@/lib/types"
import { getTodayLocalDate } from "@/lib/utils/timezone"
import { sortTasks } from "@/lib/utils/sort"

const STATUS_CARD: Record<TaskStatus, string> = {
  pending:   'border-l-2 border-l-gray-400 bg-muted/40',
  done:      'border-l-2 border-l-green-500 bg-green-500/10',
  failed:    'border-l-2 border-l-red-500 bg-red-500/10',
  moved:     'border-l-2 border-l-yellow-500 bg-yellow-500/10',
  cancelled: 'border-l-2 border-l-orange-400 bg-orange-400/10',
}

type Props = {
  yearMonth: string
  tasksByDate: Record<string, Task[]>
  onDayClick: (date: string) => void
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarView({ yearMonth, tasksByDate, onDayClick }: Props) {
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
    <div>
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-xs font-medium text-muted-foreground text-center py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 border-l border-t">
        {cells.map((day, i) => {
          if (day === null) {
            return (
              <div
                key={`blank-${i}`}
                className="border-r border-b min-h-[120px] bg-muted/10"
              />
            )
          }

          const dateStr = `${yearMonth}-${String(day).padStart(2, '0')}`
          const dayTasks = tasksByDate[dateStr] || []
          const isToday = dateStr === today

          return (
            <div
              key={dateStr}
              className="border-r border-b min-h-[120px] p-1.5 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => onDayClick(dateStr)}
            >
              <div
                className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                  isToday
                    ? 'bg-blue-500 text-white ring-2 ring-blue-400 ring-offset-1'
                    : 'text-foreground'
                }`}
              >
                {day}
              </div>

              <div className="space-y-1">
                {sortTasks(dayTasks).map(task => (
                  <div
                    key={task.id}
                    className={`rounded px-1.5 py-1 text-[11px] leading-snug ${STATUS_CARD[task.status]}`}
                  >
                    {task.scheduled_time && (
                      <p className="opacity-60 font-medium mb-0.5">
                        {task.scheduled_time.slice(0, 5)}
                      </p>
                    )}
                    <p className="truncate">{task.title}</p>
                    {task.category && (
                      <p className="text-[10px] opacity-50 truncate mt-0.5">{task.category}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
