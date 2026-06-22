export type TaskStatus = 'pending' | 'done' | 'failed' | 'moved' | 'cancelled'

export type Subtask = {
  id: string
  task_id: string
  user_id: string
  title: string
  done: boolean
  created_at: string
}

export type Task = {
  id: string
  user_id: string
  title: string
  description: string | null
  category: string | null
  date: string
  scheduled_time: string | null
  end_time: string | null
  status: TaskStatus
  cancellation_reason: string | null
  moved_from_id: string | null
  created_at: string
  updated_at: string
}
