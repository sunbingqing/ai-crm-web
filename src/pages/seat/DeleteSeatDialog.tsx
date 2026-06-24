/*
 * @Author: sunbingqing
 * @Date: 2026-06-13
 * @Description: 删除坐席确认弹窗组件
 * @Copyright: ©2021 杭州杰竞科技有限公司 版权所有
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { type CallSeatVO, deleteCallSeat } from '@/services/call-seat'

interface DeleteSeatDialogProps {
  open: boolean
  seat: CallSeatVO | null
  onOpenChange: (open: boolean) => void
}

export function DeleteSeatDialog({ open, seat, onOpenChange }: DeleteSeatDialogProps) {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      if (!seat) throw new Error('坐席信息缺失')
      return deleteCallSeat(seat.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-seats'] })
      onOpenChange(false)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : '删除失败')
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>确认删除坐席「{seat?.account}」？</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          删除后，{seat?.employeeName || ''}将无法继续使用八百呼外呼，坐席配置不可恢复。
        </p>
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
