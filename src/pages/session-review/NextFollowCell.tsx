import type { SessionReviewItem } from '@/services/session-review'
import { formatFollowStatus, formatFollowTime } from './format'
import { Pill } from './Pill'

interface NextFollowCellProps {
  session: SessionReviewItem
}

export function NextFollowCell({ session }: NextFollowCellProps) {
  const task = session.concludeNextFollowTask
  const followTime = typeof task?.followTime === 'string' ? task.followTime.trim() : undefined
  const followAction = typeof task?.followAction === 'string' ? task.followAction.trim() : undefined
  const status = typeof task?.status === 'string' ? task.status.trim() : undefined

  if (!followTime && !followAction && !status) {
    return <span className="text-sm text-muted-foreground">暂无</span>
  }

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{formatFollowTime(followTime)}</p>
      <p className="text-sm text-muted-foreground">{followAction || '暂无'}</p>
      <Pill tone="muted" value={formatFollowStatus(status)} />
    </div>
  )
}
