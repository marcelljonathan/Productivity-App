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
  const [subtaskProgress, setSubtaskProgress] = useState<Record<string, { done: number; total: number }>>({})
  const supabase = createClient()

  function handleSubtaskProgress(taskId: string, done: number, total: number) {
    setSubtaskProgress(prev => ({ ...prev, [taskId]: { done, total } }))
  }

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

    if (newTask && data.subtaskEntries.length > 0) {
      await supabase.from('subtasks').insert(
        data.subtaskEntries.map(e => ({
          task_id: newTask.id,
          user_id: userId,
          title: e.title.trim(),
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

    const entries = data.subtaskEntries
    const keptIds = entries.filter(e => e.id).map(e => e.id!)

    // Delete only subtasks that were removed in the form
    if (keptIds.length === 0) {
      await supabase.from('subtasks').delete().eq('task_id', editingTask.id)
    } else {
      await supabase.from('subtasks')
        .delete()
        .eq('task_id', editingTask.id)
        .not('id', 'in', `(${keptIds.join(',')})`)
    }

    // Update titles of kept subtasks (in case user renamed one)
    for (const entry of entries.filter(e => e.id)) {
      await supabase.from('subtasks')
        .update({ title: entry.title.trim() })
        .eq('id', entry.id!)
    }

    // Insert brand-new subtasks (no id)
    const newEntries = entries.filter(e => !e.id)
    if (newEntries.length > 0) {
      const userId = await getUserId()
      await supabase.from('subtasks').insert(
        newEntries.map(e => ({
          task_id: editingTask.id,
          user_id: userId,
          title: e.title.trim(),
          done: false,
        }))
      )
    }

    // Recalculate task status based on remaining subtasks
    const { data: remaining } = await supabase
      .from('subtasks')
      .select('done')
      .eq('task_id', editingTask.id)

    if (remaining !== null) {
      let newStatus: TaskStatus = editingTask.status
      if (remaining.length === 0) {
        newStatus = 'pending'
      } else if (remaining.every(s => s.done)) {
        newStatus = 'done'
      } else if (remaining.some(s => s.done)) {
        newStatus = 'partial'
      } else {
        newStatus = 'pending'
      }
      if (newStatus !== editingTask.status) {
        await supabase.from('tasks').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', editingTask.id)
      }
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

  const countable = tasks.filter(t => t.status !== 'cancelled' && t.status !== 'moved')
  const doneFull = countable.filter(t => t.status === 'done').length
  const totalProgress = countable.reduce((sum, task) => {
    if (task.status === 'done') return sum + 1
    if (task.status !== 'pending' && task.status !== 'partial') return sum
    const sp = subtaskProgress[task.id]
    if (!sp || sp.total === 0) return sum
    return sum + sp.done / sp.total
  }, 0)
  const pct = countable.length > 0 ? Math.round((totalProgress / countable.length) * 100) : null

  return (
    <div className="space-y-3">

      {pct !== null && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{doneFull} / {countable.length} done</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

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
            onSubtaskProgress={handleSubtaskProgress}
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
