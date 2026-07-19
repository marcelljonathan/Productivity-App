"use client"

import { useState } from "react"
import { TradeAccount } from "@/lib/types"
import { StockPosition } from "@/lib/utils/trades"
import { formatCurrency } from "@/lib/utils/finance"
import { getTodayLocalDate } from "@/lib/utils/timezone"
import { ChevronDown, ChevronRight, Trash2, Pencil } from "lucide-react"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import StockBuyForm from "./StockBuyForm"
import SellForm from "./SellForm"

type LotFields = { stock_code: string; buy_date: string; buy_price: number; volume: number; fee: number }
type NewSell = { account_id: string; stock_code: string; sell_date: string; sell_price: number; volume: number; fee: number }

type Props = {
  position: StockPosition
  broker: TradeAccount
  visible: boolean
  onDeleteLot: (id: string) => void
  onUpdateLot: (id: string, updates: LotFields) => Promise<void>
  onSell: (sell: NewSell) => Promise<void>
}

function fmtShares(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 })
}

function fmtDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PortfolioCard({ position: p, broker, visible, onDeleteLot, onUpdateLot, onSell }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selling, setSelling] = useState(false)

  const currency = broker.currency
  const hidden = <span className="tracking-widest text-muted-foreground">••••</span>

  return (
    <div className="border border-gray-400 rounded-lg overflow-hidden">
      {confirmId && (
        <ConfirmDialog
          message="Remove this purchase from the portfolio?"
          onConfirm={() => { onDeleteLot(confirmId); setConfirmId(null) }}
          onCancel={() => setConfirmId(null)}
        />
      )}

      {/* Summary row */}
      <div className="flex items-start justify-between px-4 py-3 gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{p.stock_code}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {visible ? fmtShares(p.volume) : '••••'} shares · avg {visible ? formatCurrency(p.avgPrice, currency) : hidden}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold">{visible ? formatCurrency(p.totalBuy, currency) : hidden}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">invested</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-gray-400 px-2 py-1.5">
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
        >
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          {p.lots.length} {p.lots.length === 1 ? 'buy' : 'buys'}
        </button>
        <button
          onClick={() => setSelling(v => !v)}
          className="text-xs font-medium px-3 py-1 rounded-md border border-gray-400 text-foreground hover:bg-muted/50 transition-colors"
        >
          Sell
        </button>
      </div>

      {/* Sell form */}
      {selling && (
        <div className="border-t border-gray-400 p-3">
          <SellForm
            broker={broker}
            stockCode={p.stock_code}
            avgBuyPrice={p.avgPrice}
            maxVolume={p.volume}
            defaultDate={getTodayLocalDate()}
            onSubmit={async sell => { await onSell(sell); setSelling(false) }}
            onCancel={() => setSelling(false)}
          />
        </div>
      )}

      {/* Individual buys */}
      {expanded && (
        <div className="border-t border-gray-400 bg-muted/10 divide-y divide-gray-400">
          {p.lots.map(lot => (
            editingId === lot.id ? (
              <div key={lot.id} className="p-3">
                <StockBuyForm
                  broker={broker}
                  defaultDate={lot.buy_date}
                  lot={lot}
                  submitLabel="Save Changes"
                  onSubmit={async fields => { await onUpdateLot(lot.id, fields); setEditingId(null) }}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : (
              <div key={lot.id} className="flex items-center justify-between px-4 py-2 text-xs gap-2">
                <div className="min-w-0">
                  <span className="text-muted-foreground">{fmtDate(lot.buy_date)}</span>
                  <span className="mx-1.5">·</span>
                  {visible ? fmtShares(lot.volume) : '••••'} shares @ {visible ? formatCurrency(lot.buy_price, currency) : '••••'}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => setEditingId(lot.id)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit this purchase"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setConfirmId(lot.id)}
                    className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                    title="Delete this purchase"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  )
}
