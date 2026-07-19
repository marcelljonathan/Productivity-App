"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { CustomPage, CustomPageMeta } from "@/lib/types"

export function usePages() {
  const [pages, setPages] = useState<CustomPageMeta[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPages = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('custom_pages')
      .select('id, title, icon, position')
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })
    if (data) setPages(data as CustomPageMeta[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchPages() }, [fetchPages])

  const createPage = useCallback(async (): Promise<CustomPage | null> => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const nextPosition = pages.length > 0 ? Math.max(...pages.map(p => p.position)) + 1 : 0
    const { data } = await supabase
      .from('custom_pages')
      .insert({ user_id: user.id, title: 'Untitled', position: nextPosition })
      .select()
      .single()
    await fetchPages()
    return (data as CustomPage) ?? null
  }, [pages, fetchPages])

  const renamePage = useCallback(async (id: string, title: string) => {
    const supabase = createClient()
    await supabase.from('custom_pages')
      .update({ title: title.trim() || 'Untitled', updated_at: new Date().toISOString() })
      .eq('id', id)
    await fetchPages()
  }, [fetchPages])

  const deletePage = useCallback(async (id: string) => {
    const supabase = createClient()
    await supabase.from('custom_pages').delete().eq('id', id)
    await fetchPages()
  }, [fetchPages])

  const setPageIcon = useCallback(async (id: string, icon: string | null) => {
    const supabase = createClient()
    await supabase.from('custom_pages')
      .update({ icon, updated_at: new Date().toISOString() })
      .eq('id', id)
    await fetchPages()
  }, [fetchPages])

  return { pages, loading, fetchPages, createPage, renamePage, deletePage, setPageIcon }
}
