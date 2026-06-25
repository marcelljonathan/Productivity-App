"use client"

import { FinanceAccount } from "@/lib/types"
import { formatCurrency } from "@/lib/utils/finance"

type Props = {
  accounts: FinanceAccount[]
  balances: Record<string, number>
  loading: boolean
}

const CURRENCY_BADGE: Record<string, string> = {
  IDR: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  USD: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
}

export default function AccountBar({ accounts, balances, loading }: Props) {
  if (loading) return <div className="h-16 rounded-lg bg-muted animate-pulse" />

  if (accounts.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-4 border rounded-lg">
        No accounts yet — add one in Settings.
      </div>
    )
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {accounts.map(acc => (
        <div
          key={acc.id}
          className="flex-shrink-0 border rounded-lg px-4 py-3 min-w-[160px] space-y-1"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{acc.name}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${CURRENCY_BADGE[acc.currency]}`}>
              {acc.currency}
            </span>
          </div>
          <p className="text-base font-bold">
            {formatCurrency(balances[acc.id] ?? acc.starting_balance, acc.currency)}
          </p>
        </div>
      ))}
    </div>
  )
}
