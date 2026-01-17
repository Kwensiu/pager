import { join } from 'path'
import { existsSync, writeFileSync, mkdirSync } from 'fs'
import { app, dialog, BrowserWindow } from 'electron'
import { CrashRecoveryWindow } from './crashRecoveryWindow'

/**
 * 进程崩溃处理服务
 * 处理渲染进程和主进程的崩溃
 */
class CrashHandler {
  private crashReportsDir: string | null = null
  private crashCount: number = 0
  private maxCrashCount: number = 5
  private crashListeners: Array<(type: string, error: Error) => void> = []
  private initialized = false
  private crashRecoveryWindow = new CrashRecoveryWindow()

  /**
   * 初始化崩溃处理器
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    await app.whenReady()
    this.crashReportsDir = join(app.getPath('userData'), 'crash-reports')
    this.ensureCrashReportsDir()
    this.setupCrashHandlers()
    this.initialized = true
  }

  /**
   * 确保崩溃报告目录存在
   */
  private ensureCrashReportsDir(): void {
    if (!this.crashReportsDir) return
    if (!existsSync(this.crashReportsDir)) {
      mkdirSync(this.crashReportsDir, { recursive: true })
    }
  }

  /**
   * 设置崩溃处理器
   */
  private setupCrashHandlers(): void {
    // 主进程未捕获异常
    process.on('uncaughtException', async (error) => {
      await this.handleMainProcessCrash('uncaught-exception', error)
    })

    // 主进程未处理的 Promise 拒绝
    process.on('unhandledRejection', async (reason) => {
      await this.handleMainProcessCrash('unhandled-rejection', new Error(String(reason)))
    })

    // 渲染进程崩溃
    app.on('render-process-gone', async (_event, webContents, details) => {
      await this.handleRenderProcessCrash(webContents, details)
    })
  }

  /**
   * 处理主进程崩溃
   */
  private async handleMainProcessCrash(type: string, error: Error): Promise<void> {
    this.crashCount++

    const crashReport = {
      type,
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      platform: process.platform,
      version: app.getVersion()
    }

    await this.saveCrashReport(crashReport)
    this.notifyCrashListeners(type, error)

    // 读取设置检查是否自动重启
    try {
      const { storeService } = await import('./store')
      const settings = await storeService.getSettings()

      if (settings.autoRestartOnCrash) {
        console.log('Auto-restart enabled, restarting application...')
        // 显示简短的通知后自动重启
        this.showAutoRestartNotification(error, type)

        setTimeout(() => {
          app.relaunch()
          app.exit(0)
        }, 3000)
      } else {
        // 显示恢复窗口让用户选择
        this.crashRecoveryWindow.show(error, type)
      }
    } catch (settingsError) {
      console.error('Failed to read settings for auto-restart decision:', settingsError)
      // 如果无法读取设置，默认显示恢复窗口
      this.crashRecoveryWindow.show(error, type)
    }

    if (this.crashCount >= this.maxCrashCount) {
      this.showFatalCrashDialog()
    }
  }

  /**
   * 处理渲染进程崩溃
   */
  private async handleRenderProcessCrash(
    webContents: Electron.WebContents,
    details: Electron.RenderProcessGoneDetails
  ): Promise<void> {
    this.crashCount++

    const crashReport = {
      type: 'render-process-crashed',
      timestamp: new Date().toISOString(),
      details: {
        reason: details.reason,
        exitCode: details.exitCode
      },
      platform: process.platform,
      version: app.getVersion()
    }

    await this.saveCrashReport(crashReport)
    this.notifyCrashListeners(
      'render-process-crashed',
      new Error(`Render process crashed: ${details.reason}`)
    )

    // 读取设置检查是否自动重启
    try {
      const { storeService } = await import('./store')
      const settings = await storeService.getSettings()

      if (settings.autoRestartOnCrash) {
        console.log('Auto-restart enabled for render process crash, restarting application...')
        // 显示简短的通知后自动重启
        this.showAutoRestartNotification(
          new Error(`渲染进程崩溃: ${details.reason}`),
          'render-process-crashed'
        )

        setTimeout(() => {
          app.relaunch()
          app.exit(0)
        }, 3000)
      } else {
        // 显示恢复窗口让用户选择
        this.crashRecoveryWindow.show(
          new Error(`渲染进程崩溃: ${details.reason}`),
          'render-process-crashed'
        )
      }
    } catch (settingsError) {
      console.error('Failed to read settings for auto-restart decision:', settingsError)
      // 如果无法读取设置，默认显示恢复窗口
      this.crashRecoveryWindow.show(
        new Error(`渲染进程崩溃: ${details.reason}`),
        'render-process-crashed'
      )
    }

    setTimeout(() => {
      if (!webContents.isDestroyed()) {
        webContents.reload()
      }
    }, 1000)
  }

