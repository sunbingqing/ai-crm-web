/*
 * @Author: sunbingqing
 * @Date: 2026-06-13
 * @Description: 新增/编辑坐席弹窗组件
 * @Copyright: ©2021 杭州杰竞科技有限公司 版权所有
 */

import { useEffect, useMemo, useState } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ComboboxRoot } from '@base-ui/react/combobox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SearchableSelect, type SearchableSelectOption } from '@/components/filters/SearchableSelect'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { type CallSeatVO, createCallSeat, updateCallSeat } from '@/services/call-seat'
import { searchUsers, type UserVO } from '@/services/member'
import { cn } from '@/lib/utils'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface EmployeeOption extends SearchableSelectOption {
  employeeId?: string
}

function formatUserLabel(user: UserVO) {
  return user.phone ? `${user.username} · ${user.phone}` : user.username
}

interface SeatFormDialogProps {
  open: boolean
  seat: CallSeatVO | null
  onOpenChange: (open: boolean) => void
}

export function SeatFormDialog({ open, seat, onOpenChange }: SeatFormDialogProps) {
  const isEdit = seat != null
  const [form, setForm] = useState({ account: '', password: '', employeeId: '' })
  const [errors, setErrors] = useState<Record<string, string | null>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [employeeOpen, setEmployeeOpen] = useState(false)
  const [employeeKeyword, setEmployeeKeyword] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeOption | null>(null)
  const queryClient = useQueryClient()

  const effectiveEmployeeKeyword = useMemo(() => {
    const trimmed = employeeKeyword.trim()
    return trimmed === (selectedEmployee?.label ?? '') ? '' : trimmed
  }, [employeeKeyword, selectedEmployee?.label])

  const employeeQuery = useInfiniteQuery({
    queryKey: ['seat-form', 'employees', effectiveEmployeeKeyword],
    queryFn: ({ pageParam = 1 }) =>
      searchUsers({ keyword: effectiveEmployeeKeyword, current: pageParam, size: 8 }),
    enabled: open && employeeOpen,
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
    return users.map((user) => ({
      key: `member-${user.id}`,
      label: formatUserLabel(user),
      description: user.phone || '暂无手机号',
      employeeId: user.id,
    }))
  }, [employeeQuery.data?.pages])

  useEffect(() => {
    if (!open) return
    setErrors({})
    setShowPassword(false)
    setEmployeeOpen(false)
    if (seat) {
      setForm({
        account: seat.account ?? '',
        password: seat.password ?? '',
        employeeId: seat.employeeId ?? '',
      })
      const label = seat.employeeName && seat.employeePhone
        ? `${seat.employeeName} · ${seat.employeePhone}`
        : seat.employeeName || seat.employeePhone || ''
      setSelectedEmployee(label && seat.employeeId ? {
        key: `member-${seat.employeeId}`,
        label,
        employeeId: seat.employeeId,
      } : null)
      setEmployeeKeyword(label)
    } else {
      setForm({ account: '', password: '', employeeId: '' })
      setSelectedEmployee(null)
      setEmployeeKeyword('')
    }
  }, [open, seat])

  function clearError(field: string) {
    setErrors((prev) => {
      if (!prev[field]) return prev
      return { ...prev, [field]: null }
    })
  }

  function handleEmployeeInputValueChange(value: string, details: ComboboxRoot.ChangeEventDetails) {
    setEmployeeKeyword(value)
    if (details.reason === 'input-change' || details.reason === 'input-clear' || details.reason === 'clear-press') {
      setSelectedEmployee(null)
      setForm((f) => ({ ...f, employeeId: '' }))
    }
  }

  function handleEmployeeValueChange(option: EmployeeOption | null) {
    setSelectedEmployee(option)
    setEmployeeKeyword(option?.label ?? '')
    setForm((f) => ({ ...f, employeeId: option?.employeeId ?? '' }))
    setEmployeeOpen(false)
    clearError('employeeId')
  }

  const { mutate, isPending } = useMutation({
    mutationFn: isEdit
      ? () => updateCallSeat({ id: seat.id, ...form })
      : () => createCallSeat(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-seats'] })
      onOpenChange(false)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : '保存失败')
    },
  })

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const newErrors: Record<string, string | null> = { account: null, password: null, employeeId: null }
    let hasError = false

    if (!form.account.trim()) {
      newErrors.account = '坐席账号不能为空'
      hasError = true
    }
    if (!form.password.trim()) {
      newErrors.password = '坐席密码不能为空'
      hasError = true
    }
    if (!form.employeeId) {
      newErrors.employeeId = '关联员工不能为空'
      hasError = true
    }

    setErrors(newErrors)
    if (hasError) return

    mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑坐席' : '新增坐席'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start gap-4">
            <label className="text-sm font-medium shrink-0 w-20 text-right pt-2">坐席账号</label>
            <div className="flex-1">
              <Input
                placeholder="请输入坐席账号"
                value={form.account}
                onChange={(e) => { setForm({ ...form, account: e.target.value }); clearError('account') }}
                className={cn(errors.account && 'border-destructive')}
              />
              {errors.account && <p className="mt-1 text-xs text-destructive">{errors.account}</p>}
            </div>
          </div>
          <div className="flex items-start gap-4">
            <label className="text-sm font-medium shrink-0 w-20 text-right pt-2">坐席密码</label>
            <div className="flex-1">
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="请输入坐席密码"
                  value={form.password}
                  onChange={(e) => { setForm({ ...form, password: e.target.value }); clearError('password') }}
                  className={cn('pr-9', errors.password && 'border-destructive')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
            </div>
          </div>
          <div className="flex items-start gap-4">
            <label className="text-sm font-medium shrink-0 w-20 text-right pt-2">关联员工</label>
            <div className="flex-1">
              <SearchableSelect
                options={employeeOptions}
                value={selectedEmployee}
                inputValue={employeeKeyword}
                open={employeeOpen}
                placeholder="请选择关联员工"
                emptyText="没有找到匹配的员工"
                errorText="员工列表加载失败，请稍后重试"
                isLoading={employeeQuery.isLoading}
                isError={employeeQuery.isError}
                hasNextPage={employeeQuery.hasNextPage}
                isFetchingNextPage={employeeQuery.isFetchingNextPage}
                className={cn(errors.employeeId && 'border-destructive')}
                showClear={selectedEmployee != null}
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
              {errors.employeeId && <p className="mt-1 text-xs text-destructive">{errors.employeeId}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
