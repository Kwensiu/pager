import React from 'react'
import { useStorage } from './useStorage'
import type { Settings } from '../../shared/types/store'
import { ExtensionIsolationLevel, ExtensionRiskLevel } from '../../shared/types/store'

const defaultSettings: Settings = {
  theme: 'light',
  language: 'zh',
  showDebugOptions: false,
  isAutoLaunch: false,
  isMenuVisible: true,
  isMemoryOptimizationEnabled: true,
  isOpenDevTools: false,
  isOpenZoom: true,
  isOpenContextMenu: true,
  leftMenuPosition: 'left',
  howLinkOpenMethod: 'tuboshu',
  extensionSettings: {
    enableExtensions: true,
    autoLoadExtensions: true,
    defaultIsolationLevel: ExtensionIsolationLevel.STANDARD,
    defaultRiskTolerance: ExtensionRiskLevel.MEDIUM
  },
  enableJavaScript: true,
  allowPopups: true,
  sessionIsolationEnabled: false,
  crashReportingEnabled: true,
  saveSession: true,
  clearCacheOnExit: false,
  clearCacheOptions: {
    clearStorageData: false,
    clearAuthCache: false,
    clearSessionCache: true,
    clearDefaultSession: true
  },
  allowLocalFileAccess: false,
  quickResetWebsite: true,
  resetWebsiteConfirmDialog: true,
  autoCloseSettingsOnWebsiteClick: true,
  collapsedSidebarMode: 'all',
  autoCheckUpdates: true,
  minimizeToTray: true,
  windowAlwaysOnTop: false,
  windowMiniMode: false,
  trayEnabled: true,
  trayShowNotifications: true,
  memoryOptimizerEnabled: false,
  enableGarbageCollection: true,
  enableEmergencyCleanup: true,
  clearInactiveSessionCache: false,
  clearInactiveCookies: false,
  clearInactiveLocalStorage: false,
  proxyEnabled: false,
  proxyRules: '',
  proxySoftwareOnly: false,
  updateCheckInterval: 86400000,
  autoRestartOnCrash: true,
  shortcutsEnabled: true,
  shortcutAlwaysOnTop: 'CmdOrCtrl+Shift+T',
  shortcutMiniMode: 'CmdOrCtrl+Shift+M',
  memoryCleanInterval: 300000,
  maxInactiveTime: 1800000
}

export function useSettings(): {
  settings: Settings
  updateSettings: (newSettings: Partial<Settings>) => void
} {
  const [settings, setSettings] = useStorage<Settings>({
    key: 'settings',
    defaultValue: defaultSettings,
    storageType: 'localStorage'
  })

  const updateSettings = (newSettings: Partial<Settings>): void => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings }

      // 同步到主进程的 electron-store
      if (window.api?.store?.updateSettings) {
        window.api.store.updateSettings(updated).catch((error) => {
          console.error('Failed to sync settings to main process:', error)
        })
      }

      return updated
    })
  }

  // 初始化时从主进程加载设置
  React.useEffect(() => {
    const loadSettingsFromMainProcess = async (): Promise<void> => {
      if (window.api?.store?.getSettings) {
        try {
          const mainProcessSettings = await window.api.store.getSettings()
          if (mainProcessSettings) {
            // 只在localStorage为空或主进程有更新时才合并设置
            const localSettings = localStorage.getItem('settings')
            const localSettingsParsed = localSettings ? JSON.parse(localSettings) : null

            if (!localSettingsParsed) {
              // 如果localStorage为空，使用主进程设置
              const merged = { ...defaultSettings, ...mainProcessSettings }
              localStorage.setItem('settings', JSON.stringify(merged))
              setSettings(merged)
            }
          }
        } catch (error) {
          console.error('Failed to load settings from main process:', error)
        }
      }
    }

    loadSettingsFromMainProcess()
  }, [setSettings]) // 只在组件挂载时执行一次

  return { settings, updateSettings }
}
