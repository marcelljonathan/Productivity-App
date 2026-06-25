"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { FinanceTransaction } from "@/lib/types"

export function useFinanceMonth(yearMonth: string) {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const [y, m] = yearMonth.split('-').map(Number)
    const daysInMonth = new Date(y, m, 0).getDate()
    const { data } = await supabase
      .from('finance_transactions')
      .select('*')
      .gte('date', `${yearMonth}-01`)
      .lte('date', `${yearMonth}-${String(daysInMonth).padStart(2, '0')}`)
      .order('date', { ascending: true })
    if (data) setTransactions(data as FinanceTransaction[])
    setLoading(false)
  }, [yearMonth])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const txByDate = transactions.reduce<Record<string, FinanceTransaction[]>>((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = []
    acc[tx.date].push(tx)
    return acc
  }, {})

  return { transactions, txByDate, loading, fetchTransactions }
}
