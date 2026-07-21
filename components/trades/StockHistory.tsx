"use client"

import { useState } from "react"
import { TradeAccount } from "@/lib/types"
import { StockClose } from "@/lib/utils/trades"
import { formatCurrency } from "@/lib/utils/finance"
import HistoryTimeframe, { Timeframe, ALL_TIME, inTimeframe } from "./HistoryTimeframe"

type Props = {
  closes: StockClose[]
  broker: TradeAccount
  visible: boolean
}

function fmtShares(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 })
}

function fmtDate(d: string): string {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function StockHistory({ closes, broker, visible }: Props) {
  const [timeframe, setTimeframe] = useState<Timeframe>(ALL_TIME)
  const currency = broker.currency

  const rows = closes.filter(c => inTimeframe(c.closeDate, timeframe))
  const totalNet = rows.reduce((s, c) => s + c.netPL, 0)
  const wins = rows.filter(c => c.netPL > 0).length

  return (
    <div className="space-y-4">
      <HistoryTimeframe value={timeframe} onChange={setTimeframe} />

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {closes.length === 0 ? 'No sold stocks yet.' : 'No sales in this range.'}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="border border-gray-400 rounded-lg p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Sales</p>
              <p className="text-sm font-semibold">{rows.length}</p>
            </div>
            <div className="border border-gray-400 rounded-lg p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Win / Loss</p>
              <p className="text-sm font-semibold">{wins} / {rows.length - wins}</p>
            </div>
            <div className="border border-gray-400 rounded-lg p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Total Net P/L</p>
              <p className={`text-sm font-semibold ${totalNet >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {visible
                  ? `${totalNet >= 0 ? '+' : '−'}${formatCurrency(Math.abs(totalNet), currency)}`
                  : <span className="tracking-widest text-muted-foreground">••••••</span>}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {rows.map(c => (
              <div key={c.id} className="border border-gray-400 rounded-lg px-4 py-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {c.stock_code}
                      <span className="text-muted-foreground font-normal text-xs"> · sold {fmtDate(c.closeDate)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {visible ? fmtShares(c.volume) : '••••'} shares · avg buy{' '}
                      {visible ? formatCurrency(c.avgBuy, currency) : '••••'} → sell{' '}
                      {visible ? formatCurrency(c.sellPrice, currency) : '••••'}
                    </p>
                    {c.fees > 0 && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                        Fees −{visible ? formatCurrency(c.fees, currency) : '••••'}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold ${c.netPL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {visible
                        ? `${c.netPL >= 0 ? '+' : '−'}${formatCurrency(Math.abs(c.netPL), currency)}`
                        : <span className="tracking-widest text-muted-foreground">••••</span>}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">net P/L</p>
                  </div>
                </div>

                {(c.buyNotes.length > 0 || c.sellNote) && (
                  <div className="space-y-0.5 border-t border-gray-400 pt-2">
                    {c.buyNotes.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Buy:</span> {c.buyNotes.join(' · ')}
                      </p>
                    )}
                    {c.sellNote && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Sell:</span> {c.sellNote}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
