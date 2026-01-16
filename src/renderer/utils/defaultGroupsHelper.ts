/**
 * 默认分组数据助手函数
 * 用于帮助管理 defaultGroups.json 文件中的数据
 */

import { PrimaryGroup } from '@/types/website'
import defaultGroupsData from '../data/defaultGroups.json'

/**
 * 获取默认分组数据
 */
export const getDefaultGroups = (): PrimaryGroup[] => {
  const now = Date.now()
  return defaultGroupsData.primaryGroups.map((pg) => ({
    ...pg,
    createdAt: now,
    updatedAt: now,
    websites: pg.websites.map((website, websiteIndex) => ({
      ...website,
      order: websiteIndex * 100, // 添加order字段
      createdAt: now,
      updatedAt: now
    })), // 一级分类下的网站从JSON文件中读取
    secondaryGroups: pg.secondaryGroups.map((sg, index) => ({
      ...sg,
      order: index * 100, // 添加order字段
      primaryGroupId: pg.id, // 添加primaryGroupId字段
      createdAt: now,
      updatedAt: now,
      websites: sg.websites.map((website, websiteIndex) => ({
        ...website,
        order: websiteIndex * 100, // 添加order字段
        createdAt: now,
        updatedAt: now
      }))
    }))
  }))
}

/**
 * 检查分类是否已存在于默认数据中
 */
export const isCategoryInDefaultGroups = (categoryName: string): boolean => {
  return defaultGroupsData.primaryGroups.some((pg) => pg.name === categoryName)
}

/**
 * 检查某个分类中是否存在指定的二级分组
 */
export const isSecondaryGroupInDefaultCategory = (
  categoryName: string,
  groupName: string
): boolean => {
  const category = defaultGroupsData.primaryGroups.find((pg) => pg.name === categoryName)
  if (!category) return false

  return category.secondaryGroups.some((sg) => sg.name === groupName)
}

/**
 * 检查某个二级分组中是否存在指定的网站
 */
export const isWebsiteInDefaultSecondaryGroup = (
  categoryName: string,
  groupName: string,
  websiteUrl: string
): boolean => {
  const category = defaultGroupsData.primaryGroups.find((pg) => pg.name === categoryName)
  if (!category) return false

  const secondaryGroup = category.secondaryGroups.find((sg) => sg.name === groupName)
  if (!secondaryGroup) return false

  return secondaryGroup.websites.some((w) => w.url === websiteUrl)
}
