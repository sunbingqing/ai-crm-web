/*
 * @Author: sunbingqing
 * @Date: 2026-05-09 14:36:11
 * @LastEditors: sunbingqing
 * @LastEditTime: 2026-05-09 14:36:11
 * @Description: 修改成员密码弹窗组件
 * @Copyright: ©2021 杭州杰竞科技有限公司 版权所有
 */

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { type UserVO, updateMemberPassword } from '@/services/member'

interface EditPasswordDialogProps {
  open: boolean
  user: UserVO | null
  onOpenChange: (open: boolean) => void
}

export function EditPasswordDialog({ open, user, onOpenChange }: EditPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: (password: string) => updateMemberPassword(user!.id, { newPassword: password }),
    onSuccess: () => {
      handleClose(false)
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : '修改失败')
    },
  })

  function handleClose(open: boolean) {
    onOpenChange(open)
    if (!open) {
      setNewPassword('')
      setError('')
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setError('')
    mutate(newPassword)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>修改密码 - {user?.username || user?.phone}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium shrink-0">新密码</label>
            <Input
              type="password"
              placeholder="请输入新密码"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
