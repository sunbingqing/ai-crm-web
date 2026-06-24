import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import {
  getSessionReviewDetail,
  getSessionReviewTranscript,
  type SessionReviewItem,
} from '@/services/session-review'
import { IntentBadge } from './IntentBadge'
import { NextFollowCell } from './NextFollowCell'
import { Pill } from './Pill'
import { Badge } from '@/components/ui/badge'
import { TagGroup } from './TagGroup'
import { formatDateTime, formatSessionTime } from './format'

const TRANSCRIPT_PAGE_SIZE = 20

interface SessionDetailDrawerProps {
  open: boolean
  session: SessionReviewItem | null
  onOpenChange: (open: boolean) => void
}

type DrawerTab = 'summary' | 'transcript'

const TAB_OPTIONS: Array<{ key: DrawerTab; label: string }> = [
  { key: 'summary', label: '会话总结' },
  { key: 'transcript', label: '原文' },
]

export function SessionDetailDrawer({ open, session, onOpenChange }: SessionDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('summary')

  const detailQuery = useQuery({
    queryKey: ['session-review', 'detail', session?.sessionId ?? 'empty'],
    queryFn: () => {
      if (!session) {
        throw new Error('缺少会话 ID')
      }
      return getSessionReviewDetail(session.sessionId)
    },
    enabled: open && session != null && activeTab === 'summary',
  })

  const transcriptQuery = useInfiniteQuery({
    queryKey: ['session-review', 'transcript', session?.sessionId ?? 'empty'],
    queryFn: ({ pageParam = 1 }) => {
      if (!session) {
        throw new Error('缺少会话 ID')
      }
      return getSessionReviewTranscript({
        sessionId: session.sessionId,
        current: pageParam,
        size: TRANSCRIPT_PAGE_SIZE,
      })
    },
    enabled: open && session != null && activeTab === 'transcript',
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (
      lastPage.current < lastPage.pages ? lastPage.current + 1 : undefined
    ),
    placeholderData: (previousData) => previousData,
  })

  const detail = detailQuery.data ?? session
  const qualityDimensions = useMemo(
    () => buildQualityDimensions(detail?.qualityDimensionScore),
    [detail?.qualityDimensionScore],
  )
  const transcriptPages = transcriptQuery.data?.pages ?? []
  const transcriptLines = transcriptPages.flatMap((page) => page.transcriptMessages)
  const originalText = transcriptPages.find((page) => Boolean(page.originalText))?.originalText

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setActiveTab('summary')
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="gap-0 p-0"
        style={{ width: 'min(78vw, 58rem)', maxWidth: 'min(78vw, 58rem)' }}
      >
        <SheetHeader className="gap-3 border-b px-6 py-5">
          <div className="space-y-2 pr-10">
            <SheetTitle className="text-lg font-semibold">
              {detail?.customerName || '会话详情'}
            </SheetTitle>
            <SheetDescription className="text-sm leading-6">
              {detail?.risk && <Badge variant="destructive" className="mr-2 inline-flex align-middle">有风险</Badge>}
              <span>{detail?.callerName || '未分配跟进人'}</span>
              <span className="mx-2 text-border">|</span>
              <span>{formatSessionTime(detail?.startTime)}</span>
              <span className="mx-2 text-border">|</span>
              <span>时长 {detail?.duration || '-'}</span>
            </SheetDescription>
          </div>

          <div className="flex w-fit items-center gap-1 rounded-lg bg-muted p-1">
            {TAB_OPTIONS.map((tab) => (
              <Button
                key={tab.key}
                type="button"
                variant={activeTab === tab.key ? 'secondary' : 'ghost'}
                size="sm"
                className={cn(
                  'rounded-md px-3',
                  activeTab === tab.key && 'shadow-sm',
                )}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === 'summary' && detailQuery.isLoading && !detailQuery.data ? (
            <DrawerSkeleton />
          ) : activeTab === 'summary' && detailQuery.isError ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-8 text-center text-sm text-destructive">
              会话详情加载失败，请稍后重试
            </div>
          ) : activeTab === 'summary' ? (
            <div className="space-y-6">
              <SummarySection title="关键结论">
                <SummaryField label="沟通摘要" value={detail?.concludeSummary} multiline />
                <SummaryField
                  label="客户意向"
                  value={detail?.concludeCustomerIntent ? <IntentBadge value={detail.concludeCustomerIntent} /> : undefined}
                />
                <SummaryField
                  label="当前跟进阶段"
                  value={detail?.concludeFollowStage ? <Pill value={detail.concludeFollowStage} /> : undefined}
                />
                <SummaryField
                  label="客户异议"
                  value={<TagGroup values={detail?.concludeCustomerObjections ?? []} emptyText="暂无异议" />}
                />
                <SummaryField
                  label="客户标签"
                  value={<TagGroup values={detail?.concludeCustomerTags ?? []} emptyText="暂无标签" />}
                />
                <SummaryField
                  label="下一步跟进"
                  value={detail ? <NextFollowCell session={detail} /> : undefined}
                />
              </SummarySection>

              <SummarySection title="会话质量">
                <div className="rounded-2xl border bg-background p-5">
                  <div className="flex flex-col gap-3 border-b border-dashed border-border/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-end gap-3">
                      <span className="text-5xl font-semibold leading-none text-foreground">
                        {detail?.qualityScore ?? '--'}
                      </span>
                      <span className={cn('inline-flex rounded-full px-3 py-1 text-sm font-medium', getQualityLevelBadgeTone(detail?.qualityScore))}>
                        {detail?.qualityLevel || '暂无评级'}
                      </span>
                    </div>

                    {detail?.concludedAt && (
                      <p className="text-xs text-muted-foreground">
                        总结时间：{formatDateTime(detail.concludedAt)}
                      </p>
                    )}
                  </div>

                  {qualityDimensions.length === 0 ? (
                    <p className="pt-5 text-sm text-muted-foreground">暂无维度评分</p>
                  ) : (
                    <div className="pt-2">
                      {qualityDimensions.map((dimension, index) => (
                        <div
                          key={dimension.key}
                          className={cn(
                            'grid gap-3 py-4 md:grid-cols-[120px_1fr_72px] md:items-center md:gap-4',
                            index > 0 && 'border-t border-dashed border-border/80',
                          )}
                        >
                          <div className="text-base font-medium text-foreground">
                            {dimension.label}
                          </div>

                          <div className="h-3 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn(
                                'h-full rounded-full transition-[width]',
                                getQualityBarTone(dimension.score),
                              )}
                              style={{ width: `${Math.max(0, Math.min(100, dimension.score))}%` }}
                            />
                          </div>

                          <div
                            className={cn(
                              'inline-flex min-h-11 items-center justify-center rounded-2xl px-3 text-lg font-semibold',
                              getQualityScoreBadgeTone(dimension.score),
                            )}
                          >
                            {dimension.score}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SummarySection>
            </div>
          ) : (
            <SummarySection title="会话原文">
              {transcriptQuery.isLoading && !transcriptQuery.data ? (
                <TranscriptSkeleton />
              ) : transcriptQuery.isError ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-8 text-center text-sm text-destructive">
                  会话原文加载失败，请稍后重试
                </div>
              ) : transcriptLines.length > 0 ? (
                <div className="space-y-2">
                  {transcriptLines.map((message, index) => (
                    <div
                      key={`${message.time || 'line'}-${index}`}
                      className={cn(
                        'grid gap-2 rounded-xl px-4 py-3 md:grid-cols-[64px_1fr] md:items-baseline md:gap-3',
                        message.speaker === '客户' && 'bg-primary/5',
                      )}
                    >
                      <div className="text-xs text-muted-foreground whitespace-nowrap leading-7">
                        {formatTranscriptTime(message.time)}
                      </div>
                      <div className="min-w-0 text-sm leading-7 text-foreground">
                        <span className="mr-2 font-semibold">
                          {message.speaker || '未知角色'}：
                        </span>
                        <span className="whitespace-pre-wrap break-words">{message.content}</span>
                      </div>
                    </div>
                  ))}
                  {transcriptQuery.hasNextPage && (
                    <div className="pt-2 text-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!transcriptQuery.isFetchingNextPage) {
                            void transcriptQuery.fetchNextPage()
                          }
                        }}
                      >
                        {transcriptQuery.isFetchingNextPage ? '加载中...' : '加载更多'}
                      </Button>
                    </div>
                  )}
                </div>
              ) : originalText ? (
                <div className="rounded-xl border bg-muted/10 p-4">
                  <p className="text-sm leading-7 whitespace-pre-wrap">{originalText}</p>
                </div>
              ) : (
                <div className="rounded-lg border px-4 py-8 text-center text-sm text-muted-foreground">
                  暂无会话原文
                </div>
              )}
            </SummarySection>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

interface SummarySectionProps {
  title: string
  children: ReactNode
}

function SummarySection({ title, children }: SummarySectionProps) {
  return (
    <section className="space-y-4 rounded-xl border p-5">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  )
}

interface SummaryFieldProps {
  label: string
  value?: ReactNode
  multiline?: boolean
}

function SummaryField({ label, value, multiline = false }: SummaryFieldProps) {
  const content = value ?? <span className="text-sm text-muted-foreground">暂无</span>

  return (
    <div className={cn('grid gap-3 md:grid-cols-[96px_1fr]', !multiline && 'md:items-start')}>
      <div className="pt-1 text-sm text-muted-foreground">{label}</div>
      <div className="min-w-0 text-sm leading-7">
        {typeof content === 'string'
          ? <p className="whitespace-pre-wrap">{content || '暂无'}</p>
          : content}
      </div>
    </div>
  )
}

function DrawerSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border p-5">
        <div className="space-y-4">
          <Skeleton className="h-5 w-28 rounded-md" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
      <div className="rounded-xl border p-5">
        <Skeleton className="h-10 w-36 rounded-xl" />
        <Skeleton className="mt-4 h-20 w-full rounded-2xl" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

function TranscriptSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="grid gap-2 rounded-xl px-4 py-3 md:grid-cols-[88px_1fr] md:gap-5">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ))}
    </div>
  )
}

