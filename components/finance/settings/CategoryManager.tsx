"use client"

import { useState } from "react"
import { CategoryType, FinanceCategory, FinanceSubcategory } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Plus, X } from "lucide-react"
import ConfirmDialog from "@/components/ui/ConfirmDialog"

type Props = {
  categories: FinanceCategory[]
  subcategories: FinanceSubcategory[]
  onAddCategory: (name: string, type: CategoryType) => Promise<void>
  onDeleteCategory: (id: string) => Promise<void>
  onAddSubcategory: (category_id: string, name: string) => Promise<void>
  onDeleteSubcategory: (id: string) => Promise<void>
}

export default function CategoryManager({
  categories, subcategories,
  onAddCategory, onDeleteCategory,
  onAddSubcategory, onDeleteSubcategory,
}: Props) {
  const [catName, setCatName] = useState('')
  const [catType, setCatType] = useState<CategoryType>('expense')
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null)
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null)
  const [subName, setSubName] = useState('')
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<FinanceCategory | null>(null)
  const [confirmDeleteSub, setConfirmDeleteSub] = useState<FinanceSubcategory | null>(null)

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!catName.trim()) return
    await onAddCategory(catName.trim(), catType)
    setCatName('')
    setShowAddCategory(false)
  }

  async function handleAddSubcategory(catId: string) {
    if (!subName.trim()) return
    await onAddSubcategory(catId, subName.trim())
    setSubName('')
    setAddingSubFor(null)
  }

  const income = categories.filter(c => c.type === 'income')
  const expense = categories.filter(c => c.type === 'expense')

  function renderChipGroup(cats: FinanceCategory[], label: string, color: string) {
    const selected = cats.find(c => c.id === selectedCatId) ?? null
    const subs = selected ? subcategories.filter(s => s.category_id === selected.id) : []

    return (
      <div className="space-y-2">
        <h3 className={`text-xs font-semibold uppercase tracking-wide ${color}`}>{label}</h3>
        {cats.length === 0 && (
          <p className="text-xs text-muted-foreground pl-1">No {label.toLowerCase()} categories yet.</p>
        )}
        {cats.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {cats.map(cat => {
              const subCount = subcategories.filter(s => s.category_id === cat.id).length
              const isSelected = selectedCatId === cat.id
              return (
                <span
                  key={cat.id}
                  onClick={() => {
                    setSelectedCatId(isSelected ? null : cat.id)
                    setAddingSubFor(null)
                    setSubName('')
                  }}
                  className={`flex items-center gap-1.5 border rounded-full px-3 py-1 text-sm cursor-pointer transition-colors select-none
                    ${isSelected
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-muted/40 hover:bg-muted/60'
                    }`}
                >
                  {cat.name}
                  {subCount > 0 && (
                    <span className={`text-xs ${isSelected ? 'opacity-60' : 'text-muted-foreground'}`}>
                      ({subCount})
                    </span>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); setConfirmDeleteCat(cat) }}
                    className={`transition-colors ${isSelected ? 'text-background/60 hover:text-red-400' : 'text-muted-foreground hover:text-red-500'}`}
                    title={`Delete ${cat.name}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              )
            })}
          </div>
        )}

        {selected && (
          <div className="border rounded-lg p-3 space-y-2 bg-muted/10">
            <p className="text-xs font-medium text-muted-foreground">{selected.name} — subcategories</p>
            {subs.length > 0 ? (
              <div className="space-y-0.5">
                {subs.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between text-sm py-0.5">
                    <span className="text-muted-foreground pl-2">· {sub.name}</span>
                    <button
                      onClick={() => setConfirmDeleteSub(sub)}
                      className="p-1 text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground pl-2">No subcategories yet.</p>
            )}
            {addingSubFor === selected.id ? (
              <div className="flex gap-2 pt-1">
                <Input
                  value={subName}
                  onChange={e => setSubName(e.target.value)}
                  placeholder="Subcategory name"
                  className="text-xs h-7"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleAddSubcategory(selected.id)}
                />
                <Button size="sm" className="h-7 text-xs" onClick={() => handleAddSubcategory(selected.id)}>Add</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setAddingSubFor(null); setSubName('') }}>✕</Button>
              </div>
            ) : (
              <button
                onClick={() => setAddingSubFor(selected.id)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <Plus size={11} /> Add subcategory
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {confirmDeleteCat && (
        <ConfirmDialog
          message={`Delete "${confirmDeleteCat.name}" and all its subcategories?`}
          onConfirm={() => { onDeleteCategory(confirmDeleteCat.id); setConfirmDeleteCat(null) }}
          onCancel={() => setConfirmDeleteCat(null)}
        />
      )}
      {confirmDeleteSub && (
        <ConfirmDialog
          message={`Delete subcategory "${confirmDeleteSub.name}"?`}
          onConfirm={() => { onDeleteSubcategory(confirmDeleteSub.id); setConfirmDeleteSub(null) }}
          onCancel={() => setConfirmDeleteSub(null)}
        />
      )}

      <h2 className="font-semibold">Categories</h2>

      {renderChipGroup(income, 'Income', 'text-green-600')}
      {renderChipGroup(expense, 'Expense', 'text-red-600')}

      {!showAddCategory ? (
        <button
          onClick={() => setShowAddCategory(true)}
          className="w-full border border-dashed rounded-md py-2 text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus size={14} /> Add Category
        </button>
      ) : (
        <form onSubmit={handleAddCategory} className="border rounded-lg p-3 space-y-3 bg-muted/20">
          <p className="text-sm font-medium">New Category</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input
                value={catName}
                onChange={e => setCatName(e.target.value)}
                placeholder="e.g. Food"
                className="text-sm"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <select
                value={catType}
                onChange={e => setCatType(e.target.value as CategoryType)}
                className="w-full border rounded-md px-3 py-1.5 text-sm bg-background"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="flex-1">Add Category</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowAddCategory(false)}>Cancel</Button>
          </div>
        </form>
      )}
    </div>
  )
}
