"use client"

import { TradeAccount, TradeStockLot, TradeStockSell } from "@/lib/types"
import { getTodayLocalDate } from "@/lib/utils/timezone"
import { sumInvested } from "@/lib/utils/trades"

type Props = {
  yearMonth: string
  lots: TradeStockLot[]
  sells: TradeStockSell[]
  broker: TradeAccount
  visible: boolean
  onDayClick: (date: string) => void
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function compact(amount: number, currency: string): string {
  const symbol = currency === 'IDR' ? 'Rp ' : '$'
  if (amount >= 1_000_000) return symbol + (amount / 1_000_000).toFixed(1) + 'M'
  if (amount >= 1_000) return symbol + (amount / 1_000).toFixed(0) + 'k'
  return symbol + Math.round(amount).toLocaleString('en-US')
}

export default function TradeDailyCalendar({ yearMonth, lots, sells, broker, visible, onDayClick }: Props) {
  const [year, month] = yearMonth.split('-').map(Number)
  const today = getTodayLocalDate()
  const firstWeekday = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  // invested (buys) per day; sells only mark activity
  const byDate: Record<string, TradeStockLot[]> = {}
  for (const l of lots) (byDate[l.buy_date] ??= []).push(l)
  const sellDates = new Set(sells.map(s => s.sell_date))

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-gray-100 dark:bg-gray-700/60" /> No activity</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-blue-200 dark:bg-blue-800/60" /> Bought / sold</span>
      </div>

      <div className="grid grid-cols-7">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-xs font-medium text-muted-foreground text-center py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`blank-${i}`} />
          const dateStr = `${yearMonth}-${String(day).padStart(2, '0')}`
          const dayLots = byDate[dateStr] || []
          const invested = sumInvested(dayLots)
          const isToday = dateStr === today
          const hasBuys = dayLots.length > 0
          const hasActivity = hasBuys || sellDates.has(dateStr)

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className={`rounded-lg flex flex-col items-center justify-center gap-0.5 py-2 border border-gray-400 transition-all hover:ring-2 hover:ring-blue-400
                ${hasActivity ? 'bg-blue-200 dark:bg-blue-800/60' : 'bg-gray-100 dark:bg-gray-700/60'}
                ${isToday ? 'ring-2 ring-blue-500' : ''}`}
            >
              <span className={`text-xs font-medium ${isToday ? 'text-blue-600' : ''}`}>{day}</span>
              {visible && hasBuys && (
                <span className="text-[10px] font-medium leading-none text-blue-700 dark:text-blue-300">
                  {compact(invested, broker.currency)}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
