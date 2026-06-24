/*
 * @Author: sunbingqing
 * @Date: 2026-05-22
 * @Description: 会话质量设置
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
import { getScoringDimensions, saveScoringDimensions } from '@/services/rule-settings'
import type { ScoringDimension } from '@/services/rule-settings'

const NAME_MAX = 12
const DESC_MAX = 200

export function SessionQualityTab() {
  const [dimensions, setDimensions] = useState<ScoringDimension[] | null>(null)
  const [errors, setErrors] = useState<Record<string, { name?: string; description?: string }>>({})
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const pendingRef = useRef(false)
  const queryClient = useQueryClient()

  const { data: serverDimensions, isLoading } = useQuery({
    queryKey: ['scoringDimensions'],
    queryFn: getScoringDimensions,
    staleTime: Infinity,
  })

  useEffect(() => {
    if (serverDimensions && !dimensions && !pendingRef.current) {
      setDimensions(serverDimensions)
    }
  }, [serverDimensions, dimensions])

  const { mutate, isPending: saving } = useMutation({
    mutationFn: saveScoringDimensions,
    onSuccess: () => {
      toast.success('保存成功')
      pendingRef.current = true
      queryClient.invalidateQueries({ queryKey: ['scoringDimensions'] }).then(() => {
        pendingRef.current = false
        setDimensions(null)
      })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : '保存失败，请稍后重试')
    },
  })

  const mergedDimensions = dimensions ?? serverDimensions ?? []

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
    const dim = mergedDimensions.find((d) => String(d.id) === sid)
    if (dim?.enabled && mergedDimensions.filter((d) => d.enabled).length <= 1) {
      toast.error('至少保留一个启用的评分维度')
      return
    }
    setDimensions((prev) =>
      prev ? prev.map((d) => (String(d.id) === sid ? { ...d, enabled: !d.enabled } : d)) : prev,
    )
    setErrors({})
  }, [mergedDimensions])

  const handleNameChange = useCallback((id: string | number, name: string) => {
    const sid = String(id)
    setDimensions((prev) =>
      prev ? prev.map((d) => (String(d.id) === sid ? { ...d, name } : d)) : prev,
    )
    if (name.length <= NAME_MAX) {
      clearFieldError(sid, 'name')
    }
  }, [clearFieldError])

  const handleDescChange = useCallback((id: string | number, description: string) => {
    const sid = String(id)
    setDimensions((prev) =>
      prev ? prev.map((d) => (String(d.id) === sid ? { ...d, description } : d)) : prev,
    )
    if (description.length <= DESC_MAX) {
      clearFieldError(sid, 'description')
    }
  }, [clearFieldError])

  const handleAdd = useCallback(() => {
    setDimensions((prev) => [
      ...(prev ?? mergedDimensions),
      { id: generateId(), name: '', description: '', enabled: true },
    ])
    setErrors({})
  }, [mergedDimensions])

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return
    const sid = String(deleteTarget)
    setDimensions((prev) => prev ? prev.filter((d) => String(d.id) !== sid) : prev)
    setErrors((prev) => {
      const { [sid]: _, ...rest } = prev
      return rest
    })
    setDeleteTarget(null)
  }, [deleteTarget])

  const duplicateNames = useMemo(() => {
    const seen = new Map<string, string[]>()
    mergedDimensions.forEach((d) => {
      const trimmed = d.name.trim()
      if (trimmed) {
        const ids = seen.get(trimmed) || []
        ids.push(String(d.id))
        seen.set(trimmed, ids)
      }
    })
    return new Set(
      Array.from(seen.values()).filter((ids) => ids.length > 1).flat(),
    )
  }, [mergedDimensions])

  const handleSave = useCallback(() => {
    const newErrors: Record<string, { name?: string; description?: string }> = {}
    let hasError = false

    const enabledDimensions = mergedDimensions.filter((d) => d.enabled)
    if (enabledDimensions.length === 0) {
      hasError = true
    }

    mergedDimensions.forEach((d) => {
      const itemErrors: { name?: string; description?: string } = {}

      if (!d.name.trim()) {
        if (d.enabled) {
          itemErrors.name = '维度名称不能为空'
          hasError = true
        }
      } else if (d.name.length > NAME_MAX) {
        itemErrors.name = `最多${NAME_MAX}个字`
        hasError = true
      } else if (duplicateNames.has(String(d.id))) {
        itemErrors.name = '维度名称重复'
        hasError = true
      }

      if (!d.description.trim() && d.enabled) {
        itemErrors.description = '维度描述不能为空'
        hasError = true
      } else if (d.description.length > DESC_MAX) {
        itemErrors.description = `最多${DESC_MAX}个字`
        hasError = true
      }

      if (itemErrors.name || itemErrors.description) {
        newErrors[String(d.id)] = itemErrors
      }
    })

    setErrors(newErrors)

    if (hasError) {
      toast.error('请检查并修正下方的错误项')
      return
    }

    mutate(mergedDimensions)
  }, [mergedDimensions, duplicateNames, mutate])

  const nameError = useCallback((dim: ScoringDimension) => {
    return errors[String(dim.id)]?.name
  }, [errors])

  const descError = useCallback((dim: ScoringDimension) => {
    return errors[String(dim.id)]?.description
  }, [errors])

  if (isLoading || !dimensions) {
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
          <h2 className="text-lg font-semibold">会话质量</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            配置销售会话质检口径，衡量需求识别、异议承接、价值表达、推进动作和沟通表达质量
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            保存
          </Button>
        </div>
      </div>

      {mergedDimensions.filter((d) => d.enabled).length === 0 && Object.keys(errors).length === 0 && (
        <p className="mb-4 text-xs text-destructive">请至少启用一个评分维度</p>
      )}

      <div className="mb-6 rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold">综合得分计算方式</h3>
        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">计算公式：</span><span className="rounded bg-muted px-1 py-0.5">综合得分 = 有评分依据的维度得分之和 ÷ 有评分依据的维度数量（如有小数，按四舍五入取整数）</span>
          </p>
          <p><span className="font-medium text-foreground">说明：</span>未识别到有效评分依据的维度不参与计算。</p>
          <p><span className="font-medium text-foreground">示例：</span>需求识别 80 分、异议承接 70 分、推进动作 90 分、沟通表达 85 分；价值表达无有效评分依据。则：(80 + 70 + 90 + 85) ÷ 4 = 81.25，综合得分为 81 分。</p>
        </div>
      </div>

      <div className="mb-6 rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold">评分维度</h3>

        <div className="mt-3 space-y-4">
        {mergedDimensions.map((dim) => {
          const nErr = nameError(dim)
          const dErr = descError(dim)

          return (
            <div
              key={String(dim.id)}
              className={cn(
                'flex items-start gap-3 rounded-lg border bg-card p-4',
                (nErr || dErr) && 'border-destructive/50',
              )}
            >
              <LabelSwitch
                checked={dim.enabled}
                onCheckedChange={() => handleToggle(dim.id)}
                className="mt-1"
              />

              <div className={cn('flex flex-1 items-start gap-3', !dim.enabled && 'opacity-50')}>
                <div className="w-28 shrink-0">
                  <Input
                    value={dim.name}
                    onChange={(e) => handleNameChange(dim.id, e.target.value)}
                    placeholder="维度名称"
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
                      dim.name.length > NAME_MAX ? 'text-destructive' : 'text-muted-foreground',
                    )}>
                      {dim.name.length}/{NAME_MAX}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <Textarea
                    value={dim.description}
                    onChange={(e) => handleDescChange(dim.id, e.target.value)}
                    placeholder="维度描述"
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
                      dim.description.length > DESC_MAX ? 'text-destructive' : 'text-muted-foreground',
                    )}>
                      {dim.description.length}/{DESC_MAX}
                    </span>
                  </div>
                </div>
              </div>

              <div className={cn('mt-1 shrink-0', !dim.enabled && 'opacity-50')}>
                {dim.type === 'SYSTEM_DEFINED' ? (
                  <Badge variant="secondary" className="ml-1 shrink-0">
                    默认项
                  </Badge>
                ) : (
                  <button
                    onClick={() => setDeleteTarget(String(dim.id))}
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
          添加评分维度
        </Button>
      </div>

      <div className="mb-6 rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold">评分标准</h3>
        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
          <p><span className="inline-block w-24 font-medium text-foreground">90-100 分</span>表现优秀，关键动作完整，有清晰证据。</p>
          <p><span className="inline-block w-24 font-medium text-foreground">80-89 分</span>表现较好，基本完成关键动作，只有轻微不足。</p>
          <p><span className="inline-block w-24 font-medium text-foreground">70-79 分</span>基本达标，但存在明显可改进点。</p>
          <p><span className="inline-block w-24 font-medium text-foreground">60-69 分</span>表现偏弱，关键动作不完整，对推进有影响。</p>
          <p><span className="inline-block w-24 font-medium text-foreground">0-59 分</span>明显不足，关键动作缺失、误判或方向错误。</p>
        </div>
      </div>

      <div className="mb-6 rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold">质量等级</h3>
        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
          <p><span className="inline-block w-8 font-medium text-foreground">高</span>85-100 分</p>
          <p><span className="inline-block w-8 font-medium text-foreground">中</span>70-84 分</p>
          <p><span className="inline-block w-8 font-medium text-foreground">低</span>0-69 分</p>
        </div>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除该评分维度吗？删除后不可恢复。
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
