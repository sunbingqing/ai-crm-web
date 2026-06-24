import { cn } from '@/lib/utils'
import { formatQualityLabel, getQualityTone } from './format'

interface QualityCellProps {
  score?: number
  level?: string
}

export function QualityCell({ score, level }: QualityCellProps) {
  if (score == null) {
    return <span className="text-sm text-muted-foreground">暂无</span>
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl font-semibold leading-none">{score}</span>
      <span className={cn('text-sm font-semibold', getQualityTone(level))}>
        {formatQualityLabel(level)}
      </span>
    </div>
  )
}
