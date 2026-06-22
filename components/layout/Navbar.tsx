"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function Navbar() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <nav className="border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="font-semibold">Productivity</span>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          Tasks
        </Link>
        <Link href="/log" className="text-sm text-muted-foreground hover:text-foreground">
          Failed Log
        </Link>
        <Link href="/streak" className="text-sm text-muted-foreground hover:text-foreground">
          Streak
        </Link>
      </div>
      <button
        onClick={handleLogout}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        Logout
      </button>
    </nav>
  )
}