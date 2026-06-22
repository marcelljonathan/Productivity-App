"use client"

import { useState } from "react"
import { Task, TaskStatus } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import TaskCard from "./TaskCard"
import TaskForm, { TaskFormData } from "./TaskForm"
import { Button } from "@/components/ui/button"

type Props = {
  tasks: Task[]
  date: string
  onRefresh: () => void
}

export default function TaskList({ tasks, date, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const supabase = createClient()

  async function getUserId() {
    const { data } = await supabase.auth.getUser()
    return data.user?.id
  }

  async function handleCreate(data: TaskFormData) {
    const userId = await getUserId()
    const { data: newTask } = await supabase.from('tasks').insert({
      user_id: userId,
      title: data.title,
      description: data.description || null,
      category: data.category || null,
      date: data.date,
      scheduled_time: data.scheduled_time || null,
      end_time: data.end_time || null,
      status: 'pending',
    }).select().single()

    if (newTask && data.subtaskTitles.length > 0) {
      await supabase.from('subtasks').insert(
        data.subtaskTitles.map(title => ({
          task_id: newTask.id,
          user_id: userId,
          title,
          done: false,
        }))
      )
    }

    setShowForm(false)
    onRefresh()
  }

  async function handleEdit(data: TaskFormData) {
    if (!editingTask) return

    await supabase.from('tasks').update({
      title: data.title,
      description: data.description || null,
      category: data.category || null,
      date: data.date,
      scheduled_time: data.scheduled_time || null,
      end_time: data.end_time || null,
      updated_at: new Date().toISOString(),
    }).eq('id', editingTask.id)

    // Fetch existing subtasks to carry over done state by title
    const { data: existingSubs } = await supabase
      .from('subtasks').select('title, done').eq('task_id', editingTask.id)
    const doneByTitle: Record<string, boolean> = {}
    for (const s of existingSubs ?? []) doneByTitle[s.title] = s.done

    await supabase.from('subtasks').delete().eq('task_id', editingTask.id)

    if (data.subtaskTitles.length > 0) {
      const userId = await getUserId()
      await supabase.from('subtasks').insert(
        data.subtaskTitles.map(title => ({
          task_id: editingTask.id,
          user_id: userId,
          title,
          done: doneByTitle[title] ?? false,
        }))
      )
    }

    setEditingTask(null)
    onRefresh()
  }

  async function handleStatusChange(id: string, status: TaskStatus, extra?: Partial<Task>) {
    await supabase.from('tasks').update({
      status,
      updated_at: new Date().toISOString(),
      ...extra,
    }).eq('id', id)
    onRefresh()
  }

  async function handleMove(taskId: string, newDate: string) {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const userId = await getUserId()

    await supabase.from('tasks').update({
      status: 'moved',
      updated_at: new Date().toISOString(),
    }).eq('id', taskId)

    await supabase.from('tasks').insert({
      user_id: userId,
      title: task.title,
      description: task.description,
      category: task.category,
      date: newDate,
      scheduled_time: null,
      end_time: null,
      status: 'pending',
      moved_from_id: taskId,
    })

    onRefresh()
  }

  function openEdit(task: Task) {
    setEditingTask(task)
    setShowForm(false)
  }

  function closeForm() {
    setShowForm(false)
    setEditingTask(null)
  }

  return (
    <div className="space-y-3">

      {tasks.length === 0 && !showForm && !editingTask && (
        <p className="text-muted-foreground text-sm text-center py-8">
          No tasks for this day.
        </p>
      )}

      {tasks.map(task => (
        <div key={task.id}>
          <TaskCard
            task={task}
            onStatusChange={handleStatusChange}
            onMove={handleMove}
            onEdit={openEdit}
          />
          {editingTask?.id === task.id && (
            <div className="border rounded-lg p-4 mt-2">
              <p className="text-sm font-medium mb-3">Edit task</p>
              <TaskForm
                defaultDate={date}
                task={editingTask}
                onSubmit={handleEdit}
                onCancel={closeForm}
              />
            </div>
          )}
        </div>
      ))}

      {showForm && (
        <div className="border rounded-lg p-4">
          <p className="text-sm font-medium mb-3">New task</p>
          <TaskForm
            defaultDate={date}
            onSubmit={handleCreate}
            onCancel={closeForm}
          />
        </div>
      )}

      {!showForm && !editingTask && (
        <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
          + Add task
        </Button>
      )}

    </div>
  )
}
