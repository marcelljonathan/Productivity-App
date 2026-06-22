import { Task } from "@/lib/types"

export type DayRecord = {
  date: string
  completed: boolean
  total: number
  done: number
}

export function computeStreak(tasks: Task[], todayLocalDate: string): number {
  const tasksByDate: Record<string, Task[]> = {}

  for (const task of tasks) {
    if (!tasksByDate[task.date]) tasksByDate[task.date] = []
    tasksByDate[task.date].push(task)
  }

  const dates = Object.keys(tasksByDate)
    .filter(d => d <= todayLocalDate)
    .sort((a, b) => b.localeCompare(a))

  let streak = 0

  for (const date of dates) {
    const relevant = tasksByDate[date].filter(t => t.status !== 'cancelled')

    if (relevant.length === 0) continue

    const allDone = relevant.every(t => t.status === 'done')

    if (date === todayLocalDate) {
      if (allDone) streak++
      continue
    }

    if (allDone) {
      streak++
    } else {
      break
    }
  }

  return streak
}

export function computeLongestStreak(tasks: Task[], todayLocalDate: string): number {
  const tasksByDate: Record<string, Task[]> = {}

  for (const task of tasks) {
    if (!tasksByDate[task.date]) tasksByDate[task.date] = []
    tasksByDate[task.date].push(task)
  }

  const dates = Object.keys(tasksByDate)
    .filter(d => d <= todayLocalDate)
    .sort((a, b) => a.localeCompare(b))

  let longest = 0
  let current = 0

  for (const date of dates) {
    const relevant = tasksByDate[date].filter(t => t.status !== 'cancelled')
    if (relevant.length === 0) continue

    const allDone = relevant.every(t => t.status === 'done')
    if (allDone) {
      current++
      if (current > longest) longest = current
    } else {
      current = 0
    }
  }

  return longest
}

export function buildDayHistory(tasks: Task[], todayLocalDate: string): DayRecord[] {
  const tasksByDate: Record<string, Task[]> = {}

  for (const task of tasks) {
    if (!tasksByDate[task.date]) tasksByDate[task.date] = []
    tasksByDate[task.date].push(task)
  }

  return Object.keys(tasksByDate)
    .filter(d => d <= todayLocalDate)
    .sort((a, b) => b.localeCompare(a))
    .map(date => {
      const relevant = tasksByDate[date].filter(t => t.status !== 'cancelled')
      const done = relevant.filter(t => t.status === 'done').length
      return {
        date,
        completed: relevant.length > 0 && done === relevant.length,
        total: relevant.length,
        done,
      }
    })
}
