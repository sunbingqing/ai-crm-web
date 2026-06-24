/*
 * @Author: sunbingqing
 * @Date: 2026-05-09 14:36:11
 * @LastEditors: sunbingqing
 * @LastEditTime: 2026-05-09 14:36:11
 * @Description: 删除成员确认弹窗组件
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
import { type UserVO, deleteMember } from '@/services/member'

interface DeleteMemberDialogProps {
  open: boolean
  user: UserVO | null
  onOpenChange: (open: boolean) => void
}

export function DeleteMemberDialog({ open, user, onOpenChange }: DeleteMemberDialogProps) {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: () => deleteMember(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      onOpenChange(false)
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : '删除失败')
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>确认删除</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          确定要删除成员「{user?.username || user?.phone}」吗？此操作不可撤销。
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
            variant="destructive"
            onClick={() => mutate()}
            disabled={isPending}
          >
            {isPending ? '删除中...' : '删除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
