"use client"

import { TradeAccount, TradeStockLot, TradeStockSell } from "@/lib/types"
import { addDays, getTodayLocalDate } from "@/lib/utils/timezone"
import { formatCurrency } from "@/lib/utils/finance"
import { sumInvested, sumRealizedGross, netPL } from "@/lib/utils/trades"

type Props = {
  weekStart: string
  lots: TradeStockLot[]
  sells: TradeStockSell[]
  costBasis: Record<string, number>
  broker: TradeAccount
  visible: boolean
  onDayClick: (date: string) => void
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function TradeWeeklyChart({ weekStart, lots, sells, costBasis, broker, visible, onDayClick }: Props) {
  const today = getTodayLocalDate()
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const daySet = new Set(days)

  const byDate: Record<string, TradeStockLot[]> = {}
  for (const l of lots) (byDate[l.buy_date] ??= []).push(l)

  const dayData = days.map((dateStr, i) => {
    const dl = byDate[dateStr] || []
    return {
      dateStr,
      label: DAY_NAMES[i],
      day: dateStr.slice(8),
      invested: sumInvested(dl),
      isToday: dateStr === today,
    }
  })

  const weekBuys = days.flatMap(d => byDate[d] || [])
  const weekSells = sells.filter(s => daySet.has(s.sell_date))
  const weekTotal = dayData.reduce((s, d) => s + d.invested, 0)
  const weekRealized = sumRealizedGross(weekSells, costBasis)
  const weekNet = netPL(weekBuys, weekSells, costBasis)
  const maxAmount = Math.max(...dayData.map(d => d.invested), 1)
  const MASK = <span className="font-bold tracking-widest text-muted-foreground">••••••</span>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <div className="border border-gray-400 rounded-lg p-3 space-y-1">
          <p className="text-xs text-muted-foreground">Total transaction</p>
          <p className="text-sm font-semibold">{visible ? formatCurrency(weekTotal, broker.currency) : MASK}</p>
        </div>
        <div className="border border-gray-400 rounded-lg p-3 space-y-1">
          <p className="text-xs text-muted-foreground">Realized P/L</p>
          <p className={`text-sm font-semibold ${weekRealized >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {visible ? `${weekRealized >= 0 ? '+' : '−'}${formatCurrency(Math.abs(weekRealized), broker.currency)}` : MASK}
          </p>
        </div>
        <div className="border border-gray-400 rounded-lg p-3 space-y-1">
          <p className="text-xs text-muted-foreground">Net P/L</p>
          <p className={`text-sm font-semibold ${weekNet >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {visible ? `${weekNet >= 0 ? '+' : '−'}${formatCurrency(Math.abs(weekNet), broker.currency)}` : MASK}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 items-end">
        {dayData.map(({ dateStr, label, day, invested, isToday }) => {
          const h = Math.round((invested / maxAmount) * 96)
          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className="flex flex-col items-center gap-1 w-full hover:opacity-80 transition-opacity"
              title={visible ? formatCurrency(invested, broker.currency) : undefined}
            >
              <div className="flex items-end h-24">
                <div className="w-4 rounded-t bg-blue-400 dark:bg-blue-600 transition-all" style={{ height: `${h}px` }} />
              </div>
              <span className={`text-[10px] font-medium ${isToday ? 'text-blue-600' : 'text-muted-foreground'}`}>{label}</span>
              <span className="text-[9px] text-muted-foreground">{day}</span>
            </button>
          )
        })}
      </div>

      <div className="flex justify-center text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400 inline-block" /> Invested per day</span>
      </div>
    </div>
  )
}
