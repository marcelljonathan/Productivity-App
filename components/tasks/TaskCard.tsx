"use client"

import { useState, useEffect } from "react"
import { Task, TaskStatus } from "@/lib/types"
import { isCancellationAllowed, getTodayLocalDate } from "@/lib/utils/timezone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSubtasks } from "@/hooks/useSubtasks"
import SubtaskList from "./SubtaskList"

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  partial: 'Partial',
  done: 'Done',
  failed: 'Failed',
  moved: 'Moved',
  cancelled: 'Cancelled',
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  partial: 'bg-orange-100 text-orange-800',
  done: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  moved: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-gray-100 text-gray-600',
}

const STATUS_BG: Record<TaskStatus, string> = {
  pending: '',
  partial: 'bg-orange-50 dark:bg-orange-950/30',
  done: 'bg-green-50 dark:bg-green-950/30',
  failed: 'bg-red-50 dark:bg-red-950/30',
  moved: 'bg-blue-50 dark:bg-blue-950/30',
  cancelled: 'bg-gray-50 dark:bg-gray-800/40',
}

type Props = {
  task: Task
  onStatusChange: (id: string, status: TaskStatus, extra?: Partial<Task>) => void
  onMove: (id: string, newDate: string) => void
  onEdit: (task: Task) => void
  onSubtaskProgress?: (taskId: string, done: number, total: number) => void
}

export default function TaskCard({ task, onStatusChange, onMove, onEdit, onSubtaskProgress }: Props) {
  const [cancelMode, setCancelMode] = useState(false)
  const [moveMode, setMoveMode] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [moveDate, setMoveDate] = useState("")
  const [showDesc, setShowDesc] = useState(false)

  const { subtasks, loading: subtasksLoading, toggleSubtask } = useSubtasks(task.id)

  const doneSubtasks = subtasks.filter(s => s.done).length
  const totalSubtasks = subtasks.length

  useEffect(() => {
    if (!subtasksLoading) onSubtaskProgress?.(task.id, doneSubtasks, totalSubtasks)
  }, [doneSubtasks, totalSubtasks, subtasksLoading])

  const canCancel = isCancellationAllowed(task)
  const canMove = !task.moved_from_id
  const minMoveDate = getTodayLocalDate()
  const hasSubtasks = subtasks.length > 0

  const subPct = totalSubtasks > 0 ? Math.round((doneSubtasks / totalSubtasks) * 100) : 0
  const gradientStyle: React.CSSProperties =
    task.status === 'partial' && totalSubtasks > 0 && !subtasksLoading
      ? { background: `linear-gradient(to right, rgba(249,115,22,0.2) ${subPct}%, rgba(249,115,22,0.05) ${subPct}%)` }
      : {}

  function handleCancel() {
    if (!cancelReason.trim()) return
    onStatusChange(task.id, 'cancelled', { cancellation_reason: cancelReason })
    setCancelMode(false)
    setCancelReason("")
  }

  function handleMove() {
    if (!moveDate) return
    onMove(task.id, moveDate)
    setMoveMode(false)
    setMoveDate("")
  }

  async function handleSubtaskToggle(subtaskId: string, done: boolean) {
    const updated = await toggleSubtask(subtaskId, done)
    if (updated.length === 0) return
    if (updated.every(s => s.done)) {
      onStatusChange(task.id, 'done')
    } else if (updated.some(s => s.done)) {
      onStatusChange(task.id, 'partial')
    } else {
      onStatusChange(task.id, 'pending')
    }
  }

  return (
    <div className={`border border-gray-400 rounded-lg p-4 space-y-3 ${STATUS_BG[task.status]}`} style={gradientStyle}>

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          {task.scheduled_time && (
            <p className="text-xs text-muted-foreground mb-0.5">
              {task.scheduled_time.slice(0, 5)}
              {task.end_time && ` - ${task.end_time.slice(0, 5)}`}
            </p>
          )}

          <h3 className="font-medium">
            {task.category ? `${task.category} - ${task.title}` : task.title}
          </h3>

          {task.status === 'cancelled' && task.cancellation_reason && (
            <p className="text-xs text-muted-foreground mt-1 italic">
              Reason: {task.cancellation_reason}
            </p>
          )}
        </div>

        <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_COLORS[task.status]}`}>
          {STATUS_LABELS[task.status]}
        </span>
      </div>

      {!subtasksLoading && (
        <SubtaskList
          subtasks={subtasks}
          isPending={task.status === 'pending'}
          onToggle={handleSubtaskToggle}
        />
      )}

      {task.description && (
        <>
          <div className="border-t border-gray-200" />
          <button
            onClick={() => setShowDesc(v => !v)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <span>{showDesc ? '▾' : '▸'}</span>
            Description
          </button>
          {showDesc && (
            <p className="text-sm text-muted-foreground">{task.description}</p>
          )}
        </>
      )}

      {(task.status === 'pending' || task.status === 'partial') && !cancelMode && !moveMode && (
        <div className="flex flex-wrap gap-2">
          {!hasSubtasks && (
            <button
              onClick={() => onStatusChange(task.id, 'done')}
              className="text-xs px-3 py-1 rounded bg-green-100 text-green-800 hover:bg-green-200"
            >
              Done
            </button>
          )}
          <button
            onClick={() => onStatusChange(task.id, 'failed')}
            className="text-xs px-3 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200"
          >
            Failed
          </button>
          {canCancel && (
            <button
              onClick={() => setCancelMode(true)}
              className="text-xs px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
          )}
          {canMove && (
            <button
              onClick={() => setMoveMode(true)}
              className="text-xs px-3 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200"
            >
              Move
            </button>
          )}
          <button
            onClick={() => onEdit(task)}
            className="text-xs px-3 py-1 rounded bg-muted text-muted-foreground hover:bg-muted/80"
          >
            Edit
          </button>
        </div>
      )}

      {cancelMode && (
        <div className="space-y-2">
          <Input
            placeholder="Reason for cancelling..."
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCancel} disabled={!cancelReason.trim()}>
              Confirm cancel
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setCancelMode(false); setCancelReason("") }}>
              Back
            </Button>
          </div>
        </div>
      )}

      {moveMode && (
        <div className="space-y-2">
          <Input
            type="date"
            value={moveDate}
            min={minMoveDate}
            onChange={e => setMoveDate(e.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleMove} disabled={!moveDate}>
              Confirm move
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setMoveMode(false); setMoveDate("") }}>
              Back
            </Button>
          </div>
        </div>
      )}

    </div>
  )
}
