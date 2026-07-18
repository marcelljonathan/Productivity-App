import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Sidebar from "@/components/layout/Sidebar"
import BottomNav from "@/components/layout/BottomNav"
import ProfileProvider from "@/components/providers/ProfileProvider"
import PagesProvider from "@/components/providers/PagesProvider"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  if (!profile?.display_name) redirect('/onboarding')

  return (
    <div className="min-h-screen flex">
      <ProfileProvider userId={user.id}>
        <PagesProvider>
          <Sidebar />
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8 pb-24 md:pb-8">
            {children}
          </main>
          <BottomNav />
        </PagesProvider>
      </ProfileProvider>
    </div>
  )
}
