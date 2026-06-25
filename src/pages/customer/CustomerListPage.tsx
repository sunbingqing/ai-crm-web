import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DataTableSection } from '@/components/data/DataTableSection'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search } from 'lucide-react'
import { searchCustomers, type CustomerVO } from '@/services/customer'
import { Pill } from '@/pages/session-review/Pill'
import { IntentBadge } from '@/pages/session-review/IntentBadge'
import { TagGroup } from '@/pages/session-review/TagGroup'
import { formatFollowTime, formatFollowStatus, formatSessionTime } from '@/pages/session-review/format'
import { CustomerDetailDrawer } from './CustomerDetailDrawer'

const PAGE_SIZE = 8

export default function CustomerListPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [queryType, setQueryType] = useState('ALL')
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerVO | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchKeyword(keyword.trim())
      setCurrentPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [keyword])

  const isPhone = /^[\d+\-()\s]+$/.test(searchKeyword) && searchKeyword.length > 0

  const customerQuery = useQuery({
    queryKey: ['customers', { keyword: searchKeyword, currentPage, isPhone, queryType }],
    queryFn: () =>
      searchCustomers({
        ...(isPhone ? { phone: searchKeyword } : { name: searchKeyword || undefined }),
        current: currentPage,
        size: PAGE_SIZE,
        queryType,
      }),
    placeholderData: (previousData) => previousData,
  })

  const customers = customerQuery.data?.records ?? []
  const totalCount = Number(customerQuery.data?.total ?? 0)
  const pageCount = customerQuery.data?.pages ?? 1

  useEffect(() => {
    if (currentPage <= pageCount) return
    const timer = window.setTimeout(() => setCurrentPage(pageCount), 0)
    return () => window.clearTimeout(timer)
  }, [currentPage, pageCount])

  const showLoading = customerQuery.isLoading && !customerQuery.data

  function handleViewDetail(customer: CustomerVO) {
    setSelectedCustomer(customer)
    setDetailOpen(true)
  }

  const QUERY_TYPES = [
    { value: 'ALL', label: '全部' },
    { value: 'TODAY_TO_FOLLOW', label: '今日待跟进' },
    { value: 'OVERDUE', label: '已逾期' },
  ]

  return (
    <div className="page-shell">
      <div className="toolbar-band">
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索客户姓名或手机号"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-9"
            />
          </div>
          {QUERY_TYPES.map((qt) => (
            <Button
              key={qt.value}
              size="sm"
              variant={queryType === qt.value ? 'default' : 'outline'}
              onClick={() => {
                if (queryType !== qt.value) {
                  setQueryType(qt.value)
                  setCurrentPage(1)
                }
              }}
            >
              {qt.label}
            </Button>
          ))}
        </div>
      </div>

      <DataTableSection
        title="客户列表"
        total={totalCount}
        currentPage={currentPage}
        pageCount={pageCount}
        onPageChange={setCurrentPage}
      >
        <div className="overflow-hidden rounded-lg border">
          <Table className="min-w-[1280px]">
            <TableHeader className="bg-muted/30 [&_tr]:bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="sticky left-0 z-10 w-[160px] min-w-[160px] bg-muted px-6 text-sm text-muted-foreground shadow-[1px_0_0_0_var(--color-border)]">
                  客户
                </TableHead>
                <TableHead className="sticky left-[160px] z-10 w-[140px] min-w-[140px] bg-muted px-6 text-sm text-muted-foreground shadow-[1px_0_0_0_var(--color-border)]">
                  手机号
                </TableHead>
                <TableHead className="px-4 text-sm text-muted-foreground" style={{ width: 120 }}>跟进阶段</TableHead>
                <TableHead className="px-4 text-sm text-muted-foreground">客户意向</TableHead>
                <TableHead className="px-6 text-sm text-muted-foreground">客户标签</TableHead>
                <TableHead className="px-6 text-sm text-muted-foreground" style={{ width: 140 }}>最近拨通</TableHead>
                <TableHead className="px-6 text-sm text-muted-foreground">下一步跟进</TableHead>
                <TableHead className="sticky right-0 z-10 w-[120px] min-w-[120px] bg-muted px-6 text-sm text-muted-foreground text-right shadow-[-1px_0_0_0_var(--color-border)]">
                  操作
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {showLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={8} className="px-6 py-4">
                      <Skeleton className="h-14 w-full rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : customerQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={8} className="px-6 py-10 text-center">
                    <p className="mb-3 text-destructive">客户列表加载失败，请稍后重试</p>
                    <Button variant="outline" size="sm" onClick={() => customerQuery.refetch()}>
                      重试
                    </Button>
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="px-6 py-10 text-center text-muted-foreground">
                    {searchKeyword ? '未找到匹配的客户' : '暂无客户'}
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <CustomerRow
                    key={customer.id}
                    customer={customer}
                    onViewDetail={() => handleViewDetail(customer)}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DataTableSection>

      <CustomerDetailDrawer
        open={detailOpen}
        customer={selectedCustomer}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}

function CustomerRow({ customer, onViewDetail }: { customer: CustomerVO; onViewDetail: () => void }) {
  const task = customer.nextFollowTask
  const rawFollowTime = task?.followTime
  const followTime = rawFollowTime != null ? String(rawFollowTime) : undefined
  const followAction = typeof task?.followAction === 'string' ? task.followAction.trim() : undefined
  const followStatus = typeof task?.status === 'string' ? task.status : undefined
  const hasFollowTask = !!(followTime || followAction || followStatus)

  return (
    <TableRow className="align-top">
      <TableCell className="sticky left-0 z-10 w-[160px] min-w-[160px] max-w-[160px] bg-card px-6 py-5 align-top whitespace-normal shadow-[1px_0_0_0_var(--color-border)]" >
        <div className="space-y-1">
          <p className="text-lg font-semibold">{customer.name || '未命名客户'}</p>
        </div>
      </TableCell>
      <TableCell className="sticky z-10 left-[160px] w-[140px] min-w-[140px] bg-card px-6 py-5 align-top text-base font-medium shadow-[1px_0_0_0_var(--color-border)]">
        {customer.phone}
      </TableCell>
      <TableCell className="px-4 py-5 align-top whitespace-normal" style={{ width: 120 }}>
        <Pill value={customer.followStage} />
      </TableCell>
      <TableCell className="px-4 py-5 align-top whitespace-normal">
        <IntentBadge value={customer.intentLevel} />
      </TableCell>
      <TableCell className="px-6 py-5 align-top whitespace-normal">
        <TagGroup values={customer.tags ?? []} emptyText="暂无标签" />
      </TableCell>
      <TableCell className="px-6 py-5 align-top whitespace-nowrap">
        <span className="text-sm">{formatSessionTime(customer.lastCallTime)}</span>
      </TableCell>
      <TableCell className="px-6 py-5 align-top whitespace-normal">
        {hasFollowTask ? (
          <div className="space-y-1.5">
            <p className="text-base font-semibold">{formatFollowTime(followTime)}</p>
            <p className="text-sm text-muted-foreground">{followAction || '暂无'}</p>
            <Pill tone="muted" value={formatFollowStatus(followStatus)} />
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">暂无</span>
        )}
      </TableCell>
      <TableCell className="sticky right-0 z-10 bg-card px-6 py-5 align-top whitespace-nowrap text-right shadow-[-1px_0_0_0_var(--color-border)]" style={{ width: 120, minWidth: 120 }}>
        <button
          type="button"
          className="text-sm font-semibold text-primary hover:underline"
          onClick={onViewDetail}
        >
          查看详情
        </button>
      </TableCell>
    </TableRow>
  )
}
