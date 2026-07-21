"use client"

import { useState } from "react"
import { TradeAccount, TradeStockLot } from "@/lib/types"
import { formatCurrency } from "@/lib/utils/finance"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AmountInput } from "@/components/ui/AmountInput"

type NewLot = {
  account_id: string
  stock_code: string
  buy_date: string
  buy_price: number
  volume: number
  fee: number
  note: string | null
}

type Props = {
  broker: TradeAccount
  defaultDate: string
  lot?: TradeStockLot
  submitLabel?: string
  onSubmit: (lot: NewLot) => Promise<void>
  onCancel: () => void
}

const CURRENCY_SYMBOL: Record<string, string> = { IDR: 'Rp', USD: '$' }

function parseNum(value: string): number {
  return parseFloat(value.replace(/,/g, '')) || 0
}

export default function StockBuyForm({ broker, defaultDate, lot, submitLabel, onSubmit, onCancel }: Props) {
  const [stockCode, setStockCode] = useState(lot?.stock_code ?? '')
  const [buyDate, setBuyDate] = useState(lot?.buy_date ?? defaultDate)
  const [buyPrice, setBuyPrice] = useState(lot ? String(lot.buy_price) : '')
  const [volume, setVolume] = useState(lot ? String(lot.volume) : '')
  const [fee, setFee] = useState(lot?.fee ? String(lot.fee) : '')
  const [note, setNote] = useState(lot?.note ?? '')
  const [saving, setSaving] = useState(false)

  const symbol = CURRENCY_SYMBOL[broker.currency] ?? broker.currency
  const totalBuy = parseNum(buyPrice) * parseNum(volume)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stockCode.trim() || !buyPrice || !volume) return
    setSaving(true)
    await onSubmit({
      account_id: broker.id,
      stock_code: stockCode.trim().toUpperCase(),
      buy_date: buyDate,
      buy_price: parseNum(buyPrice),
      volume: parseNum(volume),
      fee: parseNum(fee),
      note: note.trim() || null,
    })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-400 rounded-lg p-4 space-y-4 bg-muted/20">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Stock code</Label>
          <Input
            value={stockCode}
            onChange={e => setStockCode(e.target.value.toUpperCase())}
            placeholder="e.g. BBCA"
            className="text-sm uppercase"
            autoFocus
            required
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Buy date</Label>
          <Input type="date" value={buyDate} onChange={e => setBuyDate(e.target.value)} className="text-sm" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Buy price</Label>
          <div className="flex items-center border rounded-md overflow-hidden bg-background text-sm">
            <span className="px-2.5 py-1.5 text-muted-foreground border-r bg-muted/50 shrink-0 select-none">{symbol}</span>
            <AmountInput value={buyPrice} onChange={setBuyPrice} placeholder="0" className="flex-1 px-3 py-1.5 bg-transparent outline-none min-w-0" required />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Volume (shares)</Label>
          <AmountInput
            value={volume}
            onChange={setVolume}
            placeholder="0"
            className="w-full border rounded-md px-3 py-1.5 text-sm bg-background outline-none"
            required
          />
        </div>
      </div>

      {/* Total buy = price x volume (auto) */}
      <div className="flex items-center justify-between border border-gray-400 rounded-md px-3 py-2 bg-muted/30">
        <span className="text-xs text-muted-foreground">Total buy (price × volume)</span>
        <span className="text-sm font-semibold">{formatCurrency(totalBuy, broker.currency)}</span>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Additional fee (counts as a loss)</Label>
        <div className="flex items-center border rounded-md overflow-hidden bg-background text-sm">
          <span className="px-2.5 py-1.5 text-muted-foreground border-r bg-muted/50 shrink-0 select-none">{symbol}</span>
          <AmountInput value={fee} onChange={setFee} placeholder="0" className="flex-1 px-3 py-1.5 bg-transparent outline-none min-w-0" />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Description (optional)</Label>
        <Input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="e.g. averaging down, earnings play..."
          className="text-sm"
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm" disabled={saving}>{saving ? 'Saving...' : (submitLabel ?? 'Add to Portfolio')}</Button>
      </div>
    </form>
  )
}
