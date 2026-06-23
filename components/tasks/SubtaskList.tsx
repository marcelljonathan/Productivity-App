"use client"

import { Subtask } from "@/lib/types"

type Props = {
  subtasks: Subtask[]
  isPending: boolean
  onToggle: (id: string, done: boolean) => void
}

export default function SubtaskList({ subtasks, isPending, onToggle }: Props) {
  if (subtasks.length === 0) return null

  const doneCount = subtasks.filter(s => s.done).length

  return (
    <div className="space-y-1.5 pt-1">
      <p className="text-xs text-muted-foreground">
        Subtasks {doneCount}/{subtasks.length}
      </p>

      {subtasks.map(subtask => (
        <div key={subtask.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={subtask.done}
            onChange={e => isPending && onToggle(subtask.id, e.target.checked)}
            disabled={!isPending}
            className="rounded border-gray-300 cursor-pointer"
          />
          <span className="text-sm">
            {subtask.title}
          </span>
        </div>
      ))}
    </div>
  )
}
