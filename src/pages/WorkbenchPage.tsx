/*
 * @Author: sunbingqing
 * @Date: 2026-05-09 14:36:11
 * @LastEditors: sunbingqing
 * @LastEditTime: 2026-05-19 15:45:51
 * @Description: 工作台页面
 * @Copyright: ©2021 杭州杰竞科技有限公司 版权所有
 */

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  buildPresetRange,
  buildPreviousPeriodRequest,
  DateRangeSelector,
  parseDateInputValue,
  toEndOfDay,
  toStartOfDay,
  type DateRangeState,
} from '@/components/filters/DateRangeSelector'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { SessionReviewItem } from '@/services/session-review'
import {
  getWorkbenchAttentionPersons,
  getWorkbenchRiskSessions,
  getWorkbenchRiskSummary,
  type WorkbenchAttentionPerson,
  type WorkbenchRiskRequest,
} from '@/services/workbench'
import { useAuth } from '@/contexts/AuthContext'
import { SessionDetailDrawer } from './session-review/SessionDetailDrawer'
import { SessionRow } from './session-review/SessionRow'

const EMPTY_SUMMARY = {
  riskSessionCount: 0,
  attentionPersonCount: 0,
}

export default function WorkbenchPage() {
  const [range, setRange] = useState<DateRangeState>(() => buildPresetRange('7d'))
  const [selectedSession, setSelectedSession] = useState<SessionReviewItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const { orgId } = useAuth()
  const requestParams = useMemo<WorkbenchRiskRequest | null>(() => {
    if (!orgId || !parseDateInputValue(range.startDate) || !parseDateInputValue(range.endDate)) {
      return null
    }

    return {
      orgId,
      startTime: toStartOfDay(range.startDate),
      endTime: toEndOfDay(range.endDate),
    }
  }, [orgId, range.endDate, range.startDate])
  const previousRequestParams = useMemo<WorkbenchRiskRequest | null>(() => (
    orgId ? buildPreviousPeriodRequest(orgId, range.startDate, range.endDate) : null
  ), [orgId, range.endDate, range.startDate])

  const summaryQuery = useQuery({
    queryKey: ['workbench', 'risk-summary', requestParams],
    queryFn: () => {
      if (!requestParams) {
        throw new Error('缺少机构信息')
      }
      return getWorkbenchRiskSummary(requestParams)
    },
    enabled: requestParams != null,
  })

  const previousSummaryQuery = useQuery({
    queryKey: ['workbench', 'risk-summary', 'previous', previousRequestParams],
    queryFn: () => {
      if (!previousRequestParams) {
        throw new Error('缺少机构信息')
      }
      return getWorkbenchRiskSummary(previousRequestParams)
    },
    enabled: previousRequestParams != null,
  })

  const riskSessionsQuery = useQuery({
    queryKey: ['workbench', 'risk-sessions', requestParams],
    queryFn: () => {
      if (!requestParams) {
        throw new Error('缺少机构信息')
      }
      return getWorkbenchRiskSessions(requestParams)
    },
    enabled: requestParams != null,
    placeholderData: (previousData) => previousData,
  })

  const attentionPersonsQuery = useQuery({
    queryKey: ['workbench', 'attention-persons', requestParams],
    queryFn: () => {
      if (!requestParams) {
        throw new Error('缺少机构信息')
      }
      return getWorkbenchAttentionPersons(requestParams)
    },
    enabled: requestParams != null,
    placeholderData: (previousData) => previousData,
  })

  const summary = summaryQuery.data ?? EMPTY_SUMMARY
  const previousSummary = previousSummaryQuery.data ?? EMPTY_SUMMARY
  const riskSessions = riskSessionsQuery.data ?? []
  const attentionPersons = attentionPersonsQuery.data ?? []
  const showSummarySkeleton = summaryQuery.isLoading && !summaryQuery.data
  const showTrendSkeleton = previousSummaryQuery.isLoading && !previousSummaryQuery.data
  const showRiskSessionsSkeleton = riskSessionsQuery.isLoading && !riskSessionsQuery.data
  const showAttentionSkeleton = attentionPersonsQuery.isLoading && !attentionPersonsQuery.data
  const hasOrgError = !orgId

  function handleViewDetail(session: SessionReviewItem) {
    setSelectedSession(session)
    setDetailOpen(true)
  }

  function handleDetailOpenChange(open: boolean) {
    setDetailOpen(open)
    if (!open) {
      setSelectedSession(null)
    }
  }

  return (
    <div className="page-shell">
      <section className="toolbar-band">
        <div className="flex flex-wrap items-center gap-3">
          <DateRangeSelector value={range} onChange={setRange} />
        </div>
      </section>

      {hasOrgError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          当前登录信息缺少机构 ID，请重新登录后查看工作台数据。
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <SummaryCard
          title="风险会话"
          value={summary.riskSessionCount}
          unit="条"
          trend={formatTrend(summary.riskSessionCount, previousSummary.riskSessionCount)}
          loading={showSummarySkeleton || showTrendSkeleton}
          tone="risk"
        />
        <SummaryCard
          title="需关注成员"
          value={summary.attentionPersonCount}
          unit="位成员"
          trend={formatTrend(summary.attentionPersonCount, previousSummary.attentionPersonCount)}
          loading={showSummarySkeleton || showTrendSkeleton}
          tone="attention"
        />
      </section>

      <section className="data-shell">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">风险会话</h2>
            <p className="mt-1 text-sm text-muted-foreground">展示所选时间内低质量或跟进逾期的会话</p>
          </div>
          <div className="text-sm text-muted-foreground">共 {riskSessions.length} 条</div>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <Table className="min-w-[1460px]">
            <TableHeader className="bg-muted/30 [&_tr]:bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="sticky left-0 z-10 w-[160px] min-w-[160px] bg-muted px-6 text-sm text-muted-foreground shadow-[1px_0_0_0_var(--color-border)]">
                  客户
                </TableHead>
                <TableHead className="sticky left-[160px] z-10 w-[120px] min-w-[120px] bg-muted px-4 text-sm text-muted-foreground shadow-[1px_0_0_0_var(--color-border)]">
                  跟进人
                </TableHead>
                <TableHead className="px-4 text-sm text-muted-foreground">会话时间</TableHead>
                <TableHead className="px-4 text-sm text-muted-foreground">当前跟进阶段</TableHead>
                <TableHead className="px-4 text-sm text-muted-foreground">客户意向</TableHead>
                <TableHead className="px-4 text-sm text-muted-foreground">客户标签</TableHead>
                <TableHead className="px-6 text-sm text-muted-foreground">客户异议</TableHead>
                <TableHead className="px-4 text-sm text-muted-foreground">会话质量</TableHead>
                <TableHead className="px-4 text-sm text-muted-foreground">下一步跟进</TableHead>
                <TableHead className="sticky right-0 z-10 w-[120px] min-w-[120px] bg-muted px-6 text-sm text-muted-foreground shadow-[-1px_0_0_0_var(--color-border)]">
                  操作
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {showRiskSessionsSkeleton ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={10} className="px-6 py-4">
                      <Skeleton className="h-16 w-full rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : riskSessionsQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={10} className="px-6 py-10 text-center">
                    <p className="mb-3 text-destructive">风险会话加载失败，请稍后重试</p>
                    <Button variant="outline" size="sm" onClick={() => riskSessionsQuery.refetch()}>
                      重试
                    </Button>
                  </TableCell>
                </TableRow>
              ) : riskSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="px-6 py-10 text-center text-muted-foreground">
                    当前时间范围内暂无风险会话
                  </TableCell>
                </TableRow>
              ) : (
                riskSessions.map((session) => (
                  <SessionRow
                    key={session.sessionId}
                    session={session}
                    onViewDetail={handleViewDetail}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="data-shell">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">需关注成员</h2>
            <p className="mt-1 text-sm text-muted-foreground">基于风险会话占比和跟进完成情况识别</p>
          </div>
          <div className="text-sm text-muted-foreground">共 {attentionPersons.length} 位</div>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <Table className="min-w-[920px]">
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-6 text-sm text-muted-foreground">成员</TableHead>
                <TableHead className="px-4 text-sm text-muted-foreground">需关注问题</TableHead>
                <TableHead className="px-4 text-sm text-muted-foreground">风险会话占比</TableHead>
                <TableHead className="px-4 text-sm text-muted-foreground">跟进完成率</TableHead>
                <TableHead className="px-4 text-sm text-muted-foreground">逾期率</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {showAttentionSkeleton ? (
                Array.from({ length: 2 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={5} className="px-6 py-4">
                      <Skeleton className="h-14 w-full rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : attentionPersonsQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-6 py-10 text-center">
                    <p className="mb-3 text-destructive">需关注成员加载失败，请稍后重试</p>
                    <Button variant="outline" size="sm" onClick={() => attentionPersonsQuery.refetch()}>
                      重试
                    </Button>
                  </TableCell>
                </TableRow>
              ) : attentionPersons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                    当前时间范围内暂无需关注成员
                  </TableCell>
                </TableRow>
              ) : (
                attentionPersons.map((person) => (
                  <AttentionPersonRow key={person.userId} person={person} />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <SessionDetailDrawer
        open={detailOpen}
        session={selectedSession}
        onOpenChange={handleDetailOpenChange}
      />
    </div>
  )
}

function SummaryCard({
  title,
  value,
  unit,
  trend,
  loading,
  tone,
}: {
  title: string
  value: number
  unit: string
  trend: string
  loading: boolean
  tone: 'risk' | 'attention'
}) {
  return (
    <div
      className={cn(
        'metric-card p-5',
        tone === 'risk' && 'border-destructive/25',
        tone === 'attention' && 'border-foreground/20',
      )}
    >
      <p className="text-base font-semibold text-muted-foreground">{title}</p>
      <div className="mt-6 flex items-end gap-2">
        {loading ? (
          <Skeleton className="h-10 w-24 rounded-md" />
        ) : (
          <>
            <span className="text-4xl font-bold leading-none">{value}</span>
            <span className="pb-1 text-sm text-muted-foreground">{unit}</span>
          </>
        )}
      </div>
      <p className="mt-6 text-sm font-medium text-muted-foreground">{trend}</p>
    </div>
  )
}

function AttentionPersonRow({ person }: { person: WorkbenchAttentionPerson }) {
  return (
    <TableRow>
      <TableCell className="px-6 py-5 align-top">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-semibold">{person.userName || '未命名成员'}</span>
          {person.attention && <Badge variant="destructive">需关注</Badge>}
        </div>
        {person.phone && (
          <p className="mt-1 text-xs text-muted-foreground">{person.phone}</p>
        )}
      </TableCell>
      <TableCell className="px-4 py-5 align-top">
        <div className="flex flex-wrap gap-2">
          {buildAttentionIssues(person).map((issue) => (
            <Badge key={issue} variant="outline" className="bg-muted/40 text-muted-foreground">
              {issue}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell className="px-4 py-5 align-top">
        <MetricValue value={person.riskRatio} suffix="%" />
        <p className="mt-1 text-xs text-muted-foreground">
          {person.riskSessions} / {person.totalSessions} 条风险会话
        </p>
      </TableCell>
      <TableCell className="px-4 py-5 align-top">
        <MetricValue value={person.followTaskDoneRatio} suffix="%" />
        <p className="mt-1 text-xs text-muted-foreground">
          完成 {person.followTaskDoneCount} / {person.followTaskCount} 项
        </p>
      </TableCell>
      <TableCell className="px-4 py-5 align-top">
        <MetricValue value={person.overdueRatio} suffix="%" />
        <p className="mt-1 text-xs text-muted-foreground">
          逾期 {person.overdueTaskCount} 项
        </p>
      </TableCell>
    </TableRow>
  )
}

function MetricValue({ value, suffix }: { value: number; suffix: string }) {
  return (
    <span className="text-base font-semibold">
      {formatRatio(value)}
      {suffix}
    </span>
  )
}

function buildAttentionIssues(person: WorkbenchAttentionPerson) {
  const issues: string[] = []

  if (person.riskSessions > 0) {
    issues.push(`风险会话 ${person.riskSessions} 条`)
  }

  if (person.followTaskCount > 0 && person.followTaskDoneRatio < 80) {
    issues.push(`跟进完成率 ${formatRatio(person.followTaskDoneRatio)}%`)
  }

  if (person.overdueTaskCount > 0) {
    issues.push(`跟进逾期 ${person.overdueTaskCount} 项`)
  }

  return issues.length > 0 ? issues : ['需复盘近期会话']
}

function formatRatio(value: number) {
  if (Number.isInteger(value)) {
    return String(value)
  }

  return value.toFixed(1)
}

function formatTrend(current: number, previous: number) {
  const diff = current - previous
  if (diff > 0) {
    return `较上一周期 +${diff}`
  }
  if (diff < 0) {
    return `较上一周期 ${diff}`
  }
  return '较上一周期 持平'
}
