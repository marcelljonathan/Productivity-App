"use client"

import { Task, TaskStatus } from "@/lib/types"
import { getTodayLocalDate } from "@/lib/utils/timezone"
import { sortTasks } from "@/lib/utils/sort"

type Props = {
  yearMonth: string
  tasksByDate: Record<string, Task[]>
  onDayClick: (date: string) => void
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const STATUS_LABEL: Record<TaskStatus, string> = {
  pending: 'Pending',
  partial: 'Partial',
  done: 'Done',
  failed: 'Failed',
  moved: 'Moved',
  cancelled: 'Cancelled',
}

const STATUS_BOX_BG: Record<TaskStatus, string> = {
  pending: 'bg-gray-100 dark:bg-gray-700 border-l-gray-400',
  partial: 'bg-orange-50 dark:bg-orange-950/30 border-l-orange-400',
  done: 'bg-green-50 dark:bg-green-950/30 border-l-green-400',
  failed: 'bg-red-50 dark:bg-red-950/30 border-l-red-400',
  moved: 'bg-blue-50 dark:bg-blue-950/30 border-l-blue-400',
  cancelled: 'bg-gray-50 dark:bg-gray-800/40 border-l-gray-400',
}

const STATUS_BADGE: Record<TaskStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  partial: 'bg-orange-100 text-orange-800',
  done: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  moved: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-gray-100 text-gray-600',
}

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

      <div className="grid grid-cols-7 border-l border-t border-gray-400">
        {cells.map((day, i) => {
          if (day === null) {
            return (
              <div
                key={`blank-${i}`}
                className="border-r border-b border-gray-400 min-h-[120px] bg-muted/10"
              />
            )
          }

          const dateStr = `${yearMonth}-${String(day).padStart(2, '0')}`
          const dayTasks = tasksByDate[dateStr] || []
          const isToday = dateStr === today

          return (
            <div
              key={dateStr}
              className="border-r border-b border-gray-400 min-h-[120px] p-1.5 cursor-pointer hover:bg-muted/30 transition-colors"
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
                    className={`border-l-2 rounded px-1.5 py-1 text-[11px] leading-snug ${STATUS_BOX_BG[task.status]}`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="opacity-60 font-medium truncate">
                        {task.scheduled_time
                          ? `${task.scheduled_time.slice(0, 5)}${task.end_time ? ` - ${task.end_time.slice(0, 5)}` : ''}`
                          : ''}
                      </p>
                      <span className={`shrink-0 rounded-full px-1 py-px font-medium ${STATUS_BADGE[task.status]}`}>
                        {STATUS_LABEL[task.status]}
                      </span>
                    </div>
                    {task.category && (
                      <p className="opacity-60 truncate">{task.category}</p>
                    )}
                    <p className="truncate font-medium">{task.title}</p>
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
