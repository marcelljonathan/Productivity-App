import { Task } from "@/lib/types"

export function calcDayProgress(tasks: Task[]): number | null {
  const countable = tasks.filter(t => t.status !== 'cancelled' && t.status !== 'moved')
  if (countable.length === 0) return null
  const pts = countable.reduce((sum, t) => {
    if (t.status === 'done') return sum + 1
    if (t.status === 'partial') return sum + 0.5
    return sum
  }, 0)
  return Math.round((pts / countable.length) * 100)
}

export function progressBg(pct: number | null): string {
  if (pct === null) return 'bg-gray-100 dark:bg-gray-800/50'
  if (pct === 0) return 'bg-red-100 dark:bg-red-900/30'
  if (pct < 50) return 'bg-orange-100 dark:bg-orange-900/30'
  if (pct < 100) return 'bg-lime-100 dark:bg-lime-900/30'
  return 'bg-green-100 dark:bg-green-900/30'
}

export function progressBarFill(pct: number | null): string {
  if (pct === null || pct === 0) return 'bg-red-400'
  if (pct < 50) return 'bg-orange-400'
  if (pct < 100) return 'bg-yellow-400'
  return 'bg-green-500'
}

export function progressTextColor(pct: number | null): string {
  if (pct === null) return 'text-muted-foreground'
  if (pct === 0) return 'text-red-600 dark:text-red-400'
  if (pct < 50) return 'text-orange-600 dark:text-orange-400'
  if (pct < 100) return 'text-yellow-600 dark:text-yellow-500'
  return 'text-green-600 dark:text-green-400'
}
