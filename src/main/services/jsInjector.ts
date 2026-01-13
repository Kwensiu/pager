import type { Website } from '../../shared/types/store'

/**
 * JS 代码注入服务
 * 管理网站的自定义 JavaScript 代码注入
 */
class JsInjectorService {
  private injectedWebsites: Map<string, string[]> = new Map() // websiteId -> jsCode[]

  /**
   * 注入 JS 代码到 WebContents
   * @param webContents Electron WebContents 对象
   * @param jsCode JS 代码数组
   * @param websiteId 网站ID（用于缓存）
   * @returns 是否注入成功
   */
  async injectJsCode(
    webContents: Electron.WebContents,
    jsCode: string[],
    websiteId?: string
  ): Promise<boolean> {
    if (!jsCode || jsCode.length === 0) {
      return false
    }

    try {
      // 准备注入的代码
      const injectionCode = this.wrapJsCode(jsCode)

      // 等待页面加载完成
      await webContents.executeJavaScript(injectionCode)

      // 缓存已注入的代码
      if (websiteId) {
        this.injectedWebsites.set(websiteId, jsCode)
      }

      console.log(`JS code injected ${websiteId ? `for website ${websiteId}` : ''}`)
      return true
    } catch (error) {
      console.error('Failed to inject JS code:', error)
      return false
    }
  }

  /**
   * 从网站配置注入 JS 代码
   * @param webContents Electron WebContents 对象
   * @param website 网站配置
   * @returns 是否注入成功
   */
  async injectJsCodeFromWebsite(
    webContents: Electron.WebContents,
    website: Website
  ): Promise<boolean> {
    if (!website.jsCode || website.jsCode.length === 0) {
      return false
    }

    return this.injectJsCode(webContents, website.jsCode, website.id)
  }

  /**
   * 包装 JS 代码，添加错误处理
   * @param jsCode JS 代码数组
   */
  private wrapJsCode(jsCode: string[]): string {
    return `(function() {
      try {
        ${jsCode.join('\n')}
        console.log('Custom JS code executed successfully');
      } catch (e) {
        console.error('Custom JS code execution failed:', e);
      }
    })();`
  }

  /**
   * 在 DOM 就绪时注入 JS 代码
   * @param webContents Electron WebContents 对象
   * @param jsCode JS 代码数组
   * @param websiteId 网站ID
   */
  injectOnDomReady(webContents: Electron.WebContents, jsCode: string[], websiteId?: string): void {
    const handler = async (): Promise<void> => {
      await this.injectJsCode(webContents, jsCode, websiteId)
    }

    webContents.on('dom-ready', handler)

    // 清理监听器
    const cleanup = (): void => {
      webContents.removeListener('dom-ready', handler)
    }

    // 页面导航时清理
    webContents.on('did-navigate', cleanup)
    webContents.on('did-navigate-in-page', cleanup)
  }

  /**
   * 从网站配置在 DOM 就绪时注入 JS 代码
   * @param webContents Electron WebContents 对象
   * @param website 网站配置
   */
  injectOnDomReadyFromWebsite(webContents: Electron.WebContents, website: Website): void {
    if (!website.jsCode || website.jsCode.length === 0) {
      return
    }

    this.injectOnDomReady(webContents, website.jsCode, website.id)
  }

  /**
   * 移除已注入的 JS 代码
   * @param websiteId 网站ID
   */
  removeInjectedCode(websiteId: string): void {
    this.injectedWebsites.delete(websiteId)
  }

  /**
   * 获取已注入 JS 代码的网站列表
   */
  getInjectedWebsites(): string[] {
    return Array.from(this.injectedWebsites.keys())
  }

  /**
   * 获取网站的注入代码
   * @param websiteId 网站ID
   */
  getWebsiteJsCode(websiteId: string): string[] | null {
    return this.injectedWebsites.get(websiteId) || null
  }

  /**
   * 验证 JS 代码安全性
   * @param jsCode JS 代码
   * @returns 验证结果
   */
  validateJsCode(jsCode: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!jsCode || typeof jsCode !== 'string') {
      errors.push('JS 代码必须是字符串')
      return { valid: false, errors }
    }

    if (jsCode.length > 10000) {
      errors.push('JS 代码过长（最大 10000 字符）')
    }

    // 检查危险代码模式
    const dangerousPatterns = [
      /eval\s*\(/i,
      /Function\s*\(/i,
      /setTimeout\s*\(/i,
      /setInterval\s*\(/i,
      /document\.write/i,
      /window\.open/i,
      /localStorage\.clear/i,
      /sessionStorage\.clear/i,
      /cookie\s*=/i,
      /XMLHttpRequest/i,
      /fetch\s*\(/i
    ]

    for (const pattern of dangerousPatterns) {
      if (pattern.test(jsCode)) {
        errors.push(`检测到可能危险的代码模式: ${pattern}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 清理所有注入的代码
   */
  clearAll(): void {
    this.injectedWebsites.clear()
  }

  /**
   * 获取注入统计
   */
  getInjectionStats(): {
    injectedWebsiteCount: number
    totalInjectionCount: number
  } {
    let totalCodeCount = 0
    for (const codes of this.injectedWebsites.values()) {
      totalCodeCount += codes.length
    }

    return {
      injectedWebsiteCount: this.injectedWebsites.size,
      totalInjectionCount: totalCodeCount
    }
  }

  /**
   * 预编译 JS 代码（添加源映射等）
   * @param jsCode JS 代码
   */
  precompileJsCode(jsCode: string): string {
    // 这里可以添加代码压缩、混淆等预处理
    // 目前只是简单返回原代码
    return jsCode.trim()
  }

  /**
   * 批量注入 JS 代码
   * @param webContents Electron WebContents 对象
   * @param websites 网站列表
   */
  async batchInjectJsCode(
    webContents: Electron.WebContents,
    websites: Website[]
  ): Promise<{ success: number; failure: number }> {
    let successCount = 0
    let failureCount = 0

    for (const website of websites) {
      if (website.jsCode && website.jsCode.length > 0) {
        const success = await this.injectJsCodeFromWebsite(webContents, website)
        if (success) {
          successCount++
        } else {
          failureCount++
        }
      }
    }

    return { success: successCount, failure: failureCount }
  }

  /**
   * 创建代码注入监听器
   * @param webContents Electron WebContents 对象
   * @param getWebsiteCallback 获取网站配置的回调函数
   */
  createInjectionListener(
    webContents: Electron.WebContents,
    getWebsiteCallback: () => Website | null
  ): () => void {
    const handler = async (): Promise<void> => {
      const website = getWebsiteCallback()
      if (website) {
        await this.injectJsCodeFromWebsite(webContents, website)
      }
    }

    webContents.on('dom-ready', handler)

    // 返回清理函数
    return (): void => {
      webContents.removeListener('dom-ready', handler)
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.clearAll()
  }
}

// 导出单例实例
export const jsInjectorService = new JsInjectorService()
