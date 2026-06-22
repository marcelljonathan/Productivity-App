import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Sidebar from "@/components/layout/Sidebar"
import ProfileProvider from "@/components/providers/ProfileProvider"

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
        <Sidebar />
        <main className="flex-1 px-8 py-8">
          {children}
        </main>
      </ProfileProvider>
    </div>
  )
}
