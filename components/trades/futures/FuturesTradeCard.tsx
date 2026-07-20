"use client"

import { useState } from "react"
import { TradeAccount, TradeFuturesTrade } from "@/lib/types"
import { formatCurrency } from "@/lib/utils/finance"
import { futuresTradeNet } from "@/lib/utils/futures"
import { Trash2, Pencil } from "lucide-react"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import FuturesTradeForm from "./FuturesTradeForm"

type TradeFields = {
  instrument: string
  side: 'buy' | 'sell'
  price: number
  volume: number
  contract_size: number
  commission: number
  swap: number
  trade_date: string
}

type Props = {
  trade: TradeFuturesTrade
  broker: TradeAccount
  realizedGross: number   // realized P/L this trade produced (0 if it only opened/added)
  visible: boolean
  isEditing: boolean
  contractSizeByInstrument?: Record<string, number>
  onEdit: (t: TradeFuturesTrade) => void
  onUpdate: (id: string, updates: TradeFields) => Promise<void>
  onDelete: (id: string) => void
}

function fmtContracts(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 })
}

export default function FuturesTradeCard({ trade: t, broker, realizedGross, visible, isEditing, contractSizeByInstrument, onEdit, onUpdate, onDelete }: Props) {
  const [confirming, setConfirming] = useState(false)
  const currency = broker.currency
  const isBuy = t.side === 'buy'
  const net = futuresTradeNet(t, { [t.id]: realizedGross })

  if (isEditing) {
    return (
      <FuturesTradeForm
        broker={broker}
        defaultDate={t.trade_date}
        trade={t}
        contractSizeByInstrument={contractSizeByInstrument}
        mode="edit"
        submitLabel="Save Changes"
        onSubmit={async fields => {
          await onUpdate(t.id, {
            instrument: fields.instrument,
            side: fields.side,
            price: fields.price,
            volume: fields.volume,
            contract_size: fields.contract_size,
            commission: fields.commission,
            swap: fields.swap,
            trade_date: fields.trade_date,
          })
          onEdit(t)
        }}
        onCancel={() => onEdit(t)}
      />
    )
  }

  return (
    <>
      {confirming && (
        <ConfirmDialog
          message="Delete this trade?"
          onConfirm={() => { setConfirming(false); onDelete(t.id) }}
          onCancel={() => setConfirming(false)}
        />
      )}
      <div className="flex items-start gap-3 border border-gray-400 rounded-lg px-4 py-3 hover:bg-muted/30 transition-colors">
        <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${isBuy ? 'bg-green-500' : 'bg-red-500'}`} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {t.instrument}
            <span className={`ml-1.5 text-xs font-normal ${isBuy ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isBuy ? 'Buy' : 'Sell'}
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {visible ? fmtContracts(t.volume) : '••••'} @ {visible ? formatCurrency(t.price, currency) : '••••'}
          </p>
          {(t.commission > 0 || t.swap !== 0) && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {t.commission > 0 && <span className="text-red-600 dark:text-red-400">Comm −{visible ? formatCurrency(t.commission, currency) : '••••'}</span>}
              {t.commission > 0 && t.swap !== 0 && ' · '}
              {t.swap !== 0 && <span className="text-red-600 dark:text-red-400">Swap −{visible ? formatCurrency(t.swap, currency) : '••••'}</span>}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <div className="text-right mr-2">
            {visible ? (
              <>
                <p className={`text-sm font-semibold ${net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {net >= 0 ? '+' : '−'}{formatCurrency(Math.abs(net), currency)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">net P/L</p>
              </>
            ) : (
              <p className="text-sm font-bold tracking-widest text-muted-foreground">••••••</p>
            )}
          </div>
          <button onClick={() => onEdit(t)} className="p-1 text-muted-foreground hover:text-foreground transition-colors" title="Edit">
            <Pencil size={14} />
          </button>
          <button onClick={() => setConfirming(true)} className="p-1 text-muted-foreground hover:text-red-500 transition-colors" title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </>
  )
}
