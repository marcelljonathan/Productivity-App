"use client"

import { useState } from "react"
import { TradeAccount } from "@/lib/types"
import { FuturesPosition } from "@/lib/utils/futures"
import { formatCurrency } from "@/lib/utils/finance"
import { getTodayLocalDate } from "@/lib/utils/timezone"
import FuturesTradeForm from "./FuturesTradeForm"

type NewTrade = {
  account_id: string
  instrument: string
  side: 'buy' | 'sell'
  price: number
  volume: number
  contract_size: number
  commission: number
  swap: number
  usd_rate: number
  trade_date: string
}

type Props = {
  position: FuturesPosition
  broker: TradeAccount
  visible: boolean
  contractSizeByInstrument?: Record<string, number>
  onClose: (t: NewTrade) => Promise<void>
}

function fmtContracts(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 })
}

export default function FuturesPositionCard({ position: p, broker, visible, contractSizeByInstrument, onClose }: Props) {
  const [closing, setClosing] = useState(false)
  const currency = broker.currency
  const isLong = p.direction === 'long'
  const hidden = <span className="tracking-widest text-muted-foreground">••••</span>

  return (
    <div className="border border-gray-400 rounded-lg overflow-hidden">
      <div className="flex items-start justify-between px-4 py-3 gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{p.instrument}</p>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              isLong ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                     : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
            }`}>
              {isLong ? 'LONG' : 'SHORT'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {visible ? fmtContracts(p.volume) : '••••'} lots · avg {visible ? formatCurrency(p.avgEntry, currency) : hidden}
          </p>
        </div>
        <button
          onClick={() => setClosing(v => !v)}
          className="text-xs font-medium px-3 py-1 rounded-md border border-gray-400 text-foreground hover:bg-muted/50 transition-colors shrink-0"
        >
          Close
        </button>
      </div>

      {closing && (
        <div className="border-t border-gray-400 p-3">
          <FuturesTradeForm
            broker={broker}
            defaultDate={getTodayLocalDate()}
            lockInstrument={p.instrument}
            lockSide={isLong ? 'sell' : 'buy'}
            maxVolume={p.volume}
            contractSizeByInstrument={contractSizeByInstrument}
            mode="close"
            submitLabel="Close position"
            onSubmit={async t => { await onClose(t); setClosing(false) }}
            onCancel={() => setClosing(false)}
          />
        </div>
      )}
    </div>
  )
}
