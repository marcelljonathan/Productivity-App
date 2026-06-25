"use client"

import { useFinanceAccounts } from "@/hooks/useFinanceAccounts"
import { useFinanceCategories } from "@/hooks/useFinanceCategories"
import AccountManager from "@/components/finance/settings/AccountManager"
import CategoryManager from "@/components/finance/settings/CategoryManager"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function FinanceSettingsPage() {
  const { accounts, balances, addAccount, updateAccount, deleteAccount } = useFinanceAccounts()
  const { categories, subcategories, addCategory, deleteCategory, addSubcategory, deleteSubcategory } = useFinanceCategories()

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/finance">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft size={16} />
          </Button>
        </Link>
        <h1 className="font-semibold text-lg">Finance Settings</h1>
      </div>

      <AccountManager
        accounts={accounts}
        balances={balances}
        onAdd={addAccount}
        onUpdate={updateAccount}
        onDelete={deleteAccount}
      />

      <CategoryManager
        categories={categories}
        subcategories={subcategories}
        onAddCategory={addCategory}
        onDeleteCategory={deleteCategory}
        onAddSubcategory={addSubcategory}
        onDeleteSubcategory={deleteSubcategory}
      />
    </div>
  )
}
