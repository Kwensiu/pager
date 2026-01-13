// 重新导出共享的统一类型定义
export type {
  Website,
  PrimaryGroup,
  SecondaryGroup,
  WindowState,
  Settings,
  WebsiteOrderUpdate
} from '@shared/types/store'

// 导入类型用于本地接口定义
import type { Website } from '@shared/types/store'

// Renderer 层特有的类型定义
export interface WebsiteGroup {
  id: string
  name: string
  websites: Website[]
  createdAt: number
  updatedAt: number
  expanded?: boolean
  category?: string
}

export interface WebViewState {
  currentWebsiteId: string | null
  isLoading: boolean
  url: string | null
}

export interface Route {
  path: string
  component: React.ComponentType
}
