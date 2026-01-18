import { useState, useEffect } from 'react'
import SidebarLayout from '@/components/layout/SidebarLayout'
import Dashboard from '@/pages/Dashboard'
import { Website } from '@/types/website'
import { I18nProviderWrapper } from './core/i18n/I18nProvider'

function App(): JSX.Element {
  const [activeWebsiteId, setActiveWebsiteId] = useState<string | null>(null)

  // 极简主题应用
  useEffect(() => {
    const applyTheme = (): void => {
      const savedSettings = localStorage.getItem('settings')
      let theme = 'dark' // 默认深色

      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings)
          theme = parsed.theme || 'dark'
        } catch (error) {
          console.error('Failed to parse settings:', error)
        }
      }

      console.log('[App] Applying content theme:', theme)

      const root = document.documentElement

      // 完全清除 dark class
      root.classList.remove('dark')

      // 只处理深色模式
      if (theme === 'dark') {
        root.classList.add('dark')
      }
      // 浅色模式：什么都不做

      console.log('[App] Root classes:', root.className)
    }

    // 初始应用
    applyTheme()

    // 监听设置变化
    const handleStorageChange = (e: StorageEvent): void => {
      if (e.key === 'settings') {
        console.log('[App] Settings changed')
        applyTheme()
      }
    }

    // 监听主进程主题变化事件
    const handleThemeChanged = (...args: unknown[]): void => {
      const theme = args[0] as 'light' | 'dark'
      console.log('[App] Theme changed from main process:', theme)

      // 更新localStorage中的主题设置
      const savedSettings = localStorage.getItem('settings')
      let settings: Record<string, unknown> = {}

      if (savedSettings) {
        try {
          settings = JSON.parse(savedSettings)
        } catch (error) {
          console.error('Failed to parse settings:', error)
        }
      }

      settings.theme = theme
      localStorage.setItem('settings', JSON.stringify(settings))

      // 应用主题
      applyTheme()
    }

    window.addEventListener('storage', handleStorageChange)

    // 监听主进程的主题变化事件
    if (window.api?.ipcRenderer?.on) {
      window.api.ipcRenderer.on('theme-changed', handleThemeChanged)
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      if (window.api?.ipcRenderer?.removeAllListeners) {
        window.api.ipcRenderer.removeAllListeners('theme-changed')
      }
    }
  }, [])

  const handleWebsiteClick = (website: Website): void => {
    setActiveWebsiteId(website.id)
  }

  return (
    <I18nProviderWrapper>
      <SidebarLayout activeWebsiteId={activeWebsiteId} onWebsiteClick={handleWebsiteClick}>
        {(currentWebsite) => <Dashboard currentWebsite={currentWebsite} />}
      </SidebarLayout>
    </I18nProviderWrapper>
  )
}

export default App
