import { Task } from "@/lib/types"

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.scheduled_time && b.scheduled_time) {
      return a.scheduled_time.localeCompare(b.scheduled_time)
    }
    if (a.scheduled_time && !b.scheduled_time) return -1
    if (!a.scheduled_time && b.scheduled_time) return 1
    return 0
  })
}
