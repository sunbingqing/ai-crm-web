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
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { getOrgInfo } from '@/services/auth'

const navItems = [
  { title: 'AI 助手', path: '/', adminOnly: true },
  { title: '工作台', path: '/workbench', adminOnly: true },
  { title: '客户列表', path: '/customer' },
  { title: '会话复盘', path: '/session-review' },
  { title: '团队辅导', path: '/team-coaching', adminOnly: true },
  { title: '规则设置', path: '/rule-settings', adminOnly: true },
  { title: '成员设置', path: '/member-settings', adminOnly: true },
]

const seatNavItem = { title: '坐席管理', path: '/seat-management' }

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

  const filteredItems = isAdmin ? navItems : navItems.filter((item) => !item.adminOnly)
  const displayItems = showSeatManagement
    ? [...filteredItems.slice(0, 5), seatNavItem, ...filteredItems.slice(5)]
    : filteredItems

  return (
    <Sidebar>
      <SidebarHeader className="px-6 py-5">
        <span className="text-lg font-extrabold tracking-tight">
          AI 销售执行平台
        </span>
        <span className="text-xs text-muted-foreground">{isAdmin ? '管理后台' : '工作台'}</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {displayItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    render={<Link to={item.path} />}
                    isActive={location.pathname === item.path}
                  >
                    {item.title}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
