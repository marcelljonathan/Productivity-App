"use client"

import { useState } from "react"
import { FinanceTransactionType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X } from "lucide-react"
import ConfirmDialog from "@/components/ui/ConfirmDialog"

type Props = {
  transactionTypes: FinanceTransactionType[]
  onAdd: (name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export default function TransactionTypeManager({ transactionTypes, onAdd, onDelete }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<FinanceTransactionType | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    await onAdd(newName.trim())
    setNewName('')
    setShowAdd(false)
  }

  return (
    <div className="space-y-3">
      {confirmDelete && (
        <ConfirmDialog
          message={`Delete transaction type "${confirmDelete.name}"? Existing transactions of this type will lose their type label.`}
          onConfirm={() => { onDelete(confirmDelete.id); setConfirmDelete(null) }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <h2 className="font-semibold">Custom Transaction Types</h2>
      <p className="text-xs text-muted-foreground">
        For recording trading, investment, or other non-living income/expense flows separately.
      </p>

      {transactionTypes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {transactionTypes.map(t => (
            <span key={t.id} className="flex items-center gap-1.5 border rounded-full px-3 py-1 text-sm bg-muted/40">
              {t.name}
              <button
                onClick={() => setConfirmDelete(t)}
                className="text-muted-foreground hover:text-red-500 transition-colors"
                title={`Delete ${t.name}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {transactionTypes.length === 0 && (
        <p className="text-xs text-muted-foreground">No custom types yet.</p>
      )}

      {showAdd ? (
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="e.g. Trading"
            className="text-sm"
            autoFocus
          />
          <Button type="submit" size="sm">Add</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => { setShowAdd(false); setNewName('') }}>Cancel</Button>
        </form>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full border border-dashed rounded-md py-2 text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus size={14} /> Add Transaction Type
        </button>
      )}
    </div>
  )
}
