"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { FinanceTransactionType } from "@/lib/types"

export function useFinanceTransactionTypes() {
  const [transactionTypes, setTransactionTypes] = useState<FinanceTransactionType[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('finance_transaction_types')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) setTransactionTypes(data as FinanceTransactionType[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function addTransactionType(name: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('finance_transaction_types').insert({ user_id: user.id, name })
    await fetchAll()
  }

  async function deleteTransactionType(id: string) {
    const supabase = createClient()
    await supabase.from('finance_transaction_types').delete().eq('id', id)
    await fetchAll()
  }

  return { transactionTypes, loading, addTransactionType, deleteTransactionType }
}
