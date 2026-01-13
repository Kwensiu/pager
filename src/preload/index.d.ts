import { ElectronAPI } from '@electron-toolkit/preload'
import type {
  PrimaryGroup,
  SecondaryGroup,
  Website,
  WindowState,
  Settings,
  WebsiteOrderUpdate
} from '../main/types/store'
import type { ExtensionInfo, ExtensionManifest } from '../main/extensions/types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      webview: {
        loadUrl: (url: string) => void
        hide: () => void
        getUrl: () => Promise<string | null>
        reload: () => void
        goBack: () => void
        goForward: () => void
      }
      window: {
        resize: () => void
        openDevTools: () => void
      }
      dialog: {
        openDirectory: (
          options?: Electron.OpenDialogOptions
        ) => Promise<{ canceled: boolean; filePaths: string[] }>
        openFile: (
          options?: Electron.OpenDialogOptions
        ) => Promise<{ canceled: boolean; filePaths: string[] }>
      }
      getFavicon: (url: string) => Promise<string | null>
      store: {
        // 主要分组相关
        getPrimaryGroups: () => Promise<PrimaryGroup[]>
        setPrimaryGroups: (groups: PrimaryGroup[]) => Promise<void>
        clearPrimaryGroups: () => Promise<void>
        addPrimaryGroup: (group: Partial<PrimaryGroup>) => Promise<PrimaryGroup>
        updatePrimaryGroup: (
          groupId: string,
          updates: Partial<PrimaryGroup>
        ) => Promise<PrimaryGroup | null>
        deletePrimaryGroup: (groupId: string) => Promise<void>

        // 次要分组相关
        addSecondaryGroup: (
          primaryGroupId: string,
          secondaryGroup: SecondaryGroup
        ) => Promise<SecondaryGroup>
        updateSecondaryGroup: (
          secondaryGroupId: string,
          updates: Partial<SecondaryGroup>
        ) => Promise<SecondaryGroup | null>
        deleteSecondaryGroup: (secondaryGroupId: string) => Promise<boolean>

        // 网站相关
        addWebsiteToPrimary: (primaryGroupId: string, website: Website) => Promise<Website>
        addWebsiteToSecondary: (secondaryGroupId: string, website: Website) => Promise<Website>
        updateWebsite: (websiteId: string, updates: Partial<Website>) => Promise<Website | null>
        deleteWebsite: (websiteId: string) => Promise<boolean>

        // 排序相关
        updateSecondaryGroupOrder: (
          primaryGroupId: string,
          secondaryGroupIds: string[]
        ) => Promise<void>
        updateWebsiteOrder: (secondaryGroupId: string, websiteIds: string[]) => Promise<void>
        batchUpdateWebsiteOrders: (updates: WebsiteOrderUpdate[]) => Promise<void>

        // 应用状态相关
        getLastActiveWebsiteId: () => Promise<string | null>
        setLastActiveWebsiteId: (websiteId: string | null) => Promise<void>

        // 窗口状态相关
        getWindowState: () => Promise<WindowState>
        setWindowState: (state: Partial<WindowState>) => Promise<void>

        // 设置相关
        getSettings: () => Promise<Settings>
        updateSettings: (updates: Partial<Settings>) => Promise<void>

        // 清除数据相关
        clearAll: () => Promise<void>
        resetToDefaults: (defaultGroups: PrimaryGroup[]) => Promise<void>
      }
      extension: {
        getAll: () => Promise<{ success: boolean; extensions: ExtensionInfo[]; error?: string }>
        add: (
          path: string
        ) => Promise<{ success: boolean; extension?: ExtensionInfo; error?: string }>
        remove: (id: string) => Promise<{ success: boolean; error?: string }>
        toggle: (id: string, enabled: boolean) => Promise<{ success: boolean; error?: string }>
        validate: (
          path: string
        ) => Promise<{ valid: boolean; error?: string; manifest?: ExtensionManifest }>
        getLoaded: () => Promise<{ success: boolean; loaded: ExtensionInfo[]; error?: string }>
        getSettings: () => Promise<{
          success: boolean
          settings: { enableExtensions: boolean; autoLoadExtensions: boolean }
          error?: string
        }>
        updateSettings: (settings: {
          enableExtensions?: boolean
          autoLoadExtensions?: boolean
        }) => Promise<{ success: boolean; error?: string }>
      }
    }
  }
}
