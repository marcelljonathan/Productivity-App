"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { FinanceTransaction } from "@/lib/types"

export function useFinanceRange(startDate: string, endDate: string) {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('finance_transactions')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
    if (data) setTransactions(data as FinanceTransaction[])
    setLoading(false)
  }, [startDate, endDate])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const txByDate = transactions.reduce<Record<string, FinanceTransaction[]>>((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = []
    acc[tx.date].push(tx)
    return acc
  }, {})

  return { transactions, txByDate, loading, fetchTransactions }
}
