"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { CategoryType, FinanceCategory, FinanceSubcategory } from "@/lib/types"

export function useFinanceCategories() {
  const [categories, setCategories] = useState<FinanceCategory[]>([])
  const [subcategories, setSubcategories] = useState<FinanceSubcategory[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const [{ data: cats }, { data: subs }] = await Promise.all([
      supabase.from('finance_categories').select('*').order('name'),
      supabase.from('finance_subcategories').select('*').order('name'),
    ])
    if (cats) setCategories(cats as FinanceCategory[])
    if (subs) setSubcategories(subs as FinanceSubcategory[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function addCategory(name: string, type: CategoryType) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('finance_categories').insert({ user_id: user.id, name, type })
    await fetchAll()
  }

  async function deleteCategory(id: string) {
    const supabase = createClient()
    await supabase.from('finance_categories').delete().eq('id', id)
    await fetchAll()
  }

  async function addSubcategory(category_id: string, name: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('finance_subcategories').insert({ user_id: user.id, category_id, name })
    await fetchAll()
  }

  async function deleteSubcategory(id: string) {
    const supabase = createClient()
    await supabase.from('finance_subcategories').delete().eq('id', id)
    await fetchAll()
  }

  return { categories, subcategories, loading, fetchAll, addCategory, deleteCategory, addSubcategory, deleteSubcategory }
}
