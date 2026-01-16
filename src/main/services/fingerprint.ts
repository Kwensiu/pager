import os from 'os'
import { FingerprintGenerator } from 'fingerprint-generator'
import type { FingerprintConfig } from '../../shared/types/store'

/**
 * 指纹缓存接口
 */
interface CachedFingerprint {
  fingerprint: Record<string, unknown>
  headers: Record<string, string>
  timestamp: number
  expiresAt: number
}

/**
 * 浏览器指纹服务
 * 用于生成和伪装浏览器指纹，防止网站检测到 Electron 应用
 */
class FingerprintService {
  private generator: FingerprintGenerator
  private cache: Map<string, CachedFingerprint>
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000 // 24小时缓存

  constructor() {
    this.generator = new FingerprintGenerator()
    this.cache = new Map()
  }

  /**
   * 获取当前操作系统平台
   * @returns 标准化平台名称
   */
  private getPlatform(): 'windows' | 'macos' | 'linux' {
    const platform = os.platform()
    if (platform.toLowerCase().startsWith('win')) return 'windows'
    if (platform.toLowerCase().startsWith('darwin')) return 'macos'
    return 'linux'
  }

  /**
   * 生成随机屏幕分辨率
   * @returns 随机屏幕分辨率字符串
   */
  private getRandomScreenResolution(): string {
    const resolutions = [
      '1920x1080',
      '1920x1200',
      '2560x1440',
      '2560x1600',
      '3840x2160',
      '1366x768',
      '1440x900',
      '1600x900',
      '1680x1050',
      '2048x1152'
    ]
    return resolutions[Math.floor(Math.random() * resolutions.length)]
  }

  /**
   * 生成随机时区
   * @returns 随机时区字符串
   */
  private getRandomTimezone(): string {
    const timezones = [
      'Asia/Shanghai',
      'Asia/Hong_Kong',
      'Asia/Tokyo',
      'Asia/Seoul',
      'Asia/Singapore',
      'America/New_York',
      'America/Los_Angeles',
      'America/Chicago',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin'
    ]
    return timezones[Math.floor(Math.random() * timezones.length)]
  }

  /**
   * 生成随机语言列表
   * @returns 随机语言列表
   */
  private getRandomLanguages(): string[] {
    const languageSets = [
      ['zh-CN', 'zh', 'en-US', 'en'],
      ['zh-CN', 'zh', 'en'],
      ['zh-CN', 'zh'],
      ['en-US', 'en', 'zh-CN', 'zh'],
      ['en-US', 'en']
    ]
    return languageSets[Math.floor(Math.random() * languageSets.length)]
  }

  /**
   * 生成随机 Canvas 指纹噪声
   * @returns 随机噪声值
   */
  private getRandomCanvasNoise(): number {
    return Math.random() * 0.001
  }

  /**
   * 生成随机 WebGL 指纹参数
   * @returns WebGL 参数对象
   */
  private getRandomWebGLParams(): { vendor: string; renderer: string } {
    const vendors = [
      'Intel Inc.',
      'NVIDIA Corporation',
      'AMD',
      'Google Inc. (Intel)',
      'Google Inc. (NVIDIA)'
    ]
    const renderers = [
      'Intel(R) UHD Graphics 630',
      'NVIDIA GeForce RTX 3060',
      'AMD Radeon RX 580',
      'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0)',
      'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0)'
    ]
    return {
      vendor: vendors[Math.floor(Math.random() * vendors.length)],
      renderer: renderers[Math.floor(Math.random() * renderers.length)]
    }
  }

  /**
   * 生成随机音频指纹参数
   * @returns 音频参数对象
   */
  private getRandomAudioParams(): { context: string; sampleRate: number } {
    const contexts = ['webkitAudioContext', 'AudioContext']
    const sampleRates = [44100, 48000, 96000]
    return {
      context: contexts[Math.floor(Math.random() * contexts.length)],
      sampleRate: sampleRates[Math.floor(Math.random() * sampleRates.length)]
    }
  }

  /**
   * 生成缓存键
   * @param options 生成选项
   * @returns 缓存键
   */
  private getCacheKey(options?: Record<string, unknown>): string {
    const platform = this.getPlatform()
    return `${platform}-${JSON.stringify(options || {})}`
  }

  /**
   * 从缓存获取指纹
   * @param cacheKey 缓存键
   * @returns 缓存的指纹或 null
   */
  private getCachedFingerprint(cacheKey: string): CachedFingerprint | null {
    const cached = this.cache.get(cacheKey)
    if (!cached) return null

    // 检查是否过期
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(cacheKey)
      return null
    }

