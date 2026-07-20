"use client"

import { useFinanceAccounts } from "@/hooks/useFinanceAccounts"
import { useFinanceAccountTypes } from "@/hooks/useFinanceAccountTypes"
import { useFinanceCategories } from "@/hooks/useFinanceCategories"
import { useFinanceTransactionTypes } from "@/hooks/useFinanceTransactionTypes"
import AccountManager from "@/components/finance/settings/AccountManager"
import CategoryManager from "@/components/finance/settings/CategoryManager"
import TransactionTypeManager from "@/components/finance/settings/TransactionTypeManager"
import MonthlyStartDayManager from "@/components/finance/settings/MonthlyStartDayManager"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function FinanceSettingsPage() {
  const { accounts, balances, addAccount, updateAccount, deleteAccount } = useFinanceAccounts()
  const { accountTypes, addAccountType, updateAccountType, deleteAccountType } = useFinanceAccountTypes()
  const { categories, subcategories, addCategory, deleteCategory, addSubcategory, deleteSubcategory } = useFinanceCategories()
  const { transactionTypes, addTransactionType, deleteTransactionType } = useFinanceTransactionTypes()

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

      <MonthlyStartDayManager />

      <hr className="border-t border-gray-400" />

      <AccountManager
        accounts={accounts}
        balances={balances}
        accountTypes={accountTypes}
        onAdd={addAccount}
        onUpdate={updateAccount}
        onDelete={deleteAccount}
        onAddAccountType={addAccountType}
        onUpdateAccountType={updateAccountType}
        onDeleteAccountType={deleteAccountType}
      />

      <hr className="border-t border-gray-400" />

      <CategoryManager
        categories={categories}
        subcategories={subcategories}
        onAddCategory={addCategory}
        onDeleteCategory={deleteCategory}
        onAddSubcategory={addSubcategory}
        onDeleteSubcategory={deleteSubcategory}
      />

      <hr className="border-t border-gray-400" />

      <TransactionTypeManager
        transactionTypes={transactionTypes}
        onAdd={addTransactionType}
        onDelete={deleteTransactionType}
      />
    </div>
  )
}
