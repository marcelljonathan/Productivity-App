"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type Timeframe = { mode: 'all' | 'custom'; from: string; to: string }

export const ALL_TIME: Timeframe = { mode: 'all', from: '', to: '' }

// Entries are filtered by their CLOSE date, so a position held a long time lands in
// the period it was closed in.
export function inTimeframe(closeDate: string, tf: Timeframe): boolean {
  if (tf.mode === 'all') return true
  if (tf.from && closeDate < tf.from) return false
  if (tf.to && closeDate > tf.to) return false
  return true
}

type Props = {
  value: Timeframe
  onChange: (t: Timeframe) => void
}

export default function HistoryTimeframe({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex justify-center">
        <div className="flex items-center border rounded-full p-0.5 text-xs font-medium">
          {([
            { key: 'all', label: 'All time' },
            { key: 'custom', label: 'Custom range' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onChange({ ...value, mode: key })}
              className={`px-3 py-1 rounded-full transition-colors ${
                value.mode === key ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {value.mode === 'custom' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Input
              type="date"
              value={value.from}
              onChange={e => onChange({ ...value, from: e.target.value })}
              className="text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input
              type="date"
              value={value.to}
              onChange={e => onChange({ ...value, to: e.target.value })}
              className="text-sm"
            />
          </div>
        </div>
      )}
    </div>
  )
}
