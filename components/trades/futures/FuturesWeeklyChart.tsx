"use client"

import { TradeAccount, TradeFuturesTrade } from "@/lib/types"
import { addDays, getTodayLocalDate } from "@/lib/utils/timezone"
import { formatCurrency } from "@/lib/utils/finance"
import { futuresNet } from "@/lib/utils/futures"

type Props = {
  weekStart: string
  trades: TradeFuturesTrade[]
  realizedByTrade: Record<string, number>
  broker: TradeAccount
  visible: boolean
  onDayClick: (date: string) => void
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function FuturesWeeklyChart({ weekStart, trades, realizedByTrade, broker, visible, onDayClick }: Props) {
  const today = getTodayLocalDate()
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const daySet = new Set(days)

  const byDate: Record<string, TradeFuturesTrade[]> = {}
  for (const t of trades) (byDate[t.trade_date] ??= []).push(t)

  const dayData = days.map((dateStr, i) => ({
    dateStr,
    label: DAY_NAMES[i],
    day: dateStr.slice(8),
    count: (byDate[dateStr] || []).length,
    isToday: dateStr === today,
  }))

  const weekTrades = trades.filter(t => daySet.has(t.trade_date))
  const weekCount = weekTrades.length
  const weekNet = futuresNet(weekTrades, realizedByTrade)
  const maxCount = Math.max(...dayData.map(d => d.count), 1)
  const MASK = <span className="font-bold tracking-widest text-muted-foreground">••••••</span>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-gray-400 rounded-lg p-3 space-y-1">
          <p className="text-xs text-muted-foreground">Trades</p>
          <p className="text-sm font-semibold">{weekCount}</p>
        </div>
        <div className="border border-gray-400 rounded-lg p-3 space-y-1">
          <p className="text-xs text-muted-foreground">Net P/L</p>
          <p className={`text-sm font-semibold ${weekNet >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {visible ? `${weekNet >= 0 ? '+' : '−'}${formatCurrency(Math.abs(weekNet), broker.currency)}` : MASK}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 items-end">
        {dayData.map(({ dateStr, label, day, count, isToday }) => {
          const h = Math.round((count / maxCount) * 96)
          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className="flex flex-col items-center gap-1 w-full hover:opacity-80 transition-opacity"
              title={`${count} ${count === 1 ? 'trade' : 'trades'}`}
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
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400 inline-block" /> Trades per day</span>
      </div>
    </div>
  )
}
