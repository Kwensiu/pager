import { nativeTheme } from 'electron'

type ThemeMode = 'light' | 'dark' | 'system'

/**
 * 主题服务
 * 管理系统主题切换
 */
class ThemeService {
  private currentTheme: ThemeMode = 'system'
  private listeners: Array<(theme: ThemeMode) => void> = []

  constructor() {
    // 延迟初始化，不在构造函数中访问 nativeTheme
    setTimeout(() => {
      this.initialize()
    }, -1)
  }

  /**
   * 初始化主题服务
   */
  private initialize(): void {
    // 监听系统主题变化
    if (nativeTheme && nativeTheme.on) {
      nativeTheme.on('updated', () => {
        this.handleSystemThemeChange()
      })
    }

    // 设置初始主题
    this.currentTheme = this.getSystemTheme()
  }

  /**
   * 获取系统主题（只返回 light 或 dark，不含 system）
   */
  private getSystemTheme(): 'light' | 'dark' {
    if (nativeTheme && nativeTheme.shouldUseDarkColors !== undefined) {
      return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
    }
    // 默认返回浅色主题
    return 'light'
  }

  /**
   * 处理系统主题变化
   */
  private handleSystemThemeChange(): void {
    if (this.currentTheme === 'system') {
      this.notifyListeners()
    }
  }

  /**
   * 设置主题
   * @param theme 主题模式
   */
  setTheme(theme: ThemeMode): void {
    this.currentTheme = theme

    switch (theme) {
      case 'light':
        nativeTheme.themeSource = 'light'
        break
      case 'dark':
        nativeTheme.themeSource = 'dark'
        break
      case 'system':
        nativeTheme.themeSource = 'system'
        break
    }

    this.notifyListeners()
    console.log(`Theme changed to: ${theme}`)
  }

  /**
   * 获取当前主题
   */
  getCurrentTheme(): ThemeMode {
    return this.currentTheme
  }

  /**
   * 获取实际应用的主题（如果是 system 模式，返回实际的主题）
   */
  getAppliedTheme(): 'light' | 'dark' {
    if (this.currentTheme === 'system') {
      return this.getSystemTheme()
    }
    return this.currentTheme
  }

  /**
   * 切换主题
   * @returns 新的主题
   */
  toggleTheme(): ThemeMode {
    const themes: ThemeMode[] = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(this.currentTheme)
    const nextIndex = (currentIndex + 1) % themes.length
    const nextTheme = themes[nextIndex]

    this.setTheme(nextTheme)
    return nextTheme
  }

  /**
   * 注册主题变化监听器
   * @param listener 监听器函数
   * @returns 取消监听函数
   */
  onThemeChange(listener: (theme: ThemeMode) => void): () => void {
    this.listeners.push(listener)

    // 立即调用一次
    listener(this.getAppliedTheme())

    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    const appliedTheme = this.getAppliedTheme()
    this.listeners.forEach((listener) => {
      try {
        listener(appliedTheme)
      } catch (error) {
        console.error('Error in theme change listener:', error)
      }
    })
  }

  /**
   * 检查是否支持深色模式
   */
  isDarkModeSupported(): boolean {
    return true // Electron 始终支持深色模式
  }

  /**
   * 获取主题配置
   */
  getThemeConfig(): {
    current: ThemeMode
    applied: 'light' | 'dark'
    system: 'light' | 'dark'
    source: 'user' | 'system'
  } {
    return {
      current: this.currentTheme,
      applied: this.getAppliedTheme(),
      system: this.getSystemTheme(),
      source: this.currentTheme === 'system' ? 'system' : 'user'
    }
  }

  /**
   * 应用主题到 CSS 变量
   * @param webContents WebContents 实例
   */
  applyThemeToWebContents(webContents: Electron.WebContents): void {
    const theme = this.getAppliedTheme()
    const css = `
      :root {
        --theme-mode: ${theme};
        color-scheme: ${theme};
      }
    `

    webContents.insertCSS(css).catch((error) => {
      console.error('Failed to apply theme CSS:', error)
    })
  }

  /**
   * 获取主题相关的 CSS 变量
   */
  getThemeCSSVariables(): Record<string, string> {
    const theme = this.getAppliedTheme()

    const lightVariables = {
      '--background': '0 0% 100%',
      '--foreground': '222.2 84% 4.9%',
      '--card': '0 0% 100%',
      '--card-foreground': '222.2 84% 4.9%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '222.2 84% 4.9%',
      '--primary': '222.2 47.4% 11.2%',
      '--primary-foreground': '210 40% 98%',
      '--secondary': '210 40% 96.1%',
      '--secondary-foreground': '222.2 47.4% 11.2%',
      '--muted': '210 40% 96.1%',
      '--muted-foreground': '215.4 16.3% 46.9%',
      '--accent': '210 40% 96.1%',
      '--accent-foreground': '222.2 47.4% 11.2%',
      '--destructive': '0 84.2% 60.2%',
      '--destructive-foreground': '210 40% 98%',
      '--border': '214.3 31.8% 91.4%',
      '--input': '214.3 31.8% 91.4%',
      '--ring': '222.2 84% 4.9%',
      '--radius': '0.5rem'
    }

    const darkVariables = {
      '--background': '222.2 84% 4.9%',
      '--foreground': '210 40% 98%',
      '--card': '222.2 84% 4.9%',
      '--card-foreground': '210 40% 98%',
      '--popover': '222.2 84% 4.9%',
      '--popover-foreground': '210 40% 98%',
      '--primary': '210 40% 98%',
      '--primary-foreground': '222.2 47.4% 11.2%',
      '--secondary': '217.2 32.6% 17.5%',
      '--secondary-foreground': '210 40% 98%',
      '--muted': '217.2 32.6% 17.5%',
      '--muted-foreground': '215 20.2% 65.1%',
      '--accent': '217.2 32.6% 17.5%',
      '--accent-foreground': '210 40% 98%',
      '--destructive': '0 62.8% 30.6%',
      '--destructive-foreground': '210 40% 98%',
      '--border': '217.2 32.6% 17.5%',
      '--input': '217.2 32.6% 17.5%',
      '--ring': '212.7 26.8% 83.9%',
      '--radius': '0.5rem'
    }

    return theme === 'dark' ? darkVariables : lightVariables
  }

  /**
   * 获取主题切换的快捷键
   */
  getThemeShortcut(): string {
    return 'Ctrl+Shift+T'
  }

  /**
   * 保存主题配置
   * @param theme 主题模式
   */
  saveTheme(theme: ThemeMode): void {
    this.setTheme(theme)
    // 这里可以添加持久化存储逻辑
    console.log(`Theme saved: ${theme}`)
  }

  /**
   * 加载保存的主题
   * @param defaultTheme 默认主题
   */
  loadSavedTheme(defaultTheme: ThemeMode = 'system'): ThemeMode {
    // 这里可以从存储中加载主题
    // 暂时返回默认主题
    this.setTheme(defaultTheme)
    return defaultTheme
  }

  /**
   * 获取主题切换历史
   */
  getThemeHistory(): Array<{ theme: ThemeMode; timestamp: number }> {
    // 这里可以返回主题切换历史
    return [{ theme: this.currentTheme, timestamp: Date.now() }]
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.listeners = []
    nativeTheme.removeAllListeners()
  }
}

// 导出单例实例
export const themeService = new ThemeService()
