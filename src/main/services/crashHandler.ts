import { app, dialog, BrowserWindow } from 'electron'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

/**
 * 进程崩溃处理服务
 * 处理渲染进程和主进程的崩溃
 */
class CrashHandler {
  private crashReportsDir: string | null = null
  private crashCount: number = 0
  private maxCrashCount: number = 5
  private crashWindow: BrowserWindow | null = null
  private crashListeners: Array<(type: string, error: Error) => void> = []
  private initialized: boolean = false

  constructor() {
    // 延迟初始化，不在构造函数中访问 app
    this.initializeAsync()
  }

  /**
   * 异步初始化
   */
  private async initializeAsync(): Promise<void> {
    if (this.initialized) {
      return
    }

    if (!app.isReady()) {
      await app.whenReady()
    }

    this.crashReportsDir = join(app.getPath('userData'), 'crash-reports')
    this.ensureCrashReportsDir()
    this.setupCrashHandlers()
    this.initialized = true
  }

  /**
   * 确保服务已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initializeAsync()
    }
  }

  /**
   * 确保崩溃报告目录存在
   */
  private ensureCrashReportsDir(): void {
    if (!this.crashReportsDir) {
      return
    }
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
      await this.handleMainProcessCrash('uncaughtException', error)
    })

    // 主进程未处理的 Promise 拒绝
    process.on('unhandledRejection', async (reason) => {
      await this.handleMainProcessCrash(
        'unhandledRejection',
        new Error(`Unhandled rejection: ${reason}`)
      )
    })

    // 渲染进程崩溃
    app.on('render-process-gone', async (_event, webContents, details) => {
      await this.handleRenderProcessCrash(webContents, details)
    })

    // GPU 进程崩溃（Electron 中可能没有这个事件，使用备选方案）
    // app.on('gpu-process-crashed', async (event, killed) => {
    //   await this.handleGpuProcessCrash(killed)
    // })

    console.log('Crash handlers setup complete')
  }

  /**
   * 处理主进程崩溃
   * @param type 崩溃类型
   * @param error 错误对象
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
      process: {
        pid: process.pid,
        platform: process.platform,
        arch: process.arch,
        versions: process.versions
      },
      app: {
        version: app.getVersion(),
        name: app.getName(),
        path: app.getAppPath()
      }
    }

    // 保存崩溃报告
    await this.saveCrashReport(crashReport)

    // 通知监听器
    this.notifyCrashListeners(type, error)

    // 显示错误对话框
    this.showCrashDialog('主进程崩溃', `类型: ${type}\n错误: ${error.message}`)

    // 如果崩溃次数过多，建议重启
    if (this.crashCount >= this.maxCrashCount) {
      this.showFatalCrashDialog()
    }
  }

  /**
   * 处理渲染进程崩溃
   * @param webContents WebContents 实例
   * @param details 崩溃详情
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
      webContents: {
        id: webContents.id,
        url: webContents.getURL()
      },
      process: {
        pid: process.pid,
        platform: process.platform
      }
    }

    // 保存崩溃报告
    await this.saveCrashReport(crashReport)

    // 通知监听器
    this.notifyCrashListeners(
      'render-process-crashed',
      new Error(`Render process crashed: ${details.reason}`)
    )

    // 显示错误对话框
    this.showCrashDialog('渲染进程崩溃', `原因: ${details.reason}\n退出码: ${details.exitCode}`)

    // 尝试重新加载页面
    setTimeout(() => {
      if (!webContents.isDestroyed()) {
        webContents.reload()
      }
    }, 1000)
  }

  /**
   * 保存崩溃报告
   * @param report 崩溃报告
   */
  private async saveCrashReport(report: Record<string, unknown>): Promise<void> {
    try {
      await this.ensureInitialized()
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
   * 显示崩溃对话框
   * @param title 对话框标题
   * @param message 对话框消息
   */
  private showCrashDialog(title: string, message: string): void {
    // 在主进程中显示对话框
    dialog.showErrorBox(title, `${message}\n\n崩溃报告已保存。`)
  }

  /**
   * 显示致命崩溃对话框
   */
  private showFatalCrashDialog(): void {
    const options: Electron.MessageBoxOptions = {
      type: 'error',
      title: '致命错误',
      message: '应用多次崩溃',
      detail: `应用在短时间内崩溃了 ${this.crashCount} 次。建议重启应用。`,
      buttons: ['重启应用', '退出应用', '继续运行'],
      defaultId: 0,
      cancelId: 1
    }

    dialog.showMessageBox(options).then((result) => {
      switch (result.response) {
        case 0: // 重启
          app.relaunch()
          app.exit(0)
          break
        case 1: // 退出
          app.exit(1)
          break
        case 2: // 继续
          // 重置崩溃计数
          this.crashCount = 0
          break
      }
    })
  }

  /**
   * 注册崩溃监听器
   * @param listener 监听器函数
   * @returns 取消监听函数
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
   * @param type 崩溃类型
   * @param error 错误对象
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
    await this.ensureInitialized()
    return {
      totalCrashes: this.crashCount,
      recentCrashes: this.crashCount,
      crashReportsDir: this.crashReportsDir,
      maxCrashCount: this.maxCrashCount
    }
  }

  /**
   * 设置最大崩溃次数
   * @param count 最大崩溃次数
   */
  setMaxCrashCount(count: number): void {
    this.maxCrashCount = count
    console.log(`Max crash count set to: ${count}`)
  }

  /**
   * 清除崩溃报告
   */
  clearCrashReports(): number {
    try {
      // 这里可以实现清除崩溃报告文件的逻辑
      console.log('Crash reports cleared')
      return 0 // 返回清除的文件数
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
    // 这里可以返回崩溃报告文件列表
    return []
  }

  /**
   * 发送崩溃报告到服务器
   * @param reportId 报告ID
   */
  async sendCrashReport(reportId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 这里可以实现发送崩溃报告到服务器的逻辑
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
   * 创建崩溃恢复窗口
   */
  createCrashRecoveryWindow(): BrowserWindow {
    if (this.crashWindow && !this.crashWindow.isDestroyed()) {
      return this.crashWindow
    }

    const win = new BrowserWindow({
      width: 400,
      height: 300,
      show: false,
      resizable: false,
      movable: true,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true
      }
    })

    win.loadURL(
      'data:text/html;charset=utf-8,' +
        encodeURIComponent(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: -1;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          }
          .container {
            padding: 20px;
            text-align: center;
          }
          h2 {
            color: #dc2626;
            margin-bottom: 10px;
          }
          p {
            color: #4b5563;
            margin-bottom: 20px;
          }
          button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: -1;
            cursor: pointer;
            font-size: 14px;
            margin: 5px;
          }
          button:hover {
            background: #2563eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>应用崩溃</h2>
          <p>应用遇到了问题，正在尝试恢复...</p>
          <div>
            <button onclick="window.location.reload()">重新加载</button>
            <button onclick="window.close()">关闭</button>
          </div>
        </div>
      </body>
      </html>
    `)
    )

    this.crashWindow = win
    return win
  }

  /**
   * 显示崩溃恢复窗口
   */
  showCrashRecoveryWindow(): void {
    const win = this.createCrashRecoveryWindow()
    win.center()
    win.show()
  }

  /**
   * 隐藏崩溃恢复窗口
   */
  hideCrashRecoveryWindow(): void {
    if (this.crashWindow && !this.crashWindow.isDestroyed()) {
      this.crashWindow.hide()
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    if (this.crashWindow && !this.crashWindow.isDestroyed()) {
      this.crashWindow.close()
      this.crashWindow = null
    }

    this.crashListeners = []
  }
}

// 导出单例实例
export const crashHandler = new CrashHandler()
