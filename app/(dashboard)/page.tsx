"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, List, CalendarDays, BarChart2 } from "lucide-react"
import { useTasks } from "@/hooks/useTasks"
import { useStreak } from "@/hooks/useStreak"
import { useMonthTasks } from "@/hooks/useMonthTasks"
import { useRangeTasks } from "@/hooks/useRangeTasks"
import TaskList from "@/components/tasks/TaskList"
import CalendarView from "@/components/tasks/CalendarView"
import DailySummary from "@/components/summary/DailySummary"
import WeeklySummary from "@/components/summary/WeeklySummary"
import MonthlySummary from "@/components/summary/MonthlySummary"
import StreakCounter from "@/components/streak/StreakCounter"
import { getTodayLocalDate, formatLocalDate, addDays } from "@/lib/utils/timezone"
import { Button } from "@/components/ui/button"

type ViewMode = 'list' | 'calendar' | 'daily' | 'weekly' | 'monthly'

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

function getWeekStart(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(y, m - 1, d + diff)
  return [
    mon.getFullYear(),
    String(mon.getMonth() + 1).padStart(2, '0'),
    String(mon.getDate()).padStart(2, '0'),
  ].join('-')
}

function weekLabel(weekStart: string): string {
  const weekEnd = addDays(weekStart, 6)
  const s = new Date(weekStart + 'T00:00:00')
  const e = new Date(weekEnd + 'T00:00:00')
  return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

const SUMMARY_OPTIONS: { key: 'daily' | 'weekly' | 'monthly'; label: string }[] = [
  { key: 'daily', label: 'Daily Summary' },
  { key: 'weekly', label: 'Weekly Summary' },
  { key: 'monthly', label: 'Monthly Summary' },
]

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [date, setDate] = useState(getTodayLocalDate())
  const [yearMonth, setYearMonth] = useState(toYearMonth(getTodayLocalDate()))
  const [weekStart, setWeekStart] = useState(getWeekStart(getTodayLocalDate()))

  const { tasks, loading, fetchTasks } = useTasks(date)
  const { streak, longestStreak, refresh: refreshStreak } = useStreak()
  const { tasks: monthTasks, tasksByDate, loading: calLoading, fetchTasks: fetchMonthTasks } = useMonthTasks(yearMonth)
  const { tasksByDate: weekTasksByDate, loading: weekLoading, fetchTasks: fetchWeekTasks } = useRangeTasks(weekStart, addDays(weekStart, 6))

  function handleRefresh() {
    fetchTasks()
    refreshStreak()
    fetchMonthTasks()
    fetchWeekTasks()
  }

  function handleDayClick(clickedDate: string) {
    setDate(clickedDate)
    setViewMode('list')
  }

  const isSummaryActive = ['daily', 'weekly', 'monthly'].includes(viewMode)

  return (
    <div className="space-y-6">

      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <StreakCounter streak={streak} longestStreak={longestStreak} />
        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => { setViewMode('list'); setSummaryOpen(false) }}
            title="List view"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => { setViewMode('calendar'); setSummaryOpen(false) }}
            title="Calendar view"
          >
            <CalendarDays className="h-4 w-4" />
          </Button>

          <div className="relative">
            <Button
              variant={isSummaryActive ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setSummaryOpen(v => !v)}
              title="Summary"
            >
              <BarChart2 className="h-4 w-4" />
            </Button>
            {summaryOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSummaryOpen(false)} />
                <div className="absolute right-0 top-9 bg-background border rounded-lg shadow-md z-20 py-1 w-40">
                  {SUMMARY_OPTIONS.map(({ key, label }) => (
                    <button
                      key={key}
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors ${viewMode === key ? 'font-medium' : ''}`}
                      onClick={() => { setViewMode(key); setSummaryOpen(false) }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'list' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setDate(d => addDays(d, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <p className="text-sm font-medium">{formatLocalDate(date)}</p>
              {date !== getTodayLocalDate() && (
                <button onClick={() => setDate(getTodayLocalDate())} className="text-xs text-muted-foreground underline">
                  Back to today
                </button>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setDate(d => addDays(d, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {loading ? (
            <p className="text-muted-foreground text-sm text-center">Loading...</p>
          ) : (
            <TaskList tasks={tasks} date={date} onRefresh={handleRefresh} />
          )}
        </div>
      )}

      {viewMode === 'calendar' && (
        <div className="space-y-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setYearMonth(ym => shiftMonth(ym, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="text-sm font-medium">{monthLabel(yearMonth)}</p>
            <Button variant="ghost" size="icon" onClick={() => setYearMonth(ym => shiftMonth(ym, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {calLoading ? (
            <p className="text-muted-foreground text-sm text-center">Loading...</p>
          ) : (
            <CalendarView yearMonth={yearMonth} tasksByDate={tasksByDate} onDayClick={handleDayClick} />
          )}
        </div>
      )}

      {viewMode === 'daily' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setYearMonth(ym => shiftMonth(ym, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="text-sm font-medium">{monthLabel(yearMonth)}</p>
            <Button variant="ghost" size="icon" onClick={() => setYearMonth(ym => shiftMonth(ym, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {calLoading ? (
            <p className="text-muted-foreground text-sm text-center">Loading...</p>
          ) : (
            <DailySummary yearMonth={yearMonth} tasksByDate={tasksByDate} onDayClick={handleDayClick} />
          )}
        </div>
      )}

      {viewMode === 'weekly' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setWeekStart(ws => getWeekStart(addDays(ws, -7)))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="text-sm font-medium">{weekLabel(weekStart)}</p>
            <Button variant="ghost" size="icon" onClick={() => setWeekStart(ws => getWeekStart(addDays(ws, 7)))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {weekLoading ? (
            <p className="text-muted-foreground text-sm text-center">Loading...</p>
          ) : (
            <WeeklySummary weekStart={weekStart} tasksByDate={weekTasksByDate} onDayClick={handleDayClick} />
          )}
        </div>
      )}

      {viewMode === 'monthly' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setYearMonth(ym => shiftMonth(ym, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="text-sm font-medium">{monthLabel(yearMonth)}</p>
            <Button variant="ghost" size="icon" onClick={() => setYearMonth(ym => shiftMonth(ym, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {calLoading ? (
            <p className="text-muted-foreground text-sm text-center">Loading...</p>
          ) : (
            <MonthlySummary yearMonth={yearMonth} tasksByDate={tasksByDate} tasks={monthTasks} />
          )}
        </div>
      )}

    </div>
  )
}
