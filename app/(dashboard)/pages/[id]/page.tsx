"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { CustomPage } from "@/lib/types"
import { usePagesContext } from "@/components/providers/PagesProvider"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import PageEditor from "@/components/pages/PageEditor"
import { Trash2 } from "lucide-react"

export default function CustomPageRoute() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { renamePage, deletePage } = usePagesContext()

  const [page, setPage] = useState<CustomPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState("")
  const [confirming, setConfirming] = useState(false)

  const fetchPage = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('custom_pages').select('*').eq('id', id).single()
    if (data) {
      setPage(data as CustomPage)
      setTitle((data as CustomPage).title)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { fetchPage() }, [fetchPage])

  async function handleTitleBlur() {
    if (!page || title.trim() === page.title) return
    await renamePage(page.id, title)
    setPage({ ...page, title: title.trim() || 'Untitled' })
  }

  async function handleDelete() {
    if (!page) return
    await deletePage(page.id)
    router.push('/')
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>
  if (!page) return <p className="text-sm text-muted-foreground">Page not found.</p>

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {confirming && (
        <ConfirmDialog
          message="Delete this page? This cannot be undone."
          onConfirm={() => { setConfirming(false); handleDelete() }}
          onCancel={() => setConfirming(false)}
        />
      )}

      <div className="flex items-center gap-2">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          placeholder="Untitled"
          className="flex-1 text-2xl font-bold bg-transparent outline-none"
        />
        <button
          onClick={() => setConfirming(true)}
          title="Delete page"
          className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <PageEditor pageId={page.id} initialContent={page.content} />
    </div>
  )
}
