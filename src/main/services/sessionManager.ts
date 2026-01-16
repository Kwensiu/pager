import { app } from 'electron'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

interface SessionData {
  url: string
  title: string
  timestamp: number
  websiteId?: string
}

interface WebViewSession {
  sessions: SessionData[]
  lastSaved: number
}

/**
 * 会话管理服务
 * 负责保存和恢复 WebView 会话状态
 */
class SessionManager {
  private sessionFile: string
  private currentSession: WebViewSession
  private autoSaveTimer: NodeJS.Timeout | null = null

  constructor() {
    this.sessionFile = join(app.getPath('userData'), 'webview-sessions.json')
    this.currentSession = this.loadSession()
  }

  /**
   * 加载保存的会话数据
   */
  private loadSession(): WebViewSession {
    try {
      if (existsSync(this.sessionFile)) {
        const data = readFileSync(this.sessionFile, 'utf8')
        return JSON.parse(data)
      }
    } catch (error) {
      console.error('Failed to load session data:', error)
    }

    return {
      sessions: [],
      lastSaved: Date.now()
    }
  }

  /**
   * 保存会话数据到文件
   */
  private saveSessionToFile(): void {
    try {
      this.currentSession.lastSaved = Date.now()
      writeFileSync(this.sessionFile, JSON.stringify(this.currentSession, null, 2))
    } catch (error) {
      console.error('Failed to save session data:', error)
    }
  }

  /**
   * 添加或更新 WebView 会话
   */
  public addOrUpdateSession(websiteId: string, url: string, title: string): void {
    const existingIndex = this.currentSession.sessions.findIndex((s) => s.websiteId === websiteId)

    const sessionData: SessionData = {
      url,
      title,
      timestamp: Date.now(),
      websiteId
    }

    if (existingIndex >= 0) {
      this.currentSession.sessions[existingIndex] = sessionData
    } else {
      this.currentSession.sessions.push(sessionData)
    }

    // 自动保存
    this.saveSessionToFile()
  }

  /**
   * 移除 WebView 会话
   */
  public removeSession(websiteId: string): void {
    this.currentSession.sessions = this.currentSession.sessions.filter(
      (s) => s.websiteId !== websiteId
    )
    this.saveSessionToFile()
  }

  /**
   * 获取所有保存的会话
   */
  public getAllSessions(): SessionData[] {
    return this.currentSession.sessions
  }

  /**
   * 获取特定网站的会话
   */
  public getSession(websiteId: string): SessionData | undefined {
    return this.currentSession.sessions.find((s) => s.websiteId === websiteId)
  }

  /**
   * 清除所有会话数据
   */
  public clearAllSessions(): void {
    this.currentSession = {
      sessions: [],
      lastSaved: Date.now()
    }
    this.saveSessionToFile()
  }

  /**
   * 启动自动保存（如果需要定期保存）
   */
  public startAutoSave(intervalMs: number = 30000): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
    }

    this.autoSaveTimer = setInterval(() => {
      this.saveSessionToFile()
    }, intervalMs)
  }

  /**
   * 停止自动保存
   */
  public stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = null
    }
  }

  /**
   * 获取会话统计信息
   */
  public getSessionStats(): { totalSessions: number; lastSaved: number } {
    return {
      totalSessions: this.currentSession.sessions.length,
      lastSaved: this.currentSession.lastSaved
    }
  }
}

// 导出单例实例
export const sessionManager = new SessionManager()
