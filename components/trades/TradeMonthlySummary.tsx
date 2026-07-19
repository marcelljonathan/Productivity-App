"use client"

import { TradeAccount, TradeStockLot, TradeStockSell } from "@/lib/types"
import { formatCurrency } from "@/lib/utils/finance"
import { aggregatePositions, sumInvested, sumRealizedGross, netPL } from "@/lib/utils/trades"

type Props = {
  periodStart: string
  periodEnd: string
  lots: TradeStockLot[]
  sells: TradeStockSell[]
  costBasis: Record<string, number>
  broker: TradeAccount
  visible: boolean
}

function fmtShares(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 })
}

export default function TradeMonthlySummary({ periodStart, periodEnd, lots, sells, costBasis, broker, visible }: Props) {
  const inRange = (d: string) => d >= periodStart && d <= periodEnd
  const monthBuys = lots.filter(l => inRange(l.buy_date))
  const monthSells = sells.filter(s => inRange(s.sell_date))
  const total = sumInvested(monthBuys)
  const realized = sumRealizedGross(monthSells, costBasis)
  const net = netPL(monthBuys, monthSells, costBasis)
  const positions = aggregatePositions(monthBuys) // buys bought this month, per stock
  const currency = broker.currency
  const MASK = <span className="font-bold tracking-widest text-muted-foreground">••••••</span>

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border border-gray-400 rounded-lg p-3 space-y-1">
          <p className="text-xs text-muted-foreground">Total transaction</p>
          <p className="text-sm font-semibold">{visible ? formatCurrency(total, currency) : MASK}</p>
        </div>
        <div className="border border-gray-400 rounded-lg p-3 space-y-1">
          <p className="text-xs text-muted-foreground">Realized P/L</p>
          <p className={`text-sm font-semibold ${realized >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {visible ? `${realized >= 0 ? '+' : '−'}${formatCurrency(Math.abs(realized), currency)}` : MASK}
          </p>
        </div>
        <div className="border border-gray-400 rounded-lg p-3 space-y-1">
          <p className="text-xs text-muted-foreground">Net P/L</p>
          <p className={`text-sm font-semibold ${net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {visible ? `${net >= 0 ? '+' : '−'}${formatCurrency(Math.abs(net), currency)}` : MASK}
          </p>
        </div>
        <div className="border border-gray-400 rounded-lg p-3 space-y-1">
          <p className="text-xs text-muted-foreground">Buys · Sells</p>
          <p className="text-sm font-semibold">{monthBuys.length} · {monthSells.length}</p>
        </div>
      </div>

      {positions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No buys this month.</p>
      ) : (
        <div className="border border-gray-400 rounded-lg overflow-hidden divide-y divide-gray-400">
          {positions.map(p => (
            <div key={p.stock_code} className="flex items-center justify-between px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium">{p.stock_code}</p>
                <p className="text-xs text-muted-foreground">
                  {visible ? fmtShares(p.volume) : '••••'} shares · avg {visible ? formatCurrency(p.avgPrice, currency) : '••••'}
                </p>
              </div>
              <p className="text-sm font-semibold shrink-0">{visible ? formatCurrency(p.totalBuy, currency) : '••••'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
