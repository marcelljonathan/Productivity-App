"use client"

import { createContext, useContext, useEffect } from "react"
import { useProfile, type Profile } from "@/hooks/useProfile"

type Ctx = {
  profile: Profile
  loading: boolean
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

const ProfileContext = createContext<Ctx>({
  profile: { display_name: null, timezone: 'auto', theme: 'light' },
  loading: true,
  updateProfile: async () => {},
})

export const useProfileContext = () => useContext(ProfileContext)

export default function ProfileProvider({
  userId,
  children,
}: {
  userId: string
  children: React.ReactNode
}) {
  const { profile, loading, updateProfile } = useProfile(userId)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', profile.theme === 'dark')
  }, [profile.theme])

  return (
    <ProfileContext.Provider value={{ profile, loading, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}
