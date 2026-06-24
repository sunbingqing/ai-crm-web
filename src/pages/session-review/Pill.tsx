import { cn } from '@/lib/utils'

interface PillProps {
  value?: string
  emptyText?: string
  tone?: 'default' | 'primary' | 'muted' | 'destructive'
}

export function Pill({ value, emptyText = '暂无', tone = 'default' }: PillProps) {
  if (!value?.trim()) {
    return <span className="text-sm text-muted-foreground">{emptyText}</span>
  }

  return (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-medium',
        tone === 'default' && 'border-border bg-background text-foreground',
        tone === 'primary' && 'border-primary/20 bg-primary/10 text-primary',
        tone === 'muted' && 'border-border bg-muted text-muted-foreground',
        tone === 'destructive' && 'border-destructive/20 bg-destructive/10 text-destructive',
      )}
    >
      {value}
    </span>
  )
}
