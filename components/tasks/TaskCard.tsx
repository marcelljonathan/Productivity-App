"use client"

import { useState } from "react"
import { Task, TaskStatus } from "@/lib/types"
import { isCancellationAllowed, getTodayLocalDate } from "@/lib/utils/timezone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSubtasks } from "@/hooks/useSubtasks"
import SubtaskList from "./SubtaskList"

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  done: 'Done',
  failed: 'Failed',
  moved: 'Moved',
  cancelled: 'Cancelled',
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  done: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  moved: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-gray-100 text-gray-600',
}

type Props = {
  task: Task
  onStatusChange: (id: string, status: TaskStatus, extra?: Partial<Task>) => void
  onMove: (id: string, newDate: string) => void
  onEdit: (task: Task) => void
}

export default function TaskCard({ task, onStatusChange, onMove, onEdit }: Props) {
  const [cancelMode, setCancelMode] = useState(false)
  const [moveMode, setMoveMode] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [moveDate, setMoveDate] = useState("")

  const { subtasks, loading: subtasksLoading, toggleSubtask } = useSubtasks(task.id)

  const canCancel = isCancellationAllowed(task)
  const canMove = !task.moved_from_id
  const minMoveDate = getTodayLocalDate()
  const hasSubtasks = subtasks.length > 0

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
    if (updated.length > 0 && updated.every(s => s.done)) {
      onStatusChange(task.id, 'done')
    }
  }

  return (
    <div className="border border-gray-400 rounded-lg p-4 space-y-3">

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {task.scheduled_time && (
              <span className="text-xs text-muted-foreground">
                {task.scheduled_time.slice(0, 5)}
              </span>
            )}
            <h3 className={`font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </h3>
          </div>

          {task.category && (
            <span className="text-xs text-muted-foreground">{task.category}</span>
          )}

          {task.description && (
            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
          )}

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

      {task.status === 'pending' && !cancelMode && !moveMode && (
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
