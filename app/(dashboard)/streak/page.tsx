"use client"

import { useStreak } from "@/hooks/useStreak"
import StreakCounter from "@/components/streak/StreakCounter"
import { formatLocalDate } from "@/lib/utils/timezone"

export default function StreakPage() {
  const { streak, longestStreak, history, loading } = useStreak()

  if (loading) {
    return <p className="text-muted-foreground text-sm text-center">Loading...</p>
  }

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-xl font-bold">Streak</h1>
        <p className="text-sm text-muted-foreground">Your daily completion history.</p>
      </div>

      <StreakCounter streak={streak} longestStreak={longestStreak} />

      <div className="space-y-2">
        {history.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-8">No history yet.</p>
        )}

        {history.map(record => (
          <div
            key={record.date}
            className="flex items-center justify-between border rounded-lg px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{record.completed ? '✅' : '❌'}</span>
              <div>
                <p className="text-sm font-medium">{formatLocalDate(record.date)}</p>
                <p className="text-xs text-muted-foreground">
                  {record.done} / {record.total} tasks done
                </p>
              </div>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              record.completed
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {record.completed ? 'Complete' : 'Incomplete'}
            </span>
          </div>
        ))}
      </div>

    </div>
  )
}
