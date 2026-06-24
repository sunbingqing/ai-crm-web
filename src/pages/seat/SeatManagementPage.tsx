/*
 * @Author: sunbingqing
 * @Date: 2026-06-13
 * @Description: 坐席管理 - 管理机构内的坐席账号，支持搜索、筛选与分页
 * @Copyright: ©2021 杭州杰竞科技有限公司 版权所有
 */

import { useEffect, useMemo, useState } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import type { ComboboxRoot } from '@base-ui/react/combobox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTableSection } from '@/components/data/DataTableSection'
import { SearchableSelect, type SearchableSelectOption } from '@/components/filters/SearchableSelect'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type CallSeatVO, searchCallSeats } from '@/services/call-seat'
import { searchUsers, type UserVO } from '@/services/member'
import { Plus, Pencil, Trash2, Search, Eye, EyeOff, RotateCcw } from 'lucide-react'
import { SeatFormDialog } from './SeatFormDialog'
import { DeleteSeatDialog } from './DeleteSeatDialog'

const PAGE_SIZE = 8

interface EmployeeOption extends SearchableSelectOption {
  employeeId?: string
}

const ALL_EMPLOYEE_OPTION: EmployeeOption = {
  key: 'all-employees',
  label: '全部员工',
}

function formatUserLabel(user: UserVO) {
  return user.phone ? `${user.username} · ${user.phone}` : user.username
}

