/*
 * @Author: sunbingqing
 * @Date: 2026-05-22
 * @Description: 风险会话预警规则设置
 * @Copyright: ©2021 杭州杰竞科技有限公司 版权所有
 */

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getOrgConfig, saveOrgConfig } from '@/services/rule-settings'

const SCORE_MIN = 1
const SCORE_MAX = 99

export function RiskSessionTab() {
  const [score, setScore] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pendingRef = useRef(false)
  const queryClient = useQueryClient()

  const { data: config, isLoading } = useQuery({
    queryKey: ['orgConfig', 'RISK_SCORE_THRESHOLD'],
    queryFn: () => getOrgConfig('RISK_SCORE_THRESHOLD'),
    staleTime: Infinity,
  })

  useEffect(() => {
    if (config && score === null && !pendingRef.current) {
      setScore(config.value)
    }
  }, [config, score])

  const { mutate, isPending: saving } = useMutation({
    mutationFn: () => saveOrgConfig('RISK_SCORE_THRESHOLD', score!),
    onSuccess: () => {
      toast.success('保存成功')
      pendingRef.current = true
      queryClient.invalidateQueries({ queryKey: ['orgConfig', 'RISK_SCORE_THRESHOLD'] }).then(() => {
        pendingRef.current = false
        setScore(null)
      })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : '保存失败，请稍后重试')
    },
  })

  const currentScore = score ?? config?.value ?? ''

  const handleScoreChange = (value: string) => {
    setScore(value)
    setError(null)
  }

  const validate = (): boolean => {
    const num = parseInt(currentScore, 10)
    if (currentScore.trim() === '' || isNaN(num)) {
      setError('请输入质量分阈值')
      return false
    }
    if (num < SCORE_MIN || num > SCORE_MAX) {
      setError(`阈值范围 ${SCORE_MIN}-${SCORE_MAX}`)
      return false
    }
    if (String(num) !== currentScore.trim()) {
      setError('请输入整数')
      return false
    }
    return true
  }

  const handleSave = () => {
    if (!validate()) {
      toast.error('请检查并修正下方错误项')
      return
    }
    mutate()
  }

  if (isLoading || score === null) {
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
          <h2 className="text-lg font-semibold">风险会话</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            配置会话预警规则，发现需要及时介入的异常沟通和跟进风险
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
        <h3 className="text-sm font-semibold">风险条件</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          以下条件满足任意一条，会话即标记为风险会话
        </p>

        <div className="mt-4 space-y-3">
          <div className="rounded-lg border bg-muted/30 p-4">
            <span className="text-sm font-medium">下一步跟进状态 = 已逾期</span>
            <p className="mt-1 text-xs text-muted-foreground">
              客户下一步跟进任务逾期未完成
            </p>
          </div>

          <div className={error ? 'rounded-lg border border-destructive/50 bg-muted/30 p-4' : 'rounded-lg border bg-muted/30 p-4'}>
            <div className="flex items-center gap-2">
              <span className="text-sm">会话质量分</span>
              <span className="text-sm font-medium">&lt;</span>
              <Input
                value={currentScore}
                onChange={(e) => handleScoreChange(e.target.value)}
                className="h-8 w-20"
                placeholder="60"
              />
              <span className="text-sm">分</span>
            </div>
            {error ? (
              <p className="mt-1 text-xs text-destructive">{error}</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                会话质量分低于设定阈值，标记为风险会话
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