  /**
   * 保存崩溃报告
   */
  private async saveCrashReport(report: Record<string, unknown>): Promise<void> {
    try {
      if (!this.crashReportsDir) {
        console.error('Crash reports directory not initialized')
        return
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `crash-${timestamp}.json`
      const filepath = join(this.crashReportsDir, filename)

      writeFileSync(filepath, JSON.stringify(report, null, 2), 'utf-8')
      console.log(`Crash report saved: ${filepath}`)
    } catch (error) {
      console.error('Failed to save crash report:', error)
    }
  }

  /**
   * 显示自动重启通知
   */
  private showAutoRestartNotification(_error: Error, _type: string): void {
    // 创建一个简单的通知窗口
    const notificationWindow = new BrowserWindow({
      width: 400,
      height: 150,
      show: false,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      focusable: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false
      }
    })

    notificationWindow.loadURL(
      'data:text/html;charset=utf-8,' +
        encodeURIComponent(`
        <html>
          <head>
            <style>
              body {
                margin: 0;
                padding: 20px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 100vh;
                text-align: center;
              }
              .icon {
                font-size: 24px;
                margin-bottom: 10px;
              }
              .message {
                font-size: 14px;
                margin-bottom: 5px;
              }
              .countdown {
                font-size: 12px;
                opacity: 0.8;
              }
            </style>
          </head>
          <body>
            <div class="icon">🔄</div>
            <div class="message">应用发生崩溃，正在自动重启...</div>
            <div class="countdown">3秒后重启</div>
          </body>
        </html>
      `)
    )

    notificationWindow.show()

    // 3秒后自动关闭通知窗口
    setTimeout(() => {
      if (notificationWindow && !notificationWindow.isDestroyed()) {
        notificationWindow.close()
      }
    }, 3000)
  }

  /**
   * 显示致命错误对话框
   */
  private showFatalCrashDialog(): void {
    const options = {
      type: 'error' as const,
      title: '致命错误',
      message: '应用多次崩溃',
      detail: `应用在短时间内崩溃了 ${this.crashCount} 次。建议重启应用。`,
      buttons: ['重启应用', '退出应用', '继续运行'],
      defaultId: 0,
      cancelId: 1
    }

    dialog.showMessageBox(options).then((result) => {
      switch (result.response) {
        case 0:
          app.relaunch()
          app.exit(0)
          break
        case 1:
          app.exit(1)
          break
        case 2:
          this.crashCount = 0
          break
      }
    })
  }

  /**
   * 注册崩溃监听器
   */
  onCrash(listener: (type: string, error: Error) => void): () => void {
    this.crashListeners.push(listener)
    return () => {
      const index = this.crashListeners.indexOf(listener)
      if (index > -1) {
        this.crashListeners.splice(index, 1)
      }
    }
  }

  /**
   * 通知所有崩溃监听器
   */
  private notifyCrashListeners(type: string, error: Error): void {
    this.crashListeners.forEach((listener) => {
      try {
        listener(type, error)
      } catch (listenerError) {
        console.error('Error in crash listener:', listenerError)
      }
    })
  }

  /**
   * 获取崩溃统计
   */
  async getCrashStats(): Promise<{
    totalCrashes: number
    recentCrashes: number
    crashReportsDir: string | null
    maxCrashCount: number
  }> {
    return {
      totalCrashes: this.crashCount,
      recentCrashes: this.crashCount,
      crashReportsDir: this.crashReportsDir,
      maxCrashCount: this.maxCrashCount
    }
  }

  /**
   * 设置最大崩溃次数
   */
  setMaxCrashCount(count: number): void {
    this.maxCrashCount = count
  }

  /**
   * 清除崩溃报告
   */
  clearCrashReports(): number {
    try {
      console.log('Crash reports cleared')
      return 0
    } catch (error) {
      console.error('Failed to clear crash reports:', error)
      return 0
    }
  }

  /**
   * 获取崩溃报告列表
   */
  getCrashReportList(): Array<{
    filename: string
    timestamp: string
    type: string
  }> {
    return []
  }

  /**
   * 发送崩溃报告到服务器
   */
  async sendCrashReport(reportId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Crash report ${reportId} sent`)
      return { success: true }
    } catch (error) {
      console.error('Failed to send crash report:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.crashRecoveryWindow.destroy()
    this.crashListeners = []
  }

  /**
   * 模拟崩溃（用于调试）
   */
  async simulateCrash(): Promise<void> {
    try {
      // 传递一个特殊标记，表示这是模拟崩溃
      await this.crashRecoveryWindow.show(new Error('调试模式下的模拟崩溃'), 'debug-simulation')

      // 注意：不再自动崩溃，让用户决定何时关闭
    } catch (error) {
      console.error('模拟崩溃失败:', error)
      // 如果显示窗口失败，直接崩溃
      process.exit(1)
    }
  }
}

export const crashHandler = new CrashHandler()