function buildQualityDimensions(scoreMap?: Record<string, number>) {
  if (!scoreMap) {
    return []
  }

  return Object.entries(scoreMap)
    .map(([key, score]) => ({
      key,
      label: formatQualityDimensionLabel(key),
      score,
    }))
    .sort((left, right) => right.score - left.score)
}

function formatQualityDimensionLabel(value: string) {
  if (/[\u4e00-\u9fa5]/.test(value)) {
    return value
  }

  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getQualityBarTone(score: number) {
  if (score >= 80) {
    return 'bg-[#35A546]'
  }
  if (score >= 70) {
    return 'bg-[#E88700]'
  }
  return 'bg-destructive'
}

function getQualityScoreBadgeTone(score: number) {
  if (score >= 80) {
    return 'bg-[#EAF7ED] text-[#2F9E44]'
  }
  if (score >= 70) {
    return 'bg-[#FFF3E3] text-[#D97706]'
  }
  return 'bg-destructive/10 text-destructive'
}

function getQualityLevelBadgeTone(score?: number) {
  if (score == null) {
    return 'bg-muted text-muted-foreground'
  }
  if (score >= 80) {
    return 'bg-primary/10 text-primary'
  }
  if (score >= 70) {
    return 'bg-[#FFF3E3] text-[#D97706]'
  }
  return 'bg-destructive/10 text-destructive'
}

function formatTranscriptTime(value?: string) {
  return value || '--:--'
}
