"use client"

import { useState } from "react"
import { CategoryType, FinanceCategory, FinanceSubcategory } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, ChevronDown, ChevronRight, Plus } from "lucide-react"
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null)
  const [subName, setSubName] = useState('')
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<FinanceCategory | null>(null)
  const [confirmDeleteSub, setConfirmDeleteSub] = useState<FinanceSubcategory | null>(null)

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!catName.trim()) return
    await onAddCategory(catName.trim(), catType)
    setCatName('')
  }

  async function handleAddSubcategory(catId: string) {
    if (!subName.trim()) return
    await onAddSubcategory(catId, subName.trim())
    setSubName('')
    setAddingSubFor(null)
  }

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const income = categories.filter(c => c.type === 'income')
  const expense = categories.filter(c => c.type === 'expense')

  function renderCategoryGroup(cats: FinanceCategory[], label: string, color: string) {
    return (
      <div className="space-y-2">
        <h3 className={`text-xs font-semibold uppercase tracking-wide ${color}`}>{label}</h3>
        {cats.map(cat => {
          const subs = subcategories.filter(s => s.category_id === cat.id)
          const expanded = expandedIds.has(cat.id)
          return (
            <div key={cat.id} className="border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2">
                <button
                  className="flex items-center gap-2 flex-1 text-left text-sm font-medium"
                  onClick={() => toggleExpand(cat.id)}
                >
                  {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  {cat.name}
                  {subs.length > 0 && (
                    <span className="text-xs text-muted-foreground">({subs.length})</span>
                  )}
                </button>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setAddingSubFor(cat.id); setExpandedIds(prev => new Set([...prev, cat.id])) }}
                    className="p-1.5 text-muted-foreground hover:text-foreground"
                    title="Add subcategory"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteCat(cat)}
                    className="p-1.5 text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {expanded && (
                <div className="border-t bg-muted/20 px-3 py-2 space-y-1">
                  {subs.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between text-sm py-0.5">
                      <span className="text-muted-foreground pl-4">· {sub.name}</span>
                      <button
                        onClick={() => setConfirmDeleteSub(sub)}
                        className="p-1 text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  {subs.length === 0 && (
                    <p className="text-xs text-muted-foreground pl-4">No subcategories.</p>
                  )}
                  {addingSubFor === cat.id && (
                    <div className="flex gap-2 pt-1">
                      <Input
                        value={subName}
                        onChange={e => setSubName(e.target.value)}
                        placeholder="Subcategory name"
                        className="text-xs h-7"
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && handleAddSubcategory(cat.id)}
                      />
                      <Button size="sm" className="h-7 text-xs" onClick={() => handleAddSubcategory(cat.id)}>Add</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAddingSubFor(null)}>✕</Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {cats.length === 0 && (
          <p className="text-xs text-muted-foreground pl-2">No {label.toLowerCase()} categories yet.</p>
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

      {renderCategoryGroup(income, 'Income', 'text-green-600')}
      {renderCategoryGroup(expense, 'Expense', 'text-red-600')}

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
        <Button type="submit" size="sm" className="w-full">Add Category</Button>
      </form>
    </div>
  )
}
