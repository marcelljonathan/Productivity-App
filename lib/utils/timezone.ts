import { Task } from "@/lib/types"

export function getTodayLocalDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatLocalDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function addDays(dateString: string, days: number): string {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day + days)
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-')
}

export function isCancellationAllowed(task: Task): boolean {
  const now = new Date()
  const todayStr = getTodayLocalDate()

  if (task.date > todayStr) return true
  if (task.date < todayStr) return false

  if (task.end_time) {
    const [hours, minutes] = task.end_time.split(':').map(Number)
    const deadline = new Date()
    deadline.setHours(hours, minutes, 0, 0)
    return now < deadline
  }

  return true
}
