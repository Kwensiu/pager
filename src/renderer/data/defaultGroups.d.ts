declare module 'defaultGroups.json' {
  export interface DefaultWebsite {
    id: string
    name: string
    url: string
    icon?: string
    description?: string
  }

  export interface DefaultSecondaryGroup {
    id: string
    name: string
    websites: DefaultWebsite[]
  }

  export interface DefaultPrimaryGroup {
    id: string
    name: string
    websites: DefaultWebsite[]
    secondaryGroups: DefaultSecondaryGroup[]
  }

  export interface DefaultGroupsData {
    primaryGroups: DefaultPrimaryGroup[]
  }

  const data: DefaultGroupsData
  export default data
}
