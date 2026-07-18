"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
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

function formatNet(amount: number, currency: string): string {
  const symbol = currency === 'IDR' ? 'Rp ' : '$'
  return symbol + Math.abs(amount).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function dayCellColor(txs: FinanceTransaction[], accounts: FinanceAccount[], isFuture: boolean): string {
  if (isFuture) return 'bg-muted/20'
  if (txs.length === 0) return 'bg-gray-100 dark:bg-gray-700/60'
  const flow = calcDayFlowByCurrency(txs, accounts)
  const totalIncome = flow.IDR.income + flow.USD.income
  const totalExpense = flow.IDR.expense + flow.USD.expense
  if (totalIncome > totalExpense) return 'bg-green-200 dark:bg-green-800/60'
  if (totalExpense > totalIncome) return 'bg-red-200 dark:bg-red-800/60'
  return 'bg-yellow-200 dark:bg-yellow-800/60'
}

export default function DailyFinanceSummary({ yearMonth, txByDate, accounts, onDayClick }: Props) {
  const [visible, setVisible] = useState(false)
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
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-gray-100 dark:bg-gray-700/60" /> No activity</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-green-200 dark:bg-green-800/60" /> Income &gt; Expense</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-red-200 dark:bg-red-800/60" /> Expense &gt; Income</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-yellow-200 dark:bg-yellow-800/60" /> Balanced</span>
        </div>
        <button onClick={() => setVisible(v => !v)} className="text-muted-foreground hover:text-foreground transition-colors">
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
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
          const flow = calcDayFlowByCurrency(txs, accounts)
          const netIDR = flow.IDR.income - flow.IDR.expense
          const netUSD = flow.USD.income - flow.USD.expense
          const hasActivity = txs.length > 0

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className={`
                rounded-lg flex flex-col items-center justify-center gap-0.5 py-2
                border border-gray-400
                transition-all hover:ring-2 hover:ring-blue-400
                ${dayCellColor(txs, accounts, isFuture)}
                ${isToday ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              <span className={`text-xs font-medium ${isToday ? 'text-blue-600' : ''}`}>{day}</span>
              {visible && !isFuture && hasActivity && netIDR !== 0 && (
                <span className={`text-[10px] font-medium leading-none ${netIDR > 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {netIDR > 0 ? '+' : '−'}{formatNet(netIDR, 'IDR')}
                </span>
              )}
              {visible && !isFuture && hasActivity && netUSD !== 0 && (
                <span className={`text-[10px] font-medium leading-none ${netUSD > 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {netUSD > 0 ? '+' : '−'}{formatNet(netUSD, 'USD')}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
