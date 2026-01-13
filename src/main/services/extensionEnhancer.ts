import type { ExtensionInfo, ExtensionManifest } from '../extensions/types'

/**
 * 扩展增强服务
 * 提供扩展系统的增强功能
 */
class ExtensionEnhancer {
  private installedExtensions: Map<string, ExtensionInfo> = new Map()
  private extensionPermissions: Map<string, Set<string>> = new Map()
  private contentScriptCache: Map<
    string,
    Array<{ type: 'js' | 'css'; file: string; matches?: string[] }>
  > = new Map()

  /**
   * 初始化扩展增强服务
   */
  initialize(): void {
    console.log('Extension enhancer initialized')
  }

  /**
   * 注册扩展
   * @param extension 扩展信息
   */
  registerExtension(extension: ExtensionInfo): void {
    this.installedExtensions.set(extension.id, extension)

    // 解析权限
    if (extension.manifest?.permissions) {
      const permissions = new Set(extension.manifest.permissions)
      this.extensionPermissions.set(extension.id, permissions)
    }

    console.log(`Extension registered: ${extension.name} (${extension.id})`)
  }

  /**
   * 卸载扩展
   * @param extensionId 扩展ID
   */
  unregisterExtension(extensionId: string): void {
    const extension = this.installedExtensions.get(extensionId)
    if (extension) {
      this.installedExtensions.delete(extensionId)
      this.extensionPermissions.delete(extensionId)
      this.contentScriptCache.delete(extensionId)

      console.log(`Extension unregistered: ${extension.name} (${extensionId})`)
    }
  }

  /**
   * 启用扩展
   * @param extensionId 扩展ID
   */
  enableExtension(extensionId: string): boolean {
    const extension = this.installedExtensions.get(extensionId)
    if (!extension) {
      console.error(`Extension not found: ${extensionId}`)
      return false
    }

    extension.enabled = true
    this.installedExtensions.set(extensionId, extension)

    // 应用内容脚本
    this.applyContentScripts(extension)

    console.log(`Extension enabled: ${extension.name}`)
    return true
  }

  /**
   * 禁用扩展
   * @param extensionId 扩展ID
   */
  disableExtension(extensionId: string): boolean {
    const extension = this.installedExtensions.get(extensionId)
    if (!extension) {
      console.error(`Extension not found: ${extensionId}`)
      return false
    }

    extension.enabled = false
    this.installedExtensions.set(extensionId, extension)

    // 移除内容脚本
    this.removeContentScripts(extension)

    console.log(`Extension disabled: ${extension.name}`)
    return true
  }

  /**
   * 应用内容脚本
   * @param extension 扩展信息
   */
  private applyContentScripts(extension: ExtensionInfo): void {
    if (!extension.enabled || !extension.manifest?.content_scripts) {
      return
    }

    const contentScripts = extension.manifest.content_scripts
    const appliedScripts: Array<{ type: 'js' | 'css'; file: string; matches?: string[] }> = []

    contentScripts.forEach((script) => {
      if (script.js) {
        script.js.forEach((jsFile) => {
          try {
            // 这里可以实际注入 JavaScript
            // 暂时只是记录
            appliedScripts.push({
              type: 'js',
              file: jsFile,
              matches: script.matches
            })
          } catch (error) {
            console.error(`Failed to apply content script ${jsFile}:`, error)
          }
        })
      }

      if (script.css) {
        script.css.forEach((cssFile) => {
          try {
            // 这里可以实际注入 CSS
            // 暂时只是记录
            appliedScripts.push({
              type: 'css',
              file: cssFile,
              matches: script.matches
            })
          } catch (error) {
            console.error(`Failed to apply CSS ${cssFile}:`, error)
          }
        })
      }
    })

    this.contentScriptCache.set(extension.id, appliedScripts)
    console.log(`Content scripts applied for extension: ${extension.name}`)
  }

  /**
   * 移除内容脚本
   * @param extension 扩展信息
   */
  private removeContentScripts(extension: ExtensionInfo): void {
    this.contentScriptCache.delete(extension.id)
    console.log(`Content scripts removed for extension: ${extension.name}`)
  }

  /**
   * 检查扩展权限
   * @param extensionId 扩展ID
   * @param permission 权限名称
   */
  hasPermission(extensionId: string, permission: string): boolean {
    const permissions = this.extensionPermissions.get(extensionId)
    if (!permissions) {
      return false
    }

    return permissions.has(permission)
  }

  /**
   * 获取扩展权限列表
   * @param extensionId 扩展ID
   */
  getExtensionPermissions(extensionId: string): string[] {
    const permissions = this.extensionPermissions.get(extensionId)
    if (!permissions) {
      return []
    }

    return Array.from(permissions)
  }

