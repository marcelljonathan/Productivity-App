"use client"

import { useState } from "react"
import { TradeAccount, TradeStockSell } from "@/lib/types"
import { formatCurrency } from "@/lib/utils/finance"
import { calcBrokerFee } from "@/lib/utils/trades"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AmountInput } from "@/components/ui/AmountInput"
import FeeFields from "./FeeFields"

type NewSell = {
  account_id: string
  stock_code: string
  sell_date: string
  sell_price: number
  volume: number
  fee: number
  fee_pct: number | null
  meterai: boolean
  note: string | null
}

type Props = {
  broker: TradeAccount
  stockCode: string
  avgBuyPrice: number       // cost basis, for the live P/L estimate
  maxVolume?: number        // shares available to sell (omit to skip the cap, e.g. when editing)
  defaultDate: string
  sell?: TradeStockSell
  submitLabel?: string
  onSubmit: (sell: NewSell) => Promise<void>
  onCancel: () => void
}

const CURRENCY_SYMBOL: Record<string, string> = { IDR: 'Rp', USD: '$' }

function parseNum(value: string): number {
  return parseFloat(value.replace(/,/g, '')) || 0
}

function fmtShares(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 })
}

export default function SellForm({ broker, stockCode, avgBuyPrice, maxVolume, defaultDate, sell, submitLabel, onSubmit, onCancel }: Props) {
  const [sellDate, setSellDate] = useState(sell?.sell_date ?? defaultDate)
  const [sellPrice, setSellPrice] = useState(sell ? String(sell.sell_price) : '')
  const [volume, setVolume] = useState(sell ? String(sell.volume) : (maxVolume ? String(maxVolume) : ''))
  // New sells start from the broker's default %; edits keep the % saved on the sell.
  const initialPct = sell ? sell.fee_pct : broker.sell_fee_pct
  const [feePct, setFeePct] = useState(initialPct != null ? String(initialPct) : '')
  const [meterai, setMeterai] = useState(sell?.meterai ?? false)
  // Older sells stored a manually-typed fee with no %; keep that amount until the % or meterai is changed.
  const [legacyFee, setLegacyFee] = useState<number | null>(sell && sell.fee_pct == null && sell.fee > 0 ? sell.fee : null)
  const [note, setNote] = useState(sell?.note ?? '')
  const [saving, setSaving] = useState(false)

  const symbol = CURRENCY_SYMBOL[broker.currency] ?? broker.currency
  const vol = parseNum(volume)
  const price = parseNum(sellPrice)
  const proceeds = price * vol
  const gross = (price - avgBuyPrice) * vol
  const fee = legacyFee ?? calcBrokerFee(proceeds, parseNum(feePct), meterai, broker.currency)
  const net = gross - fee
  const overVolume = maxVolume !== undefined && vol > maxVolume + 1e-9

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!sellPrice || !volume || overVolume) return
    setSaving(true)
    await onSubmit({
      account_id: broker.id,
      stock_code: stockCode,
      sell_date: sellDate,
      sell_price: price,
      volume: vol,
      fee,
      fee_pct: legacyFee == null && feePct ? parseNum(feePct) : null,
      meterai: legacyFee == null && meterai,
      note: note.trim() || null,
    })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-400 rounded-lg p-4 space-y-4 bg-red-50/40 dark:bg-red-950/10">
      <p className="text-sm font-medium">Sell {stockCode}</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Sell date</Label>
          <Input type="date" value={sellDate} onChange={e => setSellDate(e.target.value)} className="text-sm" required />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">
            Volume (shares){maxVolume !== undefined && <span className="text-muted-foreground"> · max {fmtShares(maxVolume)}</span>}
          </Label>
          <AmountInput
            value={volume}
            onChange={setVolume}
            placeholder="0"
            className={`w-full border rounded-md px-3 py-1.5 text-sm bg-background outline-none ${overVolume ? 'border-red-500' : ''}`}
            required
          />
        </div>
      </div>

      {overVolume && (
        <p className="text-xs text-red-600 dark:text-red-400">You only hold {fmtShares(maxVolume!)} shares.</p>
      )}

      <div className="space-y-1">
        <Label className="text-xs">Sell price</Label>
        <div className="flex items-center border rounded-md overflow-hidden bg-background text-sm">
          <span className="px-2.5 py-1.5 text-muted-foreground border-r bg-muted/50 shrink-0 select-none">{symbol}</span>
          <AmountInput value={sellPrice} onChange={setSellPrice} placeholder="0" className="flex-1 px-3 py-1.5 bg-transparent outline-none min-w-0" required />
        </div>
      </div>

      <FeeFields
        label="Sell fee (counts as a loss)"
        currency={broker.currency}
        pct={feePct}
        onPctChange={v => { setFeePct(v); setLegacyFee(null) }}
        meterai={meterai}
        onMeteraiChange={v => { setMeterai(v); setLegacyFee(null) }}
        fee={fee}
        hint={legacyFee != null ? 'Entered manually before. Set a % to recalculate.' : undefined}
      />

      <div className="space-y-1">
        <Label className="text-xs">Description (optional)</Label>
        <Input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="e.g. took profit, cut loss..."
          className="text-sm"
        />
      </div>

      <div className="space-y-1.5 border border-gray-400 rounded-md px-3 py-2 bg-background/60">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Proceeds (price × volume)</span>
          <span className="font-medium">{formatCurrency(proceeds, broker.currency)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Realized P/L (vs avg {formatCurrency(avgBuyPrice, broker.currency)})</span>
          <span className={`font-medium ${gross >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {gross >= 0 ? '+' : '−'}{formatCurrency(Math.abs(gross), broker.currency)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Net P/L (after fee)</span>
          <span className={`font-semibold ${net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {net >= 0 ? '+' : '−'}{formatCurrency(Math.abs(net), broker.currency)}
          </span>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm" disabled={saving || overVolume}>{saving ? 'Saving...' : (submitLabel ?? 'Sell')}</Button>
      </div>
    </form>
  )
}
