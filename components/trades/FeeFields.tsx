"use client"

import { Currency } from "@/lib/types"
import { METERAI_FEE } from "@/lib/utils/trades"
import { Label } from "@/components/ui/label"
import { AmountInput } from "@/components/ui/AmountInput"

const CURRENCY_SYMBOL: Record<string, string> = { IDR: 'Rp', USD: '$' }

function fmtAmount(n: number, currency: Currency): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: currency === 'IDR' ? 0 : 2 })
}

// Number input with a "%" suffix box (accepts "0,15" as well as "0.15").
export function PercentInput({ value, onChange, placeholder = '0' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex items-center border rounded-md overflow-hidden bg-background text-sm">
      <AmountInput value={value} onChange={onChange} placeholder={placeholder} className="flex-1 px-3 py-1.5 bg-transparent outline-none min-w-0" />
      <span className="px-2.5 py-1.5 text-muted-foreground border-l bg-muted/50 shrink-0 select-none">%</span>
    </div>
  )
}

type Props = {
  label: string
  currency: Currency
  pct: string
  onPctChange: (v: string) => void
  meterai: boolean
  onMeteraiChange: (v: boolean) => void
  fee: number  // final fee to show (computed by the form)
  hint?: string
}

// Broker fee: percentage input | auto-calculated amount, plus the meterai toggle (IDR only).
export default function FeeFields({ label, currency, pct, onPctChange, meterai, onMeteraiChange, fee, hint }: Props) {
  const symbol = CURRENCY_SYMBOL[currency] ?? currency

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-xs">{label}</Label>
        <div className="grid grid-cols-2 gap-3">
          <PercentInput value={pct} onChange={onPctChange} placeholder="e.g. 0.15" />
          <div className="flex items-center border rounded-md overflow-hidden bg-muted/40 text-sm" title="Calculated automatically">
            <span className="px-2.5 py-1.5 text-muted-foreground border-r bg-muted/50 shrink-0 select-none">{symbol}</span>
            <span className="flex-1 px-3 py-1.5 font-medium truncate">{fmtAmount(fee, currency)}</span>
          </div>
        </div>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>

      {currency === 'IDR' && (
        <button
          type="button"
          role="switch"
          aria-checked={meterai}
          onClick={() => onMeteraiChange(!meterai)}
          className="flex items-center gap-2.5 text-xs"
        >
          <span className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${meterai ? 'bg-foreground' : 'bg-gray-300 dark:bg-gray-600'}`}>
            <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-background shadow transition-transform ${meterai ? 'translate-x-4' : ''}`} />
          </span>
          <span>Meterai fee</span>
          <span className="text-muted-foreground">+{symbol} {fmtAmount(METERAI_FEE, currency)}</span>
        </button>
      )}
    </div>
  )
}
