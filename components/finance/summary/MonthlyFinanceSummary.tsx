"use client"

import { FinanceAccount, FinanceCategory, FinanceTransaction } from "@/lib/types"
import { getTodayLocalDate } from "@/lib/utils/timezone"
import { calcDayFlowByCurrency, formatCurrency } from "@/lib/utils/finance"

type Props = {
  yearMonth: string
  transactions: FinanceTransaction[]
  accounts: FinanceAccount[]
  categories: FinanceCategory[]
}

export default function MonthlyFinanceSummary({ yearMonth, transactions, accounts, categories }: Props) {
  const today = getTodayLocalDate()
  const [year, month] = yearMonth.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()

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

  const activeDays = Array.from({ length: daysInMonth }, (_, i) =>
    `${yearMonth}-${String(i + 1).padStart(2, '0')}`
  ).filter(d => d <= today).filter(d => {
    const txByDay: Record<string, FinanceTransaction[]> = {}
    transactions.forEach(tx => {
      if (!txByDay[tx.date]) txByDay[tx.date] = []
      txByDay[tx.date].push(tx)
    })
    return (txByDay[d] || []).length > 0
  }).length

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

  return (
    <div className="space-y-6">
      {currencies.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">No transactions this month.</p>
      )}

      {currencies.map(cur => {
        const net = totals[cur].income - totals[cur].expense
        return (
          <div key={cur} className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">{cur}</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="border rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(totals[cur].income, cur)}
                </p>
                <p className="text-xs text-muted-foreground">Income</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(totals[cur].expense, cur)}
                </p>
                <p className="text-xs text-muted-foreground">Expense</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className={`text-lg font-bold ${net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {net >= 0 ? '+' : '−'}{formatCurrency(Math.abs(net), cur)}
                </p>
                <p className="text-xs text-muted-foreground">Net</p>
              </div>
            </div>
          </div>
        )
      })}

      <div className="grid grid-cols-2 gap-2">
        <div className="border rounded-lg p-3 text-center">
          <p className="text-2xl font-semibold">{activeDays}</p>
          <p className="text-xs text-muted-foreground">Active days</p>
        </div>
        <div className="border rounded-lg p-3 text-center">
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
                {IDR > 0 && <span className="mr-2">{formatCurrency(IDR, 'IDR')}</span>}
                {USD > 0 && <span>{formatCurrency(USD, 'USD')}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
