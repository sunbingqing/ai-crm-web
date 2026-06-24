import { cn } from '@/lib/utils'
import { getIntentTone } from './format'

interface IntentBadgeProps {
  value?: string
}

export function IntentBadge({ value }: IntentBadgeProps) {
  const label = value?.trim() || '暂无'
  const isEmpty = !value?.trim()

  if (isEmpty) {
    return <span className="text-sm text-muted-foreground">暂无</span>
  }

  return (
    <span
      className={cn(
        'inline-flex min-h-8 items-center justify-center rounded-full px-3 py-1 text-sm font-semibold whitespace-nowrap',
        getIntentTone(label),
      )}
    >
      {label}
    </span>
  )
}
