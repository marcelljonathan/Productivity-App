"use client"

import { useRef, useEffect } from "react"

function normalize(value: string): string {
  const lastIsComma = value.endsWith(',')
  const noCommas = value.replace(/,/g, '')
  const withDot = lastIsComma ? noCommas + '.' : noCommas
  const clean = withDot.replace(/[^\d.]/g, '')
  const dot = clean.indexOf('.')
  if (dot === -1) return clean
  return clean.slice(0, dot + 1) + clean.slice(dot + 1).replace(/\./g, '')
}

function formatDisplay(raw: string): string {
  const parts = raw.replace(/,/g, '').split('.')
  const integer = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.length > 1 ? `${integer}.${parts[1]}` : integer
}

type Props = {
  value: string
  onChange: (clean: string) => void
  placeholder?: string
  className?: string
  required?: boolean
}

export function AmountInput({ value, onChange, placeholder = '0', className, required }: Props) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!ref.current || document.activeElement === ref.current) return
    const display = value ? formatDisplay(value) : ''
    if (ref.current.value !== display) ref.current.value = display
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target
    const cursor = input.selectionStart ?? input.value.length
    const lastIsComma = input.value.endsWith(',')
    const contentBefore = input.value.slice(0, cursor).replace(/,/g, '').length + (lastIsComma ? 1 : 0)

    const clean = normalize(input.value)
    const display = formatDisplay(clean)

    // Write directly to DOM — bypasses React's controlled-value cycle so iOS
    // never sees a value mismatch that would swallow subsequent keystrokes
    input.value = display

    // Restore cursor accounting for commas added/removed by formatting
    let count = 0, newPos = display.length
    for (let i = 0; i < display.length; i++) {
      if (display[i] !== ',') count++
      if (count === contentBefore) { newPos = i + 1; break }
    }
    input.setSelectionRange(newPos, newPos)

    onChange(clean)
  }

  return (
    <input
      ref={ref}
      type="text"
      inputMode="decimal"
      defaultValue={value ? formatDisplay(value) : ''}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      required={required}
    />
  )
}
