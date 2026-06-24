/*
 * @Author: sunbingqing
 * @Date: 2026-05-22
 * @Description: 关注成员规则设置
 * @Copyright: ©2021 杭州杰竞科技有限公司 版权所有
 */

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { batchGetOrgConfig, batchSaveOrgConfig } from '@/services/rule-settings'

const ATTENTION_CODES = ['ATTENTION_MIN_SESSION_COUNT', 'ATTENTION_RISK_SESSION_RATIO']

const SESSION_MIN = 1
const SESSION_MAX = 999
const RATIO_MIN = 1
const RATIO_MAX = 100

interface AttentionConfig {
  sessionCount: string
  riskRatio: string
}

export function AttentionMembersTab() {
  const [config, setConfig] = useState<AttentionConfig | null>(null)
  const [errors, setErrors] = useState<Record<string, string | null>>({})
  const pendingRef = useRef(false)
  const queryClient = useQueryClient()

  const { data: serverConfig, isLoading } = useQuery({
    queryKey: ['orgConfig', 'attention'],
    queryFn: () => batchGetOrgConfig(ATTENTION_CODES),
    staleTime: Infinity,
  })

  useEffect(() => {
    if (serverConfig?.configs && config === null && !pendingRef.current) {
      setConfig({
        sessionCount: serverConfig.configs.ATTENTION_MIN_SESSION_COUNT || '3',
        riskRatio: serverConfig.configs.ATTENTION_RISK_SESSION_RATIO || '30.0',
      })
    }
  }, [serverConfig, config])

  const { mutate, isPending: saving } = useMutation({
    mutationFn: (data: AttentionConfig) =>
      batchSaveOrgConfig({
        ATTENTION_MIN_SESSION_COUNT: data.sessionCount,
        ATTENTION_RISK_SESSION_RATIO: data.riskRatio,
      }),
    onSuccess: () => {
      toast.success('保存成功')
      pendingRef.current = true
      queryClient.invalidateQueries({ queryKey: ['orgConfig', 'attention'] }).then(() => {
        pendingRef.current = false
        setConfig(null)
      })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : '保存失败，请稍后重试')
    },
  })

  const currentConfig = config ?? {
    sessionCount: serverConfig?.configs?.ATTENTION_MIN_SESSION_COUNT || '3',
    riskRatio: serverConfig?.configs?.ATTENTION_RISK_SESSION_RATIO || '30.0',
  }

  const handleChange = (field: keyof AttentionConfig, value: string) => {
    setConfig((prev) => (prev ? { ...prev, [field]: value } : prev))
    setErrors((prev) => ({ ...prev, [field]: null }))
  }

  const validateField = (field: keyof AttentionConfig): string | null => {
    const value = currentConfig[field]
    if (field === 'sessionCount') {
      const num = parseInt(value, 10)
      if (value.trim() === '' || isNaN(num)) return '请输入会话总数'
      if (num < SESSION_MIN || num > SESSION_MAX) return `范围 ${SESSION_MIN}-${SESSION_MAX}`
      if (String(num) !== value.trim()) return '请输入整数'
    }
    if (field === 'riskRatio') {
      const num = parseFloat(value)
      if (value.trim() === '' || isNaN(num)) return '请输入风险会话占比'
      if (num < RATIO_MIN || num > RATIO_MAX) return `范围 ${RATIO_MIN}-${RATIO_MAX}`
    }
    return null
  }

  const handleSave = () => {
    const newErrors: Record<string, string | null> = {}
    let hasError = false

    const sessionErr = validateField('sessionCount')
    if (sessionErr) {
      newErrors.sessionCount = sessionErr
      hasError = true
    }
    const ratioErr = validateField('riskRatio')
    if (ratioErr) {
      newErrors.riskRatio = ratioErr
      hasError = true
    }

    setErrors(newErrors)
    if (hasError) {
      toast.error('请检查并修正下方错误项')
      return
    }

    mutate(currentConfig)
  }

  if (isLoading || config === null) {
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
          <h2 className="text-lg font-semibold">关注成员</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            配置团队辅导规则，识别需要重点关注和提升的成员。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            保存
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-sm font-semibold">关注条件</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          同时满足以下条件，成员标记为需重点关注
        </p>

        <div className="mt-4 space-y-4">
          <div className={errors.sessionCount ? 'rounded-lg border border-destructive/50 bg-muted/30 p-4' : 'rounded-lg border bg-muted/30 p-4'}>
            <div className="flex items-center gap-2">
              <span className="text-sm">成员总会话数</span>
              <span className="text-sm font-medium">≥</span>
              <Input
                value={currentConfig.sessionCount}
                onChange={(e) => handleChange('sessionCount', e.target.value)}
                className="h-8 w-24"
              />
              <span className="text-sm">通</span>
            </div>
            {errors.sessionCount ? (
              <p className="mt-1 text-xs text-destructive">{errors.sessionCount}</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                成员总会话数达到阈值，才会评估是否需要关注
              </p>
            )}
          </div>

          <div className={errors.riskRatio ? 'rounded-lg border border-destructive/50 bg-muted/30 p-4' : 'rounded-lg border bg-muted/30 p-4'}>
            <div className="flex items-center gap-2">
              <span className="text-sm">风险会话占比</span>
              <span className="text-sm font-medium">≥</span>
              <Input
                value={currentConfig.riskRatio}
                onChange={(e) => handleChange('riskRatio', e.target.value)}
                className="h-8 w-24"
              />
              <span className="text-sm">%</span>
            </div>
            {errors.riskRatio ? (
              <p className="mt-1 text-xs text-destructive">{errors.riskRatio}</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                风险会话占总会话的比例达到阈值，成员标记为重点关注
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