    return cached
  }

  /**
   * 缓存指纹
   * @param cacheKey 缓存键
   * @param fingerprint 指纹数据
   */
  private cacheFingerprint(
    cacheKey: string,
    fingerprint: { fingerprint: Record<string, unknown>; headers: Record<string, string> }
  ): void {
    const cached: CachedFingerprint = {
      ...fingerprint,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATION
    }
    this.cache.set(cacheKey, cached)
  }

  /**
   * 清理过期缓存
   */
  private cleanExpiredCache(): void {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 根据模式获取指纹生成参数
   * @param mode 指纹伪装模式
   * @returns 指纹生成参数
   */
  private getFingerprintParams(mode: 'basic' | 'balanced' | 'advanced'): {
    includeScreen: boolean
    includeTimezone: boolean
    includeLanguages: boolean
    includeCanvas: boolean
    includeWebGL: boolean
    includeAudio: boolean
    includeHardware: boolean
  } {
    switch (mode) {
      case 'basic':
        return {
          includeScreen: true,
          includeTimezone: true,
          includeLanguages: true,
          includeCanvas: false,
          includeWebGL: false,
          includeAudio: false,
          includeHardware: false
        }
      case 'balanced':
        return {
          includeScreen: true,
          includeTimezone: true,
          includeLanguages: true,
          includeCanvas: true,
          includeWebGL: false,
          includeAudio: false,
          includeHardware: true
        }
      case 'advanced':
        return {
          includeScreen: true,
          includeTimezone: true,
          includeLanguages: true,
          includeCanvas: true,
          includeWebGL: true,
          includeAudio: true,
          includeHardware: true
        }
      default:
        return this.getFingerprintParams('balanced')
    }
  }

  /**
   * 生成浏览器指纹
   * @param options 生成选项
   * @returns 包含指纹和请求头的对象
   */
  generateFingerprint(options?: Record<string, unknown>): {
    fingerprint: Record<string, unknown>
    headers: Record<string, string>
  } {
    // 清理过期缓存
    this.cleanExpiredCache()

    // 检查缓存
    const cacheKey = this.getCacheKey(options)
    const cached = this.getCachedFingerprint(cacheKey)
    if (cached) {
      console.log('Using cached fingerprint')
      return {
        fingerprint: cached.fingerprint,
        headers: cached.headers
      }
    }

    try {
      const { fingerprint, headers } = this.generator.getFingerprint({
        devices: ['desktop'],
        operatingSystems: [this.getPlatform()],
        browsers: ['chrome'],
        locales: ['zh-CN']
      })

      // 获取模式参数
      const mode = (options?.mode as 'basic' | 'balanced' | 'advanced') || 'balanced'
      const params = this.getFingerprintParams(mode)

      // 添加动态随机化参数
      const enhancedFingerprint: Record<string, unknown> = {
        ...fingerprint
      }

      // 根据模式添加不同的指纹参数
      if (params.includeScreen) {
        enhancedFingerprint.screenResolution = this.getRandomScreenResolution()
      }

      if (params.includeTimezone) {
        enhancedFingerprint.timezone = this.getRandomTimezone()
      }

      if (params.includeLanguages) {
        enhancedFingerprint.languages = this.getRandomLanguages()
      }

      if (params.includeCanvas) {
        enhancedFingerprint.canvasNoise = this.getRandomCanvasNoise()
      }

      if (params.includeWebGL) {
        enhancedFingerprint.webGL = this.getRandomWebGLParams()
      }

      if (params.includeAudio) {
        enhancedFingerprint.audio = this.getRandomAudioParams()
      }

      if (params.includeHardware) {
        enhancedFingerprint.hardwareConcurrency = Math.floor(Math.random() * 8) + 4 // 4-12 核
        enhancedFingerprint.deviceMemory = Math.floor(Math.random() * 8) + 4 // 4-12 GB
        enhancedFingerprint.maxTouchPoints = Math.floor(Math.random() * 2) // 0-1
        enhancedFingerprint.colorDepth = 24
        enhancedFingerprint.pixelRatio = Math.random() > 0.5 ? 1 : Math.random() > 0.5 ? 1.25 : 1.5
      }

      // 添加时间戳，使指纹每次都略有不同
      enhancedFingerprint.timestamp = Date.now()

      console.log(`Generated fingerprint with ${mode} mode, params:`, params)

      // 缓存指纹
      this.cacheFingerprint(cacheKey, { fingerprint: enhancedFingerprint, headers })

      return { fingerprint: enhancedFingerprint, headers }
    } catch (error) {
      console.error('Failed to generate fingerprint:', error)
      // 返回默认指纹作为回退
      return this.getDefaultFingerprint()
    }
  }

  /**
   * 获取默认指纹（生成失败时的回退）
   */
  private getDefaultFingerprint(): {
    fingerprint: Record<string, unknown>
    headers: Record<string, string>
  } {
    const platform = this.getPlatform()
    const userAgent =
      platform === 'windows'
        ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        : platform === 'macos'
          ? 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          : 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

    return {
      fingerprint: {
        userAgent,
        platform,
        languages: this.getRandomLanguages(),
        screenResolution: this.getRandomScreenResolution(),
        timezone: this.getRandomTimezone(),
        canvasNoise: this.getRandomCanvasNoise(),
        webGL: this.getRandomWebGLParams(),
        audio: this.getRandomAudioParams(),
        hardwareConcurrency: Math.floor(Math.random() * 8) + 4,
        deviceMemory: Math.floor(Math.random() * 8) + 4,
        maxTouchPoints: Math.floor(Math.random() * 2),
        colorDepth: 24,
        pixelRatio: Math.random() > 0.5 ? 1 : Math.random() > 0.5 ? 1.25 : 1.5,
        timestamp: Date.now()
      },
      headers: {
        'user-agent': userAgent,
        'sec-ch-ua': '"Chromium";v="120", "Google Chrome";v="120", "Not=A?Brand";v="99"',
        'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': `"${platform}"`
      }
    }
  }

  /**
   * 应用指纹到 WebContents
   * @param webContents Electron WebContents 对象
   * @param headers 请求头
   */
  applyFingerprintToWebContents(
    webContents: Electron.WebContents,
    headers: Record<string, string>
  ): void {
    const session = webContents.session

    // 修改请求头
    session.webRequest.onBeforeSendHeaders((details, callback) => {
      // 排除某些域名（如 Google）以免影响功能
      const excludedDomains = ['google.com', 'googleapis.com', 'gstatic.com']
      if (excludedDomains.some((domain) => details.url.toLowerCase().includes(domain))) {
        callback({ requestHeaders: details.requestHeaders })
        return
      }

      // 合并请求头
      const newHeaders = { ...details.requestHeaders }
      Object.keys(headers).forEach((key) => {
        if (headers[key]) {
          newHeaders[key] = headers[key]
        }
      })

      callback({ requestHeaders: newHeaders })
    })

    // 修改响应头（CSP 等）
    session.webRequest.onHeadersReceived((details, callback) => {
      const cspHeader = {
        name: 'content-security-policy',
        value: "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:"
      }

      // 为某些网站放宽 CSP
      const domainsToRelaxCSP = ['yuque.com', 'wx.mail.qq.com']
      if (domainsToRelaxCSP.some((domain) => details.url.toLowerCase().includes(domain))) {
        if (details.responseHeaders) {
          details.responseHeaders[cspHeader.name] = [cspHeader.value]
        }
      }

      callback({ responseHeaders: details.responseHeaders })
    })
  }

  /**
   * 获取指纹配置
   */
  getFingerprintConfig(): FingerprintConfig {
    const { fingerprint } = this.generateFingerprint()
    return {
      userAgent: fingerprint.userAgent as string,
      platform: fingerprint.platform as string,
      languages: fingerprint.languages as string[],
      screenResolution: fingerprint.screenResolution as string,
      timezone: fingerprint.timezone as string
    }
  }

  /**
   * 验证指纹是否有效
   */
  validateFingerprint(fingerprint: Record<string, unknown>): boolean {
    if (!fingerprint) return false
    if (!fingerprint.userAgent || typeof fingerprint.userAgent !== 'string') return false
    if (!fingerprint.platform || typeof fingerprint.platform !== 'string') return false
    return true
  }

  /**
   * 刷新指纹缓存
   * @param options 生成选项
   */
  refreshFingerprint(options?: Record<string, unknown>): void {
    const cacheKey = this.getCacheKey(options)
    this.cache.delete(cacheKey)
    console.log('Fingerprint cache refreshed for key:', cacheKey)
  }

  /**
   * 清除所有指纹缓存
   */
  clearAllCache(): void {
    this.cache.clear()
    console.log('All fingerprint cache cleared')
  }

  /**
   * 获取缓存统计信息
   * @returns 缓存统计
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// 导出单例实例
export const fingerprintService = new FingerprintService()
