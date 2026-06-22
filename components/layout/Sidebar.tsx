"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { Menu, ListTodo, LogOut, ChevronLeft, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useProfileContext } from "@/components/providers/ProfileProvider"

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const { profile } = useProfileContext()

  const title = profile.display_name ? `${profile.display_name}'s Domain` : 'Productivity'

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen border-r flex flex-col transition-all duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className="flex items-center justify-between px-3 py-4 border-b">
        {!collapsed && <span className="font-semibold text-sm truncate">{title}</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded hover:bg-muted ml-auto"
        >
          {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
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
      </nav>

      <div className="p-2 border-t space-y-1">
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
