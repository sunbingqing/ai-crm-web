import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { UserMenu } from './UserMenu'

export function AppLayout() {
  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <AppSidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="z-20 flex shrink-0 items-center gap-2 border-b bg-background px-4 py-2">
          <SidebarTrigger />
          <div className="ml-auto">
            <UserMenu />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  )
}
