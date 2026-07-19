"use client"

import { useState } from "react"
import { TradeAccount, TradeStockLot } from "@/lib/types"
import { formatCurrency } from "@/lib/utils/finance"
import { lotInvested } from "@/lib/utils/trades"
import { Trash2, Pencil } from "lucide-react"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import StockBuyForm from "./StockBuyForm"

type LotFields = {
  stock_code: string
  buy_date: string
  buy_price: number
  volume: number
  fee: number
}

type Props = {
  lot: TradeStockLot
  broker: TradeAccount
  visible: boolean
  isEditing: boolean
  onEdit: (lot: TradeStockLot) => void
  onUpdateLot: (id: string, updates: LotFields) => Promise<void>
  onDeleteLot: (id: string) => void
}

function fmtShares(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 })
}

export default function TradeBuyCard({ lot, broker, visible, isEditing, onEdit, onUpdateLot, onDeleteLot }: Props) {
  const [confirming, setConfirming] = useState(false)
  const currency = broker.currency

  if (isEditing) {
    return (
      <StockBuyForm
        broker={broker}
        defaultDate={lot.buy_date}
        lot={lot}
        submitLabel="Save Changes"
        onSubmit={async fields => { await onUpdateLot(lot.id, fields); onEdit(lot) }}
        onCancel={() => onEdit(lot)}
      />
    )
  }

  return (
    <>
      {confirming && (
        <ConfirmDialog
          message="Delete this purchase?"
          onConfirm={() => { setConfirming(false); onDeleteLot(lot.id) }}
          onCancel={() => setConfirming(false)}
        />
      )}
      <div className="flex items-start gap-3 border border-gray-400 rounded-lg px-4 py-3 hover:bg-muted/30 transition-colors">
        <div className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 bg-blue-500" />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {lot.stock_code}
            <span className="text-muted-foreground font-normal"> · Buy</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {visible ? fmtShares(lot.volume) : '••••'} shares @ {visible ? formatCurrency(lot.buy_price, currency) : '••••'}
          </p>
          {lot.fee > 0 && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
              Fee −{visible ? formatCurrency(lot.fee, currency) : '••••'}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <div className="text-right mr-2">
            {visible ? (
              <p className="text-sm font-semibold">{formatCurrency(lotInvested(lot), currency)}</p>
            ) : (
              <p className="text-sm font-bold tracking-widest text-muted-foreground">••••••</p>
            )}
          </div>
          <button
            onClick={() => onEdit(lot)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => setConfirming(true)}
            className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </>
  )
}
