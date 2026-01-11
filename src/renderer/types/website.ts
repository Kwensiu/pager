export interface Website {
  id: string
  name: string
  url: string
  icon?: string
  favicon?: string
  description?: string
  order: number
  createdAt: number
  updatedAt: number
}

export interface WebsiteGroup {
  id: string
  name: string
  websites: Website[]
  createdAt: number
  updatedAt: number
  expanded?: boolean
  category?: string
}

export interface PrimaryGroup {
  id: string
  name: string
  secondaryGroups: SecondaryGroup[]
  websites: Website[] // 直接在一级分类下的网站
  order?: number
  expanded?: boolean
  createdAt: number
  updatedAt: number
}

export interface SecondaryGroup {
  id: string
  name: string
  websites: Website[]
  order: number
  expanded?: boolean
  primaryGroupId: string
  createdAt: number
  updatedAt: number
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
