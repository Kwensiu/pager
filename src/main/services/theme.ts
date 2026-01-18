import { BrowserWindow } from 'electron'

type ThemeMode = 'light' | 'dark' // 删除 'system'

/**
 * 极简主题服务
 * 1. 只支持 light/dark 两种模式
 * 2. 主题仅在应用内部生效，不影响系统原生控件
 */
class ThemeService {
  private currentTheme: ThemeMode = 'dark' // 默认深色
  private mainWindow: BrowserWindow | null = null

  constructor() {
    // Initialize with system theme
  }

  /**
   * 设置主窗口引用
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  /**
   * 设置主题
   */
  setTheme(theme: ThemeMode): void {
    this.currentTheme = theme
    this.applyThemeToWindow()
  }

  /**
   * 应用主题到窗口
   */
  private applyThemeToWindow(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return
    }

    // 发送主题变化事件到渲染进程
    this.mainWindow.webContents.send('theme-changed', this.currentTheme)
    console.log(`Theme applied to window: ${this.currentTheme}`)
  }

  /**
   * 获取当前主题
   */
  getCurrentTheme(): ThemeMode {
    return this.currentTheme
  }

  /**
   * 获取实际应用的主题
   */
  getAppliedTheme(): 'light' | 'dark' {
    return this.currentTheme
  }

  /**
   * 切换主题
   */
  toggleTheme(): ThemeMode {
    const nextTheme = this.currentTheme === 'light' ? 'dark' : 'light'
    this.setTheme(nextTheme)
    return nextTheme
  }
}

// 导出单例实例
export const themeService = new ThemeService()
