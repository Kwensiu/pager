import React, { useContext } from 'react'

export interface SidebarLockContextType {
  isLocked: boolean
  toggleLock: () => void
}

export const SidebarLockContext = React.createContext<SidebarLockContextType | undefined>(undefined)

export function useSidebarLock(): SidebarLockContextType {
  const context = useContext(SidebarLockContext)
  if (context === undefined) {
    throw new Error('useSidebarLock must be used within a SidebarLockProvider')
  }
  return context
}
