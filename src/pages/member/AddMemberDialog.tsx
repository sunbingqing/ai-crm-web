/*
 * @Author: sunbingqing
 * @Date: 2026-05-09 14:36:11
 * @LastEditors: sunbingqing
 * @LastEditTime: 2026-05-09 14:36:11
 * @Description: 新增成员弹窗组件
 * @Copyright: ©2021 杭州杰竞科技有限公司 版权所有
 */

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { createMember } from '@/services/member'

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddMemberDialog({ open, onOpenChange }: AddMemberDialogProps) {
  const [form, setForm] = useState({ phone: '', password: '', username: '' })
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: createMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      handleClose(false)
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : '创建失败')
    },
  })

  function handleClose(open: boolean) {
    onOpenChange(open)
    if (!open) {
      setForm({ phone: '', password: '', username: '' })
      setError('')
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    mutate(form)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新增成员</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium shrink-0 w-14 text-right">姓名</label>
            <Input
              placeholder="请输入姓名"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium shrink-0 w-14 text-right">手机号</label>
            <Input
              placeholder="请输入手机号"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium shrink-0 w-14 text-right">密码</label>
            <Input
              type="password"
              placeholder="请输入密码"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
