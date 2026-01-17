import { BrowserWindow, app, shell } from 'electron'

/**
 * 崩溃恢复窗口
 * 显示错误信息并提供GitHub issue提交指引
 */
export class CrashRecoveryWindow {
  private window: BrowserWindow | null = null
  private isSimulation = false

  /**
   * 显示崩溃恢复窗口
   * @param error 错误信息
   * @param type 错误类型
   */
  show(error?: Error, type?: string): void {
    // 如果窗口已存在，先关闭
    if (this.window && !this.window.isDestroyed()) {
      this.window.close()
      this.window = null
    }

    // 检查是否是模拟崩溃
    this.isSimulation = type === 'debug-simulation'

    this.window = new BrowserWindow({
      width: 600,
      height: 550,
      show: false,
      resizable: true,
      movable: true,
      minimizable: true, // 允许最小化
      maximizable: false,
      fullscreenable: false,
      skipTaskbar: false, // 显示在任务栏
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      focusable: false, // 不自动获取焦点
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false, // 改为 false 以支持 clipboard API
        preload: undefined // 确保没有预加载脚本
      }
    })

    // 生成错误信息
    const errorData = this.generateErrorData(error, type)

    this.window.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(this.getHtmlContent(errorData))}`
    )

    this.window.center()
    this.window.showInactive() // 显示但不激活

    // 如果是模拟崩溃，设置窗口关闭时的行为
    if (this.isSimulation) {
      // 监听导航事件来区分重启和退出
      this.window.webContents.on('will-navigate', (event, url) => {
        if (url === 'app://restart') {
          event.preventDefault()
          app.relaunch()
          app.exit(0)
        } else if (url === 'app://exit') {
          event.preventDefault()
          app.exit(0)
        } else if (url === 'app://open-github') {
          event.preventDefault()
          // 使用外部浏览器打开GitHub
          shell.openExternal('https://github.com/Kwensiu/pager/issues')
        }
      })

      this.window.on('closed', () => {
        app.exit(0)
      })
    }
  }

  /**
   * 隐藏窗口
   */
  hide(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.hide()
    }
  }

  /**
   * 销毁窗口
   */
  destroy(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.close()
      this.window = null
    }
  }

  /**
   * 生成错误数据
   */
  private generateErrorData(
    error?: Error,
    type?: string
  ): {
    error: string
    type: string
    timestamp: string
    stack: string
    appVersion: string
    platform: string
    arch: string
    electronVersion: string
    nodeVersion: string
    chromeVersion: string
  } {
    return {
      error: error?.message || String(error) || '未知错误',
      type: type || 'UnknownError',
      timestamp: new Date().toISOString(),
      stack: error?.stack || '',
      appVersion: app.getVersion(),
      platform: process.platform,
      arch: process.arch,
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      chromeVersion: process.versions.chrome
    }
  }

  /**
   * 获取HTML内容
   */
  private getHtmlContent(errorData: ReturnType<CrashRecoveryWindow['generateErrorData']>): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pager - 崩溃恢复</title>
        <style>
          * {
            box-sizing: border-box;
          }
          
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, rgba(249, 250, 251, 0.95) 0%, rgba(243, 244, 246, 0.95) 100%);
            border-radius: 16px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            backdrop-filter: blur(10px);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            -webkit-app-region: drag; /* 使整个窗口可拖动 */
            user-select: none; /* 防止文字选择影响拖动 */
          }
          
          .container {
            width: 100%;
            max-width: 520px;
            padding: 32px;
            animation: fadeInUp 0.5s ease-out;
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .header {
            text-align: center;
            margin-bottom: 24px;
          }
          
          .icon {
            font-size: 64px;
            margin-bottom: 16px;
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          
          h1 {
            color: #dc2626;
            margin: 0 0 8px 0;
            font-size: 24px;
            font-weight: 700;
            line-height: 1.2;
          }
          
          .subtitle {
            color: #6b7280;
            margin: 0;
            font-size: 16px;
            line-height: 1.5;
          }
          
          .error-section {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 12px;
            padding: 20px;
            margin: 24px 0;
            animation: slideIn 0.6s ease-out 0.2s both;
          }
          
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-10px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          .error-header {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            font-weight: 600;
            color: #991b1b;
            font-size: 14px;
          }
          
          .error-content {
            background: #ffffff;
            border: 1px solid #fee2e2;
            border-radius: 8px;
            padding: 16px;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
            font-size: 12px;
            color: #7f1d1d;
            line-height: 1.4;
            word-break: break-all;
            white-space: pre-wrap;
            max-height: 200px;
            overflow-y: auto;
            -webkit-app-region: no-drag; /* 错误内容区域不可拖动 */
            user-select: text; /* 允许选择文字 */
          }
          
          .error-content::-webkit-scrollbar {
            width: 6px;
          }
          
          .error-content::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 3px;
          }
          
          .error-content::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;
          }
          
          .system-info {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            margin: 16px 0;
            animation: slideIn 0.6s ease-out 0.3s both;
          }
          
          .system-info h3 {
            margin: 0 0 12px 0;
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            font-size: 12px;
          }
          
          .info-item {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            border-bottom: 1px solid #f1f5f9;
          }
          
          .info-label {
            color: #6b7280;
            font-weight: 500;
          }
          
          .info-value {
            color: #374151;
            font-family: 'SF Mono', 'Monaco', monospace;
          }
          
          .actions {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 24px;
            animation: fadeInUp 0.6s ease-out 0.4s both;
          }
          
          .button-group {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
          }
          
          button {
            flex: 1;
            min-width: 120px;
            background: #3b82f6;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.2s ease;
            position: relative;
            overflow: hidden;
            -webkit-app-region: no-drag; /* 按钮不可拖动 */
            user-select: auto; /* 允许选择按钮文字 */
          }
          
          button:hover {
            background: #2563eb;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          }
          
          button:active {
            transform: translateY(0);
          }
          
          button.secondary {
            background: #6b7280;
          }
          
          button.secondary:hover {
            background: #4b5563;
            box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
          }
          
          button.danger {
            background: #dc2626;
          }
          
          button.danger:hover {
            background: #b91c1c;
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
          }
          
          button.success {
            background: #10b981;
          }
          
          button.success:hover {
            background: #059669;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          }
          
          .github-section {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border: 1px solid #bae6fd;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            animation: slideIn 0.6s ease-out 0.5s both;
          }
          
          .github-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            font-weight: 600;
            color: #1e40af;
            font-size: 14px;
          }
          
          .github-content {
            font-size: 13px;
            color: #1e40af;
            line-height: 1.5;
          }
          
          .github-link {
            color: #1e40af;
            text-decoration: underline;
            word-break: break-all;
          }
          
          .github-link:hover {
            color: #1d4ed8;
          }
          
          .checklist {
            margin: 12px 0;
            padding-left: 20px;
          }
          
          .checklist li {
            margin: 4px 0;
            color: #1e40af;
          }
          
          .copy-feedback {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            opacity: 0;
            transform: translateY(-10px);
            transition: all 0.3s ease;
            z-index: 1000;
          }
          
          .copy-feedback.show {
            opacity: 1;
            transform: translateY(0);
          }
          
          @media (max-width: 480px) {
            .container {
              padding: 20px;
            }
            
            .info-grid {
              grid-template-columns: 1fr;
            }
            
            .button-group {
              flex-direction: column;
            }
            
            button {
              min-width: auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">🚨</div>
            <h1>应用遇到了问题</h1>
            <p class="subtitle">Pager 在运行过程中发生了意外错误</p>
          </div>
          
          <div class="error-section">
            <div class="error-header">
              <span>📋 错误详情</span>
            </div>
            <div class="error-content" id="errorContent">
              正在加载错误信息...
            </div>
          </div>
          
          <div class="system-info">
            <h3>💻 系统信息</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">应用版本:</span>
                <span class="info-value">${errorData.appVersion}</span>
              </div>
              <div class="info-item">
                <span class="info-label">错误类型:</span>
                <span class="info-value">${errorData.type}</span>
              </div>
              <div class="info-item">
                <span class="info-label">操作系统:</span>
                <span class="info-value">${errorData.platform}</span>
              </div>
              <div class="info-item">
                <span class="info-label">架构:</span>
                <span class="info-value">${errorData.arch}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Electron:</span>
                <span class="info-value">${errorData.electronVersion}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Node.js:</span>
                <span class="info-value">${errorData.nodeVersion}</span>
              </div>
            </div>
          </div>
          
          <div class="github-section">
            <div class="github-header">
              <span>🐙 提交 Issue 到 GitHub</span>
            </div>
            <div class="github-content">
              <p>
                <strong>仓库地址：</strong><br>
                <a href="https://github.com/Kwensiu/pager/issues" target="_blank" class="github-link">
                  https://github.com/Kwensiu/pager/issues
                </a>
              </p>
              <p><strong>提交时请包含：</strong></p>
              <ul class="checklist">
                <li>✅ 完整的错误信息（上方）</li>
                <li>📝 详细的操作步骤</li>
                <li>💻 系统环境信息</li>
                <li>🎯 预期行为 vs 实际行为</li>
              </ul>
            </div>
          </div>
          
          <div class="actions">
            <div class="button-group">
              <button onclick="copyAllInfo()" class="success">📋 复制完整信息</button>
              <button onclick="openGithub()" class="secondary">🐙 打开 GitHub</button>
            </div>
            <div class="button-group">
              <button onclick="reloadApp()" class="danger">${this.isSimulation ? '🔄 重启应用' : '🔄 重新加载应用'}</button>
              <button onclick="closeWindow()" class="secondary">${this.isSimulation ? '✖ 退出应用' : '✖ 关闭窗口'}</button>
            </div>
          </div>
        </div>
        
        <div class="copy-feedback" id="copyFeedback">
          ✅ 已复制到剪贴板
        </div>
        
        <script>
          const errorData = ${JSON.stringify(errorData, null, 2)};
          
          // 显示错误信息
          function displayErrorInfo() {
            const errorContent = document.getElementById('errorContent');
            const errorText = \`类型: \${errorData.type}\n时间: \${errorData.timestamp}\n错误: \${errorData.error}\`;
            const stackText = errorData.stack ? \`\n\n堆栈跟踪:\n\${errorData.stack}\` : '';
            errorContent.textContent = errorText + stackText;
          }
          
          // 复制所有信息
          function copyAllInfo() {
            const allInfo = \`Pager 应用错误报告
=====================

错误信息:
类型: \${errorData.type}
时间: \${errorData.timestamp}
错误: \${errorData.error}
\${errorData.stack ? \`堆栈跟踪:\n\${errorData.stack}\` : ''}

系统信息:
应用版本: \${errorData.appVersion}
操作系统: \${errorData.platform} (\${errorData.arch})
Electron: \${errorData.electronVersion}
Node.js: \${errorData.nodeVersion}
Chrome: \${errorData.chromeVersion}

请将此信息提交到: https://github.com/Kwensiu/pager/issues\`;
            
            // 优先尝试现代API
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(allInfo).then(() => {
                showCopyFeedback();
              }).catch(() => {
                fallbackCopy(allInfo);
              });
            } else {
              fallbackCopy(allInfo);
            }
          }
          
          // 降级复制方案
          function fallbackCopy(text) {
            try {
              const textarea = document.createElement('textarea');
              textarea.value = text;
              textarea.style.position = 'fixed';
              textarea.style.left = '-999999px';
              textarea.style.top = '-999999px';
              document.body.appendChild(textarea);
              textarea.focus();
              textarea.select();
              
              const successful = document.execCommand('copy');
              document.body.removeChild(textarea);
              
              if (successful) {
                showCopyFeedback();
              } else {
                alert('复制失败，请手动选择文本复制');
              }
            } catch (err) {
              console.error('复制过程中出错:', err);
              alert('复制失败，请手动选择文本复制');
            }
          }
          
          // 显示复制反馈
          function showCopyFeedback() {
            const feedback = document.getElementById('copyFeedback');
            feedback.classList.add('show');
            setTimeout(() => {
              feedback.classList.remove('show');
            }, 2000);
          }
          
          // 打开 GitHub
          function openGithub() {
            // 通过特殊URL通知主进程打开外部浏览器
            window.location.href = 'app://open-github';
          }
          
          // 重新加载应用
          function reloadApp() {
            if (${JSON.stringify(this.isSimulation)}) {
              // 模拟崩溃时，通过导航到特殊URL来重启应用
              window.location.href = 'app://restart';
            } else {
              // 真实崩溃时，重新加载当前窗口
              window.location.reload();
            }
          }
          
          // 关闭窗口
          function closeWindow() {
            if (${JSON.stringify(this.isSimulation)}) {
              // 模拟崩溃时，通过导航到特殊URL来退出应用
              window.location.href = 'app://exit';
            } else {
              // 真实崩溃时，只关闭窗口
              window.close();
            }
          }
          
          // 页面加载完成后显示错误信息
          document.addEventListener('DOMContentLoaded', () => {
            displayErrorInfo();
          });
        </script>
      </body>
      </html>
    `
  }
}
