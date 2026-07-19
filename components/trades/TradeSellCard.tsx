"use client"

import { useState } from "react"
import { TradeAccount, TradeStockSell } from "@/lib/types"
import { formatCurrency } from "@/lib/utils/finance"
import { sellProceeds, sellGross } from "@/lib/utils/trades"
import { Trash2, Pencil } from "lucide-react"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import SellForm from "./SellForm"

type SellFields = {
  stock_code: string
  sell_date: string
  sell_price: number
  volume: number
  fee: number
}

type Props = {
  sell: TradeStockSell
  broker: TradeAccount
  avgBuyPrice: number
  visible: boolean
  isEditing: boolean
  onEdit: (sell: TradeStockSell) => void
  onUpdateSell: (id: string, updates: SellFields) => Promise<void>
  onDeleteSell: (id: string) => void
}

function fmtShares(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 })
}

export default function TradeSellCard({ sell, broker, avgBuyPrice, visible, isEditing, onEdit, onUpdateSell, onDeleteSell }: Props) {
  const [confirming, setConfirming] = useState(false)
  const currency = broker.currency
  const realized = sellGross(sell, avgBuyPrice) // gross; fee is shown on its own line

  if (isEditing) {
    return (
      <SellForm
        broker={broker}
        stockCode={sell.stock_code}
        avgBuyPrice={avgBuyPrice}
        defaultDate={sell.sell_date}
        sell={sell}
        submitLabel="Save Changes"
        onSubmit={async fields => {
          await onUpdateSell(sell.id, {
            stock_code: fields.stock_code,
            sell_date: fields.sell_date,
            sell_price: fields.sell_price,
            volume: fields.volume,
            fee: fields.fee,
          })
          onEdit(sell)
        }}
        onCancel={() => onEdit(sell)}
      />
    )
  }

  return (
    <>
      {confirming && (
        <ConfirmDialog
          message="Delete this sale?"
          onConfirm={() => { setConfirming(false); onDeleteSell(sell.id) }}
          onCancel={() => setConfirming(false)}
        />
      )}
      <div className="flex items-start gap-3 border border-gray-400 rounded-lg px-4 py-3 hover:bg-muted/30 transition-colors">
        <div className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 bg-amber-500" />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {sell.stock_code}
            <span className="text-muted-foreground font-normal"> · Sell</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {visible ? fmtShares(sell.volume) : '••••'} shares @ {visible ? formatCurrency(sell.sell_price, currency) : '••••'}
          </p>
          {sell.fee > 0 && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
              Fee −{visible ? formatCurrency(sell.fee, currency) : '••••'}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <div className="text-right mr-2">
            {visible ? (
              <>
                <p className="text-sm font-semibold">{formatCurrency(sellProceeds(sell), currency)}</p>
                <p className={`text-xs mt-0.5 ${realized >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {realized >= 0 ? '+' : '−'}{formatCurrency(Math.abs(realized), currency)}
                </p>
              </>
            ) : (
              <p className="text-sm font-bold tracking-widest text-muted-foreground">••••••</p>
            )}
          </div>
          <button
            onClick={() => onEdit(sell)}
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
