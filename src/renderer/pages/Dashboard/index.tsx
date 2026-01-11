import { useState, useCallback, useEffect, useReducer } from 'react'
import { WebViewContainer } from '@/components/features/WebViewContainer'
import { Website } from '@/types/website'

interface DashboardProps {
  currentWebsite: Website | null
}

function Dashboard({ currentWebsite }: DashboardProps): React.ReactElement {
  const [isLoading, setIsLoading] = useState(false)

  // 使用 reducer 管理 openedWebsites 状态
  const openedWebsitesReducer = (
    state: Website[],
    action: { type: string; payload?: any }
  ): Website[] => {
    switch (action.type) {
      case 'ADD_IF_NOT_EXISTS':
        const website = action.payload.website
        if (!state.some((w) => w.url === website.url)) {
          return [...state, website]
        }
        return state
      default:
        return state
    }
  }

  const [openedWebsites, dispatch] = useReducer(openedWebsitesReducer, [])

  // 记录所有打开过的网站
  useEffect(() => {
    if (currentWebsite) {
      dispatch({ type: 'ADD_IF_NOT_EXISTS', payload: { website: currentWebsite } })
    }
  }, [currentWebsite])

  const handleRefresh = useCallback(() => {
    window.api.webview.reload()
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 1000)
  }, [])

  const handleGoBack = useCallback(() => {
    window.api.webview.goBack()
  }, [])

  const handleGoForward = useCallback(() => {
    window.api.webview.goForward()
  }, [])

  const handleOpenExternal = useCallback((url: string) => {
    // 使用window.open打开外部链接
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [])

  return (
    <div className="h-full w-full relative">
      {/* 渲染所有打开过的网站，但只显示当前选中的 */}
      {openedWebsites.map((website) => (
        <div
          key={website.url}
          className="absolute inset-0"
          style={{ display: currentWebsite?.url === website.url ? 'block' : 'none' }}
        >
          <WebViewContainer
            url={website.url}
            isLoading={isLoading}
            onRefresh={handleRefresh}
            onGoBack={handleGoBack}
            onGoForward={handleGoForward}
            onOpenExternal={() => handleOpenExternal(website.url)}
          />
        </div>
      ))}
    </div>
  )
}

export default Dashboard
