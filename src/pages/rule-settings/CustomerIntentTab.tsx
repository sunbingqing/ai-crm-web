/*
 * @Author: sunbingqing
 * @Date: 2026-05-21
 * @Description: 客户意向设置
 * @Copyright: ©2021 杭州杰竞科技有限公司 版权所有
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LabelSwitch } from '@/components/label-switch'
import { cn } from '@/lib/utils'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { generateId } from '@/lib/utils'
import { getIntentOptions, saveIntentOptions } from '@/services/rule-settings'
import type { IntentOption } from '@/services/rule-settings'

const NAME_MAX = 12
const DESC_MAX = 200

export function CustomerIntentTab() {
  const [options, setOptions] = useState<IntentOption[] | null>(null)
  const [errors, setErrors] = useState<Record<string, { name?: string; description?: string }>>({})
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const pendingRef = useRef(false)
  const queryClient = useQueryClient()

  const { data: serverOptions, isLoading } = useQuery({
    queryKey: ['intentOptions'],
    queryFn: getIntentOptions,
    staleTime: Infinity,
  })

  useEffect(() => {
    if (serverOptions && !options && !pendingRef.current) {
      setOptions(serverOptions)
    }
  }, [serverOptions, options])

  const { mutate, isPending: saving } = useMutation({
    mutationFn: saveIntentOptions,
    onSuccess: () => {
      toast.success('保存成功')
      pendingRef.current = true
      queryClient.invalidateQueries({ queryKey: ['intentOptions'] }).then(() => {
        pendingRef.current = false
        setOptions(null)
      })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : '保存失败，请稍后重试')
    },
  })

  const mergedOptions = options ?? serverOptions ?? []

  const clearFieldError = useCallback((id: string, field: 'name' | 'description') => {
    setErrors((prev) => {
      const cur = prev[id]
      if (!cur) return prev
      const next = { ...cur, [field]: undefined }
      if (!next.name && !next.description) {
        const { [id]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [id]: next }
    })
  }, [])

  const handleToggle = useCallback((id: string | number) => {
    const sid = String(id)
    const option = mergedOptions.find((o) => String(o.id) === sid)
    if (option?.enabled && mergedOptions.filter((o) => o.enabled).length <= 1) {
      toast.error('至少保留一个启用的意向选项')
      return
    }
    setOptions((prev) =>
      prev ? prev.map((o) => (String(o.id) === sid ? { ...o, enabled: !o.enabled } : o)) : prev,
    )
    setErrors({})
  }, [mergedOptions])

  const handleNameChange = useCallback((id: string | number, name: string) => {
    const sid = String(id)
    setOptions((prev) =>
      prev ? prev.map((o) => (String(o.id) === sid ? { ...o, name } : o)) : prev,
    )
    if (name.length <= NAME_MAX) {
      clearFieldError(sid, 'name')
    }
  }, [clearFieldError])

  const handleDescChange = useCallback((id: string | number, description: string) => {
    const sid = String(id)
    setOptions((prev) =>
      prev ? prev.map((o) => (String(o.id) === sid ? { ...o, description } : o)) : prev,
    )
    if (description.length <= DESC_MAX) {
      clearFieldError(sid, 'description')
    }
  }, [clearFieldError])

  const handleAdd = useCallback(() => {
    setOptions((prev) => [
      ...(prev ?? mergedOptions),
      { id: generateId(), name: '', description: '', enabled: true },
    ])
    setErrors({})
  }, [mergedOptions])

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return
    const sid = String(deleteTarget)
    setOptions((prev) => prev ? prev.filter((o) => String(o.id) !== sid) : prev)
    setErrors((prev) => {
      const { [sid]: _, ...rest } = prev
      return rest
    })
    setDeleteTarget(null)
  }, [deleteTarget])

  const duplicateNames = useMemo(() => {
    const seen = new Map<string, string[]>()
    mergedOptions.forEach((o) => {
      const trimmed = o.name.trim()
      if (trimmed) {
        const ids = seen.get(trimmed) || []
        ids.push(String(o.id))
        seen.set(trimmed, ids)
      }
    })
    return new Set(
      Array.from(seen.values()).filter((ids) => ids.length > 1).flat(),
    )
  }, [mergedOptions])

  const handleSave = useCallback(() => {
    const newErrors: Record<string, { name?: string; description?: string }> = {}
    let hasError = false

    const enabledOptions = mergedOptions.filter((o) => o.enabled)
    if (enabledOptions.length === 0) {
      hasError = true
    }

    mergedOptions.forEach((o) => {
      const itemErrors: { name?: string; description?: string } = {}

      if (!o.name.trim()) {
        if (o.enabled) {
          itemErrors.name = '选项名称不能为空'
          hasError = true
        }
      } else if (o.name.length > NAME_MAX) {
        itemErrors.name = `最多${NAME_MAX}个字`
        hasError = true
      } else if (duplicateNames.has(String(o.id))) {
        itemErrors.name = '选项名称重复'
        hasError = true
      }

      if (!o.description.trim() && o.enabled) {
        itemErrors.description = '选项描述不能为空'
        hasError = true
      } else if (o.description.length > DESC_MAX) {
        itemErrors.description = `最多${DESC_MAX}个字`
        hasError = true
      }

      if (itemErrors.name || itemErrors.description) {
        newErrors[String(o.id)] = itemErrors
      }
    })

    setErrors(newErrors)

    if (hasError) {
      toast.error('请检查并修正下方的错误项')
      return
    }

    mutate(mergedOptions)
  }, [mergedOptions, duplicateNames, mutate])

  const nameError = useCallback((option: IntentOption) => {
    return errors[String(option.id)]?.name
  }, [errors])

  const descError = useCallback((option: IntentOption) => {
    return errors[String(option.id)]?.description
  }, [errors])

  if (isLoading || !options) {
    return (
      <div className="mx-auto flex w-full max-w-3xl items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">客户意向</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            配置商机热度分层，帮助判断客户推进价值和跟进优先级
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            保存
          </Button>
        </div>
      </div>

      {mergedOptions.filter((o) => o.enabled).length === 0 && Object.keys(errors).length === 0 && (
        <p className="mb-4 text-xs text-destructive">请至少启用一个意向选项</p>
      )}

      <div className="mb-6 rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold">意向选项</h3>

        <div className="mt-3 space-y-4">
        {mergedOptions.map((option) => {
          const nErr = nameError(option)
          const dErr = descError(option)

          return (
            <div
              key={String(option.id)}
              className={cn(
                'flex items-start gap-3 rounded-lg border bg-card p-4',
                (nErr || dErr) && 'border-destructive/50',
              )}
            >
              <LabelSwitch
                checked={option.enabled}
                onCheckedChange={() => handleToggle(option.id)}
                className="mt-1"
              />

              <div className={cn('flex flex-1 items-start gap-3', !option.enabled && 'opacity-50')}>
                <div className="w-28 shrink-0">
                  <Input
                    value={option.name}
                    onChange={(e) => handleNameChange(option.id, e.target.value)}
                    placeholder="选项名称"
                    className={cn('h-9', nErr && 'border-destructive')}
                    maxLength={NAME_MAX + 10}
                  />
                  <div className="mt-0.5 flex justify-between">
                    {nErr ? (
                      <span className="text-xs text-destructive">{nErr}</span>
                    ) : (
                      <span />
                    )}
                    <span className={cn(
                      'text-xs',
                      option.name.length > NAME_MAX ? 'text-destructive' : 'text-muted-foreground',
                    )}>
                      {option.name.length}/{NAME_MAX}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <Textarea
                    value={option.description}
                    onChange={(e) => handleDescChange(option.id, e.target.value)}
                    placeholder="选项描述"
                    className={cn('min-h-9 resize-none', dErr && 'border-destructive')}
                    rows={2}
                    maxLength={DESC_MAX + 20}
                  />
                  <div className="mt-0.5 flex justify-between">
                    {dErr ? (
                      <span className="text-xs text-destructive">{dErr}</span>
                    ) : (
                      <span />
                    )}
                    <span className={cn(
                      'text-xs',
                      option.description.length > DESC_MAX ? 'text-destructive' : 'text-muted-foreground',
                    )}>
                      {option.description.length}/{DESC_MAX}
                    </span>
                  </div>
                </div>
              </div>

              <div className={cn('mt-1 shrink-0', !option.enabled && 'opacity-50')}>
                {option.type === 'SYSTEM_DEFINED' ? (
                  <Badge variant="secondary" className="ml-1 shrink-0">
                  默认项
                </Badge>
              ) : (
                <button
                  onClick={() => setDeleteTarget(String(option.id))}
                  className="ml-1 rounded border bg-background p-0.5 text-muted-foreground hover:bg-accent hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
              </div>
            </div>
          )
        })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="mt-4"
        >
          <Plus className="mr-1.5 size-4" />
          添加意向选项
        </Button>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除该意向选项吗？删除后不可恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" size="sm" />}>
              取消
            </DialogClose>
            <Button variant="destructive" size="sm" onClick={confirmDelete}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
