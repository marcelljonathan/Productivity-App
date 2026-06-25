"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Currency, FinanceAccount, FinanceTransaction } from "@/lib/types"
import { calcAccountBalance } from "@/lib/utils/finance"

export function useFinanceAccounts() {
  const [accounts, setAccounts] = useState<FinanceAccount[]>([])
  const [balances, setBalances] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const [{ data: accs }, { data: txs }] = await Promise.all([
      supabase.from('finance_accounts').select('*').order('created_at', { ascending: true }),
      supabase.from('finance_transactions').select('*'),
    ])
    if (accs && txs) {
      const accounts = accs as FinanceAccount[]
      const transactions = txs as FinanceTransaction[]
      setAccounts(accounts)
      const map: Record<string, number> = {}
      for (const acc of accounts) map[acc.id] = calcAccountBalance(acc, transactions)
      setBalances(map)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function addAccount(name: string, currency: Currency, starting_balance: number, account_type_id: string | null) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('finance_accounts').insert({ user_id: user.id, name, currency, starting_balance, account_type_id })
    await fetchAll()
  }

  async function updateAccount(id: string, updates: { name?: string; starting_balance?: number; account_type_id?: string | null }) {
    const supabase = createClient()
    await supabase.from('finance_accounts').update(updates).eq('id', id)
    await fetchAll()
  }

  async function deleteAccount(id: string) {
    const supabase = createClient()
    await supabase.from('finance_accounts').delete().eq('id', id)
    await fetchAll()
  }

  return { accounts, balances, loading, fetchAll, addAccount, updateAccount, deleteAccount }
}
