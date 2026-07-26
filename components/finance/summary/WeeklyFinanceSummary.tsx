"use client"

import { useState } from "react"
import { Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react"
import { FinanceAccount, FinanceCategory, FinanceSubcategory, FinanceTransaction } from "@/lib/types"
import { addDays, getTodayLocalDate } from "@/lib/utils/timezone"
import { calcDayFlowByCurrency, formatCurrency } from "@/lib/utils/finance"

type Props = {
  weekStart: string
  txByDate: Record<string, FinanceTransaction[]>
  accounts: FinanceAccount[]
  categories: FinanceCategory[]
  subcategories: FinanceSubcategory[]
  onDayClick: (date: string) => void
}

type BarMode = 'expense' | 'income' | 'both'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function WeeklyFinanceSummary({ weekStart, txByDate, accounts, categories, subcategories, onDayClick }: Props) {
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState<BarMode>('expense')
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)
  const [catMode, setCatMode] = useState<'income' | 'expense'>('expense')
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null)

  const today = getTodayLocalDate()
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Category breakdown for the week (transfers/custom excluded, same as the monthly view).
  const incomeCatTotals: Record<string, { IDR: number; USD: number }> = {}
  const expenseCatTotals: Record<string, { IDR: number; USD: number }> = {}
  const subTotals: Record<string, { IDR: number; USD: number }> = {}
  for (const dateStr of days) {
    for (const tx of txByDate[dateStr] || []) {
      const acc = accounts.find(a => a.id === tx.account_id)
      if (!acc || (tx.type !== 'income' && tx.type !== 'expense')) continue
      const cur = acc.currency
      const catTotals = tx.type === 'income' ? incomeCatTotals : expenseCatTotals
      if (tx.category_id) {
        if (!catTotals[tx.category_id]) catTotals[tx.category_id] = { IDR: 0, USD: 0 }
        catTotals[tx.category_id][cur] += tx.amount
      }
      if (tx.subcategory_id) {
        if (!subTotals[tx.subcategory_id]) subTotals[tx.subcategory_id] = { IDR: 0, USD: 0 }
        subTotals[tx.subcategory_id][cur] += tx.amount
      }
    }
  }
  const activeCatTotals = catMode === 'income' ? incomeCatTotals : expenseCatTotals
  const sortedCategories = Object.entries(activeCatTotals)
    .map(([catId, amounts]) => ({ category: categories.find(c => c.id === catId), IDR: amounts.IDR, USD: amounts.USD }))
    .filter(e => e.category)
    .sort((a, b) => (b.IDR + b.USD) - (a.IDR + a.USD))

  const dayData = days.map((dateStr, i) => ({
    dateStr,
    label: DAY_NAMES[i],
    day: dateStr.slice(8),
    flow: calcDayFlowByCurrency(txByDate[dateStr] || [], accounts),
    isFuture: dateStr > today,
    isToday: dateStr === today,
  }))

  const weekTotals = { IDR: { income: 0, expense: 0 }, USD: { income: 0, expense: 0 } }
  for (const { flow } of dayData) {
    weekTotals.IDR.income += flow.IDR.income
    weekTotals.IDR.expense += flow.IDR.expense
    weekTotals.USD.income += flow.USD.income
    weekTotals.USD.expense += flow.USD.expense
  }

  const relevantValues = dayData.flatMap(d => {
    if (d.isFuture) return [0]
    if (mode === 'income') return [d.flow.IDR.income + d.flow.USD.income]
    if (mode === 'expense') return [d.flow.IDR.expense + d.flow.USD.expense]
    return [
      d.flow.IDR.income + d.flow.USD.income,
      d.flow.IDR.expense + d.flow.USD.expense,
    ]
  })
  const maxAmount = Math.max(...relevantValues, 1)

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
            <div key={cur} className="border border-gray-400 rounded-lg p-3 space-y-1">
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

      <div className="flex items-center justify-center">
        <div className="flex items-center border rounded-full p-0.5 text-xs font-medium">
          {(['expense', 'income', 'both'] as BarMode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-full transition-colors capitalize ${
                mode === m
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 items-end">
        {dayData.map(({ dateStr, label, day, flow, isFuture, isToday }) => {
          const income = flow.IDR.income + flow.USD.income
          const expense = flow.IDR.expense + flow.USD.expense
          const incomeH = isFuture ? 0 : Math.round((income / maxAmount) * 80)
          const expenseH = isFuture ? 0 : Math.round((expense / maxAmount) * 80)
          const isHovered = hoveredDay === dateStr
          const hasData = income > 0 || expense > 0

          return (
            <div
              key={dateStr}
              className="relative flex flex-col items-center gap-1"
              onMouseEnter={() => hasData && !isFuture ? setHoveredDay(dateStr) : null}
              onMouseLeave={() => setHoveredDay(null)}
            >
              {isHovered && (
                <div className="absolute bottom-full mb-2 z-10 bg-popover border border-gray-200 dark:border-border rounded-lg shadow-md px-3 py-2 text-xs whitespace-nowrap left-1/2 -translate-x-1/2">
                  {visible ? (
                    <div className="space-y-1">
                      {(mode === 'income' || mode === 'both') && income > 0 && (
                        <p className="text-green-600 dark:text-green-400">
                          +{flow.IDR.income > 0 ? formatCurrency(flow.IDR.income, 'IDR') : formatCurrency(flow.USD.income, 'USD')}
                          {flow.IDR.income > 0 && flow.USD.income > 0 && (
                            <span className="ml-1 text-muted-foreground">/ {formatCurrency(flow.USD.income, 'USD')}</span>
                          )}
                        </p>
                      )}
                      {(mode === 'expense' || mode === 'both') && expense > 0 && (
                        <p className="text-red-600 dark:text-red-400">
                          −{flow.IDR.expense > 0 ? formatCurrency(flow.IDR.expense, 'IDR') : formatCurrency(flow.USD.expense, 'USD')}
                          {flow.IDR.expense > 0 && flow.USD.expense > 0 && (
                            <span className="ml-1 text-muted-foreground">/ {formatCurrency(flow.USD.expense, 'USD')}</span>
                          )}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="tracking-widest text-muted-foreground">••••••</p>
                  )}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-200 dark:border-t-border" />
                </div>
              )}

              <button
                onClick={() => onDayClick(dateStr)}
                className="flex flex-col items-center gap-1 w-full hover:opacity-80 transition-opacity"
              >
                <div className="flex gap-0.5 items-end h-24">
                  {(mode === 'income' || mode === 'both') && (
                    <div
                      className="w-3 rounded-t bg-green-400 dark:bg-green-600 transition-all"
                      style={{ height: `${incomeH}px` }}
                    />
                  )}
                  {(mode === 'expense' || mode === 'both') && (
                    <div
                      className="w-3 rounded-t bg-red-400 dark:bg-red-600 transition-all"
                      style={{ height: `${expenseH}px` }}
                    />
                  )}
                </div>
                <span className={`text-[10px] font-medium ${isToday ? 'text-blue-600' : 'text-muted-foreground'}`}>{label}</span>
                <span className="text-[9px] text-muted-foreground">{day}</span>
              </button>
            </div>
          )
        })}
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground justify-center">
        {(mode === 'income' || mode === 'both') && (
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400 inline-block" /> Income</span>
        )}
        {(mode === 'expense' || mode === 'both') && (
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 inline-block" /> Expense</span>
        )}
      </div>

      {sortedCategories.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">Categories</h3>
            <div className="flex items-center border rounded-full p-0.5 text-xs font-medium">
              {(['expense', 'income'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => { setCatMode(m); setExpandedCatId(null) }}
                  className={`px-3 py-1 rounded-full transition-colors capitalize ${
                    catMode === m ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            {sortedCategories.map(({ category, IDR, USD }) => {
              const catSubs = subcategories.filter(s => s.category_id === category!.id)
              const isExpanded = expandedCatId === category!.id
              const hasSubs = catSubs.some(s => subTotals[s.id] && (subTotals[s.id].IDR > 0 || subTotals[s.id].USD > 0))

              return (
                <div key={category!.id} className="border border-gray-400 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => hasSubs ? setExpandedCatId(isExpanded ? null : category!.id) : undefined}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm ${hasSubs ? 'hover:bg-muted/40 transition-colors cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{category!.name}</span>
                      {hasSubs && (isExpanded ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />)}
                    </div>
                    <div className="text-right text-muted-foreground text-xs">
                      {visible ? (
                        <>
                          {IDR > 0 && <span className="mr-2">{formatCurrency(IDR, 'IDR')}</span>}
                          {USD > 0 && <span>{formatCurrency(USD, 'USD')}</span>}
                        </>
                      ) : (
                        <span className="tracking-widest">••••••</span>
                      )}
                    </div>
                  </button>

                  {isExpanded && hasSubs && (
                    <div className="border-t border-gray-200 dark:border-border bg-muted/20 px-4 py-2 space-y-1.5">
                      {catSubs.map(sub => {
                        const st = subTotals[sub.id]
                        if (!st || (st.IDR === 0 && st.USD === 0)) return null
                        return (
                          <div key={sub.id} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground pl-2">{sub.name}</span>
                            <div className="text-right text-muted-foreground">
                              {visible ? (
                                <>
                                  {st.IDR > 0 && <span className="mr-2">{formatCurrency(st.IDR, 'IDR')}</span>}
                                  {st.USD > 0 && <span>{formatCurrency(st.USD, 'USD')}</span>}
                                </>
                              ) : (
                                <span className="tracking-widest">••••••</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
