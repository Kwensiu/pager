import React, { useState, ReactNode } from 'react'
import { SidebarLockContext, SidebarLockContextType } from './SidebarLockContextValue'

interface SidebarLockProviderProps {
  children: ReactNode
}

const SIDEBAR_LOCK_KEY = 'sidebarLocked'

export function SidebarLockProvider({ children }: SidebarLockProviderProps): React.JSX.Element {
  // 从 localStorage 读取初始锁定状态
  const getInitialLockedState = (): boolean => {
    try {
      const saved = localStorage.getItem(SIDEBAR_LOCK_KEY)
      return saved ? JSON.parse(saved) : false
    } catch {
      return false
    }
  }

  const [isLocked, setIsLocked] = useState(getInitialLockedState)

  const toggleLock = (): void => {
    setIsLocked((prev) => {
      const newState = !prev
      // 保存到 localStorage
      localStorage.setItem(SIDEBAR_LOCK_KEY, JSON.stringify(newState))
      return newState
    })
  }

  const contextValue: SidebarLockContextType = {
    isLocked,
    toggleLock
  }

  return <SidebarLockContext.Provider value={contextValue}>{children}</SidebarLockContext.Provider>
}
