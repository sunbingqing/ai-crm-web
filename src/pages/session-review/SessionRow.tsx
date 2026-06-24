import type { SessionReviewItem } from '@/services/session-review'
import { formatSessionTime } from './format'
import { Pill } from './Pill'
import { IntentBadge } from './IntentBadge'
import { NextFollowCell } from './NextFollowCell'
import { QualityCell } from './QualityCell'
import { TagGroup } from './TagGroup'
import { Badge } from '@/components/ui/badge'
import { TableCell, TableRow } from '@/components/ui/table'

interface SessionRowProps {
  session: SessionReviewItem
  onViewDetail: (session: SessionReviewItem) => void
}

export function SessionRow({ session, onViewDetail }: SessionRowProps) {
  return (
    <TableRow className="align-top">
      <TableCell className="sticky left-0 z-10 w-[160px] min-w-[160px] bg-card px-6 py-5 align-top whitespace-normal shadow-[1px_0_0_0_var(--color-border)]">
        <div className="space-y-1">
          <p className="text-lg font-semibold">{session.customerName || '未命名客户'}</p>
          {session.risk && <Badge variant="destructive">有风险</Badge>}
        </div>
      </TableCell>
      <TableCell className="sticky left-[160px] z-10 w-[120px] min-w-[120px] bg-card px-4 py-5 align-top text-base font-medium shadow-[1px_0_0_0_var(--color-border)]">
        {session.callerName || '-'}
      </TableCell>
      <TableCell className="px-4 py-5 align-top whitespace-normal">
        <div className="space-y-1.5">
          <p className="text-base font-semibold">{formatSessionTime(session.startTime)}</p>
          <p className="text-sm text-muted-foreground">时长 {session.duration || '-'}</p>
        </div>
      </TableCell>
      <TableCell className="px-4 py-5 align-top whitespace-normal">
        <Pill value={session.concludeFollowStage} />
      </TableCell>
      <TableCell className="px-4 py-5 align-top whitespace-normal">
        <IntentBadge value={session.concludeCustomerIntent} />
      </TableCell>
      <TableCell className="px-4 py-5 align-top whitespace-normal">
        <TagGroup values={session.concludeCustomerTags} emptyText="暂无标签" />
      </TableCell>
      <TableCell className="px-6 py-5 align-top whitespace-normal">
        <TagGroup values={session.concludeCustomerObjections} emptyText="暂无异议" />
      </TableCell>
      <TableCell className="px-4 py-5 align-top whitespace-normal">
        <QualityCell score={session.qualityScore} level={session.qualityLevel} />
      </TableCell>
      <TableCell className="px-4 py-5 align-top whitespace-normal">
        <NextFollowCell session={session} />
      </TableCell>
      <TableCell className="sticky right-0 z-10 w-[120px] min-w-[120px] bg-card px-6 py-5 align-top whitespace-normal text-right shadow-[-1px_0_0_0_var(--color-border)]">
        <button
          type="button"
          className="text-sm font-semibold text-primary hover:underline"
          onClick={() => onViewDetail(session)}
        >
          查看详情
        </button>
      </TableCell>
    </TableRow>
  )
}
