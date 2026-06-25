"use client"

import { useState } from "react"
import { FinanceAccount, Currency } from "@/lib/types"
import { formatCurrency } from "@/lib/utils/finance"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Pencil, Check, X } from "lucide-react"
import ConfirmDialog from "@/components/ui/ConfirmDialog"

type Props = {
  accounts: FinanceAccount[]
  balances: Record<string, number>
  onAdd: (name: string, currency: Currency, starting_balance: number) => Promise<void>
  onUpdate: (id: string, updates: { name?: string; starting_balance?: number }) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export default function AccountManager({ accounts, balances, onAdd, onUpdate, onDelete }: Props) {
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState<Currency>('IDR')
  const [startingBalance, setStartingBalance] = useState('')
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editBalance, setEditBalance] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<FinanceAccount | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !startingBalance) return
    setAdding(true)
    await onAdd(name.trim(), currency, parseFloat(startingBalance))
    setName(''); setStartingBalance(''); setAdding(false)
  }

  function startEdit(acc: FinanceAccount) {
    setEditId(acc.id)
    setEditName(acc.name)
    setEditBalance(acc.starting_balance.toString())
  }

  async function handleUpdate() {
    if (!editId) return
    await onUpdate(editId, { name: editName.trim(), starting_balance: parseFloat(editBalance) })
    setEditId(null)
  }

  return (
    <div className="space-y-4">
      {confirmDelete && (
        <ConfirmDialog
          message={`Delete "${confirmDelete.name}"? All its transactions will also be deleted.`}
          onConfirm={() => { onDelete(confirmDelete.id); setConfirmDelete(null) }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      <h2 className="font-semibold">Accounts</h2>

      <div className="space-y-2">
        {accounts.map(acc => (
          <div key={acc.id} className="border rounded-lg p-3">
            {editId === acc.id ? (
              <div className="space-y-2">
                <Input value={editName} onChange={e => setEditName(e.target.value)} className="text-sm" />
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-muted-foreground">Starting balance:</span>
                  <Input
                    type="number"
                    value={editBalance}
                    onChange={e => setEditBalance(e.target.value)}
                    className="text-sm flex-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditId(null)}><X size={14} /></Button>
                  <Button size="sm" onClick={handleUpdate}><Check size={14} /></Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{acc.name}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{acc.currency}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Balance: {formatCurrency(balances[acc.id] ?? acc.starting_balance, acc.currency)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(acc)} className="p-1.5 text-muted-foreground hover:text-foreground">
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(acc)}
                    className="p-1.5 text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {accounts.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-3">No accounts yet.</p>
        )}
      </div>

      <form onSubmit={handleAdd} className="border rounded-lg p-3 space-y-3 bg-muted/20">
        <p className="text-sm font-medium">New Account</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. BCA Savings" className="text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Currency</Label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value as Currency)}
              className="w-full border rounded-md px-3 py-1.5 text-sm bg-background"
            >
              <option value="IDR">IDR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Starting Balance</Label>
          <Input
            type="number"
            min="0"
            step="any"
            value={startingBalance}
            onChange={e => setStartingBalance(e.target.value)}
            placeholder="0"
            className="text-sm"
          />
        </div>
        <Button type="submit" size="sm" disabled={adding} className="w-full">
          {adding ? 'Adding...' : 'Add Account'}
        </Button>
      </form>
    </div>
  )
}
