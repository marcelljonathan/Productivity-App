"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { FinanceAccount, FinanceTransaction } from "@/lib/types"
import { addDays, getTodayLocalDate } from "@/lib/utils/timezone"
import { calcDayFlowByCurrency, formatCurrency } from "@/lib/utils/finance"

type Props = {
  weekStart: string
  txByDate: Record<string, FinanceTransaction[]>
  accounts: FinanceAccount[]
  onDayClick: (date: string) => void
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function WeeklyFinanceSummary({ weekStart, txByDate, accounts, onDayClick }: Props) {
  const [visible, setVisible] = useState(false)
  const today = getTodayLocalDate()
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const dayData = days.map((dateStr, i) => ({
    dateStr,
    label: DAY_NAMES[i],
    day: dateStr.slice(8),
    flow: calcDayFlowByCurrency(txByDate[dateStr] || [], accounts),
    isFuture: dateStr > today,
    isToday: dateStr === today,
  }))

  const weekTotals = {
    IDR: { income: 0, expense: 0 },
    USD: { income: 0, expense: 0 },
  }
  for (const { flow } of dayData) {
    weekTotals.IDR.income += flow.IDR.income
    weekTotals.IDR.expense += flow.IDR.expense
    weekTotals.USD.income += flow.USD.income
    weekTotals.USD.expense += flow.USD.expense
  }

  const maxAmount = Math.max(
    ...dayData.flatMap(d => [d.flow.IDR.income + d.flow.USD.income, d.flow.IDR.expense + d.flow.USD.expense]),
    1
  )

  const MASK = <span className="font-bold tracking-widest text-muted-foreground">••••••</span>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <button onClick={() => setVisible(v => !v)} className="text-muted-foreground hover:text-foreground transition-colors">
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(['IDR', 'USD'] as const).map(cur => {
          const net = weekTotals[cur].income - weekTotals[cur].expense
          if (weekTotals[cur].income === 0 && weekTotals[cur].expense === 0) return null
          return (
            <div key={cur} className="border border-gray-300 dark:border-border rounded-lg p-3 space-y-1">
              <p className="text-xs text-muted-foreground font-medium">{cur}</p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">Income</span>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {visible ? `+${formatCurrency(weekTotals[cur].income, cur)}` : MASK}
                </p>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">Expense</span>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {visible ? `−${formatCurrency(weekTotals[cur].expense, cur)}` : MASK}
                </p>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">Net</span>
                <p className={`text-sm font-semibold ${net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {visible ? `${net >= 0 ? '+' : '−'}${formatCurrency(Math.abs(net), cur)}` : MASK}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-7 gap-1 items-end">
        {dayData.map(({ dateStr, label, day, flow, isFuture, isToday }) => {
          const income = flow.IDR.income + flow.USD.income
          const expense = flow.IDR.expense + flow.USD.expense
          const incomeH = isFuture ? 0 : Math.round((income / maxAmount) * 80)
          const expenseH = isFuture ? 0 : Math.round((expense / maxAmount) * 80)

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity"
            >
              <div className="flex gap-0.5 items-end h-24">
                <div
                  className="w-3 rounded-t bg-green-400 dark:bg-green-600 transition-all"
                  style={{ height: `${incomeH}px` }}
                />
                <div
                  className="w-3 rounded-t bg-red-400 dark:bg-red-600 transition-all"
                  style={{ height: `${expenseH}px` }}
                />
              </div>
              <span className={`text-[10px] font-medium ${isToday ? 'text-blue-600' : 'text-muted-foreground'}`}>{label}</span>
              <span className="text-[9px] text-muted-foreground">{day}</span>
            </button>
          )
        })}
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground justify-center">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400 inline-block" /> Income</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 inline-block" /> Expense</span>
      </div>
    </div>
  )
}
