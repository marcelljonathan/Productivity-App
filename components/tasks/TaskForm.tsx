"use client"

import { useState, useEffect } from "react"
import { Task } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export type SubtaskEntry = { id?: string; title: string }

export type TaskFormData = {
  title: string
  description: string
  category: string
  date: string
  scheduled_time: string
  end_time: string
  subtaskEntries: SubtaskEntry[]
}

type Props = {
  defaultDate: string
  task?: Task | null
  onSubmit: (data: TaskFormData) => void
  onCancel: () => void
}

export default function TaskForm({ defaultDate, task, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(task?.title ?? "")
  const [description, setDescription] = useState(task?.description ?? "")
  const [category, setCategory] = useState(task?.category ?? "")
  const [date, setDate] = useState(task?.date ?? defaultDate)
  const [scheduledTime, setScheduledTime] = useState(task?.scheduled_time?.slice(0, 5) ?? "")
  const [endTime, setEndTime] = useState(task?.end_time?.slice(0, 5) ?? "")
  const [subtaskEntries, setSubtaskEntries] = useState<SubtaskEntry[]>([])

  useEffect(() => {
    if (!task?.id) return
    const supabase = createClient()
    supabase
      .from('subtasks')
      .select('id, title')
      .eq('task_id', task.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setSubtaskEntries(data.map(s => ({ id: s.id, title: s.title })))
      })
  }, [task?.id])

  function formatTimeInput(val: string): string {
    if (val.includes(':')) return val.slice(0, 5)
    const digits = val.replace(/\D/g, '')
    if (digits.length <= 2) return digits
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`
  }

  function updateTitle(i: number, val: string) {
    setSubtaskEntries(prev => {
      const next = [...prev]
      next[i] = { ...next[i], title: val }
      return next
    })
  }

  function removeEntry(i: number) {
    setSubtaskEntries(prev => prev.filter((_, j) => j !== i))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      title,
      description,
      category,
      date,
      scheduled_time: scheduledTime,
      end_time: endTime,
      subtaskEntries: subtaskEntries.filter(e => e.title.trim()),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Task title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Add details..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">
          Category <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Input
          id="category"
          value={category}
          onChange={e => setCategory(e.target.value)}
          placeholder="e.g. Work, Health, Admin"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scheduled_time">
            Start time <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Input
            id="scheduled_time"
            type="text"
            value={scheduledTime}
            onChange={e => setScheduledTime(formatTimeInput(e.target.value))}
            placeholder="HH:MM"
            pattern="[0-2][0-9]:[0-5][0-9]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_time">
            End time <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Input
            id="end_time"
            type="text"
            value={endTime}
            onChange={e => setEndTime(formatTimeInput(e.target.value))}
            placeholder="HH:MM"
            pattern="[0-2][0-9]:[0-5][0-9]"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>
          Subtasks <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        {subtaskEntries.map((entry, i) => (
          <div key={entry.id ?? i} className="flex gap-2">
            <Input
              value={entry.title}
              onChange={e => updateTitle(i, e.target.value)}
              placeholder={`Subtask ${i + 1}`}
              className="h-8 text-sm"
            />
            <button
              type="button"
              onClick={() => removeEntry(i)}
              className="text-muted-foreground hover:text-foreground px-1 text-base leading-none"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setSubtaskEntries(prev => [...prev, { title: '' }])}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          + Add subtask
        </button>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">
          {task ? 'Save changes' : 'Create task'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

    </form>
  )
}
