/**
 * 扩展信息接口
 */
export interface ExtensionInfo {
  /** 扩展 ID（由 Electron 分配） */
  id: string
  /** 扩展名称 */
  name: string
  /** 扩展版本 */
  version: string
  /** 扩展路径 */
  path: string
  /** 是否启用 */
  enabled: boolean
  /** 扩展 manifest 内容 */
  manifest?: ExtensionManifest
}

/**
 * 扩展 manifest 接口（简化版）
 */
export interface ExtensionManifest {
  name: string
  version: string
  manifest_version?: number
  description?: string
  permissions?: string[]
  host_permissions?: string[]
  content_scripts?: ContentScript[]
  background?: BackgroundConfig
  icons?: Record<string, string>
}

/**
 * 内容脚本配置
 */
export interface ContentScript {
  matches?: string[]
  js?: string[]
  css?: string[]
}

/**
 * 后台脚本配置
 */
export interface BackgroundConfig {
  service_worker?: string
  scripts?: string[]
  persistent?: boolean
}

/**
 * 扩展配置接口
 */
export interface ExtensionConfig {
  extensions: ExtensionInfo[]
}

/**
 * 扩展加载结果
 */
export interface ExtensionLoadResult {
  id: string
  name: string
  version: string
  path: string
  enabled: boolean
  manifest: ExtensionManifest
}
