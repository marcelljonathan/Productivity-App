"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Currency, FinanceAccount, FinanceAccountType, FinanceTransaction } from "@/lib/types"
import { formatCurrency } from "@/lib/utils/finance"

type View = 'summary' | 'accounts'

type Props = {
  accounts: FinanceAccount[]
  balances: Record<string, number>
  accountTypes: FinanceAccountType[]
  transactions: FinanceTransaction[]
  loading: boolean
}

const CURRENCIES: Currency[] = ['IDR', 'USD']

const CURRENCY_BADGE: Record<string, string> = {
  IDR: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  USD: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
}

export default function FinanceSummaryBar({ accounts, balances, accountTypes, transactions, loading }: Props) {
  const [view, setView] = useState<View>('summary')
  const [currency, setCurrency] = useState<Currency>('IDR')
  const [visible, setVisible] = useState(false)

  const equity = accounts
    .filter(a => a.currency === currency)
    .reduce((sum, a) => sum + (balances[a.id] ?? a.starting_balance), 0)

  const income = transactions
    .filter(tx => tx.type === 'income')
    .filter(tx => accounts.find(a => a.id === tx.account_id)?.currency === currency)
    .reduce((sum, tx) => sum + tx.amount, 0)

  const expense = transactions
    .filter(tx => tx.type === 'expense' || (tx.type === 'transfer' && tx.transfer_fee))
    .filter(tx => accounts.find(a => a.id === tx.account_id)?.currency === currency)
    .reduce((sum, tx) => sum + (tx.type === 'transfer' ? (tx.transfer_fee ?? 0) : tx.amount), 0)

  const net = income - expense

  const boxes = [
    { label: 'Total Equity', value: equity, color: 'text-foreground' },
    { label: 'Income', value: income, color: 'text-green-600 dark:text-green-400' },
    { label: 'Expense', value: expense, color: 'text-red-600 dark:text-red-400' },
    {
      label: 'Net Income',
      value: net,
      color: net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
    },
  ]

  if (loading) return <div className="h-28 rounded-lg bg-muted animate-pulse" />

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        {/* View tabs */}
        <div className="flex items-center border rounded-full p-0.5 text-xs font-medium">
          {(['summary', 'accounts'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded-full transition-colors capitalize ${
                view === v
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-full p-0.5 text-xs font-medium">
            {CURRENCIES.map(c => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`px-3 py-1 rounded-full transition-colors ${
                  currency === c
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <button
            onClick={() => setVisible(v => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Summary view */}
      {view === 'summary' && (
        <div className="grid grid-cols-2 gap-3">
          {boxes.map(({ label, value, color }) => (
            <div key={label} className="border border-gray-400 rounded-lg px-4 py-3 space-y-1">
              <p className="text-xs text-muted-foreground">{label}</p>
              {visible ? (
                <p className={`text-base font-bold ${color}`}>
                  {formatCurrency(Math.abs(value), currency)}
                </p>
              ) : (
                <p className="text-base font-bold tracking-widest text-muted-foreground">••••••</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Accounts view */}
      {view === 'accounts' && (
        accounts.filter(a => a.currency === currency).length === 0 ? (
          <p className="text-sm text-muted-foreground py-3">No {currency} accounts yet.</p>
        ) : (
          <>
            {/* Mobile: 2-col grid — Desktop: horizontal scroll row */}
            <div className="grid grid-cols-2 gap-3 md:hidden">
              {accounts.filter(a => a.currency === currency).map(acc => {
                const typeName = accountTypes.find(t => t.id === acc.account_type_id)?.name
                return (
                  <div key={acc.id} className="border border-gray-400 rounded-lg px-4 py-3 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">{acc.name}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${CURRENCY_BADGE[acc.currency]}`}>
                        {acc.currency}
                      </span>
                    </div>
                    {typeName && <p className="text-[11px] text-muted-foreground">{typeName}</p>}
                    {visible ? (
                      <p className="text-base font-bold">
                        {formatCurrency(balances[acc.id] ?? acc.starting_balance, acc.currency)}
                      </p>
                    ) : (
                      <p className="text-base font-bold tracking-widest text-muted-foreground">••••••</p>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="hidden md:flex gap-3 overflow-x-auto pb-1">
              {accounts.filter(a => a.currency === currency).map(acc => {
                const typeName = accountTypes.find(t => t.id === acc.account_type_id)?.name
                return (
                  <div key={acc.id} className="shrink-0 border border-gray-400 rounded-lg px-4 py-3 min-w-40 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">{acc.name}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${CURRENCY_BADGE[acc.currency]}`}>
                        {acc.currency}
                      </span>
                    </div>
                    {typeName && <p className="text-[11px] text-muted-foreground">{typeName}</p>}
                    {visible ? (
                      <p className="text-base font-bold">
                        {formatCurrency(balances[acc.id] ?? acc.starting_balance, acc.currency)}
                      </p>
                    ) : (
                      <p className="text-base font-bold tracking-widest text-muted-foreground">••••••</p>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )
      )}
    </div>
  )
}
