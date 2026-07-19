"use client"

import { useState, useRef, useEffect } from "react"
import { FileText } from "lucide-react"

const EMOJIS = [
  "📝", "📄", "📋", "✅", "⭐", "🔥", "💡", "📌",
  "📎", "🎯", "📊", "📈", "💰", "🗓️", "⏰", "🏋️",
  "🍔", "🛒", "✈️", "🏠", "💼", "📚", "🎨", "🎵",
  "❤️", "🌱", "🔑", "🧠", "⚙️", "🚀", "📦", "🔖",
  "💻", "📱", "🎓", "🏆", "🎉", "🧾", "📅", "🗒️",
]

type Props = {
  value: string | null
  onChange: (icon: string | null) => void
}

export default function IconPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title="Change icon"
        className="flex h-9 w-9 items-center justify-center rounded-md border text-xl hover:bg-muted transition-colors"
      >
        {value ? value : <FileText size={18} className="text-muted-foreground" />}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-64 rounded-md border bg-background p-2 shadow-md">
          <div className="grid grid-cols-8 gap-1">
            {EMOJIS.map(em => (
              <button
                key={em}
                type="button"
                onClick={() => { onChange(em); setOpen(false) }}
                className={`flex h-7 w-7 items-center justify-center rounded text-lg hover:bg-muted ${value === em ? "bg-muted" : ""}`}
              >
                {em}
              </button>
            ))}
          </div>
          {value && (
            <button
              type="button"
              onClick={() => { onChange(null); setOpen(false) }}
              className="mt-2 w-full border-t pt-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Remove icon
            </button>
          )}
        </div>
      )}
    </div>
  )
}
