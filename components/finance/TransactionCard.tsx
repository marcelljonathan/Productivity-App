"use client"

import { useState } from "react"
import { FinanceAccount, FinanceCategory, FinanceSubcategory, FinanceTransaction } from "@/lib/types"
import { formatCurrency } from "@/lib/utils/finance"
import { createClient } from "@/lib/supabase/client"
import { Trash2 } from "lucide-react"
import ConfirmDialog from "@/components/ui/ConfirmDialog"

type Props = {
  transaction: FinanceTransaction
  accounts: FinanceAccount[]
  categories: FinanceCategory[]
  subcategories: FinanceSubcategory[]
  onDeleted: () => void
  onEdit: (tx: FinanceTransaction) => void
}

const TYPE_DOT: Record<string, string> = {
  income: 'bg-green-500',
  expense: 'bg-red-500',
  transfer: 'bg-blue-500',
}

const TYPE_AMOUNT: Record<string, string> = {
  income: 'text-green-600 dark:text-green-400',
  expense: 'text-red-600 dark:text-red-400',
  transfer: 'text-blue-600 dark:text-blue-400',
}

const TYPE_SIGN: Record<string, string> = {
  income: '+',
  expense: '−',
  transfer: '',
}

export default function TransactionCard({ transaction: tx, accounts, categories, subcategories, onDeleted, onEdit }: Props) {
  const [confirming, setConfirming] = useState(false)
  const account = accounts.find(a => a.id === tx.account_id)
  const toAccount = accounts.find(a => a.id === tx.to_account_id)
  const category = categories.find(c => c.id === tx.category_id)
  const subcategory = subcategories.find(s => s.id === tx.subcategory_id)

  async function handleDelete() {
    const supabase = createClient()
    await supabase.from('finance_transactions').delete().eq('id', tx.id)
    onDeleted()
  }

  const amountStr = account ? formatCurrency(tx.amount, account.currency) : tx.amount.toString()
  const toAmountStr = toAccount && tx.to_amount !== null
    ? formatCurrency(tx.to_amount, toAccount.currency)
    : null

  return (
    <>
      {confirming && (
        <ConfirmDialog
          message="Delete this transaction?"
          onConfirm={() => { setConfirming(false); handleDelete() }}
          onCancel={() => setConfirming(false)}
        />
      )}
    <div
      className="flex items-start gap-3 border rounded-lg px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={() => onEdit(tx)}
    >
      <div className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${TYPE_DOT[tx.type]}`} />

      <div className="flex-1 min-w-0">
        {tx.type === 'transfer' ? (
          <p className="text-sm font-medium">
            {account?.name ?? '—'} → {toAccount?.name ?? '—'}
          </p>
        ) : (
          <p className="text-sm font-medium">
            {category?.name ?? 'Uncategorized'}
            {subcategory && <span className="text-muted-foreground"> · {subcategory.name}</span>}
          </p>
        )}
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {tx.type !== 'transfer' && (
            <span className="text-xs text-muted-foreground">{account?.name}</span>
          )}
          {tx.type === 'transfer' && tx.exchange_rate && (
            <span className="text-xs text-muted-foreground">
              Rate: {tx.exchange_rate.toLocaleString()}
            </span>
          )}
          {tx.note && <span className="text-xs text-muted-foreground italic">"{tx.note}"</span>}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right">
          <p className={`text-sm font-semibold ${TYPE_AMOUNT[tx.type]}`}>
            {TYPE_SIGN[tx.type]}{amountStr}
          </p>
          {toAmountStr && (
            <p className="text-xs text-muted-foreground">→ {toAmountStr}</p>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); setConfirming(true) }}
          className="text-muted-foreground hover:text-red-500 transition-colors p-1"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
    </>
  )
}
