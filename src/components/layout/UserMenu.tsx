import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, ChevronDown, KeyRound, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { logout as logoutApi } from '@/services/auth'
import { updateSelfPassword } from '@/services/member'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

export function UserMenu() {
  const { username, orgName, userType, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleEnter = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setOpen(true)
  }, [])

  const handleLeave = useCallback(() => {
    timerRef.current = setTimeout(() => setOpen(false), 150)
  }, [])

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      queryClient.clear()
      logout()
      navigate('/login', { replace: true })
    },
  })

  const passwordMutation = useMutation({
    mutationFn: updateSelfPassword,
    onSuccess: () => {
      setPasswordDialogOpen(false)
      setOldPassword('')
      setNewPassword('')
      toast.success('密码修改成功，请重新登录')
      queryClient.clear()
      logout()
      navigate('/login', { replace: true })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : '修改失败，请稍后重试')
    },
  })

  function handleChangePassword() {
    setOpen(false)
    setPasswordDialogOpen(true)
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    passwordMutation.mutate({ oldPassword, newPassword })
  }

  function handlePasswordDialogClose(open: boolean) {
    setPasswordDialogOpen(open)
    if (!open) {
      setOldPassword('')
      setNewPassword('')
    }
  }

  const avatarChar = username?.[0]?.toUpperCase() || 'U'
  const roleLabel = userType === 2 ? '成员' : '超级管理员'

  return (
    <>
      <div
        className="relative flex items-center gap-2"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Building2 className="size-3.5 shrink-0" />
          <span>{orgName || '默认机构'}</span>
        </div>
        <div className="mx-1 h-4 w-px bg-border" />
        <div className="flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors hover:bg-muted">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
            {avatarChar}
          </div>
          <span className="max-w-[80px] truncate text-sm font-medium">
            {username || '管理员'}
          </span>
          <span className="inline-flex h-5 shrink-0 items-center rounded-4xl border border-primary/20 bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
            {roleLabel}
          </span>
          <ChevronDown
            className={cn(
              'size-3.5 text-muted-foreground transition-transform',
              open && 'rotate-180'
            )}
          />
        </div>
        {open && (
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-lg border bg-popover p-1 shadow-md">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
              onClick={handleChangePassword}
            >
              <KeyRound className="size-4 shrink-0" />
              修改密码
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive transition-colors hover:bg-muted disabled:opacity-50"
              disabled={logoutMutation.isPending}
              onClick={() => setLogoutDialogOpen(true)}
            >
              <LogOut className="size-4 shrink-0" />
              {logoutMutation.isPending ? '退出中...' : '退出登录'}
            </button>
          </div>
        )}
      </div>

      <Dialog open={passwordDialogOpen} onOpenChange={handlePasswordDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>修改密码</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="shrink-0 text-sm font-medium">旧密码</label>
              <Input
                type="password"
                placeholder="请输入旧密码"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="shrink-0 text-sm font-medium">新密码</label>
              <Input
                type="password"
                placeholder="请输入新密码"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={passwordMutation.isPending}>
                {passwordMutation.isPending ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>退出登录</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">确定要退出登录吗？</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoutDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              disabled={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
            >
              {logoutMutation.isPending ? '退出中...' : '确认退出'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
