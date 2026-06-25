/*
 * @Author: sunbingqing
 * @Date: 2026-05-09 14:36:11
 * @LastEditors: sunbingqing
 * @LastEditTime: 2026-05-20 14:14:27
 * @Description: 团队辅导页面
 * @Copyright: ©2021 杭州杰竞科技有限公司 版权所有
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import type { ComboboxRoot } from '@base-ui/react/combobox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { Eye } from 'lucide-react'
import { SearchableSelect, type SearchableSelectOption } from '@/components/filters/SearchableSelect'
import {
  buildPresetRange,
  DateRangeSelector,
  parseDateInputValue,
  toEndOfDay,
  toStartOfDay,
  type DateRangeState,
} from '@/components/filters/DateRangeSelector'
import { searchUsers, type UserVO } from '@/services/member'
import { DataTableSection } from '@/components/data/DataTableSection'
import { useAuth } from '@/contexts/AuthContext'
import {
  getWorkbenchAttentionPersons,
  getTeamCoachInfo,
  getEmployeePerformance,
  type WorkbenchAttentionPerson,
  type WorkbenchRiskRequest,
  type TeamCoachRequest,
  type EmployeePerformanceRequest,
  type TeamCoachInfo,
  type PeriodStats,
} from '@/services/workbench'

function formatDuration(milliseconds: number) {
  const sign = milliseconds < 0 ? '-' : ''
  const absSeconds = Math.abs(milliseconds) / 1000
  const hours = Math.floor(absSeconds / 3600)
  const minutes = Math.floor((absSeconds % 3600) / 60)
  const secs = Math.floor(absSeconds % 60)
  return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

const STAT_ITEMS: Array<{
  key: keyof PeriodStats
  label: string
  unit: string
  isRatio?: boolean
  formatValue?: (value: number) => string
  formatOffset?: (value: number) => string
}> = [
  { key: 'customerCallCount', label: '跟进客户数', unit: '条' },
  { key: 'followTaskCount', label: '跟进任务数', unit: '项' },
  { key: 'followTaskDoneCount', label: '已完成跟进数', unit: '项' },
  { key: 'followTaskDoneRatio', label: '跟进完成率', unit: '%', isRatio: true },
  { key: 'overdueTaskCount', label: '逾期未跟进数', unit: '项' },
  { key: 'overdueRatio', label: '逾期率', unit: '%', isRatio: true },
  { key: 'callCount', label: '通话次数', unit: '次' },
  { key: 'avgCallDuration', label: '平均通话时长', unit: '', formatValue: formatDuration, formatOffset: formatDuration },
]

type MemberCardType = 'all' | 'attention'

interface MemberOption extends SearchableSelectOption {
  memberId?: string
  user?: UserVO
}

const ALL_MEMBERS_OPTION: MemberOption = {
  key: 'all-members',
  label: '全部成员',
  description: '查看所有成员的数据',
}

const PAGE_SIZE = 5

const EMPTY_COACH_INFO: TeamCoachInfo = {
  totalUsers: 0,
  attentionPersonCount: 0,
  current: {
    customerCallCount: 0,
    followTaskCount: 0,
    followTaskDoneCount: 0,
    followTaskDoneRatio: 0,
    overdueTaskCount: 0,
    overdueRatio: 0,
    callCount: 0,
    avgCallDuration: 0,
  },
  previous: {
    customerCallCount: 0,
    followTaskCount: 0,
    followTaskDoneCount: 0,
    followTaskDoneRatio: 0,
    overdueTaskCount: 0,
    overdueRatio: 0,
    callCount: 0,
    avgCallDuration: 0,
  },
  offset: {
    customerCallCount: 0,
    followTaskCount: 0,
    followTaskDoneCount: 0,
    followTaskDoneRatio: 0,
    overdueTaskCount: 0,
    overdueRatio: 0,
    callCount: 0,
    avgCallDuration: 0,
  },
}

export default function TeamCoachingPage() {
  const [range, setRange] = useState<DateRangeState>(() => buildPresetRange('7d'))
  const [cardType, setCardType] = useState<MemberCardType>('all')
  const [memberKeyword, setMemberKeyword] = useState(ALL_MEMBERS_OPTION.label)
  const [memberOpen, setMemberOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberOption>(ALL_MEMBERS_OPTION)
  const [currentPage, setCurrentPage] = useState(1)
  const navigate = useNavigate()

  const { orgId } = useAuth()

  const effectiveMemberKeyword = useMemo(() => {
    const trimmed = memberKeyword.trim()
    return trimmed === selectedMember.label ? '' : trimmed
  }, [memberKeyword, selectedMember.label])

  const memberQuery = useInfiniteQuery({
    queryKey: ['team-coaching', 'members', effectiveMemberKeyword],
    queryFn: ({ pageParam = 1 }) =>
      searchUsers({ keyword: effectiveMemberKeyword, current: pageParam, size: 8 }),
    enabled: memberOpen,
    placeholderData: (previousData) => previousData,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const current = Number(lastPage.current ?? 1)
      const totalPages = Number(lastPage.pages ?? 1)
      return current < totalPages ? current + 1 : undefined
    },
  })

  const memberOptions = useMemo<MemberOption[]>(() => {
    const users = memberQuery.data?.pages.flatMap((page) => page.records ?? []) ?? []
    return [
      ALL_MEMBERS_OPTION,
      ...users.map((user) => ({
        key: `member-${user.id}`,
        label: user.phone ? `${user.username} · ${user.phone}` : user.username,
        description: user.phone || '暂无手机号',
        memberId: user.id,
        user,
      })),
    ]
  }, [memberQuery.data?.pages])

  const coachRequestParams = useMemo<TeamCoachRequest | null>(() => {
    if (!orgId || !parseDateInputValue(range.startDate) || !parseDateInputValue(range.endDate)) {
      return null
    }
    return {
      orgId,
      startTime: toStartOfDay(range.startDate),
      endTime: toEndOfDay(range.endDate),
      queryType: cardType === 'attention' ? 'ATTENTION' : 'ALL',
    }
  }, [orgId, range.endDate, range.startDate, cardType])

  const attentionRequestParams = useMemo<WorkbenchRiskRequest | null>(() => {
    if (!orgId || !parseDateInputValue(range.startDate) || !parseDateInputValue(range.endDate)) {
      return null
    }
    return {
      orgId,
      startTime: toStartOfDay(range.startDate),
      endTime: toEndOfDay(range.endDate),
    }
  }, [orgId, range.endDate, range.startDate])

  const personsRequestParams = useMemo<EmployeePerformanceRequest | null>(() => {
    if (!orgId || !parseDateInputValue(range.startDate) || !parseDateInputValue(range.endDate)) {
      return null
    }
    return {
      orgId,
      startTime: toStartOfDay(range.startDate),
      endTime: toEndOfDay(range.endDate),
      current: currentPage,
      size: PAGE_SIZE,
      ...(selectedMember.memberId != null ? { userId: selectedMember.memberId } : {}),
    }
  }, [orgId, range.endDate, range.startDate, currentPage, selectedMember.memberId])

  const coachQuery = useQuery({
    queryKey: ['team-coaching', 'coach-info', coachRequestParams],
    queryFn: () => {
      if (!coachRequestParams) throw new Error('缺少机构信息')
      return getTeamCoachInfo(coachRequestParams)
    },
    enabled: coachRequestParams != null,
    placeholderData: (previousData) => previousData,
  })

  const attentionQuery = useQuery({
    queryKey: ['team-coaching', 'attention-persons', attentionRequestParams],
    queryFn: () => {
      if (!attentionRequestParams) throw new Error('缺少机构信息')
      return getWorkbenchAttentionPersons(attentionRequestParams)
    },
    enabled: cardType === 'attention' && attentionRequestParams != null,
    placeholderData: (previousData) => previousData,
  })

  const personsQuery = useQuery({
    queryKey: ['team-coaching', 'persons', personsRequestParams],
    queryFn: () => {
      if (!personsRequestParams) throw new Error('缺少机构信息')
      return getEmployeePerformance(personsRequestParams)
    },
    enabled: cardType === 'all' && personsRequestParams != null,
    placeholderData: (previousData) => previousData,
  })

  const coachInfo = coachQuery.data ?? EMPTY_COACH_INFO

  const totalCount = Number(personsQuery.data?.total ?? 0)
  const pageCount = Math.max(
    1,
    Number((personsQuery.data?.pages ?? Math.ceil(totalCount / PAGE_SIZE)) || 1),
  )

  useEffect(() => {
    if (currentPage <= pageCount) return
    const timer = window.setTimeout(() => {
      setCurrentPage(pageCount)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [currentPage, pageCount])

  const filteredPersons = useMemo(() => {
    if (cardType === 'all') {
      return personsQuery.data?.records ?? []
    }
    const persons = attentionQuery.data ?? []
    return persons.filter((p) => p.attention)
  }, [attentionQuery.data, personsQuery.data, cardType])

  const showCoachSkeleton = coachQuery.isLoading && !coachQuery.data
  const showPersonsSkeleton = cardType === 'all' && personsQuery.isLoading && !personsQuery.data
  const showAttentionSkeleton = cardType === 'attention' && attentionQuery.isLoading && !attentionQuery.data
  const hasOrgError = !orgId

  function handleCardTypeChange(nextType: MemberCardType) {
    if (nextType === cardType) return
    setCardType(nextType)
    setCurrentPage(1)
  }

  function handleMemberInputValueChange(value: string, details: ComboboxRoot.ChangeEventDetails) {
    setMemberKeyword(value)
    if (details.reason === 'input-change' || details.reason === 'input-clear' || details.reason === 'clear-press') {
      setSelectedMember(ALL_MEMBERS_OPTION)
    }
  }

  function handleMemberValueChange(member: MemberOption | null) {
    const next = member ?? ALL_MEMBERS_OPTION
    setSelectedMember(next)
    setMemberKeyword(next.label)
    setMemberOpen(false)
    setCurrentPage(1)
  }

  function handleViewSession(person: WorkbenchAttentionPerson) {
    const name = person.userName || '未命名成员'
    navigate(`/session-review?followerId=${person.userId}&followerName=${encodeURIComponent(name)}`)
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
          当前登录信息缺少机构 ID，请重新登录后查看团队辅导数据。
        </div>
      )}

      <section className="data-shell">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">概览</h2>
          <p className="mt-1 text-sm text-muted-foreground">点击卡片切换成员列表筛选类型</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <button
            type="button"
            className={cn(
              'metric-card text-left',
              cardType === 'all' && 'metric-card-active',
            )}
            onClick={() => handleCardTypeChange('all')}
          >
            <p className="text-base font-semibold">全部成员</p>
            <div className="mt-5 flex items-end gap-2">
              {showCoachSkeleton ? (
                <Skeleton className="h-10 w-20 rounded-md" />
              ) : (
                <>
                  <span className="text-4xl font-bold leading-none">{coachInfo.totalUsers}</span>
                  <span className="pb-0.5 text-base text-muted-foreground">位</span>
                </>
              )}
            </div>
          </button>
          <button
            type="button"
            className={cn(
              'metric-card text-left',
              cardType === 'attention' && 'border-destructive/35 bg-destructive/10',
            )}
            onClick={() => handleCardTypeChange('attention')}
          >
            <p className="text-base font-semibold">需关注成员</p>
            <div className="mt-5 flex items-end gap-2">
              {showCoachSkeleton ? (
                <Skeleton className="h-10 w-20 rounded-md" />
              ) : (
                <>
                  <span className="text-4xl font-bold leading-none">{coachInfo.attentionPersonCount}</span>
                  <span className="pb-0.5 text-base text-muted-foreground">位</span>
                </>
              )}
            </div>
          </button>
        </div>
      </section>

      <section className="data-shell">
        <h2 className="text-lg font-semibold">团队基础数据</h2>
        <p className="mt-1 text-sm text-muted-foreground">所选时间范围内的团队整体表现</p>
        <div           className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {STAT_ITEMS.map((item) => {
            const currentValue = coachInfo.current[item.key]
            const offsetValue = item.isRatio
              ? coachInfo.current[item.key] - coachInfo.previous[item.key]
              : coachInfo.offset[item.key]

            return (
              <div
                key={item.key}
                className="metric-card"
              >
                <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                <div className="mt-3 flex items-end gap-1.5">
                  {showCoachSkeleton ? (
                    <Skeleton className="h-8 w-16 rounded-md" />
                  ) : (
                    <>
                      <span className="text-3xl font-bold leading-none">
                        {item.formatValue ? item.formatValue(currentValue) : item.isRatio ? formatRatio(currentValue) : currentValue}
                      </span>
                      <span className="pb-0.5 text-sm text-muted-foreground">{item.unit}</span>
                    </>
                  )}
                </div>
                <div className="mt-3">
                  {showCoachSkeleton ? (
                    <Skeleton className="h-5 w-20 rounded-full" />
                  ) : (
                    <TrendBadge offset={offsetValue} formatOffset={item.formatOffset} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {cardType === 'all' ? (
        <DataTableSection
          title="全部成员"
          description="展示团队所有成员的跟进表现"
          total={totalCount}
          currentPage={currentPage}
          pageCount={pageCount}
          onPageChange={setCurrentPage}
          headerExtra={
            <SearchableSelect
              options={memberOptions}
              value={selectedMember}
              inputValue={memberKeyword}
              open={memberOpen}
              placeholder="筛选成员"
              emptyText="没有找到匹配的成员"
              errorText="成员列表加载失败，请稍后重试"
              isLoading={memberQuery.isLoading}
              isError={memberQuery.isError}
              hasNextPage={memberQuery.hasNextPage}
              isFetchingNextPage={memberQuery.isFetchingNextPage}
              className="h-9 w-[240px]"
              showClear={selectedMember.memberId != null}
              onOpenChange={setMemberOpen}
              onInputValueChange={handleMemberInputValueChange}
              onValueChange={handleMemberValueChange}
              onReachEnd={() => {
                if (!memberQuery.isFetchingNextPage) {
                  void memberQuery.fetchNextPage()
                }
              }}
              isOptionEqual={(option, value) => option.key === value.key}
            />
          }
        >
          <div className="overflow-hidden rounded-lg border">
            <Table className="min-w-[1100px]">
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-6 text-sm text-muted-foreground">成员</TableHead>
                  <TableHead className="px-4 text-sm text-muted-foreground">关注问题</TableHead>
                  <TableHead className="px-4 text-sm text-muted-foreground">风险会话占比</TableHead>
                  <TableHead className="px-4 text-sm text-muted-foreground">跟进完成率</TableHead>
                  <TableHead className="px-4 text-sm text-muted-foreground">逾期率</TableHead>
                  <TableHead className="sticky right-0 z-10 min-w-[120px] bg-muted px-6 text-sm text-muted-foreground shadow-[-1px_0_0_0_var(--color-border)]">
                    操作
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {showPersonsSkeleton ? (
                  Array.from({ length: PAGE_SIZE }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={6} className="px-6 py-4">
                        <Skeleton className="h-14 w-full rounded-md" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : personsQuery.isError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-6 py-10 text-center">
                      <p className="mb-3 text-destructive">成员列表加载失败，请稍后重试</p>
                      <Button variant="outline" size="sm" onClick={() => personsQuery.refetch()}>
                        重试
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : filteredPersons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                      当前筛选条件下暂无成员
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPersons.map((person) => (
                    <MemberRow
                      key={person.userId}
                      person={person}
                      onViewSession={handleViewSession}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DataTableSection>
      ) : (
        <section className="data-shell">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">需关注成员</h2>
              <p className="mt-1 text-sm text-muted-foreground">基于风险会话占比和跟进完成情况识别</p>
            </div>
            <div className="text-sm text-muted-foreground whitespace-nowrap">共 {filteredPersons.length} 位</div>
          </div>
          <div className="overflow-hidden rounded-lg border">
            <Table className="min-w-[1100px]">
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-6 text-sm text-muted-foreground">成员</TableHead>
                  <TableHead className="px-4 text-sm text-muted-foreground">关注问题</TableHead>
                  <TableHead className="px-4 text-sm text-muted-foreground">风险会话占比</TableHead>
                  <TableHead className="px-4 text-sm text-muted-foreground">跟进完成率</TableHead>
                  <TableHead className="px-4 text-sm text-muted-foreground">逾期率</TableHead>
                  <TableHead className="sticky right-0 z-10 min-w-[120px] bg-muted px-6 text-sm text-muted-foreground shadow-[-1px_0_0_0_var(--color-border)]">
                    操作
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {showAttentionSkeleton ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={6} className="px-6 py-4">
                        <Skeleton className="h-14 w-full rounded-md" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : attentionQuery.isError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-6 py-10 text-center">
                      <p className="mb-3 text-destructive">成员列表加载失败，请稍后重试</p>
                      <Button variant="outline" size="sm" onClick={() => attentionQuery.refetch()}>
                        重试
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : filteredPersons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                      当前时间范围内暂无需关注成员
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPersons.map((person) => (
                    <MemberRow
                      key={person.userId}
                      person={person}
                      onViewSession={handleViewSession}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      )}
    </div>
  )
}

function MemberRow({
  person,
  onViewSession,
}: {
  person: WorkbenchAttentionPerson
  onViewSession: (person: WorkbenchAttentionPerson) => void
}) {
  const issues = buildAttentionIssues(person)

  return (
    <TableRow>
      <TableCell className="px-6 py-5 align-top">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-semibold">{person.userName || '未命名成员'}</span>
          {person.attention && (
            <Badge variant="destructive">需关注</Badge>
          )}
        </div>
        {person.phone && (
          <p className="mt-1 text-xs text-muted-foreground">{person.phone}</p>
        )}
      </TableCell>
      <TableCell className="px-4 py-5 align-top">
        {issues.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {issues.map((issue) => (
              <Badge key={issue} variant="outline" className="bg-muted/40 text-muted-foreground">
                {issue}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">表现正常</span>
        )}
      </TableCell>
      <TableCell className="px-4 py-5 align-top">
        <span className="text-base font-semibold">
          {formatRatio(person.riskRatio)}%
        </span>
        <p className="mt-1 text-xs text-muted-foreground">
          {person.riskSessions} / {person.totalSessions} 条风险会话
        </p>
      </TableCell>
      <TableCell className="px-4 py-5 align-top">
        <span className="text-base font-semibold">
          {formatRatio(person.followTaskDoneRatio)}%
        </span>
        <p className="mt-1 text-xs text-muted-foreground">
          完成 {person.followTaskDoneCount} / {person.followTaskCount} 项
        </p>
      </TableCell>
      <TableCell className="px-4 py-5 align-top">
        <span className="text-base font-semibold">
          {formatRatio(person.overdueRatio)}%
        </span>
        <p className="mt-1 text-xs text-muted-foreground">
          逾期 {person.overdueTaskCount} 项
        </p>
      </TableCell>
      <TableCell className="sticky right-0 z-10 min-w-[120px] bg-background px-6 py-5 align-top shadow-[-1px_0_0_0_var(--color-border)]">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => onViewSession(person)}
        >
          <Eye className="mr-1.5 size-3.5" />
          查看会话
        </Button>
      </TableCell>
    </TableRow>
  )
}

function TrendBadge({ offset, formatOffset }: { offset: number; formatOffset?: (value: number) => string }) {
  const displayOffset = formatOffset ? formatOffset(offset) : offset
  if (offset > 0) {
    return (
      <Badge variant="default" className="bg-success/20 text-success-foreground hover:bg-success/20">
        较上一周期 +{displayOffset}
      </Badge>
    )
  }
  if (offset < 0) {
    return (
      <Badge variant="default" className="bg-destructive/15 text-destructive hover:bg-destructive/15">
        较上一周期 {displayOffset}
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="bg-muted/60 text-muted-foreground hover:bg-muted/60">
      较上一周期 持平
    </Badge>
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
  return issues
}

function formatRatio(value: number) {
  if (Number.isInteger(value)) {
    return String(value)
  }
  return value.toFixed(1)
}
