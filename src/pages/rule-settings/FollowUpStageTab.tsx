/*
 * @Author: sunbingqing
 * @Date: 2026-05-21
 * @Description: 跟进阶段设置
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
import { Plus, Trash2, Loader2, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'
import { generateId } from '@/lib/utils'
import { getFollowUpStages, saveFollowUpStages } from '@/services/rule-settings'
import type { FollowUpStage } from '@/services/rule-settings'

const NAME_MAX = 12
const DESC_MAX = 200

function assignSort(items: FollowUpStage[]): FollowUpStage[] {
  return items.map((item, index) => ({ ...item, sequence: index + 1 }))
}

export function FollowUpStageTab() {
  const [stages, setStages] = useState<FollowUpStage[] | null>(null)
  const [errors, setErrors] = useState<Record<string, { name?: string; description?: string }>>({})
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const pendingRef = useRef(false)
  const queryClient = useQueryClient()

  const { data: serverStages, isLoading } = useQuery({
    queryKey: ['followUpStages'],
    queryFn: getFollowUpStages,
    staleTime: Infinity,
  })

  useEffect(() => {
    if (serverStages && !stages && !pendingRef.current) {
      setStages(serverStages)
    }
  }, [serverStages, stages])

  const { mutate, isPending: saving } = useMutation({
    mutationFn: saveFollowUpStages,
    onSuccess: () => {
      toast.success('保存成功')
      pendingRef.current = true
      queryClient.invalidateQueries({ queryKey: ['followUpStages'] }).then(() => {
        pendingRef.current = false
        setStages(null)
      })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : '保存失败，请稍后重试')
    },
  })

  const mergedStages = stages ?? serverStages ?? []

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
    const stage = mergedStages.find((s) => String(s.id) === sid)
    if (stage?.enabled && mergedStages.filter((s) => s.enabled).length <= 2) {
      toast.error('至少保留两个启用的跟进阶段')
      return
    }
    setStages((prev) =>
      prev ? prev.map((s) => (String(s.id) === sid ? { ...s, enabled: !s.enabled } : s)) : prev,
    )
    setErrors({})
  }, [mergedStages])

  const handleNameChange = useCallback((id: string | number, name: string) => {
    const sid = String(id)
    setStages((prev) =>
      prev ? prev.map((s) => (String(s.id) === sid ? { ...s, name } : s)) : prev,
    )
    if (name.length <= NAME_MAX) {
      clearFieldError(sid, 'name')
    }
  }, [clearFieldError])

  const handleDescChange = useCallback((id: string | number, description: string) => {
    const sid = String(id)
    setStages((prev) =>
      prev ? prev.map((s) => (String(s.id) === sid ? { ...s, description } : s)) : prev,
    )
    if (description.length <= DESC_MAX) {
      clearFieldError(sid, 'description')
    }
  }, [clearFieldError])

  const handleAdd = useCallback(() => {
    setStages((prev) => {
      const list = prev ?? mergedStages
      const maxSort = list.reduce((max, s) => Math.max(max, s.sequence), 0)
      return [
        ...list,
        { id: generateId(), name: '', description: '', enabled: true, sequence: maxSort + 1 },
      ]
    })
    setErrors({})
  }, [mergedStages])

  const handleMoveUp = useCallback((index: number) => {
    setStages((prev) => {
      if (!prev || index <= 0) return prev
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return assignSort(next)
    })
  }, [])

  const handleMoveDown = useCallback((index: number) => {
    setStages((prev) => {
      if (!prev || index >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return assignSort(next)
    })
  }, [])

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return
    const sid = String(deleteTarget)
    setStages((prev) => {
      if (!prev) return prev
      return assignSort(prev.filter((s) => String(s.id) !== sid))
    })
    setErrors((prev) => {
      const { [deleteTarget]: _, ...rest } = prev
      return rest
    })
    setDeleteTarget(null)
  }, [deleteTarget])

  const duplicateNames = useMemo(() => {
    const seen = new Map<string, string[]>()
    mergedStages.forEach((s) => {
      const trimmed = s.name.trim()
      if (trimmed) {
        const ids = seen.get(trimmed) || []
        ids.push(String(s.id))
        seen.set(trimmed, ids)
      }
    })
    return new Set(
      Array.from(seen.values()).filter((ids) => ids.length > 1).flat(),
    )
  }, [mergedStages])

  const handleSave = useCallback(() => {
    const newErrors: Record<string, { name?: string; description?: string }> = {}
    let hasError = false

    const enabledStages = mergedStages.filter((s) => s.enabled)
    if (enabledStages.length < 2) {
      hasError = true
    }

    mergedStages.forEach((s) => {
      const itemErrors: { name?: string; description?: string } = {}

      if (!s.name.trim()) {
        if (s.enabled) {
          itemErrors.name = '阶段名称不能为空'
          hasError = true
        }
      } else if (s.name.length > NAME_MAX) {
        itemErrors.name = `最多${NAME_MAX}个字`
        hasError = true
      } else if (duplicateNames.has(String(s.id))) {
        itemErrors.name = '阶段名称重复'
        hasError = true
      }

      if (!s.description.trim() && s.enabled) {
        itemErrors.description = '阶段描述不能为空'
        hasError = true
      } else if (s.description.length > DESC_MAX) {
        itemErrors.description = `最多${DESC_MAX}个字`
        hasError = true
      }

      if (itemErrors.name || itemErrors.description) {
        newErrors[String(s.id)] = itemErrors
      }
    })

    setErrors(newErrors)

    if (hasError) {
      toast.error('请检查并修正下方的错误项')
      return
    }

    mutate(mergedStages)
  }, [mergedStages, duplicateNames, mutate])

  const nameError = useCallback((stage: FollowUpStage) => {
    return errors[String(stage.id)]?.name
  }, [errors])

  const descError = useCallback((stage: FollowUpStage) => {
    return errors[String(stage.id)]?.description
  }, [errors])

  if (isLoading || !stages) {
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
          <h2 className="text-lg font-semibold">跟进阶段</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            配置客户跟进流程中的各阶段，用于标识跟进进度和推进方向
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            保存
          </Button>
        </div>
      </div>

      {mergedStages.filter((s) => s.enabled).length < 2 && Object.keys(errors).length === 0 && (
        <p className="mb-4 text-xs text-destructive">请至少启用两个跟进阶段</p>
      )}

      <div className="mb-6 rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold">阶段选项</h3>

        <div className="mt-3 space-y-4">
        {mergedStages.map((stage, index) => {
          const nErr = nameError(stage)
          const dErr = descError(stage)

          return (
            <div
              key={String(stage.id)}
              className={cn(
                'flex items-start gap-3 rounded-lg border bg-card p-4',
                (nErr || dErr) && 'border-destructive/50',
              )}
            >
              <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {index + 1}
              </span>

              <LabelSwitch
                checked={stage.enabled}
                onCheckedChange={() => handleToggle(stage.id)}
                className="mt-1"
              />

              <div className={cn('flex flex-1 items-start gap-3', !stage.enabled && 'opacity-50')}>
                <div className="w-28 shrink-0">
                  <Input
                    value={stage.name}
                    onChange={(e) => handleNameChange(stage.id, e.target.value)}
                    placeholder="阶段名称"
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
                      stage.name.length > NAME_MAX ? 'text-destructive' : 'text-muted-foreground',
                    )}>
                      {stage.name.length}/{NAME_MAX}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <Textarea
                    value={stage.description}
                    onChange={(e) => handleDescChange(stage.id, e.target.value)}
                    placeholder="阶段描述"
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
                      stage.description.length > DESC_MAX ? 'text-destructive' : 'text-muted-foreground',
                    )}>
                      {stage.description.length}/{DESC_MAX}
                    </span>
                  </div>
                </div>
              </div>

              <div className={cn('ml-1 mt-1 flex shrink-0 items-center gap-0.5', !stage.enabled && 'opacity-50')}>
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="rounded border bg-background p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === mergedStages.length - 1}
                  className="rounded border bg-background p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
                >
                  <ArrowDown className="size-4" />
                </button>
                {stage.type === 'SYSTEM_DEFINED' ? (
                  <Badge variant="secondary" className="ml-1 shrink-0">
                    默认项
                  </Badge>
                ) : (
                  <button
                    onClick={() => setDeleteTarget(String(stage.id))}
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
          添加跟进阶段
        </Button>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除该跟进阶段吗？删除后不可恢复。
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
