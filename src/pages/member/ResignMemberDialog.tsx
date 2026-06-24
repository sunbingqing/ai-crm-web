/*
 * @Author: sunbingqing
 * @Date: 2026-06-23
 * @Description: 离职/启用成员确认弹窗组件
 * @Copyright: ©2021 杭州杰竞科技有限公司 版权所有
 */

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { type UserVO, updateMemberStatus } from '@/services/member'

interface ResignMemberDialogProps {
  open: boolean
  user: UserVO | null
  onOpenChange: (open: boolean) => void
}

export function ResignMemberDialog({ open, user, onOpenChange }: ResignMemberDialogProps) {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')

  const isResigning = user?.status === 1
  const newStatus = isResigning ? 0 : 1
  const actionLabel = isResigning ? '离职' : '启用'

  const { mutate, isPending } = useMutation({
    mutationFn: () => updateMemberStatus(user!.id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      onOpenChange(false)
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : '操作失败')
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>确认{actionLabel}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {isResigning
            ? `确定将成员「${user?.username || user?.phone}」设为离职吗？离职后该成员无法登录。`
            : `确定将成员「${user?.username || user?.phone}」重新启用吗？`}
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            取消
          </Button>
          <Button
            variant={isResigning ? 'destructive' : 'default'}
            onClick={() => mutate()}
            disabled={isPending}
          >
            {isPending ? '处理中...' : actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
