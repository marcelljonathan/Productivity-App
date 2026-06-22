"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, List, CalendarDays } from "lucide-react"
import { useTasks } from "@/hooks/useTasks"
import { useStreak } from "@/hooks/useStreak"
import { useMonthTasks } from "@/hooks/useMonthTasks"
import TaskList from "@/components/tasks/TaskList"
import CalendarView from "@/components/tasks/CalendarView"
import StreakCounter from "@/components/streak/StreakCounter"
import { getTodayLocalDate, formatLocalDate, addDays } from "@/lib/utils/timezone"
import { Button } from "@/components/ui/button"

type ViewMode = 'list' | 'calendar'

function toYearMonth(dateStr: string): string {
  return dateStr.slice(0, 7)
}

function shiftMonth(yearMonth: string, delta: number): string {
  const [y, m] = yearMonth.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [date, setDate] = useState(getTodayLocalDate())
  const [yearMonth, setYearMonth] = useState(toYearMonth(getTodayLocalDate()))

  const { tasks, loading, fetchTasks } = useTasks(date)
  const { streak, longestStreak, refresh: refreshStreak } = useStreak()
  const { tasksByDate, loading: calLoading, fetchTasks: fetchMonthTasks } = useMonthTasks(yearMonth)

  function handleRefresh() {
    fetchTasks()
    refreshStreak()
    fetchMonthTasks()
  }

  function handleDayClick(clickedDate: string) {
    setDate(clickedDate)
    setViewMode('list')
  }

  return (
    <div className="space-y-6">

      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <StreakCounter streak={streak} longestStreak={longestStreak} />
        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode('calendar')}
            title="Calendar view"
          >
            <CalendarDays className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDate(d => addDays(d, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center">
              <p className="text-sm font-medium">{formatLocalDate(date)}</p>
              {date !== getTodayLocalDate() && (
                <button
                  onClick={() => setDate(getTodayLocalDate())}
                  className="text-xs text-muted-foreground underline"
                >
                  Back to today
                </button>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDate(d => addDays(d, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <p className="text-muted-foreground text-sm text-center">Loading...</p>
          ) : (
            <TaskList tasks={tasks} date={date} onRefresh={handleRefresh} />
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setYearMonth(ym => shiftMonth(ym, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <p className="text-sm font-medium">{monthLabel(yearMonth)}</p>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setYearMonth(ym => shiftMonth(ym, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {calLoading ? (
            <p className="text-muted-foreground text-sm text-center">Loading...</p>
          ) : (
            <CalendarView
              yearMonth={yearMonth}
              tasksByDate={tasksByDate}
              onDayClick={handleDayClick}
            />
          )}
        </div>
      )}

    </div>
  )
}
