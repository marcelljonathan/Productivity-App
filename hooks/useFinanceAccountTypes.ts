"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { FinanceAccountType } from "@/lib/types"

export function useFinanceAccountTypes() {
  const [accountTypes, setAccountTypes] = useState<FinanceAccountType[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('finance_account_types')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) setAccountTypes(data as FinanceAccountType[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function addAccountType(name: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('finance_account_types').insert({ user_id: user.id, name })
    await fetchAll()
  }

  async function deleteAccountType(id: string) {
    const supabase = createClient()
    await supabase.from('finance_account_types').delete().eq('id', id)
    await fetchAll()
  }

  return { accountTypes, loading, addAccountType, deleteAccountType }
}
