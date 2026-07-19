"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useState, useRef, useEffect } from "react"
import { Menu, ListTodo, LogOut, ChevronLeft, Settings, Wallet, FileText, Plus, CandlestickChart } from "lucide-react"
import { cn } from "@/lib/utils"
import { PageType } from "@/lib/types"
import { useProfileContext } from "@/components/providers/ProfileProvider"
import { usePagesContext } from "@/components/providers/PagesProvider"

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [showChooser, setShowChooser] = useState(false)
  const chooserRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const { profile } = useProfileContext()
  const { pages, createPage } = usePagesContext()

  const title = profile.display_name ? `${profile.display_name}'s Domain` : 'Productivity'

  useEffect(() => {
    if (!showChooser) return
    function onClick(e: MouseEvent) {
      if (chooserRef.current && !chooserRef.current.contains(e.target as Node)) setShowChooser(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [showChooser])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  async function handleCreatePage(type: PageType) {
    setShowChooser(false)
    const page = await createPage(type)
    if (page) router.push(`/pages/${page.id}`)
  }

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen border-r border-gray-400 flex-col transition-all duration-200",
        "hidden md:flex",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className="flex items-center justify-between px-3 py-4 border-b border-gray-400">
        {!collapsed && <span className="font-semibold text-sm truncate">{title}</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded hover:bg-muted ml-auto"
        >
          {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        <Link
          href="/"
          title="Task List"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded text-sm hover:bg-muted transition-colors",
            pathname === "/" ? "bg-muted font-medium" : "text-muted-foreground"
          )}
        >
          <ListTodo size={18} className="shrink-0" />
          {!collapsed && "Task List"}
        </Link>
        <Link
          href="/finance"
          title="Finance"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded text-sm hover:bg-muted transition-colors",
            pathname.startsWith("/finance") ? "bg-muted font-medium" : "text-muted-foreground"
          )}
        >
          <Wallet size={18} className="shrink-0" />
          {!collapsed && "Finance"}
        </Link>

        {pages.map(page => (
          <Link
            key={page.id}
            href={`/pages/${page.id}`}
            title={page.title}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded text-sm hover:bg-muted transition-colors",
              pathname === `/pages/${page.id}` ? "bg-muted font-medium" : "text-muted-foreground"
            )}
          >
            {page.icon
              ? <span className="w-4.5 shrink-0 text-center text-base leading-none">{page.icon}</span>
              : page.type === "trades"
              ? <CandlestickChart size={18} className="shrink-0" />
              : <FileText size={18} className="shrink-0" />}
            {!collapsed && <span className="truncate">{page.title}</span>}
          </Link>
        ))}

        <div className="relative" ref={chooserRef}>
          <button
            onClick={() => setShowChooser(v => !v)}
            title="New page"
            className="flex items-center gap-3 px-3 py-2 rounded text-sm w-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <Plus size={18} className="shrink-0" />
            {!collapsed && "New page"}
          </button>
          {showChooser && (
            <div className="absolute left-0 bottom-full mb-1 z-20 w-48 rounded-md border border-gray-400 bg-background shadow-lg p-1">
              <button
                onClick={() => handleCreatePage("doc")}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded text-sm hover:bg-muted text-left transition-colors"
              >
                <FileText size={16} className="shrink-0 text-muted-foreground" />
                <span>
                  <span className="block">Blank page</span>
                  <span className="block text-xs text-muted-foreground">Rich text & tables</span>
                </span>
              </button>
              <button
                onClick={() => handleCreatePage("trades")}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded text-sm hover:bg-muted text-left transition-colors"
              >
                <CandlestickChart size={16} className="shrink-0 text-muted-foreground" />
                <span>
                  <span className="block">Trades tracker</span>
                  <span className="block text-xs text-muted-foreground">Stocks & futures P/L</span>
                </span>
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="p-2 border-t border-gray-400 space-y-1">
        <Link
          href="/settings"
          title="Settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded text-sm hover:bg-muted transition-colors",
            pathname === "/settings" ? "bg-muted font-medium" : "text-muted-foreground"
          )}
        >
          <Settings size={18} className="shrink-0" />
          {!collapsed && "Settings"}
        </Link>
        <button
          title="Logout"
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded text-sm w-full hover:bg-muted text-muted-foreground transition-colors"
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  )
}
