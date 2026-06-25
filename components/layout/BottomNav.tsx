"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ListTodo, Settings, LogOut, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background flex md:hidden">
      <Link
        href="/"
        className={cn(
          "flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors",
          pathname === "/" ? "text-foreground font-medium" : "text-muted-foreground"
        )}
      >
        <ListTodo size={20} />
        Tasks
      </Link>
      <Link
        href="/finance"
        className={cn(
          "flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors",
          pathname.startsWith("/finance") ? "text-foreground font-medium" : "text-muted-foreground"
        )}
      >
        <Wallet size={20} />
        Finance
      </Link>
      <Link
        href="/settings"
        className={cn(
          "flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors",
          pathname === "/settings" ? "text-foreground font-medium" : "text-muted-foreground"
        )}
      >
        <Settings size={20} />
        Settings
      </Link>
      <button
        onClick={handleLogout}
        className="flex-1 flex flex-col items-center gap-1 py-3 text-xs text-muted-foreground transition-colors"
      >
        <LogOut size={20} />
        Logout
      </button>
    </nav>
  )
}
