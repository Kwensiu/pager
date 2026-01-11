import ElectronStore from 'electron-store'

const Store = (ElectronStore as any).default || ElectronStore

const store = new Store({
  name: 'pager-store',
  encryptionKey: undefined, // 确保不加密，便于调试
  clearInvalidConfig: false,
  defaults: {
    primaryGroups: [],
    lastActiveWebsiteId: null,
    windowState: {
      width: 1200,
      height: 800,
      x: null,
      y: null,
      maximized: false
    },
    settings: {
      theme: 'light',
      showDebugOptions: false
    }
  }
})

// 打印存储路径以便调试
console.log('Store initialized, path:', store.path)

export const storeService = {
  // ===== 主要分组相关 =====

  // 获取所有主要分组
  getPrimaryGroups() {
    return store.get('primaryGroups', [])
  },

  // 保存所有主要分组
  setPrimaryGroups(groups: any[]) {
    store.set('primaryGroups', groups)
  },

  // 清除所有主要分组
  clearPrimaryGroups() {
    store.set('primaryGroups', [])
  },

  // 添加主要分组
  addPrimaryGroup(group: any) {
    const groups = this.getPrimaryGroups()
    groups.push(group)
    this.setPrimaryGroups(groups)
    return group
  },

  // 更新主要分组
  updatePrimaryGroup(groupId: string, updates: any) {
    const groups = this.getPrimaryGroups()
    const index = groups.findIndex((g) => g.id === groupId)
    if (index !== -1) {
      groups[index] = { ...groups[index], ...updates, updatedAt: Date.now() }
      this.setPrimaryGroups(groups)
      return groups[index]
    }
    return null
  },

  // 删除主要分组
  deletePrimaryGroup(groupId: string) {
    const groups = this.getPrimaryGroups().filter((g) => g.id !== groupId)
    this.setPrimaryGroups(groups)
  },

  // ===== 次要分组相关 =====

  // 添加次要分组到主要分组
  addSecondaryGroup(primaryGroupId: string, secondaryGroup: any) {
    const groups = this.getPrimaryGroups()
    const index = groups.findIndex((g) => g.id === primaryGroupId)

    if (index === -1) {
      throw new Error('Primary group not found')
    }

    groups[index].secondaryGroups.push(secondaryGroup)
    groups[index].updatedAt = Date.now()
    this.setPrimaryGroups(groups)
    return secondaryGroup
  },

  // 更新次要分组
  updateSecondaryGroup(secondaryGroupId: string, updates: any) {
    const groups = this.getPrimaryGroups()

    for (let i = 0; i < groups.length; i++) {
      const secondaryIndex = groups[i].secondaryGroups.findIndex(
        (sg: any) => sg.id === secondaryGroupId
      )
      if (secondaryIndex !== -1) {
        groups[i].secondaryGroups[secondaryIndex] = {
          ...groups[i].secondaryGroups[secondaryIndex],
          ...updates,
          updatedAt: Date.now()
        }
        groups[i].updatedAt = Date.now()
        this.setPrimaryGroups(groups)
        return groups[i].secondaryGroups[secondaryIndex]
      }
    }

    return null
  },

  // 删除次要分组
  deleteSecondaryGroup(secondaryGroupId: string) {
    const groups = this.getPrimaryGroups()

    for (let i = 0; i < groups.length; i++) {
      const secondaryIndex = groups[i].secondaryGroups.findIndex(
        (sg: any) => sg.id === secondaryGroupId
      )
      if (secondaryIndex !== -1) {
        groups[i].secondaryGroups.splice(secondaryIndex, 1)
        groups[i].updatedAt = Date.now()
        this.setPrimaryGroups(groups)
        return true
      }
    }

    return false
  },

  // ===== 网站相关 =====

  // 在主要分组中添加网站
  addWebsiteToPrimaryGroup(primaryGroupId: string, website: any) {
    const groups = this.getPrimaryGroups()
    const index = groups.findIndex((g) => g.id === primaryGroupId)

    if (index === -1) {
      throw new Error('Primary group not found')
    }

    if (!groups[index].websites) {
      groups[index].websites = []
    }

    groups[index].websites.push(website)
    groups[index].updatedAt = Date.now()
    this.setPrimaryGroups(groups)
    return website
  },

  // 在次要分组中添加网站
  addWebsiteToSecondaryGroup(secondaryGroupId: string, website: any) {
    const groups = this.getPrimaryGroups()

    for (let i = 0; i < groups.length; i++) {
      const secondaryIndex = groups[i].secondaryGroups.findIndex(
        (sg: any) => sg.id === secondaryGroupId
      )
      if (secondaryIndex !== -1) {
        groups[i].secondaryGroups[secondaryIndex].websites.push(website)
        groups[i].secondaryGroups[secondaryIndex].updatedAt = Date.now()
        groups[i].updatedAt = Date.now()
        this.setPrimaryGroups(groups)
        return website
      }
    }

    throw new Error('Secondary group not found')
  },

  // 更新网站
  updateWebsite(websiteId: string, updates: any) {
    const groups = this.getPrimaryGroups()

    // 搜索主要分组中的网站
    for (let i = 0; i < groups.length; i++) {
      if (groups[i].websites) {
        const websiteIndex = groups[i].websites.findIndex((w: any) => w.id === websiteId)
        if (websiteIndex !== -1) {
          groups[i].websites[websiteIndex] = {
            ...groups[i].websites[websiteIndex],
            ...updates,
            updatedAt: Date.now()
          }
          groups[i].updatedAt = Date.now()
          this.setPrimaryGroups(groups)
          return groups[i].websites[websiteIndex]
        }
      }

      // 搜索次要分组中的网站
      for (let j = 0; j < groups[i].secondaryGroups.length; j++) {
        const websiteIndex = groups[i].secondaryGroups[j].websites.findIndex(
          (w: any) => w.id === websiteId
        )
        if (websiteIndex !== -1) {
          groups[i].secondaryGroups[j].websites[websiteIndex] = {
            ...groups[i].secondaryGroups[j].websites[websiteIndex],
            ...updates,
            updatedAt: Date.now()
          }
          groups[i].secondaryGroups[j].updatedAt = Date.now()
          groups[i].updatedAt = Date.now()
          this.setPrimaryGroups(groups)
          return groups[i].secondaryGroups[j].websites[websiteIndex]
        }
      }
    }

    return null
  },

  // 删除网站
  deleteWebsite(websiteId: string) {
    const groups = this.getPrimaryGroups()

    for (let i = 0; i < groups.length; i++) {
      // 删除主要分组中的网站
      if (groups[i].websites) {
        const websiteIndex = groups[i].websites.findIndex((w: any) => w.id === websiteId)
        if (websiteIndex !== -1) {
          groups[i].websites.splice(websiteIndex, 1)
          groups[i].updatedAt = Date.now()
          this.setPrimaryGroups(groups)
          return true
        }
      }

      // 删除次要分组中的网站
      for (let j = 0; j < groups[i].secondaryGroups.length; j++) {
        const websiteIndex = groups[i].secondaryGroups[j].websites.findIndex(
          (w: any) => w.id === websiteId
        )
        if (websiteIndex !== -1) {
          groups[i].secondaryGroups[j].websites.splice(websiteIndex, 1)
          groups[i].secondaryGroups[j].updatedAt = Date.now()
          groups[i].updatedAt = Date.now()
          this.setPrimaryGroups(groups)
          return true
        }
      }
    }

    return false
  },

  // ===== 排序相关 =====

  // 更新二级分组排序
  updateSecondaryGroupOrder(primaryGroupId: string, secondaryGroupIds: string[]) {
    const groups = this.getPrimaryGroups()
    const index = groups.findIndex((g) => g.id === primaryGroupId)

    if (index === -1) {
      throw new Error('Primary group not found')
    }

    const sortedSecondaryGroups = secondaryGroupIds.map((id, index) => {
      const group = groups[index].secondaryGroups.find((sg: any) => sg.id === id)
      if (!group) {
        throw new Error(`Secondary group ${id} not found`)
      }
      return { ...group, order: index * 100, updatedAt: Date.now() }
    })

    groups[index].secondaryGroups = sortedSecondaryGroups
    groups[index].updatedAt = Date.now()
    this.setPrimaryGroups(groups)
  },

  // 更新网站排序
  updateWebsiteOrder(secondaryGroupId: string, websiteIds: string[]) {
    const groups = this.getPrimaryGroups()

    for (let i = 0; i < groups.length; i++) {
      const secondaryIndex = groups[i].secondaryGroups.findIndex(
        (sg: any) => sg.id === secondaryGroupId
      )
      if (secondaryIndex !== -1) {
        const sortedWebsites = websiteIds.map((id, index) => {
          const website = groups[i].secondaryGroups[secondaryIndex].websites.find(
            (w: any) => w.id === id
          )
          if (!website) {
            throw new Error(`Website ${id} not found`)
          }
          return { ...website, order: index * 100, updatedAt: Date.now() }
        })

        groups[i].secondaryGroups[secondaryIndex].websites = sortedWebsites
        groups[i].secondaryGroups[secondaryIndex].updatedAt = Date.now()
        groups[i].updatedAt = Date.now()
        this.setPrimaryGroups(groups)
        return
      }
    }

    throw new Error('Secondary group not found')
  },

  // 批量更新网站排序
  batchUpdateWebsiteOrders(updates: Array<{ secondaryGroupId: string; websiteIds: string[] }>) {
    const groups = this.getPrimaryGroups()

    updates.forEach(({ secondaryGroupId, websiteIds }) => {
      for (let i = 0; i < groups.length; i++) {
        const secondaryIndex = groups[i].secondaryGroups.findIndex(
          (sg: any) => sg.id === secondaryGroupId
        )
        if (secondaryIndex !== -1) {
          const sortedWebsites = websiteIds.map((id, index) => {
            const website = groups[i].secondaryGroups[secondaryIndex].websites.find(
              (w: any) => w.id === id
            )
            if (!website) {
              throw new Error(`Website ${id} not found`)
            }
            return { ...website, order: index * 100, updatedAt: Date.now() }
          })

          groups[i].secondaryGroups[secondaryIndex].websites = sortedWebsites
          groups[i].secondaryGroups[secondaryIndex].updatedAt = Date.now()
          groups[i].updatedAt = Date.now()
        }
      }
    })

    this.setPrimaryGroups(groups)
  },

  // ===== 应用状态相关 =====

  // 获取最后激活的网站ID
  getLastActiveWebsiteId() {
    return store.get('lastActiveWebsiteId', null)
  },

  // 设置最后激活的网站ID
  setLastActiveWebsiteId(websiteId: string | null) {
    store.set('lastActiveWebsiteId', websiteId)
  },

  // ===== 窗口状态相关 =====

  // 获取窗口状态
  getWindowState() {
    return store.get('windowState')
  },

  // 设置窗口状态
  setWindowState(state: any) {
    store.set('windowState', state)
  },

  // ===== 设置相关 =====

  // 获取设置
  getSettings() {
    return store.get('settings')
  },

  // 更新设置
  updateSettings(updates: any) {
    const settings = this.getSettings()
    store.set('settings', { ...settings, ...updates })
  },

  // ===== 清除数据相关 =====

  // 清除所有数据（恢复默认）
  clearAll() {
    store.clear()
  },

  // 重置为默认数据
  resetToDefaults(defaultGroups: any[]) {
    store.set('primaryGroups', defaultGroups)
  }
}

// 导出 store 实例以供直接访问
export { store }
