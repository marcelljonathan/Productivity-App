"use client"

import { useState } from "react"
import { FinanceAccount, FinanceCategory, FinanceSubcategory, FinanceTransaction, FinanceTransactionType } from "@/lib/types"
import { formatCurrency } from "@/lib/utils/finance"
import { createClient } from "@/lib/supabase/client"
import { Trash2, Pencil } from "lucide-react"
import ConfirmDialog from "@/components/ui/ConfirmDialog"

type Props = {
  transaction: FinanceTransaction
  accounts: FinanceAccount[]
  categories: FinanceCategory[]
  subcategories: FinanceSubcategory[]
  transactionTypes: FinanceTransactionType[]
  visible: boolean
  isEditing: boolean
  onDeleted: () => void
  onEdit: (tx: FinanceTransaction) => void
}

const TYPE_DOT: Record<string, string> = {
  income: 'bg-green-500',
  expense: 'bg-red-500',
  transfer: 'bg-blue-500',
  custom_gain: 'bg-purple-500',
  custom_loss: 'bg-orange-500',
}

const TYPE_AMOUNT: Record<string, string> = {
  income: 'text-green-600 dark:text-green-400',
  expense: 'text-red-600 dark:text-red-400',
  transfer: 'text-blue-600 dark:text-blue-400',
  custom_gain: 'text-purple-600 dark:text-purple-400',
  custom_loss: 'text-orange-600 dark:text-orange-400',
}

export default function TransactionCard({ transaction: tx, accounts, categories, subcategories, transactionTypes, visible, isEditing, onDeleted, onEdit }: Props) {
  const [confirming, setConfirming] = useState(false)
  const account = accounts.find(a => a.id === tx.account_id)
  const toAccount = accounts.find(a => a.id === tx.to_account_id)
  const category = categories.find(c => c.id === tx.category_id)
  const subcategory = subcategories.find(s => s.id === tx.subcategory_id)
  const customType = transactionTypes.find(t => t.id === tx.custom_type_id)

  async function handleDelete() {
    const supabase = createClient()
    await supabase.from('finance_transactions').delete().eq('id', tx.id)
    onDeleted()
  }

  const amountStr = account ? formatCurrency(tx.amount, account.currency) : tx.amount.toString()
  const toAmountStr = toAccount && tx.to_amount !== null
    ? formatCurrency(tx.to_amount, toAccount.currency)
    : null

  const colorKey = tx.type === 'custom'
    ? (tx.is_gain ? 'custom_gain' : 'custom_loss')
    : tx.type

  const sign = tx.type === 'income' ? '+'
    : tx.type === 'expense' ? '−'
    : tx.type === 'custom' ? (tx.is_gain ? '+' : '−')
    : ''

  const label = tx.type === 'transfer'
    ? `${account?.name ?? '—'} → ${toAccount?.name ?? '—'}`
    : tx.type === 'custom'
    ? (customType?.name ?? 'Custom')
    : (category?.name ?? 'Uncategorized')

  return (
    <>
      {confirming && (
        <ConfirmDialog
          message="Delete this transaction?"
          onConfirm={() => { setConfirming(false); handleDelete() }}
          onCancel={() => setConfirming(false)}
        />
      )}
      <div className={`flex items-start gap-3 border border-gray-400 rounded-lg px-4 py-3 transition-colors ${isEditing ? 'bg-muted/40 border-foreground/30!' : 'hover:bg-muted/30'}`}>
        <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${TYPE_DOT[colorKey]}`} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {label}
            {tx.type !== 'transfer' && tx.type !== 'custom' && subcategory && (
              <span className="text-muted-foreground"> · {subcategory.name}</span>
            )}
          </p>
          <div className="mt-0.5 space-y-0.5">
            {tx.type !== 'transfer' && (
              <p className="text-xs text-muted-foreground">{account?.name}</p>
            )}
            {tx.type === 'transfer' && tx.exchange_rate && (
              <p className="text-xs text-muted-foreground">Rate: {tx.exchange_rate.toLocaleString()}</p>
            )}
            {tx.type === 'transfer' && tx.transfer_fee ? (
              <p className="text-xs text-muted-foreground">
                Fee: {account ? formatCurrency(tx.transfer_fee, account.currency) : tx.transfer_fee}
              </p>
            ) : null}
            {tx.note && (
              <p className="text-xs text-muted-foreground">Notes: {tx.note}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <div className="text-right mr-2">
            {visible ? (
              <>
                <p className={`text-sm font-semibold ${TYPE_AMOUNT[colorKey]}`}>
                  {sign}{amountStr}
                </p>
                {toAmountStr && (
                  <p className="text-xs text-muted-foreground">→ {toAmountStr}</p>
                )}
              </>
            ) : (
              <p className="text-sm font-bold tracking-widest text-muted-foreground">••••••</p>
            )}
          </div>
          <button
            onClick={() => onEdit(tx)}
            className={`p-1 transition-colors ${isEditing ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => setConfirming(true)}
            className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </>
  )
}
