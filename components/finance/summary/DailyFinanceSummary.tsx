"use client"

import { FinanceAccount, FinanceTransaction } from "@/lib/types"
import { getTodayLocalDate } from "@/lib/utils/timezone"
import { calcDayFlowByCurrency } from "@/lib/utils/finance"

type Props = {
  yearMonth: string
  txByDate: Record<string, FinanceTransaction[]>
  accounts: FinanceAccount[]
  onDayClick: (date: string) => void
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function dayCellColor(txs: FinanceTransaction[], accounts: FinanceAccount[], isFuture: boolean): string {
  if (isFuture) return 'bg-muted/20'
  if (txs.length === 0) return 'bg-gray-100 dark:bg-gray-800/50'
  const flow = calcDayFlowByCurrency(txs, accounts)
  const totalIncome = flow.IDR.income + flow.USD.income
  const totalExpense = flow.IDR.expense + flow.USD.expense
  if (totalIncome > totalExpense) return 'bg-green-100 dark:bg-green-900/30'
  if (totalExpense > totalIncome) return 'bg-red-100 dark:bg-red-900/30'
  return 'bg-yellow-100 dark:bg-yellow-900/30'
}

export default function DailyFinanceSummary({ yearMonth, txByDate, accounts, onDayClick }: Props) {
  const [year, month] = yearMonth.split('-').map(Number)
  const today = getTodayLocalDate()
  const firstWeekday = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-gray-100 dark:bg-gray-800/50" /> No activity</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-green-100" /> Income &gt; Expense</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-red-100" /> Expense &gt; Income</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-yellow-100" /> Balanced</span>
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
          const txs = txByDate[dateStr] || []
          const isToday = dateStr === today
          const isFuture = dateStr > today
          const nonTransfer = txs.filter(t => t.type !== 'transfer')

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className={`
                rounded-lg flex flex-col items-center justify-center gap-0.5 py-2
                transition-all hover:ring-2 hover:ring-blue-400
                ${dayCellColor(txs, accounts, isFuture)}
                ${isToday ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              <span className={`text-xs font-medium ${isToday ? 'text-blue-600' : ''}`}>{day}</span>
              {!isFuture && nonTransfer.length > 0 && (
                <span className="text-[9px] text-muted-foreground">{nonTransfer.length} tx</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
