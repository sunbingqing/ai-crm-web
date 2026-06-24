import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import { RequireAuth, RequireAdmin } from '@/components/auth/RequireAuth'
import { AppLayout } from '@/components/layout/AppLayout'
import LoginPage from '@/pages/LoginPage'
import AssistantPage from '@/pages/AssistantPage'
import WorkbenchPage from '@/pages/WorkbenchPage'
import SessionReviewPage from '@/pages/SessionReviewPage'
import TeamCoachingPage from '@/pages/TeamCoachingPage'
import RuleSettingsPage from '@/pages/rule-settings/RuleSettingsPage'
import MemberSettingsPage from '@/pages/member/MemberSettingsPage'
import SeatManagementPage from '@/pages/seat/SeatManagementPage'
import CustomerListPage from '@/pages/customer/CustomerListPage'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<RequireAuth />}>
                <Route element={<AppLayout />}>
                  <Route element={<RequireAdmin />}>
                    <Route path="/" element={<AssistantPage />} />
                    <Route path="/workbench" element={<WorkbenchPage />} />
                    <Route path="/team-coaching" element={<TeamCoachingPage />} />
                    <Route path="/rule-settings" element={<RuleSettingsPage />} />
                    <Route path="/member-settings" element={<MemberSettingsPage />} />
                    <Route path="/seat-management" element={<SeatManagementPage />} />
                  </Route>
                  <Route path="/session-review" element={<SessionReviewPage />} />
                  <Route path="/customer" element={<CustomerListPage />} />
                  <Route path="*" element={<Navigate to="/session-review" replace />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  )
}

export default App
