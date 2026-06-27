"use client"

import { useState } from "react"
import { FinanceAccount, FinanceAccountType, Currency } from "@/lib/types"
import { formatCurrency } from "@/lib/utils/finance"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Pencil, Check, X, Plus, ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react"
import ConfirmDialog from "@/components/ui/ConfirmDialog"

type Props = {
  accounts: FinanceAccount[]
  balances: Record<string, number>
  accountTypes: FinanceAccountType[]
  onAdd: (name: string, currency: Currency, starting_balance: number, account_type_id: string | null) => Promise<void>
  onUpdate: (id: string, updates: { name?: string; starting_balance?: number; account_type_id?: string | null }) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onAddAccountType: (name: string) => Promise<void>
  onDeleteAccountType: (id: string) => Promise<void>
}

const CURRENCY_SYMBOL: Record<string, string> = { IDR: 'Rp', USD: '$' }

function formatAmount(value: string): string {
  const stripped = value.replace(/[^\d.]/g, '')
  const parts = stripped.split('.')
  const integer = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.length > 1 ? `${integer}.${parts[1]}` : integer
}

function parseAmount(display: string): number {
  return parseFloat(display.replace(/,/g, '')) || 0
}

const NO_TYPE_KEY = '__none__'

export default function AccountManager({
  accounts, balances, accountTypes,
  onAdd, onUpdate, onDelete,
  onAddAccountType, onDeleteAccountType,
}: Props) {
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState<Currency>('IDR')
  const [accountTypeId, setAccountTypeId] = useState('')
  const [startingBalance, setStartingBalance] = useState('')
  const [adding, setAdding] = useState(false)

  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editBalance, setEditBalance] = useState('')
  const [editTypeId, setEditTypeId] = useState<string>('')

  const [newTypeName, setNewTypeName] = useState('')
  const [showAddType, setShowAddType] = useState(false)
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState<FinanceAccount | null>(null)
  const [confirmDeleteType, setConfirmDeleteType] = useState<FinanceAccountType | null>(null)
  const [balancesVisible, setBalancesVisible] = useState(false)

  function toggleGroup(key: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setAdding(true)
    await onAdd(name.trim(), currency, parseAmount(startingBalance), accountTypeId || null)
    setName(''); setStartingBalance(''); setAccountTypeId(''); setAdding(false)
    setShowAddAccount(false)
  }

  function startEdit(acc: FinanceAccount) {
    setEditId(acc.id)
    setEditName(acc.name)
    setEditBalance(formatAmount(acc.starting_balance.toString()))
    setEditTypeId(acc.account_type_id ?? '')
  }

  async function handleUpdate() {
    if (!editId) return
    await onUpdate(editId, {
      name: editName.trim(),
      starting_balance: parseAmount(editBalance),
      account_type_id: editTypeId || null,
    })
    setEditId(null)
  }

  async function handleAddType(e: React.FormEvent) {
    e.preventDefault()
    if (!newTypeName.trim()) return
    await onAddAccountType(newTypeName.trim())
    setNewTypeName('')
    setShowAddType(false)
  }

  // Build groups: only types that have at least one account, plus "No Type" if needed
  const groups: { key: string; label: string; accs: FinanceAccount[] }[] = []

  for (const t of accountTypes) {
    const accs = accounts.filter(a => a.account_type_id === t.id)
    if (accs.length > 0) groups.push({ key: t.id, label: t.name, accs })
  }

  const noTypeAccs = accounts.filter(a => a.account_type_id === null)
  if (noTypeAccs.length > 0) groups.push({ key: NO_TYPE_KEY, label: 'No Type', accs: noTypeAccs })

  function renderAccount(acc: FinanceAccount) {
    if (editId === acc.id) {
      return (
        <div key={acc.id} className="space-y-2 py-2 border-t first:border-t-0 px-3">
          <Input value={editName} onChange={e => setEditName(e.target.value)} className="text-sm" autoFocus />
          <select
            value={editTypeId}
            onChange={e => setEditTypeId(e.target.value)}
            className="w-full border rounded-md px-3 py-1.5 text-sm bg-background"
          >
            <option value="">No type</option>
            {accountTypes.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-muted-foreground shrink-0">Starting balance:</span>
            <div className="flex items-center border rounded-md overflow-hidden bg-background text-sm flex-1">
              <span className="px-2 py-1.5 text-muted-foreground border-r bg-muted/50 shrink-0 select-none">
                {CURRENCY_SYMBOL[acc.currency] ?? acc.currency}
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={editBalance}
                onChange={e => setEditBalance(formatAmount(e.target.value))}
                className="flex-1 px-2 py-1.5 bg-transparent outline-none min-w-0"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditId(null)}><X size={14} /></Button>
            <Button size="sm" onClick={handleUpdate}><Check size={14} /></Button>
          </div>
        </div>
      )
    }

    return (
      <div key={acc.id} className="flex items-center justify-between py-2 border-t first:border-t-0 px-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{acc.name}</span>
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{acc.currency}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 tracking-widest">
            {balancesVisible
              ? formatCurrency(balances[acc.id] ?? acc.starting_balance, acc.currency)
              : '••••••'}
          </p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => startEdit(acc)} className="p-1.5 text-muted-foreground hover:text-foreground">
            <Pencil size={14} />
          </button>
          <button onClick={() => setConfirmDelete(acc)} className="p-1.5 text-muted-foreground hover:text-red-500">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {confirmDelete && (
        <ConfirmDialog
          message={`Delete "${confirmDelete.name}"? All its transactions will also be deleted.`}
          onConfirm={() => { onDelete(confirmDelete.id); setConfirmDelete(null) }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {confirmDeleteType && (
        <ConfirmDialog
          message={`Delete account type "${confirmDeleteType.name}"? Accounts using this type will have no type set.`}
          onConfirm={() => { onDeleteAccountType(confirmDeleteType.id); setConfirmDeleteType(null) }}
          onCancel={() => setConfirmDeleteType(null)}
        />
      )}

      {/* Account Types */}
      <div className="space-y-3">
        <h2 className="font-semibold">Account Types</h2>
        {accountTypes.length === 0 && (
          <p className="text-xs text-muted-foreground">No account types yet.</p>
        )}
        {accountTypes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {accountTypes.map(t => (
              <span key={t.id} className="flex items-center gap-1.5 border rounded-full px-3 py-1 text-sm bg-muted/40">
                {t.name}
                <button
                  onClick={() => setConfirmDeleteType(t)}
                  className="text-muted-foreground hover:text-red-500 transition-colors"
                  title={`Delete ${t.name}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
        {showAddType ? (
          <form onSubmit={handleAddType} className="flex gap-2">
            <Input
              value={newTypeName}
              onChange={e => setNewTypeName(e.target.value)}
              placeholder="e.g. Savings"
              className="text-sm"
              autoFocus
            />
            <Button type="submit" size="sm">Add</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setShowAddType(false); setNewTypeName('') }}>Cancel</Button>
          </form>
        ) : (
          <button
            onClick={() => setShowAddType(true)}
            className="w-full border border-dashed rounded-md py-2 text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus size={14} /> Add Account Type
          </button>
        )}
      </div>

      <hr className="border-t border-gray-400" />

      {/* Accounts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Accounts</h2>
          <button
            onClick={() => setBalancesVisible(v => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {balancesVisible ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        {accounts.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-3">No accounts yet.</p>
        )}

        <div className="space-y-2">
          {groups.map(({ key, label, accs }) => {
            const expanded = expandedGroups.has(key)
            return (
              <div key={key} className="border rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium hover:bg-muted/40 transition-colors"
                  onClick={() => toggleGroup(key)}
                >
                  <div className="flex items-center gap-2">
                    {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {label}
                    <span className="text-xs text-muted-foreground font-normal">({accs.length})</span>
                  </div>
                </button>
                {expanded && (
                  <div className="bg-muted/10">
                    {accs.map(acc => renderAccount(acc))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {!showAddAccount ? (
          <button
            onClick={() => setShowAddAccount(true)}
            className="w-full border border-dashed rounded-md py-2 text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus size={14} /> Add Account
          </button>
        ) : (
          <form onSubmit={handleAdd} className="border rounded-lg p-3 space-y-3 bg-muted/20">
            <p className="text-sm font-medium">New Account</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Bank Saving" className="text-sm" autoFocus required />
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
              <Label className="text-xs">Account Type (Optional)</Label>
              <select
                value={accountTypeId}
                onChange={e => setAccountTypeId(e.target.value)}
                className="w-full border rounded-md px-3 py-1.5 text-sm bg-background"
              >
                <option value="">No type</option>
                {accountTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Starting Balance</Label>
              <div className="flex items-center border rounded-md overflow-hidden bg-background text-sm">
                <span className="px-2.5 py-1.5 text-muted-foreground border-r bg-muted/50 shrink-0 select-none">
                  {CURRENCY_SYMBOL[currency] ?? currency}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={startingBalance}
                  onChange={e => setStartingBalance(formatAmount(e.target.value))}
                  placeholder="0"
                  className="flex-1 px-3 py-1.5 bg-transparent outline-none min-w-0"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={adding} className="flex-1">
                {adding ? 'Adding...' : 'Add Account'}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowAddAccount(false)}>Cancel</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
