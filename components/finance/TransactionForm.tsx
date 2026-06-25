"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { FinanceAccount, FinanceCategory, FinanceSubcategory, FinanceTransaction, TransactionType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = {
  accounts: FinanceAccount[]
  categories: FinanceCategory[]
  subcategories: FinanceSubcategory[]
  defaultDate: string
  transaction?: FinanceTransaction
  onSuccess: () => void
  onCancel: () => void
}

export default function TransactionForm({ accounts, categories, subcategories, defaultDate, transaction, onSuccess, onCancel }: Props) {
  const isEdit = !!transaction

  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'expense')
  const [accountId, setAccountId] = useState(transaction?.account_id ?? accounts[0]?.id ?? '')
  const [toAccountId, setToAccountId] = useState(transaction?.to_account_id ?? '')
  const [amount, setAmount] = useState(transaction?.amount?.toString() ?? '')
  const [toAmount, setToAmount] = useState(transaction?.to_amount?.toString() ?? '')
  const [categoryId, setCategoryId] = useState(transaction?.category_id ?? '')
  const [subcategoryId, setSubcategoryId] = useState(transaction?.subcategory_id ?? '')
  const [date, setDate] = useState(transaction?.date ?? defaultDate)
  const [note, setNote] = useState(transaction?.note ?? '')
  const [saving, setSaving] = useState(false)

  const fromAccount = accounts.find(a => a.id === accountId)
  const toAccount = accounts.find(a => a.id === toAccountId)
  const isCrossCurrency = fromAccount && toAccount && fromAccount.currency !== toAccount.currency

  const filteredCategories = categories.filter(c => c.type === type)
  const filteredSubcategories = subcategories.filter(s => s.category_id === categoryId)

  useEffect(() => {
    setCategoryId('')
    setSubcategoryId('')
  }, [type])

  useEffect(() => {
    setSubcategoryId('')
  }, [categoryId])

  useEffect(() => {
    if (!isCrossCurrency) setToAmount('')
  }, [isCrossCurrency])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!accountId || !amount) return
    if (type === 'transfer' && !toAccountId) return

    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const amountNum = parseFloat(amount)
    const toAmountNum = toAmount ? parseFloat(toAmount) : null
    const exchangeRate = isCrossCurrency && amountNum && toAmountNum
      ? amountNum / toAmountNum
      : null

    const payload = {
      user_id: user.id,
      type,
      account_id: accountId,
      to_account_id: type === 'transfer' ? toAccountId : null,
      amount: amountNum,
      to_amount: type === 'transfer' ? (isCrossCurrency ? toAmountNum : amountNum) : null,
      exchange_rate: exchangeRate,
      category_id: type !== 'transfer' && categoryId ? categoryId : null,
      subcategory_id: type !== 'transfer' && subcategoryId ? subcategoryId : null,
      date,
      note: note || null,
    }

    if (isEdit) {
      await supabase.from('finance_transactions').update(payload).eq('id', transaction.id)
    } else {
      await supabase.from('finance_transactions').insert(payload)
    }

    setSaving(false)
    onSuccess()
  }

  const TYPE_BUTTONS: { key: TransactionType; label: string; active: string }[] = [
    { key: 'income', label: 'Income', active: 'bg-green-600 text-white' },
    { key: 'expense', label: 'Expense', active: 'bg-red-600 text-white' },
    { key: 'transfer', label: 'Transfer', active: 'bg-blue-600 text-white' },
  ]

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4 bg-muted/20">
      <div className="flex gap-2">
        {TYPE_BUTTONS.map(({ key, label, active }) => (
          <button
            key={key}
            type="button"
            onClick={() => setType(key)}
            className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${
              type === key ? active : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">{type === 'transfer' ? 'From Account' : 'Account'}</Label>
          <select
            value={accountId}
            onChange={e => setAccountId(e.target.value)}
            className="w-full border rounded-md px-3 py-1.5 text-sm bg-background"
            required
          >
            <option value="">Select account</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
            ))}
          </select>
        </div>

        {type === 'transfer' ? (
          <div className="space-y-1">
            <Label className="text-xs">To Account</Label>
            <select
              value={toAccountId}
              onChange={e => setToAccountId(e.target.value)}
              className="w-full border rounded-md px-3 py-1.5 text-sm bg-background"
              required
            >
              <option value="">Select account</option>
              {accounts.filter(a => a.id !== accountId).map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-1">
            <Label className="text-xs">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="text-sm"
              required
            />
          </div>
        )}
      </div>

      {type === 'transfer' && (
        <div className="space-y-1">
          <Label className="text-xs">Date</Label>
          <Input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="text-sm"
            required
          />
        </div>
      )}

      <div className={`grid gap-3 ${isCrossCurrency ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <div className="space-y-1">
          <Label className="text-xs">
            Amount{fromAccount ? ` (${fromAccount.currency})` : ''}
          </Label>
          <Input
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            className="text-sm"
            required
          />
        </div>
        {isCrossCurrency && (
          <div className="space-y-1">
            <Label className="text-xs">
              To Amount{toAccount ? ` (${toAccount.currency})` : ''}
            </Label>
            <Input
              type="number"
              min="0"
              step="any"
              value={toAmount}
              onChange={e => setToAmount(e.target.value)}
              placeholder="0"
              className="text-sm"
              required
            />
          </div>
        )}
      </div>

      {isCrossCurrency && amount && toAmount && parseFloat(toAmount) > 0 && (
        <p className="text-xs text-muted-foreground">
          Rate: 1 {toAccount?.currency} = {(parseFloat(amount) / parseFloat(toAmount)).toLocaleString()} {fromAccount?.currency}
        </p>
      )}

      {type !== 'transfer' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Category</Label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full border rounded-md px-3 py-1.5 text-sm bg-background"
            >
              <option value="">No category</option>
              {filteredCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Subcategory</Label>
            <select
              value={subcategoryId}
              onChange={e => setSubcategoryId(e.target.value)}
              disabled={!categoryId || filteredSubcategories.length === 0}
              className="w-full border rounded-md px-3 py-1.5 text-sm bg-background disabled:opacity-50"
            >
              <option value="">None</option>
              {filteredSubcategories.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-xs">Note (optional)</Label>
        <Input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add a note..."
          className="text-sm"
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Transaction'}
        </Button>
      </div>
    </form>
  )
}
