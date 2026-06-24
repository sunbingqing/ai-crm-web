/*
 * @Author: sunbingqing
 * @Date: 2026-05-21
 * @Description: 客户标签设置
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
import {
  getProfileDimensions,
  saveProfileDimensions,
  type ProfileDimension,
  type ProfileOption,
  type DimensionItem,
} from '@/services/rule-settings'

const NAME_MAX = 12
const DESC_MAX = 200
const SUGGESTION_MAX = 50
const DIM_NAME_MAX = 12

function getDimKey(dim: ProfileDimension, index: number): string {
  return dim.dimension || `__new_${index}`
}

function buildSaveDimensionsRequest(dims: ProfileDimension[]): DimensionItem[] {
  return dims.map((d) => ({
    type: d.type,
    dimension: d.dimension,
    enabled: d.enabled,
    options: d.options.map((o) => ({
      type: o.type,
      option: o.option,
      description: o.description,
      suggestion: o.suggestion,
      enabled: o.enabled,
    })),
  }))
}

export function CustomerTagTab() {
  const [dims, setDims] = useState<ProfileDimension[] | null>(null)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [errors, setErrors] = useState<Record<string, { option?: string; description?: string; suggestion?: string }>>({})
  const [dimNameError, setDimNameError] = useState('')
  const [deleteOptTarget, setDeleteOptTarget] = useState<{ dimIdx: number; optIdx: number } | null>(null)
  const [deleteDimTarget, setDeleteDimTarget] = useState<number | null>(null)
  const pendingRef = useRef(false)
  const queryClient = useQueryClient()

  const { data: serverDims, isLoading } = useQuery({
    queryKey: ['profileDimensions'],
    queryFn: getProfileDimensions,
    staleTime: Infinity,
  })

  useEffect(() => {
    if (serverDims && !dims && !pendingRef.current) {
      setDims(serverDims)
    }
  }, [serverDims, dims])

  const { mutate: saveMutate, isPending: saving } = useMutation({
    mutationFn: saveProfileDimensions,
    onSuccess: () => {
      toast.success('保存成功')
      pendingRef.current = true
      queryClient.invalidateQueries({ queryKey: ['profileDimensions'] }).then(() => {
        pendingRef.current = false
        setDims(null)
      })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : '保存失败，请稍后重试')
    },
  })

  const mergedDims = dims ?? serverDims ?? []
  const selectedDim = mergedDims[selectedIdx] ?? mergedDims[0]
  const selectedOpts = selectedDim?.options ?? []

  const clearFieldError = useCallback((optIdx: number, field: 'option' | 'description' | 'suggestion') => {
    const key = `${selectedIdx}_${optIdx}`
    setErrors((prev) => {
      const cur = prev[key]
      if (!cur) return prev
      const next = { ...cur, [field]: undefined }
      if (!next.option && !next.description && !next.suggestion) {
        const { [key]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [key]: next }
    })
  }, [selectedIdx])

  const updateDim = useCallback((patch: Partial<ProfileDimension>) => {
    setDims((prev) => {
      if (!prev) return prev
      return prev.map((d, i) => (i === selectedIdx ? { ...d, ...patch } : d))
    })
    if (patch.dimension !== undefined && patch.dimension.length <= DIM_NAME_MAX) {
      setDimNameError('')
    }
  }, [selectedIdx])

  const handleDimToggle = useCallback(() => {
    if (selectedDim?.enabled && mergedDims.filter((d) => d.enabled).length <= 1) {
      toast.error('至少保留一个启用维度')
      return
    }
    const newEnabled = !selectedDim?.enabled
    setDims((prev) => {
      if (!prev) return prev
      return prev.map((d, i) =>
        i === selectedIdx
          ? {
              ...d,
              enabled: newEnabled,
              options: d.options.map((o) => ({ ...o, enabled: newEnabled })),
            }
          : d,
      )
    })
  }, [selectedDim, mergedDims, selectedIdx])

  const updateOpt = useCallback((optIdx: number, patch: Partial<ProfileOption>) => {
    setDims((prev) => {
      if (!prev) return prev
      return prev.map((d, i) =>
        i === selectedIdx
          ? { ...d, options: d.options.map((o, j) => (j === optIdx ? { ...o, ...patch } : o)) }
          : d,
      )
    })
  }, [selectedIdx])

  const handleOptToggle = useCallback((optIdx: number) => {
    if (!selectedDim?.enabled) {
      return
    }
    const opt = selectedOpts[optIdx]
    if (opt?.enabled && selectedOpts.filter((o) => o.enabled).length <= 1) {
      toast.error('至少保留一个启用标签')
      return
    }
    updateOpt(optIdx, { enabled: !opt?.enabled })
    setErrors({})
  }, [selectedDim, selectedOpts, updateOpt])

  const handleOptNameChange = useCallback((optIdx: number, option: string) => {
    updateOpt(optIdx, { option })
    if (option.length <= NAME_MAX) clearFieldError(optIdx, 'option')
  }, [updateOpt, clearFieldError])

  const handleOptDescChange = useCallback((optIdx: number, description: string) => {
    updateOpt(optIdx, { description })
    if (description.length <= DESC_MAX) clearFieldError(optIdx, 'description')
  }, [updateOpt, clearFieldError])

  const handleOptSuggestionChange = useCallback((optIdx: number, suggestion: string) => {
    updateOpt(optIdx, { suggestion })
    if (suggestion.length <= SUGGESTION_MAX) clearFieldError(optIdx, 'suggestion')
  }, [updateOpt, clearFieldError])

  const handleAddOpt = useCallback(() => {
    setDims((prev) => {
      if (!prev) return prev
      return prev.map((d, i) =>
        i === selectedIdx
          ? { ...d, options: [...d.options, { option: '', description: '', suggestion: '', enabled: d.enabled }] }
          : d,
      )
    })
    setErrors({})
  }, [selectedIdx])

  const handleDeleteOpt = useCallback((dimIdx: number, optIdx: number) => {
    setDims((prev) => {
      if (!prev) return prev
      return prev.map((d, i) =>
        i === dimIdx ? { ...d, options: d.options.filter((_, j) => j !== optIdx) } : d,
      )
    })
    setDeleteOptTarget(null)
  }, [])

  const handleSelectDim = useCallback((idx: number) => {
    setSelectedIdx(idx)
    setErrors({})
    setDimNameError('')
  }, [])

  const handleAddDim = useCallback(() => {
    const newDim: ProfileDimension = {
      dimension: '',
      enabled: true,
      options: [{ option: '', description: '', suggestion: '', enabled: true }],
    }
    setDims((prev) => [...(prev ?? mergedDims), newDim])
    setSelectedIdx(mergedDims.length)
    setErrors({})
  }, [mergedDims])

  const handleDeleteDim = useCallback(() => {
    if (deleteDimTarget === null) return
    const dimIdx = deleteDimTarget
    setDims((prev) => {
      if (!prev) return prev
      const next = prev.filter((_, i) => i !== dimIdx)
      if (selectedIdx === dimIdx || selectedIdx >= next.length) {
        setSelectedIdx(Math.max(0, next.length - 1))
      }
      return next
    })
    setDeleteDimTarget(null)
  }, [deleteDimTarget, selectedIdx])

  const duplicateNames = useMemo(() => {
    const seen = new Map<string, number[]>()
    selectedOpts.forEach((o, idx) => {
      const trimmed = o.option.trim()
      if (trimmed) {
        const indices = seen.get(trimmed) || []
        indices.push(idx)
        seen.set(trimmed, indices)
      }
    })
    return new Set(
      Array.from(seen.values()).filter((indices) => indices.length > 1).flat(),
    )
  }, [selectedOpts])

  const handleSave = useCallback(() => {
    if (!selectedDim) return

    let hasError = false

    if (!selectedDim.dimension.trim()) {
      setDimNameError('维度名称不能为空')
      hasError = true
    } else if (selectedDim.dimension.length > DIM_NAME_MAX) {
      setDimNameError(`最多${DIM_NAME_MAX}个字`)
      hasError = true
    } else if (mergedDims.some((d, i) => i !== selectedIdx && d.dimension === selectedDim.dimension)) {
      setDimNameError('维度名称重复')
      hasError = true
    } else {
      setDimNameError('')
    }

    const newErrors: Record<string, { option?: string; description?: string }> = {}
    if (selectedDim.enabled) {
      const enabledOpts = selectedOpts.filter((o) => o.enabled)
      if (enabledOpts.length === 0) {
        hasError = true
        toast.error('请至少启用一个标签选项')
      }
    }

    selectedOpts.forEach((o, optIdx) => {
      const key = `${selectedIdx}_${optIdx}`
      const itemErrors: { option?: string; description?: string; suggestion?: string } = {}

      if (!o.option.trim()) {
        if (o.enabled) {
          itemErrors.option = '标签名称不能为空'
          hasError = true
        }
      } else if (o.option.length > NAME_MAX) {
        itemErrors.option = `最多${NAME_MAX}个字`
        hasError = true
      } else if (duplicateNames.has(optIdx)) {
        itemErrors.option = '标签名称重复'
        hasError = true
      }

      if (!o.description.trim() && o.enabled) {
        itemErrors.description = '标签描述不能为空'
        hasError = true
      } else if (o.description.length > DESC_MAX) {
        itemErrors.description = `最多${DESC_MAX}个字`
        hasError = true
      }

      if (o.suggestion && o.suggestion.length > SUGGESTION_MAX) {
        itemErrors.suggestion = `最多${SUGGESTION_MAX}个字`
        hasError = true
      }

      if (itemErrors.option || itemErrors.description || itemErrors.suggestion) {
        newErrors[key] = itemErrors
      }
    })

    setErrors(newErrors)

    if (hasError) {
      toast.error('请检查并修正下方的错误项')
      return
    }

    saveMutate(buildSaveDimensionsRequest(mergedDims))
  }, [selectedDim, selectedOpts, selectedIdx, duplicateNames, mergedDims, saveMutate])

  const optError = useCallback((optIdx: number) => {
    return errors[`${selectedIdx}_${optIdx}`]
  }, [errors, selectedIdx])

  if (isLoading || !dims) {
    return (
      <div className="mx-auto flex w-full max-w-4xl items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const systemDims = mergedDims.filter((d) => d.type === 'SYSTEM_DEFINED')
  const customDims = mergedDims.filter((d) => d.type !== 'SYSTEM_DEFINED')

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">客户标签</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            配置客户画像标签，沉淀需求特征、决策偏好和商机线索
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            保存
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-44 shrink-0">
          <div className="space-y-0.5 rounded-lg border bg-card p-3">
            <h3 className="mb-2 text-sm font-semibold">系统默认维度</h3>
            {systemDims.length === 0 && (
              <p className="px-2 py-1 text-xs text-muted-foreground">暂无</p>
            )}
            {systemDims.map((dim) => {
              const idx = mergedDims.indexOf(dim)
              return (
                <button
                  key={getDimKey(dim, idx)}
                  onClick={() => handleSelectDim(idx)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors',
                    selectedIdx === idx
                      ? 'bg-accent font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                    !dim.enabled && 'opacity-50',
                  )}
                >
                  <span className="truncate">{dim.dimension || '未命名维度'}</span>
                  {!dim.enabled && (
                    <Badge variant="outline" className="ml-1 shrink-0 text-xs text-muted-foreground">停用</Badge>
                  )}
                </button>
              )
            })}

            <h3 className="mt-3 mb-2 border-t pt-3 text-sm font-semibold">自定义维度</h3>
            {customDims.length === 0 && (
              <p className="px-2 py-1 text-xs text-muted-foreground">暂无</p>
            )}
            {customDims.map((dim) => {
              const idx = mergedDims.indexOf(dim)
              return (
                <button
                  key={getDimKey(dim, idx)}
                  onClick={() => handleSelectDim(idx)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors',
                    selectedIdx === idx
                      ? 'bg-accent font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                    !dim.enabled && 'opacity-50',
                  )}
                >
                  <span className="truncate">{dim.dimension || '未命名维度'}</span>
                  {!dim.enabled && (
                    <Badge variant="outline" className="ml-1 shrink-0 text-xs text-muted-foreground">停用</Badge>
                  )}
                </button>
              )
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddDim}
              className="mt-1 w-full text-xs"
            >
              <Plus className="mr-1 size-3" />
              添加维度
            </Button>
          </div>
        </div>

        <div className="min-w-0 flex-1 rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">维度设置</h3>
          <div className="flex items-center gap-3">
            {selectedDim?.type === 'SYSTEM_DEFINED' && (
              <span className="text-sm font-medium">{selectedDim?.dimension ?? '未命名维度'}</span>
            )}
            <LabelSwitch
              checked={selectedDim?.enabled ?? false}
              onCheckedChange={handleDimToggle}
            />
            {selectedDim?.type === 'SYSTEM_DEFINED' ? null : (
              <>
                <Input
                  value={selectedDim?.dimension ?? ''}
                  onChange={(e) => updateDim({ dimension: e.target.value })}
                  placeholder="请输入维度名称"
                  className={cn('h-8 w-36', dimNameError && 'border-destructive')}
                  maxLength={DIM_NAME_MAX + 10}
                />
                {dimNameError ? (
                  <span className="text-xs text-destructive">{dimNameError}</span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {(selectedDim?.dimension?.length ?? 0)}/{DIM_NAME_MAX}
                  </span>
                )}
                <button
                  onClick={() => setDeleteDimTarget(selectedIdx)}
                  className="ml-auto rounded border bg-background p-0.5 text-muted-foreground hover:bg-accent hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </>
            )}
          </div>

          <h3 className="mb-3 mt-4 border-t pt-4 text-sm font-semibold">选项设置</h3>
          <div className={cn(!selectedDim?.enabled && 'opacity-50')}>
          <div className="space-y-3">
            {selectedOpts.map((opt, optIdx) => {
              const err = optError(optIdx)
              return (
                <div
                  key={optIdx}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border bg-card p-3',
                    (err?.option || err?.description || err?.suggestion) && 'border-destructive/50',
                  )}
                >
                  <LabelSwitch
                    checked={opt.enabled}
                    onCheckedChange={() => handleOptToggle(optIdx)}
                    className="mt-1"
                    disabled={!selectedDim?.enabled}
                  />
                  <div className={cn('flex-1 space-y-3', !opt.enabled && 'opacity-50')}>
                    <div className="w-58">
                      <Input
                        value={opt.option}
                        onChange={(e) => handleOptNameChange(optIdx, e.target.value)}
                        placeholder="标签名称"
                        className={cn('h-8', err?.option && 'border-destructive')}
                        maxLength={NAME_MAX + 10}
                      />
                      <div className="mt-0.5 flex justify-between">
                        {err?.option ? (
                          <span className="text-xs text-destructive">{err.option}</span>
                        ) : (
                          <span />
                        )}
                        <span className={cn(
                          'text-xs',
                          opt.option.length > NAME_MAX ? 'text-destructive' : 'text-muted-foreground',
                        )}>
                          {opt.option.length}/{NAME_MAX}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">选项描述</p>
                      <Textarea
                        value={opt.description}
                        onChange={(e) => handleOptDescChange(optIdx, e.target.value)}
                        placeholder="标签描述"
                        className={cn('min-h-8 resize-none text-sm leading-relaxed', err?.description && 'border-destructive')}
                        rows={2}
                        maxLength={DESC_MAX + 20}
                      />
                      <div className="mt-0.5 flex justify-between">
                        {err?.description ? (
                          <span className="text-xs text-destructive">{err.description}</span>
                        ) : (
                          <span />
                        )}
                        <span className={cn(
                          'text-xs',
                          opt.description.length > DESC_MAX ? 'text-destructive' : 'text-muted-foreground',
                        )}>
                          {opt.description.length}/{DESC_MAX}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">销售策略</p>
                      <Textarea
                        value={opt.suggestion || ''}
                        onChange={(e) => handleOptSuggestionChange(optIdx, e.target.value)}
                        placeholder="销售策略（选填）"
                        className={cn('min-h-8 resize-none text-sm leading-relaxed', err?.suggestion && 'border-destructive')}
                        rows={2}
                        maxLength={SUGGESTION_MAX + 5}
                      />
                      <div className="mt-0.5 flex justify-between">
                        {err?.suggestion ? (
                          <span className="text-xs text-destructive">{err.suggestion}</span>
                        ) : (
                          <span />
                        )}
                        <span className={cn(
                          'text-xs',
                          (opt.suggestion || '').length > SUGGESTION_MAX ? 'text-destructive' : 'text-muted-foreground',
                        )}>
                          {(opt.suggestion || '').length}/{SUGGESTION_MAX}
                        </span>
                      </div>
                    </div>
                  </div>
                  {opt.type === 'SYSTEM_DEFINED' ? (
                    <Badge variant="secondary" className={cn('ml-1 mt-1 shrink-0 text-xs', !opt.enabled && 'opacity-50')}>
                      默认项
                    </Badge>
                  ) : (
                    <button
                      onClick={() => setDeleteOptTarget({ dimIdx: selectedIdx, optIdx })}
                      className={cn('ml-1 mt-1 shrink-0 rounded border bg-background p-0.5 text-muted-foreground hover:bg-accent hover:text-destructive', !opt.enabled && 'opacity-50')}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleAddOpt}
            className="mt-3"
          >
            <Plus className="mr-1.5 size-4" />
            添加标签
          </Button>
          </div>
        </div>
      </div>

      <Dialog open={!!deleteOptTarget} onOpenChange={(open) => { if (!open) setDeleteOptTarget(null) }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除该标签吗？删除后不可恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" size="sm" />}>
              取消
            </DialogClose>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (deleteOptTarget) handleDeleteOpt(deleteOptTarget.dimIdx, deleteOptTarget.optIdx)
              }}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDimTarget !== null} onOpenChange={(open) => { if (!open) setDeleteDimTarget(null) }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除该维度及其所有标签吗？删除后不可恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" size="sm" />}>
              取消
            </DialogClose>
            <Button variant="destructive" size="sm" onClick={handleDeleteDim}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