  /**
   * 验证扩展 manifest
   * @param manifest 扩展 manifest
   */
  validateManifest(manifest: ExtensionManifest): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!manifest.name || manifest.name.trim().length === 0) {
      errors.push('Extension name is required')
    }

    if (!manifest.version || !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      errors.push('Version must be in format x.y.z')
    }

    if (manifest.permissions) {
      const validPermissions = [
        'tabs',
        'bookmarks',
        'history',
        'storage',
        'cookies',
        'webRequest',
        'webRequestBlocking',
        'downloads',
        'notifications',
        'contextMenus'
      ]

      manifest.permissions.forEach((permission) => {
        if (!validPermissions.includes(permission)) {
          errors.push(`Invalid permission: ${permission}`)
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 获取扩展统计信息
   */
  getExtensionStats(): {
    total: number
    enabled: number
    disabled: number
    withPermissions: number
    withContentScripts: number
  } {
    let enabledCount = 0
    let withPermissions = 0
    let withContentScripts = -1

    this.installedExtensions.forEach((extension) => {
      if (extension.enabled) {
        enabledCount++
      }

      if (extension.manifest?.permissions && extension.manifest.permissions.length > 0) {
        withPermissions++
      }

      if (extension.manifest?.content_scripts && extension.manifest.content_scripts.length > 0) {
        withContentScripts++
      }
    })

    return {
      total: this.installedExtensions.size,
      enabled: enabledCount,
      disabled: this.installedExtensions.size - enabledCount,
      withPermissions,
      withContentScripts
    }
  }

  /**
   * 搜索扩展
   * @param query 搜索查询
   */
  searchExtensions(query: string): ExtensionInfo[] {
    const results: ExtensionInfo[] = []
    const lowerQuery = query.toLowerCase()

    this.installedExtensions.forEach((extension) => {
      if (
        extension.name.toLowerCase().includes(lowerQuery) ||
        extension.id.toLowerCase().includes(lowerQuery) ||
        extension.manifest?.description?.toLowerCase().includes(lowerQuery)
      ) {
        results.push(extension)
      }
    })

    return results
  }

  /**
   * 按类别获取扩展
   */
  getExtensionsByCategory(): Record<string, ExtensionInfo[]> {
    const categories: Record<string, ExtensionInfo[]> = {
      productivity: [],
      developer: [],
      social: [],
      utility: [],
      other: []
    }

    this.installedExtensions.forEach((extension) => {
      const manifest = extension.manifest
      let category = 'other'

      if (manifest?.description) {
        const desc = manifest.description.toLowerCase()
        if (desc.includes('productivity') || desc.includes('效率')) {
          category = 'productivity'
        } else if (desc.includes('developer') || desc.includes('开发')) {
          category = 'developer'
        } else if (desc.includes('social') || desc.includes('社交')) {
          category = 'social'
        } else if (desc.includes('utility') || desc.includes('工具')) {
          category = 'utility'
        }
      }

      categories[category].push(extension)
    })

    return categories
  }

  /**
   * 导出扩展配置
   * @param extensionIds 扩展ID列表
   */
  exportExtensions(extensionIds: string[]): string {
    const extensions: ExtensionInfo[] = []

    extensionIds.forEach((id) => {
      const extension = this.installedExtensions.get(id)
      if (extension) {
        extensions.push(extension)
      }
    })

    return JSON.stringify(extensions, null, 2)
  }

  /**
   * 导入扩展配置
   * @param configJson 配置JSON字符串
   */
  importExtensions(configJson: string): { success: number; failure: number } {
    let successCount = 0
    let failureCount = 0

    try {
      const extensions: ExtensionInfo[] = JSON.parse(configJson)

      extensions.forEach((extension) => {
        try {
          this.registerExtension(extension)
          successCount++
        } catch (error) {
          console.error(`Failed to import extension ${extension.name}:`, error)
          failureCount++
        }
      })
    } catch (error) {
      console.error('Failed to parse extension config:', error)
      failureCount++
    }

    return { success: successCount, failure: failureCount }
  }

  /**
   * 检查扩展更新
   * @param extensionId 扩展ID
   */
  async checkForUpdate(extensionId: string): Promise<{
    hasUpdate: boolean
    currentVersion: string
    latestVersion?: string
    changelog?: string
  }> {
    const extension = this.installedExtensions.get(extensionId)
    if (!extension) {
      throw new Error(`Extension not found: ${extensionId}`)
    }

    // 这里可以实现实际的更新检查逻辑
    // 暂时返回没有更新
    return {
      hasUpdate: false,
      currentVersion: extension.version,
      latestVersion: extension.version
    }
  }

  /**
   * 批量操作扩展
   * @param extensionIds 扩展ID列表
   * @param action 操作 ('enable' | 'disable' | 'remove')
   */
  batchOperation(
    extensionIds: string[],
    action: 'enable' | 'disable' | 'remove'
  ): {
    success: number
    failure: number
  } {
    let successCount = 0
    let failureCount = 0

    extensionIds.forEach((id) => {
      try {
        switch (action) {
          case 'enable':
            if (this.enableExtension(id)) successCount++
            else failureCount++
            break
          case 'disable':
            if (this.disableExtension(id)) successCount++
            else failureCount++
            break
          case 'remove':
            this.unregisterExtension(id)
            successCount++
            break
        }
      } catch (error) {
        console.error(`Failed to ${action} extension ${id}:`, error)
        failureCount++
      }
    })

    return { success: successCount, failure: failureCount }
  }

  /**
   * 获取扩展推荐
   */
  getExtensionRecommendations(): Array<{
    id: string
    name: string
    description: string
    category: string
    icon?: string
  }> {
    // 返回一些推荐的扩展
    return [
      {
        id: 'adblock',
        name: 'AdBlock',
        description: 'Block ads and pop-ups',
        category: 'utility',
        icon: 'https://example.com/adblock-icon.png'
      },
      {
        id: 'password-manager',
        name: 'Password Manager',
        description: 'Secure password management',
        category: 'productivity',
        icon: 'https://example.com/password-icon.png'
      },
      {
        id: 'dark-reader',
        name: 'Dark Reader',
        description: 'Dark mode for every website',
        category: 'utility',
        icon: 'https://example.com/darkreader-icon.png'
      }
    ]
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.installedExtensions.clear()
    this.extensionPermissions.clear()
    this.contentScriptCache.clear()
  }
}

// 导出单例实例
export const extensionEnhancer = new ExtensionEnhancer()
