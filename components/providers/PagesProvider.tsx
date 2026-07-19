"use client"

import { createContext, useContext } from "react"
import { usePages } from "@/hooks/usePages"
import { CustomPage, CustomPageMeta, PageType } from "@/lib/types"

type Ctx = {
  pages: CustomPageMeta[]
  loading: boolean
  fetchPages: () => Promise<void>
  createPage: (type?: PageType) => Promise<CustomPage | null>
  renamePage: (id: string, title: string) => Promise<void>
  deletePage: (id: string) => Promise<void>
  setPageIcon: (id: string, icon: string | null) => Promise<void>
}

const PagesContext = createContext<Ctx>({
  pages: [],
  loading: true,
  fetchPages: async () => {},
  createPage: async () => null,
  renamePage: async () => {},
  deletePage: async () => {},
  setPageIcon: async () => {},
})

export const usePagesContext = () => useContext(PagesContext)

export default function PagesProvider({ children }: { children: React.ReactNode }) {
  const value = usePages()
  return <PagesContext.Provider value={value}>{children}</PagesContext.Provider>
}
