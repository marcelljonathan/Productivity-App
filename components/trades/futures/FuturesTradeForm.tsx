"use client"

import { useState } from "react"
import { FuturesSide, TradeAccount, TradeFuturesTrade } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AmountInput } from "@/components/ui/AmountInput"

type NewTrade = {
  account_id: string
  instrument: string
  side: FuturesSide
  price: number
  volume: number
  contract_size: number
  commission: number
  swap: number
  usd_rate: number
  trade_date: string
}

type Props = {
  broker: TradeAccount
  defaultDate: string
  trade?: TradeFuturesTrade
  lockInstrument?: string       // preset + locked (used when closing from a position)
  lockSide?: FuturesSide        // preset + locked side
  maxVolume?: number            // cap the volume (e.g. lots open to close)
  contractSizeByInstrument?: Record<string, number> // remembered size per instrument (prefill)
  // Which cost fields to show: opening has commission (no swap), closing has swap
  // (no commission), editing shows both. Hidden fields save as 0.
  mode?: 'open' | 'close' | 'edit'
  submitLabel?: string
  onSubmit: (t: NewTrade) => Promise<void>
  onCancel: () => void
}

const CURRENCY_SYMBOL: Record<string, string> = { IDR: 'Rp', USD: '$' }

function parseNum(value: string): number {
  return parseFloat(value.replace(/,/g, '')) || 0
}

function fmtShares(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 })
}

export default function FuturesTradeForm({ broker, defaultDate, trade, lockInstrument, lockSide, maxVolume, contractSizeByInstrument, mode = 'open', submitLabel, onSubmit, onCancel }: Props) {
  const showCommission = mode !== 'close'
  const showSwap = mode !== 'open'
  // The quote→USD rate only matters on the trade that realizes P/L (a close), same as swap.
  const showRate = mode !== 'open'
  const sizeFor = (inst: string) => contractSizeByInstrument?.[inst.trim().toUpperCase()]
  const initialSize = trade?.contract_size ?? sizeFor(lockInstrument ?? '') ?? 1

  const [instrument, setInstrument] = useState(trade?.instrument ?? lockInstrument ?? '')
  const [side, setSide] = useState<FuturesSide>(trade?.side ?? lockSide ?? 'buy')
  const [tradeDate, setTradeDate] = useState(trade?.trade_date ?? defaultDate)
  const [price, setPrice] = useState(trade ? String(trade.price) : '')
  const [volume, setVolume] = useState(trade ? String(trade.volume) : (maxVolume ? String(maxVolume) : ''))
  const [contractSize, setContractSize] = useState(String(initialSize))
  const [commission, setCommission] = useState(trade?.commission ? String(trade.commission) : '')
  const [swap, setSwap] = useState(trade?.swap ? String(trade.swap) : '')
  const [usdRate, setUsdRate] = useState(trade?.usd_rate != null ? String(trade.usd_rate) : '1')
  const [saving, setSaving] = useState(false)

  const symbol = CURRENCY_SYMBOL[broker.currency] ?? broker.currency
  const sideLocked = lockSide !== undefined
  const instrumentLocked = lockInstrument !== undefined
  const vol = parseNum(volume)
  const overVolume = maxVolume !== undefined && vol > maxVolume + 1e-9

  // Typing a remembered instrument pre-fills its contract size.
  function changeInstrument(v: string) {
    const up = v.toUpperCase()
    setInstrument(up)
    const known = sizeFor(up)
    if (known !== undefined) setContractSize(String(known))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!instrument.trim() || !price || !volume || overVolume) return
    setSaving(true)
    await onSubmit({
      account_id: broker.id,
      instrument: instrument.trim().toUpperCase(),
      side,
      price: parseNum(price),
      volume: vol,
      contract_size: parseNum(contractSize) || 1,
      commission: showCommission ? parseNum(commission) : 0,
      swap: showSwap ? parseNum(swap) : 0,
      usd_rate: showRate ? (parseNum(usdRate) || 1) : 1,
      trade_date: tradeDate,
    })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-400 rounded-lg p-4 space-y-4 bg-muted/20">
      {/* Buy (long) / Sell (short) */}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={sideLocked}
          onClick={() => setSide('buy')}
          className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors disabled:opacity-60 ${
            side === 'buy' ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Buy · Long
        </button>
        <button
          type="button"
          disabled={sideLocked}
          onClick={() => setSide('sell')}
          className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors disabled:opacity-60 ${
            side === 'sell' ? 'bg-red-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Sell · Short
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Instrument</Label>
          <Input
            value={instrument}
            onChange={e => changeInstrument(e.target.value)}
            placeholder="e.g. XAUUSD, EURUSD"
            className="text-sm uppercase disabled:opacity-70"
            disabled={instrumentLocked}
            autoFocus={!instrumentLocked}
            required
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Date</Label>
          <Input type="date" value={tradeDate} onChange={e => setTradeDate(e.target.value)} className="text-sm" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Price</Label>
          <AmountInput
            value={price}
            onChange={setPrice}
            placeholder="0"
            className="w-full border rounded-md px-3 py-1.5 text-sm bg-background outline-none"
            required
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">
            Volume (lots){maxVolume !== undefined && <span className="text-muted-foreground"> · max {fmtShares(maxVolume)}</span>}
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

      {overVolume && <p className="text-xs text-red-600 dark:text-red-400">You only have {fmtShares(maxVolume!)} lots open.</p>}

      <div className="space-y-1">
        <Label className="text-xs">Contract size</Label>
        <AmountInput
          value={contractSize}
          onChange={setContractSize}
          placeholder="1"
          className="w-full border rounded-md px-3 py-1.5 text-sm bg-background outline-none"
        />
        <p className="text-[11px] text-muted-foreground">units per lot · XAUUSD 100, forex 100,000</p>
      </div>

      {showRate && (
        <div className="space-y-1">
          <Label className="text-xs">USD conversion rate</Label>
          <AmountInput
            value={usdRate}
            onChange={setUsdRate}
            placeholder="1"
            className="w-full border rounded-md px-3 py-1.5 text-sm bg-background outline-none"
          />
          <p className="text-[11px] text-muted-foreground">
            1 unit of quote currency in {broker.currency} · leave 1 for …{broker.currency} pairs (e.g. EURUSD, XAUUSD)
          </p>
        </div>
      )}

      {(showCommission || showSwap) && (
        <div className={`grid gap-3 ${showCommission && showSwap ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {showCommission && (
            <div className="space-y-1">
              <Label className="text-xs">Commission (optional)</Label>
              <div className="flex items-center border rounded-md overflow-hidden bg-background text-sm">
                <span className="px-2.5 py-1.5 text-muted-foreground border-r bg-muted/50 shrink-0 select-none">{symbol}</span>
                <AmountInput value={commission} onChange={setCommission} placeholder="0" className="flex-1 px-3 py-1.5 bg-transparent outline-none min-w-0" />
              </div>
            </div>
          )}
          {showSwap && (
            <div className="space-y-1">
              <Label className="text-xs">Swap (optional)</Label>
              <div className="flex items-center border rounded-md overflow-hidden bg-background text-sm">
                <span className="px-2.5 py-1.5 text-muted-foreground border-r bg-muted/50 shrink-0 select-none">{symbol}</span>
                <AmountInput value={swap} onChange={setSwap} placeholder="0" className="flex-1 px-3 py-1.5 bg-transparent outline-none min-w-0" />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm" disabled={saving || overVolume}>{saving ? 'Saving...' : (submitLabel ?? 'Add Trade')}</Button>
      </div>
    </form>
  )
}
