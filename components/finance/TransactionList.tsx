"use client"

import { useState } from "react"
import { FinanceAccount, FinanceCategory, FinanceSubcategory, FinanceTransaction } from "@/lib/types"
import { formatCurrency } from "@/lib/utils/finance"
import TransactionCard from "./TransactionCard"
import TransactionForm from "./TransactionForm"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

type Props = {
  transactions: FinanceTransaction[]
  date: string
  accounts: FinanceAccount[]
  categories: FinanceCategory[]
  subcategories: FinanceSubcategory[]
  onRefresh: () => void
}

export default function TransactionList({ transactions, date, accounts, categories, subcategories, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editingTx, setEditingTx] = useState<FinanceTransaction | null>(null)

  const incomeTotal = transactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => {
      const acc = accounts.find(a => a.id === tx.account_id)
      return acc?.currency === 'IDR' ? { ...sum, IDR: sum.IDR + tx.amount } : { ...sum, USD: sum.USD + tx.amount }
    }, { IDR: 0, USD: 0 })

  const expenseTotal = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => {
      const acc = accounts.find(a => a.id === tx.account_id)
      return acc?.currency === 'IDR' ? { ...sum, IDR: sum.IDR + tx.amount } : { ...sum, USD: sum.USD + tx.amount }
    }, { IDR: 0, USD: 0 })

  function handleSuccess() {
    setShowForm(false)
    setEditingTx(null)
    onRefresh()
  }

  function handleEdit(tx: FinanceTransaction) {
    setEditingTx(prev => prev?.id === tx.id ? null : tx)
    setShowForm(false)
  }

  return (
    <div className="space-y-4">
      {transactions.length > 0 && (
        <div className="flex gap-4 text-sm">
          {(incomeTotal.IDR > 0 || incomeTotal.USD > 0) && (
            <span className="text-green-600 dark:text-green-400 font-medium">
              + {incomeTotal.IDR > 0 && formatCurrency(incomeTotal.IDR, 'IDR')}
              {incomeTotal.IDR > 0 && incomeTotal.USD > 0 && '  '}
              {incomeTotal.USD > 0 && formatCurrency(incomeTotal.USD, 'USD')}
            </span>
          )}
          {(expenseTotal.IDR > 0 || expenseTotal.USD > 0) && (
            <span className="text-red-600 dark:text-red-400 font-medium">
              − {expenseTotal.IDR > 0 && formatCurrency(expenseTotal.IDR, 'IDR')}
              {expenseTotal.IDR > 0 && expenseTotal.USD > 0 && '  '}
              {expenseTotal.USD > 0 && formatCurrency(expenseTotal.USD, 'USD')}
            </span>
          )}
        </div>
      )}

      {showForm && (
        <TransactionForm
          accounts={accounts}
          categories={categories}
          subcategories={subcategories}
          defaultDate={date}
          onSuccess={handleSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}

      {transactions.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground text-center py-6">No transactions on this day.</p>
      )}

      <div className="space-y-2">
        {transactions.map(tx => (
          <div key={tx.id}>
            {editingTx?.id === tx.id && (
              <div className="mb-2">
                <TransactionForm
                  accounts={accounts}
                  categories={categories}
                  subcategories={subcategories}
                  defaultDate={date}
                  transaction={tx}
                  onSuccess={handleSuccess}
                  onCancel={() => setEditingTx(null)}
                />
              </div>
            )}
            <TransactionCard
              transaction={tx}
              accounts={accounts}
              categories={categories}
              subcategories={subcategories}
              onDeleted={onRefresh}
              onEdit={handleEdit}
            />
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => { setShowForm(v => !v); setEditingTx(null) }}
      >
        <Plus size={14} className="mr-1" />
        Add Transaction
      </Button>
    </div>
  )
}
