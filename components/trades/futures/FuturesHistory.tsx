"use client"

import { useState } from "react"
import { TradeAccount } from "@/lib/types"
import { FuturesClose } from "@/lib/utils/futures"
import { formatCurrency } from "@/lib/utils/finance"
import HistoryTimeframe, { Timeframe, ALL_TIME, inTimeframe } from "../HistoryTimeframe"

type Props = {
  closes: FuturesClose[]
  broker: TradeAccount
  visible: boolean
}

function fmtLots(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 })
}

function fmtDate(d: string): string {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function FuturesHistory({ closes, broker, visible }: Props) {
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
          {closes.length === 0 ? 'No closed positions yet.' : 'No closes in this range.'}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="border border-gray-400 rounded-lg p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Closes</p>
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
            {rows.map(c => {
              const isLong = c.direction === 'long'
              return (
                <div key={c.id} className="border border-gray-400 rounded-lg px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{c.instrument}</p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          isLong ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                 : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                        }`}>
                          {isLong ? 'LONG' : 'SHORT'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {visible ? fmtLots(c.volume) : '••••'} lots · entry{' '}
                        {visible ? formatCurrency(c.avgEntry, currency) : '••••'} → exit{' '}
                        {visible ? formatCurrency(c.exitPrice, currency) : '••••'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        opened {fmtDate(c.openDate)} · closed {fmtDate(c.closeDate)}
                      </p>
                      {c.costs > 0 && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                          Comm + swap −{visible ? formatCurrency(c.costs, currency) : '••••'}
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
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
