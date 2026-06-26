"use client"

import { useState } from "react"
import { useMonthlyStartDay } from "@/hooks/useMonthlyStartDay"

export default function MonthlyStartDayManager() {
  const { startDay, setStartDay } = useMonthlyStartDay()
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const n = parseInt(input, 10)
    if (!isNaN(n) && n >= 1 && n <= 28) {
      await setStartDay(n)
      setEditing(false)
    }
  }

  return (
    <div className="space-y-2">
      <h2 className="font-semibold text-sm">Monthly Period</h2>
      <p className="text-xs text-muted-foreground">
        The day each month your budget period starts — e.g. your salary date. Capped at 28 to handle all months.
        If the date falls on a weekend, the period shifts to the previous Friday.
      </p>
      <div className="flex items-center gap-3 text-sm">
        <span>
          Starts on day <span className="font-semibold">{startDay}</span> of each month
        </span>
        {!editing ? (
          <button
            onClick={() => { setInput(String(startDay)); setEditing(true) }}
            className="text-xs text-primary underline"
          >
            Change
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={28}
              value={input}
              onChange={e => setInput(e.target.value)}
              className="w-16 text-sm border border-gray-300 dark:border-border rounded px-2 py-1 bg-background"
              autoFocus
            />
            <button type="submit" className="text-xs text-primary underline">Save</button>
            <button type="button" onClick={() => setEditing(false)} className="text-xs text-muted-foreground underline">
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
