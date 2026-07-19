"use client"

import { useState } from "react"
import { BrokerType, Currency, TradeAccount } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, CandlestickChart, LineChart } from "lucide-react"

type Props = {
  brokers: TradeAccount[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAdd: (name: string, type: BrokerType, currency: Currency) => Promise<TradeAccount | null>
}

const TYPE_LABEL: Record<BrokerType, string> = { stock: 'Stock', futures: 'Futures' }

export default function BrokerSelector({ brokers, selectedId, onSelect, onAdd }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<BrokerType>('stock')
  const [currency, setCurrency] = useState<Currency>('IDR')
  const [saving, setSaving] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const broker = await onAdd(name.trim(), type, currency)
    setSaving(false)
    setName(''); setType('stock'); setCurrency('IDR'); setShowAdd(false)
    if (broker) onSelect(broker.id)
  }

  return (
    <div className="space-y-2">
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Broker</span>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {brokers.map(b => {
          const active = b.id === selectedId
          const Icon = b.broker_type === 'futures' ? CandlestickChart : LineChart
          return (
            <button
              key={b.id}
              onClick={() => onSelect(b.id)}
              className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                active
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-gray-400 hover:bg-muted/50'
              }`}
            >
              <Icon size={15} className="shrink-0" />
              <span className="font-medium">{b.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${active ? 'bg-background/20' : 'bg-muted'}`}>
                {TYPE_LABEL[b.broker_type]} · {b.currency}
              </span>
            </button>
          )
        })}

        <button
          onClick={() => setShowAdd(v => !v)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-gray-400 text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
        >
          <Plus size={15} /> Add broker
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="border border-gray-400 rounded-lg p-3 space-y-3 bg-muted/20">
          <p className="text-sm font-medium">New Broker</p>
          <div className="space-y-1">
            <Label className="text-xs">Broker name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mirae, IBKR" className="text-sm" autoFocus required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <select
                value={type}
                onChange={e => setType(e.target.value as BrokerType)}
                className="w-full border rounded-md px-3 py-1.5 text-sm bg-background"
              >
                <option value="stock">Stock Broker</option>
                <option value="futures">Futures Broker</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Currency</Label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value as Currency)}
                className="w-full border rounded-md px-3 py-1.5 text-sm bg-background"
              >
                <option value="IDR">IDR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving} className="flex-1">
              {saving ? 'Adding...' : 'Add Broker'}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </form>
      )}
    </div>
  )
}
