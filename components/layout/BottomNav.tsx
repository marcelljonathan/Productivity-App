"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ListTodo, Settings, LogOut, Wallet, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePagesContext } from "@/components/providers/PagesProvider"

// basis-1/4 + shrink-0 => exactly 4 items fill the screen; extras overflow and scroll
const ITEM = "basis-1/4 shrink-0 flex flex-col items-center gap-1 py-3 px-1 text-xs transition-colors min-w-0"

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { pages } = usePagesContext()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background flex overflow-x-auto md:hidden">
      <Link
        href="/"
        className={cn(ITEM, pathname === "/" ? "text-foreground font-medium" : "text-muted-foreground")}
      >
        <ListTodo size={20} />
        Tasks
      </Link>
      <Link
        href="/finance"
        className={cn(ITEM, pathname.startsWith("/finance") ? "text-foreground font-medium" : "text-muted-foreground")}
      >
        <Wallet size={20} />
        Finance
      </Link>

      {pages.map(page => (
        <Link
          key={page.id}
          href={`/pages/${page.id}`}
          className={cn(ITEM, pathname === `/pages/${page.id}` ? "text-foreground font-medium" : "text-muted-foreground")}
        >
          {page.icon
            ? <span className="text-lg leading-none">{page.icon}</span>
            : <FileText size={20} />}
          <span className="truncate max-w-full">{page.title}</span>
        </Link>
      ))}

      <Link
        href="/settings"
        className={cn(ITEM, pathname === "/settings" ? "text-foreground font-medium" : "text-muted-foreground")}
      >
        <Settings size={20} />
        Settings
      </Link>
      <button onClick={handleLogout} className={cn(ITEM, "text-muted-foreground")}>
        <LogOut size={20} />
        Logout
      </button>
    </nav>
  )
}
