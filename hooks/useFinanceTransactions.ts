"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { FinanceTransaction } from "@/lib/types"

export function useFinanceTransactions(date: string) {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('finance_transactions')
      .select('*')
      .eq('date', date)
      .order('created_at', { ascending: false })
    if (data) setTransactions(data as FinanceTransaction[])
    setLoading(false)
  }, [date])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  return { transactions, loading, fetchTransactions }
}
