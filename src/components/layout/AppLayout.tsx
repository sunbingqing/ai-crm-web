import { Outlet, useLocation } from 'react-router-dom'
import { Activity, Bell, Command, Search, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { UserMenu } from './UserMenu'

const PAGE_META: Array<{ match: string; title: string; eyebrow: string }> = [
  { match: '/', title: '团队看板', eyebrow: '团队驾驶舱' },
  { match: '/assistant', title: 'AI 助手', eyebrow: '会话智能分析' },
  { match: '/workbench', title: '工作台', eyebrow: '日常风险处理' },
  { match: '/customer', title: '客户智能', eyebrow: '客户与线索视图' },
  { match: '/session-review', title: '会话复盘', eyebrow: '会话、意向与跟进' },
  { match: '/team-coaching', title: '团队辅导', eyebrow: '经理复盘视角' },
  { match: '/rule-settings', title: '规则设置', eyebrow: '评分与标签规则' },
  { match: '/member-settings', title: '成员设置', eyebrow: '组织与权限管理' },
  { match: '/seat-management', title: '坐席管理', eyebrow: '通话运营配置' },
]

function getPageMeta(pathname: string) {
  return PAGE_META.find((item) => item.match === pathname) ?? {
    title: '销售工作台',
    eyebrow: '运营视图',
  }
}

export function AppLayout() {
  const location = useLocation()
  const meta = getPageMeta(location.pathname)

  return (
    <SidebarProvider className="app-chrome h-svh overflow-hidden">
      <AppSidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="app-topbar z-20 flex h-14 shrink-0 items-center gap-3 px-3 sm:px-4">
          <SidebarTrigger aria-label="切换导航" />
          <div className="min-w-0">
            <p className="hidden text-[11px] font-semibold uppercase text-muted-foreground sm:block">
              {meta.eyebrow}
            </p>
            <h1 className="truncate text-sm font-semibold sm:text-base">{meta.title}</h1>
          </div>
          <div className="ml-auto hidden min-w-0 items-center gap-2 lg:flex">
            <div className="flex h-8 w-[300px] items-center gap-2 rounded-lg border border-border/80 bg-card px-2.5 text-sm text-muted-foreground">
              <Search className="size-4" />
              <span className="truncate">搜索成员、会话或客户</span>
              <span className="ml-auto flex items-center gap-1 rounded-md border bg-muted px-1.5 py-0.5 text-[10px]">
                <Command className="size-3" /> K
              </span>
            </div>
            <div className="flex h-8 items-center gap-2 rounded-lg border bg-card px-2.5 text-xs text-muted-foreground">
              <span className="status-dot" />
              团队实时信号
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1 lg:ml-0">
            <Button variant="ghost" size="icon-sm" aria-label="AI 快捷动作">
              <Sparkles className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="团队动态">
              <Activity className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="提醒">
              <Bell className="size-4" />
            </Button>
            <UserMenu />
          </div>
        </div>
        <div className="app-scroll">
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  )
}