export default function SeatManagementPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [employeeOpen, setEmployeeOpen] = useState(false)
  const [employeeKeyword, setEmployeeKeyword] = useState(ALL_EMPLOYEE_OPTION.label)
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOption>(ALL_EMPLOYEE_OPTION)

  const [formOpen, setFormOpen] = useState(false)
  const [formSeat, setFormSeat] = useState<CallSeatVO | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedSeat, setSelectedSeat] = useState<CallSeatVO | null>(null)
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set())

  function togglePasswordVisibility(id: string) {
    setVisiblePasswords((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const effectiveEmployeeKeyword = useMemo(() => {
    const trimmed = employeeKeyword.trim()
    return trimmed === selectedEmployee.label ? '' : trimmed
  }, [employeeKeyword, selectedEmployee.label])

  const employeeQuery = useInfiniteQuery({
    queryKey: ['seat-management', 'employees', effectiveEmployeeKeyword],
    queryFn: ({ pageParam = 1 }) =>
      searchUsers({ keyword: effectiveEmployeeKeyword, current: pageParam, size: 8 }),
    enabled: employeeOpen,
    placeholderData: (previousData) => previousData,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const current = Number(lastPage.current ?? 1)
      const totalPages = Number(lastPage.pages ?? 1)
      return current < totalPages ? current + 1 : undefined
    },
  })

  const employeeOptions = useMemo<EmployeeOption[]>(() => {
    const users = employeeQuery.data?.pages.flatMap((page) => page.records ?? []) ?? []
    return [
      ALL_EMPLOYEE_OPTION,
      ...users.map((user) => ({
        key: `member-${user.id}`,
        label: formatUserLabel(user),
        description: user.phone || '暂无手机号',
        employeeId: user.id,
      })),
    ]
  }, [employeeQuery.data?.pages])

  function handleEmployeeInputValueChange(value: string, details: ComboboxRoot.ChangeEventDetails) {
    setEmployeeKeyword(value)
    if (details.reason === 'input-change' || details.reason === 'input-clear' || details.reason === 'clear-press') {
      setSelectedEmployee(ALL_EMPLOYEE_OPTION)
    }
  }

  function handleEmployeeValueChange(member: EmployeeOption | null) {
    const next = member ?? ALL_EMPLOYEE_OPTION
    setSelectedEmployee(next)
    setEmployeeKeyword(next.label)
    setEmployeeOpen(false)
    setCurrentPage(1)
  }

  function handleReset() {
    setKeyword('')
    setSearchKeyword('')
    setSelectedEmployee(ALL_EMPLOYEE_OPTION)
    setEmployeeKeyword(ALL_EMPLOYEE_OPTION.label)
    setCurrentPage(1)
  }
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchKeyword(keyword.trim())
      setCurrentPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [keyword])

  const seatQuery = useQuery({
    queryKey: ['call-seats', { keyword: searchKeyword, employeeId: selectedEmployee.employeeId, currentPage }],
    queryFn: () =>
      searchCallSeats({
        account: searchKeyword || undefined,
        employeeId: selectedEmployee.employeeId,
        current: currentPage,
        size: PAGE_SIZE,
      }),
    placeholderData: (previousData) => previousData,
  })

  const seats = seatQuery.data?.records ?? []
  const totalCount = Number(seatQuery.data?.total ?? 0)
  const pageCount = Math.max(seatQuery.data?.pages ?? 1, 1)

  useEffect(() => {
    if (currentPage <= pageCount) {
      return
    }

    const timer = window.setTimeout(() => {
      setCurrentPage(pageCount)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [currentPage, pageCount])

  const showTableLoading = seatQuery.isLoading && !seatQuery.data

  return (
    <div className="space-y-6 p-6">
      <div className="-mx-6 border-b bg-background px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索坐席账号"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-9"
            />
          </div>
          <SearchableSelect
            options={employeeOptions}
            value={selectedEmployee}
            inputValue={employeeKeyword}
            open={employeeOpen}
            placeholder="关联员工"
            emptyText="没有找到匹配的员工"
            errorText="员工列表加载失败，请稍后重试"
            isLoading={employeeQuery.isLoading}
            isError={employeeQuery.isError}
            hasNextPage={employeeQuery.hasNextPage}
            isFetchingNextPage={employeeQuery.isFetchingNextPage}
            className="h-9 w-[200px]"
            showClear={selectedEmployee.employeeId != null}
            onOpenChange={setEmployeeOpen}
            onInputValueChange={handleEmployeeInputValueChange}
            onValueChange={handleEmployeeValueChange}
            onReachEnd={() => {
              if (!employeeQuery.isFetchingNextPage) {
                void employeeQuery.fetchNextPage()
              }
            }}
            isOptionEqual={(option, value) => option.key === value.key}
          />
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-1 h-4 w-4" />
            重置
          </Button>
        </div>
      </div>

      <DataTableSection
        title="坐席列表"
        total={totalCount}
        currentPage={currentPage}
        pageCount={pageCount}
        onPageChange={setCurrentPage}
        headerExtra={
          <Button onClick={() => { setFormSeat(null); setFormOpen(true) }}>
            <Plus className="mr-1 h-4 w-4" />
            新增坐席
          </Button>
        }
      >
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>坐席账号</TableHead>
                <TableHead>坐席密码</TableHead>
                <TableHead>关联员工</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {showTableLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={4} className="px-6 py-4">
                      <Skeleton className="h-10 w-full rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : seatQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-6 py-10 text-center text-destructive">
                    坐席列表加载失败，请稍后重试
                  </TableCell>
                </TableRow>
              ) : seats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                    {searchKeyword || selectedEmployee.employeeId ? '未找到匹配的坐席' : '暂无坐席'}
                  </TableCell>
                </TableRow>
              ) : (
                seats.map((seat) => (
                  <TableRow key={seat.id}>
                    <TableCell className="font-medium">{seat.account}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1">
                        {visiblePasswords.has(seat.id) ? seat.password : '******'}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => togglePasswordVisibility(seat.id)}
                        >
                          {visiblePasswords.has(seat.id) ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </span>
                    </TableCell>
                    <TableCell>{seat.employeeName || seat.employeePhone || '-'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFormSeat(seat)
                          setFormOpen(true)
                        }}
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setSelectedSeat(seat)
                          setDeleteOpen(true)
                        }}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        删除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DataTableSection>

      <SeatFormDialog open={formOpen} seat={formSeat} onOpenChange={setFormOpen} />
      <DeleteSeatDialog open={deleteOpen} seat={selectedSeat} onOpenChange={setDeleteOpen} />
    </div>
  )
}
