"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { FinanceAccount, FinanceCategory, FinanceTransaction } from "@/lib/types"
import { getTodayLocalDate } from "@/lib/utils/timezone"
import { datesBetween, formatCurrency } from "@/lib/utils/finance"

type Props = {
  periodStart: string
  periodEnd: string
  transactions: FinanceTransaction[]
  accounts: FinanceAccount[]
  categories: FinanceCategory[]
}

export default function MonthlyFinanceSummary({ periodStart, periodEnd, transactions, accounts, categories }: Props) {
  const [visible, setVisible] = useState(false)
  const today = getTodayLocalDate()

  const totals = { IDR: { income: 0, expense: 0 }, USD: { income: 0, expense: 0 } }
  const categoryTotals: Record<string, { IDR: number; USD: number }> = {}

  for (const tx of transactions) {
    if (tx.type === 'transfer') continue
    const acc = accounts.find(a => a.id === tx.account_id)
    if (!acc) continue
    const cur = acc.currency
    if (tx.type === 'income') totals[cur].income += tx.amount
    if (tx.type === 'expense') {
      totals[cur].expense += tx.amount
      if (tx.category_id) {
        if (!categoryTotals[tx.category_id]) categoryTotals[tx.category_id] = { IDR: 0, USD: 0 }
        categoryTotals[tx.category_id][cur] += tx.amount
      }
    }
  }

  const txByDate = transactions.reduce<Record<string, FinanceTransaction[]>>((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = []
    acc[tx.date].push(tx)
    return acc
  }, {})

  const activeDays = datesBetween(periodStart, periodEnd)
    .filter(d => d <= today)
    .filter(d => (txByDate[d] || []).length > 0)
    .length

  const topCategories = Object.entries(categoryTotals)
    .map(([catId, amounts]) => ({
      category: categories.find(c => c.id === catId),
      IDR: amounts.IDR,
      USD: amounts.USD,
    }))
    .filter(e => e.category)
    .sort((a, b) => (b.IDR + b.USD) - (a.IDR + a.USD))
    .slice(0, 5)

  const currencies = (['IDR', 'USD'] as const).filter(
    cur => totals[cur].income > 0 || totals[cur].expense > 0
  )

  const MASK = '••••••'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <button onClick={() => setVisible(v => !v)} className="text-muted-foreground hover:text-foreground transition-colors">
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>

      {currencies.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">No transactions this month.</p>
      )}

      {currencies.map(cur => {
        const net = totals[cur].income - totals[cur].expense
        return (
          <div key={cur} className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">{cur}</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="border border-gray-300 dark:border-border rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {visible ? formatCurrency(totals[cur].income, cur) : MASK}
                </p>
                <p className="text-xs text-muted-foreground">Income</p>
              </div>
              <div className="border border-gray-300 dark:border-border rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  {visible ? formatCurrency(totals[cur].expense, cur) : MASK}
                </p>
                <p className="text-xs text-muted-foreground">Expense</p>
              </div>
              <div className="border border-gray-300 dark:border-border rounded-lg p-3 text-center">
                <p className={`text-lg font-bold ${net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {visible ? `${net >= 0 ? '+' : '−'}${formatCurrency(Math.abs(net), cur)}` : MASK}
                </p>
                <p className="text-xs text-muted-foreground">Net</p>
              </div>
            </div>
          </div>
        )
      })}

      <div className="grid grid-cols-2 gap-2">
        <div className="border border-gray-300 dark:border-border rounded-lg p-3 text-center">
          <p className="text-2xl font-semibold">{activeDays}</p>
          <p className="text-xs text-muted-foreground">Active days</p>
        </div>
        <div className="border border-gray-300 dark:border-border rounded-lg p-3 text-center">
          <p className="text-2xl font-semibold">{transactions.filter(t => t.type !== 'transfer').length}</p>
          <p className="text-xs text-muted-foreground">Transactions</p>
        </div>
      </div>

      {topCategories.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Top Expense Categories</h3>
          {topCategories.map(({ category, IDR, USD }) => (
            <div key={category!.id} className="flex items-center justify-between text-sm">
              <span>{category!.name}</span>
              <div className="text-right text-muted-foreground">
                {visible ? (
                  <>
                    {IDR > 0 && <span className="mr-2">{formatCurrency(IDR, 'IDR')}</span>}
                    {USD > 0 && <span>{formatCurrency(USD, 'USD')}</span>}
                  </>
                ) : (
                  <span className="tracking-widest">{MASK}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
