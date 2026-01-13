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
  // 新增字段 - tuboshu 功能
  jsCode?: string[] // 自定义 JS 代码注入
  proxy?: string // 代理设置
  partition?: string // Session 分区名称
  lastAccessTime?: number // 最后访问时间（用于内存优化）
  isOpen?: boolean // 是否在侧边栏中打开
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
  // 新增字段
  alwaysOnTop?: boolean
  minimized?: boolean
}

export interface Settings {
  theme: 'light' | 'dark' | 'system' // 新增 system 选项
  showDebugOptions: boolean
  // 新增字段 - tuboshu 功能
  isAutoLaunch?: boolean // 开机自启动
  isMenuVisible?: boolean // 侧边栏可见性
  isWindowEdgeAdsorption?: boolean // 窗口边缘吸附
  isMemoryOptimizationEnabled?: boolean // 内存优化
  isOpenDevTools?: boolean // 开发者工具
  isOpenZoom?: boolean // 缩放功能
  isOpenContextMenu?: boolean // 右键菜单
  leftMenuPosition?: 'left' | 'right' // 侧边栏位置
  howLinkOpenMethod?: 'tuboshu' | 'external' // 链接打开方式
}

export interface WebsiteOrderUpdate {
  secondaryGroupId: string
  websiteIds: string[]
}

// 快捷键配置
export interface Shortcut {
  id: string
  name: string
  tag: string
  cmd: string
  isGlobal: boolean
  isOpen: boolean
}

// 数据同步配置
export interface DataSyncConfig {
  lastExportTime?: number
  lastImportTime?: number
  exportPath?: string
}

// 浏览器指纹配置
export interface FingerprintConfig {
  userAgent?: string
  platform?: string
  languages?: string[]
  screenResolution?: string
  timezone?: string
}
