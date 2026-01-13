// 共享的 Store 数据类型定义
// 此文件被 main 和 renderer 层共享使用

export interface Website {
  id: string
  name: string
  url: string
  icon?: string
  favicon?: string
  description?: string
  order?: number
  createdAt?: number
  updatedAt?: number
}

export interface SecondaryGroup {
  id: string
  name: string
  websites: Website[]
  order?: number
  primaryGroupId?: string
  expanded?: boolean
  createdAt?: number
  updatedAt?: number
}

export interface PrimaryGroup {
  id: string
  name: string
  secondaryGroups: SecondaryGroup[]
  websites?: Website[]
  order?: number
  expanded?: boolean
  createdAt?: number
  updatedAt?: number
}

export interface WindowState {
  width: number
  height: number
  x: number | null
  y: number | null
  maximized: boolean
}

export interface Settings {
  theme: 'light' | 'dark'
  showDebugOptions: boolean
}

export interface WebsiteOrderUpdate {
  secondaryGroupId: string
  websiteIds: string[]
}
