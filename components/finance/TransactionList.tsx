"use client"

import { useState } from "react"
import { FinanceAccount, FinanceCategory, FinanceSubcategory, FinanceTransaction, FinanceTransactionType } from "@/lib/types"
import { formatCurrency } from "@/lib/utils/finance"
import TransactionCard from "./TransactionCard"
import TransactionForm from "./TransactionForm"
import { Button } from "@/components/ui/button"
import { Plus, Eye, EyeOff } from "lucide-react"

type Props = {
  transactions: FinanceTransaction[]
  date: string
  accounts: FinanceAccount[]
  categories: FinanceCategory[]
  subcategories: FinanceSubcategory[]
  transactionTypes: FinanceTransactionType[]
  onRefresh: () => void
}

export default function TransactionList({ transactions, date, accounts, categories, subcategories, transactionTypes, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editingTx, setEditingTx] = useState<FinanceTransaction | null>(null)
  const [visible, setVisible] = useState(false)

  const incomeTotal = transactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => {
      const acc = accounts.find(a => a.id === tx.account_id)
      return acc?.currency === 'IDR' ? { ...sum, IDR: sum.IDR + tx.amount } : { ...sum, USD: sum.USD + tx.amount }
    }, { IDR: 0, USD: 0 })

  const expenseTotal = transactions
    .filter(tx => tx.type === 'expense' || (tx.type === 'transfer' && tx.transfer_fee))
    .reduce((sum, tx) => {
      const acc = accounts.find(a => a.id === tx.account_id)
      const amount = tx.type === 'transfer' ? (tx.transfer_fee ?? 0) : tx.amount
      return acc?.currency === 'IDR' ? { ...sum, IDR: sum.IDR + amount } : { ...sum, USD: sum.USD + amount }
    }, { IDR: 0, USD: 0 })

  const customTotals = transactionTypes.map(t => {
    const txs = transactions.filter(tx => tx.type === 'custom' && tx.custom_type_id === t.id)
    const net = txs.reduce((sum, tx) => {
      const acc = accounts.find(a => a.id === tx.account_id)
      const delta = tx.is_gain ? tx.amount : -tx.amount
      if (acc?.currency === 'IDR') return { ...sum, IDR: sum.IDR + delta }
      return { ...sum, USD: sum.USD + delta }
    }, { IDR: 0, USD: 0 })
    return { name: t.name, net }
  }).filter(t => t.net.IDR !== 0 || t.net.USD !== 0)

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
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {visible ? (
              <>
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
                {customTotals.map(({ name, net }) => {
                  const color = net.IDR + net.USD >= 0
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-orange-600 dark:text-orange-400'
                  return (
                    <span key={name} className={`font-medium ${color}`}>
                      {name}: {net.IDR !== 0 && `${net.IDR >= 0 ? '+' : ''}${formatCurrency(Math.abs(net.IDR), 'IDR')}`}
                      {net.IDR !== 0 && net.USD !== 0 && '  '}
                      {net.USD !== 0 && `${net.USD >= 0 ? '+' : ''}${formatCurrency(Math.abs(net.USD), 'USD')}`}
                    </span>
                  )
                })}
              </>
            ) : (
              <span className="text-sm font-bold tracking-widest text-muted-foreground">••••••</span>
            )}
          </div>
          <button
            onClick={() => setVisible(v => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors ml-2 shrink-0"
          >
            {visible ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      )}

      {showForm && (
        <TransactionForm
          accounts={accounts}
          categories={categories}
          subcategories={subcategories}
          transactionTypes={transactionTypes}
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
                  transactionTypes={transactionTypes}
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
              transactionTypes={transactionTypes}
              visible={visible}
              isEditing={editingTx?.id === tx.id}
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
