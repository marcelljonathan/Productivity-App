"use client"

import { TradeAccount, TradeFuturesTrade } from "@/lib/types"
import { formatCurrency } from "@/lib/utils/finance"
import { futuresNet, futuresTradeNet } from "@/lib/utils/futures"

type Props = {
  periodStart: string
  periodEnd: string
  trades: TradeFuturesTrade[]
  realizedByTrade: Record<string, number>
  broker: TradeAccount
  visible: boolean
}

function fmtContracts(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 })
}

export default function FuturesMonthlySummary({ periodStart, periodEnd, trades, realizedByTrade, broker, visible }: Props) {
  const monthTrades = trades.filter(t => t.trade_date >= periodStart && t.trade_date <= periodEnd)
  const net = futuresNet(monthTrades, realizedByTrade)
  const currency = broker.currency
  const MASK = <span className="font-bold tracking-widest text-muted-foreground">••••••</span>

  // Per-instrument: lots traded and net P/L this month.
  const byInstrument = new Map<string, { contracts: number; net: number }>()
  for (const t of monthTrades) {
    const k = t.instrument.trim().toUpperCase()
    const e = byInstrument.get(k) ?? { contracts: 0, net: 0 }
    e.contracts += t.volume
    e.net += futuresTradeNet(t, realizedByTrade)
    byInstrument.set(k, e)
  }
  const rows = [...byInstrument.entries()].sort((a, b) => a[0].localeCompare(b[0]))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-gray-400 rounded-lg p-3 space-y-1">
          <p className="text-xs text-muted-foreground">Net P/L</p>
          <p className={`text-sm font-semibold ${net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {visible ? `${net >= 0 ? '+' : '−'}${formatCurrency(Math.abs(net), currency)}` : MASK}
          </p>
        </div>
        <div className="border border-gray-400 rounded-lg p-3 space-y-1">
          <p className="text-xs text-muted-foreground">Trades</p>
          <p className="text-sm font-semibold">{monthTrades.length}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No trades this month.</p>
      ) : (
        <div className="border border-gray-400 rounded-lg overflow-hidden divide-y divide-gray-400">
          {rows.map(([instrument, e]) => (
            <div key={instrument} className="flex items-center justify-between px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium">{instrument}</p>
                <p className="text-xs text-muted-foreground">{visible ? fmtContracts(e.contracts) : '••••'} lots traded</p>
              </div>
              <p className={`text-sm font-semibold shrink-0 ${e.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {visible ? `${e.net >= 0 ? '+' : '−'}${formatCurrency(Math.abs(e.net), currency)}` : '••••'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
