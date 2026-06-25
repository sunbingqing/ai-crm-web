/*
 * @Author: sunbingqing
 * @Date: 2026-05-27 19:09:56
 * @LastEditors: sunbingqing
 * @LastEditTime: 2026-06-18 15:34:54
 * @Description: 
 * @Copyright: ©2021 杭州杰竞科技有限公司 版权所有
 */
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Bot,
  BrainCircuit,
  Building2,
  ClipboardCheck,
  Gauge,
  Headset,
  Landmark,
  Settings2,
  ShieldCheck,
  Sparkles,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { getOrgInfo } from '@/services/auth'

interface NavItem {
  title: string
  path: string
  icon: LucideIcon
  adminOnly?: boolean
  badge?: string
}

const commandNav: NavItem[] = [
  { title: '团队看板', path: '/', icon: Gauge, adminOnly: true, badge: '实时' },
  { title: 'AI 助手', path: '/assistant', icon: Bot, adminOnly: true },
  { title: '工作台', path: '/workbench', icon: ClipboardCheck, adminOnly: true },
  { title: '客户智能', path: '/customer', icon: Building2 },
  { title: '会话复盘', path: '/session-review', icon: BrainCircuit },
  { title: '团队辅导', path: '/team-coaching', icon: UsersRound, adminOnly: true },
]

const adminNav: NavItem[] = [
  { title: '规则设置', path: '/rule-settings', icon: Settings2, adminOnly: true },
  { title: '成员设置', path: '/member-settings', icon: ShieldCheck, adminOnly: true },
]

const seatNavItem: NavItem = {
  title: '坐席管理',
  path: '/seat-management',
  icon: Headset,
}

export function AppSidebar() {
  const location = useLocation()
  const { orgId, userType } = useAuth()
  const isAdmin = userType === 1
  const { data: orgInfo } = useQuery({
    queryKey: ['orgInfo', orgId],
    queryFn: () => getOrgInfo(orgId!),
    enabled: !!orgId,
    staleTime: Infinity,
  })
  const showSeatManagement = isAdmin && orgInfo?.services?.includes('WH_800_CALL')

  const commandItems = isAdmin ? commandNav : commandNav.filter((item) => !item.adminOnly)
  const adminItems = showSeatManagement
    ? [...adminNav.filter((item) => isAdmin || !item.adminOnly), seatNavItem]
    : adminNav.filter((item) => isAdmin || !item.adminOnly)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="brand-mark">
            <Landmark className="size-4" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold">AI 销售助手</p>
            <p className="truncate text-xs text-sidebar-foreground/55">
              {isAdmin ? '团队运营驾驶舱' : '销售工作区'}
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-3">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel>导航</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMenu items={commandItems} pathname={location.pathname} />
          </SidebarGroupContent>
        </SidebarGroup>
        {adminItems.length > 0 && (
          <SidebarGroup className="mt-4 p-0">
            <SidebarGroupLabel>管理</SidebarGroupLabel>
            <SidebarGroupContent>
              <NavMenu items={adminItems} pathname={location.pathname} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3 group-data-[collapsible=icon]:hidden">
        <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/55 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-sidebar-foreground">
            <Sparkles className="size-3.5" />
            AI 团队简报
          </div>
          <p className="mt-2 text-xs leading-5 text-sidebar-foreground/62">
            2 名成员响应时长明显变慢，赵六本周客户回复率最高。
          </p>
          <div className="mt-3 stage-bar bg-white/10">
            <div className="h-full w-[78%] rounded-full bg-white" />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

function NavMenu({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <SidebarMenu className="gap-1">
      {items.map((item) => {
        const Icon = item.icon
        const isActive = item.path === '/'
          ? pathname === '/'
          : pathname === item.path || pathname.startsWith(`${item.path}/`)

        return (
          <SidebarMenuItem key={item.path}>
            <SidebarMenuButton
              render={<Link to={item.path} />}
              isActive={isActive}
              tooltip={item.title}
              className="h-10 px-2.5"
            >
              <Icon className="size-4" />
              <span>{item.title}</span>
              {item.badge && (
                <span className="ml-auto rounded-md border border-sidebar-border px-1.5 py-0.5 text-[10px] text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
                  {item.badge}
                </span>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}
