"use client"

import { useState } from "react"
import { Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react"
import { FinanceAccount, FinanceCategory, FinanceSubcategory, FinanceTransaction, FinanceTransactionType } from "@/lib/types"
import { getTodayLocalDate } from "@/lib/utils/timezone"
import { datesBetween, formatCurrency } from "@/lib/utils/finance"

type Props = {
  periodStart: string
  periodEnd: string
  transactions: FinanceTransaction[]
  accounts: FinanceAccount[]
  categories: FinanceCategory[]
  subcategories: FinanceSubcategory[]
  transactionTypes: FinanceTransactionType[]
}

export default function MonthlyFinanceSummary({ periodStart, periodEnd, transactions, accounts, categories, subcategories, transactionTypes }: Props) {
  const [visible, setVisible] = useState(false)
  const [customExpanded, setCustomExpanded] = useState(false)
  const [catMode, setCatMode] = useState<'income' | 'expense'>('expense')
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null)
  const today = getTodayLocalDate()

  const totals = { IDR: { income: 0, expense: 0 }, USD: { income: 0, expense: 0 } }
  const incomeCatTotals: Record<string, { IDR: number; USD: number }> = {}
  const expenseCatTotals: Record<string, { IDR: number; USD: number }> = {}
  const subTotals: Record<string, { IDR: number; USD: number }> = {}
  const customByType: Record<string, { IDR: number; USD: number }> = {}
  const customTotals = { IDR: 0, USD: 0 }

  for (const tx of transactions) {
    const acc = accounts.find(a => a.id === tx.account_id)
    if (!acc) continue
    const cur = acc.currency

    if (tx.type === 'transfer') {
      if (tx.transfer_fee) totals[cur].expense += tx.transfer_fee
      continue
    }

    if (tx.type === 'income') {
      totals[cur].income += tx.amount
      if (tx.category_id) {
        if (!incomeCatTotals[tx.category_id]) incomeCatTotals[tx.category_id] = { IDR: 0, USD: 0 }
        incomeCatTotals[tx.category_id][cur] += tx.amount
      }
    }

    if (tx.type === 'expense') {
      totals[cur].expense += tx.amount
      if (tx.category_id) {
        if (!expenseCatTotals[tx.category_id]) expenseCatTotals[tx.category_id] = { IDR: 0, USD: 0 }
        expenseCatTotals[tx.category_id][cur] += tx.amount
      }
    }

    if ((tx.type === 'income' || tx.type === 'expense') && tx.subcategory_id) {
      if (!subTotals[tx.subcategory_id]) subTotals[tx.subcategory_id] = { IDR: 0, USD: 0 }
      subTotals[tx.subcategory_id][cur] += tx.amount
    }

    if (tx.type === 'custom' && tx.custom_type_id) {
      const signed = tx.is_gain ? tx.amount : -tx.amount
      if (!customByType[tx.custom_type_id]) customByType[tx.custom_type_id] = { IDR: 0, USD: 0 }
      customByType[tx.custom_type_id][cur] += signed
      customTotals[cur] += signed
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

  const currencies = (['IDR', 'USD'] as const).filter(
    cur => totals[cur].income > 0 || totals[cur].expense > 0
  )

  const activeCatTotals = catMode === 'income' ? incomeCatTotals : expenseCatTotals
  const sortedCategories = Object.entries(activeCatTotals)
    .map(([catId, amounts]) => ({
      category: categories.find(c => c.id === catId),
      IDR: amounts.IDR,
      USD: amounts.USD,
    }))
    .filter(e => e.category)
    .sort((a, b) => (b.IDR + b.USD) - (a.IDR + a.USD))

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
        const netIncome = totals[cur].income - totals[cur].expense
        const customNet = customTotals[cur]
        const allNet = netIncome + customNet
        const hasCustom = customNet !== 0 || Object.keys(customByType).length > 0

        return (
          <div key={cur} className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">{cur}</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="border border-gray-400 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {visible ? formatCurrency(totals[cur].income, cur) : MASK}
                </p>
                <p className="text-xs text-muted-foreground">Income</p>
              </div>
              <div className="border border-gray-400 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  {visible ? formatCurrency(totals[cur].expense, cur) : MASK}
                </p>
                <p className="text-xs text-muted-foreground">Expense</p>
              </div>
              <div className="border border-gray-400 rounded-lg p-3 text-center">
                <p className={`text-lg font-bold ${netIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {visible ? `${netIncome >= 0 ? '+' : '−'}${formatCurrency(Math.abs(netIncome), cur)}` : MASK}
                </p>
                <p className="text-xs text-muted-foreground">Net Income</p>
              </div>
            </div>

            {hasCustom && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCustomExpanded(v => !v)}
                  className="border border-gray-400 rounded-lg p-3 text-center hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <p className={`text-lg font-bold ${customNet >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {visible ? `${customNet >= 0 ? '+' : '−'}${formatCurrency(Math.abs(customNet), cur)}` : MASK}
                    </p>
                    {customExpanded ? <ChevronUp size={14} className="text-muted-foreground mt-1" /> : <ChevronDown size={14} className="text-muted-foreground mt-1" />}
                  </div>
                  <p className="text-xs text-muted-foreground">Custom</p>
                </button>
                <div className="border border-gray-400 rounded-lg p-3 text-center">
                  <p className={`text-lg font-bold ${allNet >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {visible ? `${allNet >= 0 ? '+' : '−'}${formatCurrency(Math.abs(allNet), cur)}` : MASK}
                  </p>
                  <p className="text-xs text-muted-foreground">All Net</p>
                </div>
              </div>
            )}

            {hasCustom && customExpanded && (
              <div className="border border-gray-400 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Custom Breakdown</p>
                {Object.entries(customByType).map(([typeId, amounts]) => {
                  const typeName = transactionTypes.find(t => t.id === typeId)?.name ?? typeId
                  const val = amounts[cur]
                  if (val === 0) return null
                  return (
                    <div key={typeId} className="flex items-center justify-between text-sm">
                      <span>{typeName}</span>
                      <span className={val >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {visible ? `${val >= 0 ? '+' : '−'}${formatCurrency(Math.abs(val), cur)}` : MASK}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      <div className="grid grid-cols-2 gap-2">
        <div className="border border-gray-400 rounded-lg p-3 text-center">
          <p className="text-2xl font-semibold">{activeDays}</p>
          <p className="text-xs text-muted-foreground">Active days</p>
        </div>
        <div className="border border-gray-400 rounded-lg p-3 text-center">
          <p className="text-2xl font-semibold">{transactions.length}</p>
          <p className="text-xs text-muted-foreground">Transactions</p>
        </div>
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
                        <span className="tracking-widest">{MASK}</span>
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
                                <span className="tracking-widest">{MASK}</span>
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
