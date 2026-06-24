/*
 * @Author: sunbingqing
 * @Date: 2026-05-09 14:36:11
 * @LastEditors: sunbingqing
 * @LastEditTime: 2026-05-14 00:00:00
 * @Description: 会话复盘页面
 * @Copyright: ©2021 杭州杰竞科技有限公司 版权所有
 */

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { DataTableSection } from '@/components/data/DataTableSection'
import { Skeleton } from '@/components/ui/skeleton'
import { SearchableSelect } from '@/components/filters/SearchableSelect'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useFollowerSearch } from '@/hooks/use-follower-search'
import {
  getSessionReviewSummary,
  searchSessionReviews,
  type SessionReviewItem,
  type SessionReviewSummary,
  type SessionSearchType,
} from '@/services/session-review'
import { SessionDetailDrawer } from './session-review/SessionDetailDrawer'
import { SessionRow } from './session-review/SessionRow'

const PAGE_SIZE = 10

const EMPTY_SUMMARY: SessionReviewSummary = {
  totalSessions: 0,
  riskSessions: 0,
  overdueTasks: 0,
}

const SEARCH_TYPE_MAP: Array<{
  key: SessionSearchType
  title: string
  summaryKey: keyof SessionReviewSummary
  unit: string
}> = [
  { key: 'ALL', title: '全部会话', summaryKey: 'totalSessions', unit: '条' },
  { key: 'RISK', title: '风险会话', summaryKey: 'riskSessions', unit: '条' },
  { key: 'OVERDUE', title: '跟进逾期', summaryKey: 'overdueTasks', unit: '项' },
]

export default function SessionReviewPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchType, setSearchType] = useState<SessionSearchType>('ALL')
  const [selectedSession, setSelectedSession] = useState<SessionReviewItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const { userType } = useAuth()
  const isAdmin = userType === 1

  const resetPage = () => setCurrentPage(1)

  const urlFollowerId = useMemo(() => searchParams.get('followerId') ?? undefined, [searchParams])
  const urlFollowerName = useMemo(() => searchParams.get('followerName') ?? undefined, [searchParams])

  const followerSearch = useFollowerSearch({
    onResetPage: resetPage,
    initialFollowerId: urlFollowerId,
    initialFollowerName: urlFollowerName,
  })

  const summaryFollowerId = isAdmin ? followerSearch.selected.followerId : undefined
  const searchFollowerId = isAdmin ? followerSearch.selected.followerId : undefined

  const summaryQuery = useQuery({
    queryKey: ['session-review', 'summary', summaryFollowerId ?? 'all'],
    queryFn: () => getSessionReviewSummary(summaryFollowerId),
  })

  const sessionQuery = useQuery({
    queryKey: ['session-review', 'sessions', searchFollowerId ?? 'all', searchType, currentPage],
    queryFn: () =>
      searchSessionReviews({
        followerId: searchFollowerId,
        searchType,
        current: currentPage,
        size: PAGE_SIZE,
      }),
    placeholderData: (previousData) => previousData,
  })

  const overview = summaryQuery.data ?? EMPTY_SUMMARY
  const sessions = sessionQuery.data?.records ?? []
  const totalCount = Number(sessionQuery.data?.total ?? 0)
  const pageCount = Math.max(
    1,
    Number((sessionQuery.data?.pages ?? Math.ceil(totalCount / PAGE_SIZE)) || 1),
  )

  useEffect(() => {
    if (currentPage <= pageCount) {
      return
    }
    const timer = window.setTimeout(() => {
      setCurrentPage(pageCount)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [currentPage, pageCount])

  useEffect(() => {
    if (!isAdmin && (searchParams.has('followerId') || searchParams.has('followerName'))) {
      setSearchParams({}, { replace: true })
    }
    if (!followerSearch.selected.followerId && (searchParams.has('followerId') || searchParams.has('followerName'))) {
      setSearchParams({}, { replace: true })
    }
  }, [isAdmin, followerSearch.selected.followerId, searchParams, setSearchParams])

  const cards = useMemo(
    () =>
      SEARCH_TYPE_MAP.map((item) => ({
        ...item,
        value: overview[item.summaryKey],
        active: searchType === item.key,
      })),
    [overview, searchType],
  )

  function handleSwitchSearchType(nextType: SessionSearchType) {
    if (nextType === searchType) return
    setSearchType(nextType)
    setCurrentPage(1)
  }

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

  const showSummarySkeleton = summaryQuery.isLoading && !summaryQuery.data
  const showTableLoading = sessionQuery.isLoading && !sessionQuery.data

  return (
    <div className="space-y-6 p-6">
      <div className="-mx-6 border-b bg-background px-6 py-4">
        {isAdmin && (
          <div className="max-w-sm">
            <SearchableSelect
            options={followerSearch.options}
            value={followerSearch.selected}
            inputValue={followerSearch.keyword}
            open={followerSearch.open}
            placeholder="筛选跟进人"
            emptyText="没有找到匹配的跟进人"
            errorText="跟进人列表加载失败，请稍后重试"
            isLoading={followerSearch.query.isLoading}
            isError={followerSearch.query.isError}
            hasNextPage={followerSearch.query.hasNextPage}
            isFetchingNextPage={followerSearch.query.isFetchingNextPage}
            className="h-10"
            showClear={followerSearch.selected.followerId != null}
            onOpenChange={followerSearch.setOpen}
            onInputValueChange={followerSearch.handleInputValueChange}
            onValueChange={followerSearch.handleValueChange}
            onReachEnd={() => {
              if (!followerSearch.query.isFetchingNextPage) {
                void followerSearch.query.fetchNextPage()
              }
            }}
            isOptionEqual={(option, value) => option.key === value.key}
            />
          </div>
        )}
      </div>

      <div className="rounded-lg border p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold">概览</h2>
          <p className="mt-1 text-sm text-muted-foreground">点击卡片切换列表筛选类型</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {cards.map((card) => (
            <button
              key={card.key}
              type="button"
              className={cn(
                'rounded-lg border p-4 text-left transition-colors hover:bg-muted/30',
                card.active && 'border-primary/40 bg-primary/5',
              )}
              onClick={() => handleSwitchSearchType(card.key)}
            >
              <p className="text-base font-semibold">{card.title}</p>
              <div className="mt-5 flex items-end gap-2">
                {showSummarySkeleton ? (
                  <Skeleton className="h-10 w-20 rounded-md" />
                ) : (
                  <>
                    <span className="text-4xl font-bold leading-none">{card.value}</span>
                    <span className="pb-0.5 text-base text-muted-foreground">{card.unit}</span>
                  </>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <DataTableSection
        title="会话列表"
        description={`当前列表展示：${cards.find((card) => card.key === searchType)?.title ?? '全部会话'}`}
        total={totalCount}
        currentPage={currentPage}
        pageCount={pageCount}
        onPageChange={setCurrentPage}
      >
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
              {showTableLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={10} className="px-6 py-4">
                      <Skeleton className="h-14 w-full rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : sessionQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={10} className="px-6 py-10 text-center text-destructive">
                    会话列表加载失败，请稍后重试
                  </TableCell>
                </TableRow>
              ) : sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="px-6 py-10 text-center text-muted-foreground">
                    当前筛选条件下暂无会话
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
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
      </DataTableSection>

      <SessionDetailDrawer
        open={detailOpen}
        session={selectedSession}
        onOpenChange={handleDetailOpenChange}
      />
    </div>
  )
}
