import { globalShortcut } from 'electron'
import type { Shortcut } from '../../shared/types/store'

/**
 * 全局快捷键服务
 * 管理应用内和全局快捷键的注册、注销和执行
 */
class ShortcutService {
  private shortcuts: Map<string, Shortcut> = new Map()
  private callbacks: Map<string, () => void> = new Map()

  /**
   * 注册快捷键
   * @param shortcut 快捷键配置
   * @param callback 快捷键触发时的回调函数
   * @returns 是否注册成功
   */
  register(shortcut: Shortcut, callback: () => void): boolean {
    if (!shortcut.isOpen || this.shortcuts.has(shortcut.cmd)) {
      return false
    }

    try {
      if (shortcut.isGlobal) {
        // 注册全局快捷键
        const success = globalShortcut.register(shortcut.cmd, callback)
        if (success) {
          this.shortcuts.set(shortcut.cmd, shortcut)
          this.callbacks.set(shortcut.cmd, callback)
          console.log(`Global shortcut registered: ${shortcut.cmd} (${shortcut.tag})`)
          return true
        }
      } else {
        // 应用内快捷键（通过 IPC 处理）
        this.shortcuts.set(shortcut.cmd, shortcut)
        this.callbacks.set(shortcut.cmd, callback)
        console.log(`App shortcut registered: ${shortcut.cmd} (${shortcut.tag})`)
        return true
      }
    } catch (error) {
      console.error(`Failed to register shortcut ${shortcut.cmd}:`, error)
    }

    return false
  }

  /**
   * 注销快捷键
   * @param cmd 快捷键命令字符串
   * @returns 是否注销成功
   */
  unregister(cmd: string): boolean {
    try {
      if (this.shortcuts.get(cmd)?.isGlobal) {
        globalShortcut.unregister(cmd)
      }

      this.shortcuts.delete(cmd)
      this.callbacks.delete(cmd)
      console.log(`Shortcut unregistered: ${cmd}`)
      return true
    } catch (error) {
      console.error(`Failed to unregister shortcut ${cmd}:`, error)
      return false
    }
  }

  /**
   * 注销所有快捷键
   */
  unregisterAll(): void {
    try {
      globalShortcut.unregisterAll()
      this.shortcuts.clear()
      this.callbacks.clear()
      console.log('All shortcuts unregistered')
    } catch (error) {
      console.error('Failed to unregister all shortcuts:', error)
    }
  }

  /**
   * 检查快捷键是否已注册
   * @param cmd 快捷键命令字符串
   */
  isRegistered(cmd: string): boolean {
    return this.shortcuts.has(cmd)
  }

  /**
   * 获取所有已注册的快捷键
   */
  getAllShortcuts(): Shortcut[] {
    return Array.from(this.shortcuts.values())
  }

  /**
   * 更新快捷键配置
   * @param shortcut 新的快捷键配置
   * @returns 是否更新成功
   */
  update(shortcut: Shortcut): boolean {
    const oldShortcut = this.shortcuts.get(shortcut.cmd)
    if (!oldShortcut) {
      return this.register(shortcut, this.callbacks.get(shortcut.cmd) || (() => {}))
    }

    // 如果快捷键命令发生变化，需要重新注册
    if (oldShortcut.cmd !== shortcut.cmd) {
      this.unregister(oldShortcut.cmd)
      return this.register(shortcut, this.callbacks.get(oldShortcut.cmd) || (() => {}))
    }

    // 更新配置
    this.shortcuts.set(shortcut.cmd, shortcut)
    return true
  }

  /**
   * 执行快捷键回调
   * @param cmd 快捷键命令字符串
   */
  execute(cmd: string): void {
    const callback = this.callbacks.get(cmd)
    if (callback) {
      try {
        callback()
      } catch (error) {
        console.error(`Error executing shortcut ${cmd}:`, error)
      }
    }
  }

  /**
   * 验证快捷键命令格式
   * @param cmd 快捷键命令字符串
   */
  validateCommand(cmd: string): boolean {
    if (!cmd || typeof cmd !== 'string') return false

    // 基本格式验证
    const parts = cmd.split('+')
    if (parts.length < 2) return false

    // 检查修饰键
    const validModifiers = [
      'Command',
      'Cmd',
      'Control',
      'Ctrl',
      'CommandOrControl',
      'CmdOrCtrl',
      'Alt',
      'Option',
      'Shift'
    ]
    const modifiers = parts.slice(0, -1)

    for (const modifier of modifiers) {
      if (!validModifiers.includes(modifier)) return false
    }

    return true
  }

  /**
   * 获取默认快捷键配置
   */
  getDefaultShortcuts(): Shortcut[] {
    return [
      {
        id: 'toggle-window',
        name: 'softwareWindowVisibilityController',
        tag: '隐藏/显示 软件窗口',
        cmd: 'CommandOrControl+H',
        isGlobal: true,
        isOpen: true
      },
      {
        id: 'toggle-sidebar',
        name: 'isMenuVisible',
        tag: '隐藏/显示 侧边导航',
        cmd: 'CommandOrControl+B',
        isGlobal: false,
        isOpen: true
      },
      {
        id: 'open-settings',
        name: 'softwareSetting',
        tag: '打开设置',
        cmd: 'CommandOrControl+S',
        isGlobal: false,
        isOpen: true
      },
      {
        id: 'switch-website',
        name: 'softwareSiteSwitch',
        tag: '切换站点',
        cmd: 'CommandOrControl+Tab',
        isGlobal: false,
        isOpen: true
      },
      {
        id: 'toggle-always-on-top',
        name: 'windowTopmostToggle',
        tag: '取消/设置 窗口置顶',
        cmd: 'CommandOrControl+T',
        isGlobal: false,
        isOpen: true
      },
      {
        id: 'refresh-page',
        name: 'currentPageRefresher',
        tag: '刷新当前页面',
        cmd: 'CommandOrControl+R',
        isGlobal: false,
        isOpen: true
      },
      {
        id: 'copy-url',
        name: 'getCurrentPageUrl',
        tag: '获取当前页URL',
        cmd: 'CommandOrControl+Shift+L',
        isGlobal: false,
        isOpen: false
      },
      {
        id: 'minimize-window',
        name: 'windowMinimize',
        tag: '最小化窗口',
        cmd: 'CommandOrControl+[',
        isGlobal: false,
        isOpen: true
      },
      {
        id: 'maximize-window',
        name: 'windowMaximizer',
        tag: '最大化窗口',
        cmd: 'CommandOrControl+]',
        isGlobal: false,
        isOpen: true
      },
      {
        id: 'left-mini-window',
        name: 'leftScreenMiniWindow',
        tag: '屏幕左边小窗',
        cmd: 'CommandOrControl+Left',
        isGlobal: false,
        isOpen: true
      },
      {
        id: 'right-mini-window',
        name: 'rightScreenMiniWindow',
        tag: '屏幕右边小窗',
        cmd: 'CommandOrControl+Right',
        isGlobal: false,
        isOpen: true
      },
      {
        id: 'exit-app',
        name: 'softwareExit',
        tag: '退出软件',
        cmd: 'CommandOrControl+Q',
        isGlobal: true,
        isOpen: true
      }
    ]
  }
}

// 导出单例实例
export const shortcutService = new ShortcutService()
